from typing import Optional
from fastapi import APIRouter, UploadFile, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse
import os
import mimetypes
from app.core.config import settings
from app.utils.file import save_upload_file
from app.models.screenshot import Screenshot
from app.schemas.screenshot import BulkScreenshotRequest
from app.models.user import User
from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.services.rate_limiter import rate_limit_demo, rate_limit_user
from app.workers.ocr_tasks import process_screenshot
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/upload")
async def upload_screenshot(
    request: Request,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")

    # Rate limiting
    if current_user:
        rate_limit_user(current_user.id)
    else:
        if not session_id:
            raise HTTPException(status_code=400, detail="X-Session-ID header required for anonymous uploads")
        rate_limit_demo(request)

    # 1. Save file and compute hash
    file_path, file_hash = save_upload_file(file)

    # 2. Duplicate detection — if this user already uploaded this exact image, return it
    existing_query = db.query(Screenshot).filter(
        Screenshot.file_hash == file_hash,
        Screenshot.status == "COMPLETED",
    )
    if current_user:
        existing_query = existing_query.filter(Screenshot.user_id == current_user.id)
    else:
        existing_query = existing_query.filter(Screenshot.session_id == session_id)
        
    existing = existing_query.first()
    
    if existing:
        return {
            "id": existing.id,
            "status": existing.status,
            "duplicate": True,
        }

    # 3. Create DB row
    screenshot = Screenshot(
        user_id=current_user.id if current_user else None,
        session_id=session_id if not current_user else None,
        original_filename=file.filename,
        smart_filename="processing...",
        file_path=file_path,
        file_hash=file_hash,
        status="PROCESSING",
    )

    db.add(screenshot)
    db.commit()
    db.refresh(screenshot)

    # 4. Enqueue background task
    process_screenshot.delay(screenshot.id)

    # 5. Return immediately
    return {
        "id": screenshot.id,
        "status": screenshot.status,
        "duplicate": False,
    }

@router.get("/")
def list_screenshots(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.deleted_at == None)
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Not authenticated and no session ID provided")

    screenshots = query.order_by(Screenshot.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "smart_filename": s.smart_filename,
            "category": s.category_rel.name if s.category_rel else "uncategorized",
            "created_at": s.created_at,
            "status": s.status,
        }
        for s in screenshots
    ]

from sqlalchemy.sql import func

@router.get("/trash")
def list_trash(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.deleted_at != None)
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    screenshots = query.order_by(Screenshot.deleted_at.desc()).all()

    return [
        {
            "id": s.id,
            "smart_filename": s.smart_filename,
            "category": s.category_rel.name if s.category_rel else "uncategorized",
            "created_at": s.created_at,
            "deleted_at": s.deleted_at,
            "status": s.status,
        }
        for s in screenshots
    ]

@router.delete("/bulk")
def bulk_soft_delete(
    request: Request,
    payload: BulkScreenshotRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.id.in_(payload.ids))
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    query.update({"deleted_at": func.now()}, synchronize_session=False)
    db.commit()
    return {"success": True, "message": f"Moved {len(payload.ids)} items to trash."}

@router.post("/bulk/restore")
def bulk_restore(
    request: Request,
    payload: BulkScreenshotRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.id.in_(payload.ids))
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    query.update({"deleted_at": None}, synchronize_session=False)
    db.commit()
    return {"success": True, "message": f"Restored {len(payload.ids)} items."}

@router.delete("/bulk/permanent")
def bulk_hard_delete(
    request: Request,
    payload: BulkScreenshotRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.id.in_(payload.ids))
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    screenshots = query.all()
    
    deleted_count = 0
    for s in screenshots:
        raw = s.file_path.replace("\\", "/")
        upload_dir = settings.UPLOAD_DIR.strip("./")
        for prefix in (f"./{upload_dir}/", f"{upload_dir}/"):
            if raw.startswith(prefix):
                raw = raw[len(prefix):]
                break
        file_path = os.path.join(settings.UPLOAD_DIR, raw)
        
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error removing file {file_path}: {e}")
            
        db.delete(s)
        deleted_count += 1
        
    db.commit()
    return {"success": True, "message": f"Permanently deleted {deleted_count} items."}

@router.get("/{screenshot_id}")
def get_screenshot(
    screenshot_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.id == screenshot_id)
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    screenshot = query.first()

    if not screenshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screenshot not found",
        )

    return {
        "id": screenshot.id,
        "smart_filename": screenshot.smart_filename,
        "category": screenshot.category_rel.name if screenshot.category_rel else "uncategorized",
        "created_at": screenshot.created_at,
        "status": screenshot.status,
    }

@router.get("/{screenshot_id}/file")
def get_screenshot_file(
    screenshot_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.id == screenshot_id)
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    screenshot = query.first()

    if not screenshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screenshot not found",
        )

    # Resolve the file path robustly — strips any accidental 'uploads/' prefix
    # before joining with UPLOAD_DIR, so we never get double-path errors.
    raw = screenshot.file_path.replace("\\", "/")
    upload_dir = settings.UPLOAD_DIR.strip("./")  # "uploads"
    for prefix in (f"./{upload_dir}/", f"{upload_dir}/"):
        if raw.startswith(prefix):
            raw = raw[len(prefix):]
            break
    file_path = os.path.join(settings.UPLOAD_DIR, raw)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk",
        )
        
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"
        
    return FileResponse(path=file_path, media_type=mime_type)

@router.get("/search")
def search_screenshots(
    q: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(
        Screenshot.deleted_at == None,
        Screenshot.extracted_text.ilike(f"%{q}%")
    )
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    results = query.all()

    return [
        {
            "id": s.id,
            "smart_filename": s.smart_filename,
            "category": s.category_rel.name if s.category_rel else "uncategorized",
            "created_at": s.created_at,
            "status": s.status,
        }
        for s in results
    ]

from app.schemas.override import OverrideRequest

@router.patch("/{screenshot_id}/override")
def override_screenshot(
    screenshot_id: str,
    payload: OverrideRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Screenshot).filter(Screenshot.id == screenshot_id)
    
    if current_user:
        query = query.filter(Screenshot.user_id == current_user.id)
    elif session_id:
        query = query.filter(Screenshot.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    screenshot = query.first()

    if not screenshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screenshot not found",
        )

    if payload.category:
        # Resolve category name to ID
        from app.models.category import Category
        category_query = db.query(Category).filter(func.lower(Category.name) == payload.category.lower())
        if current_user:
            category_query = category_query.filter(Category.user_id == current_user.id)
        else:
            category_query = category_query.filter(Category.session_id == session_id)
            
        category_record = category_query.first()
        if not category_record:
            category_record = Category(
                user_id=current_user.id if current_user else None,
                session_id=session_id if not current_user else None,
                name=payload.category.title()
            )
            db.add(category_record)
            db.commit()
            db.refresh(category_record)
        screenshot.category_id = category_record.id

    if payload.smart_filename:
        screenshot.smart_filename = payload.smart_filename

    db.commit()
    db.refresh(screenshot)

    return {
        "id": screenshot.id,
        "category": screenshot.category_rel.name if screenshot.category_rel else "uncategorized",
        "smart_filename": screenshot.smart_filename,
        "corrected": True
    }