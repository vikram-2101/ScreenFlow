from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.db.base import Base
from app.models.category import Category
from app.models.screenshot import Screenshot
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse
from app.api.deps import get_db, get_current_user

router = APIRouter()

@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Query categories and count active (non-deleted) screenshots
    results = (
        db.query(
            Category,
            func.count(Screenshot.id).label("count")
        )
        .outerjoin(
            Screenshot,
            (Category.id == Screenshot.category_id) & (Screenshot.deleted_at == None)
        )
        .filter(Category.user_id == current_user.id)
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
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = Category(
        user_id=current_user.id,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == current_user.id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # The foreign key is ON DELETE SET NULL, so screenshots will just become uncategorized.
    db.delete(category)
    db.commit()

    return {"success": True}
