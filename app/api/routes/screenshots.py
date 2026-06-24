from fastapi import APIRouter, UploadFile, Depends, HTTPException, status
from fastapi.responses import FileResponse
import os
import mimetypes
from app.core.config import settings
from app.utils.file import save_upload_file
from app.models.screenshot import Screenshot
from app.models.user import User
from app.api.deps import get_db, get_current_user
from app.workers.ocr_tasks import process_screenshot
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/upload")
async def upload_screenshot(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Save file and compute hash
    file_path, file_hash = save_upload_file(file)

    # 2. Duplicate detection — if this user already uploaded this exact image, return it
    existing = db.query(Screenshot).filter(
        Screenshot.user_id == current_user.id,
        Screenshot.file_hash == file_hash,
        Screenshot.status == "COMPLETED",
    ).first()
    if existing:
        return {
            "id": existing.id,
            "status": existing.status,
            "duplicate": True,
        }

    # 3. Create DB row
    screenshot = Screenshot(
        user_id=current_user.id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    screenshots = db.query(Screenshot).filter(
        Screenshot.user_id == current_user.id
    ).order_by(Screenshot.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "smart_filename": s.smart_filename,
            "category": s.category,
            "created_at": s.created_at,
            "status": s.status,
        }
        for s in screenshots
    ]

@router.get("/{screenshot_id}")
def get_screenshot(
    screenshot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    screenshot = db.query(Screenshot).filter(
        Screenshot.id == screenshot_id,
        Screenshot.user_id == current_user.id
    ).first()

    if not screenshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screenshot not found",
        )

    return {
        "id": screenshot.id,
        "smart_filename": screenshot.smart_filename,
        "category": screenshot.category,
        "created_at": screenshot.created_at,
        "status": screenshot.status,
    }

@router.get("/{screenshot_id}/file")
def get_screenshot_file(
    screenshot_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    screenshot = db.query(Screenshot).filter(
        Screenshot.id == screenshot_id,
        Screenshot.user_id == current_user.id
    ).first()

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    results = db.query(Screenshot).filter(
        Screenshot.user_id == current_user.id,
        Screenshot.extracted_text.ilike(f"%{q}%")
    ).all()

    return [
        {
            "id": s.id,
            "smart_filename": s.smart_filename,
            "category": s.category,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    screenshot = db.query(Screenshot).filter(
        Screenshot.id == screenshot_id,
        Screenshot.user_id == current_user.id
    ).first()

    if not screenshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screenshot not found",
        )

    if payload.category:
        screenshot.category = payload.category

    if payload.smart_filename:
        screenshot.smart_filename = payload.smart_filename

    db.commit()
    db.refresh(screenshot)

    return {
        "id": screenshot.id,
        "category": screenshot.category,
        "smart_filename": screenshot.smart_filename,
        "corrected": True
    }