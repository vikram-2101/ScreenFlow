from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.category import Category
from app.models.screenshot import Screenshot
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse
from app.api.deps import get_db, get_current_user, get_current_user_optional

router = APIRouter()

@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")

    # Query categories and count active (non-deleted) screenshots
    query = (
        db.query(
            Category,
            func.count(Screenshot.id).label("count")
        )
        .outerjoin(
            Screenshot,
            (Category.id == Screenshot.category_id) & (Screenshot.deleted_at == None)
        )
    )
    
    if current_user:
        query = query.filter(Category.user_id == current_user.id)
    elif session_id:
        query = query.filter(Category.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    results = (
        query
        .group_by(Category.id)
        .order_by(Category.created_at.desc())
        .all()
    )

    response = []
    for cat, count in results:
        thumbnails = []
        if count > 0:
            recent_shots = db.query(Screenshot.id).filter(
                Screenshot.category_id == cat.id,
                Screenshot.deleted_at == None
            ).order_by(Screenshot.created_at.desc()).limit(3).all()
            thumbnails = [str(s.id) for s in recent_shots]
            
        response.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "created_at": cat.created_at,
            "count": count,
            "thumbnails": thumbnails
        })

    return response

@router.post("/", response_model=CategoryResponse)
def create_category(
    request: Request,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    if not current_user and not session_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    category = Category(
        user_id=current_user.id if current_user else None,
        session_id=session_id if not current_user else None,
        name=payload.name,
        description=payload.description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "created_at": category.created_at,
        "count": 0,
        "thumbnails": []
    }

@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    session_id = request.headers.get("X-Session-ID")
    query = db.query(Category).filter(Category.id == category_id)

    if current_user:
        query = query.filter(Category.user_id == current_user.id)
    elif session_id:
        query = query.filter(Category.session_id == session_id)
    else:
        raise HTTPException(status_code=401, detail="Unauthorized")

    category = query.first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # The foreign key is ON DELETE SET NULL, so screenshots will just become uncategorized.
    db.delete(category)
    db.commit()

    return {"success": True}
