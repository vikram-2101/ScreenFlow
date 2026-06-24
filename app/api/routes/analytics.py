from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user
from app.models.screenshot import Screenshot
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/classification")
def classification_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = db.query(Screenshot).filter(
        Screenshot.user_id == current_user.id
    ).count()

    low_confidence = db.query(Screenshot).filter(
        Screenshot.user_id == current_user.id,
        Screenshot.confidence < 0.6
    ).count()

    by_category = (
        db.query(Screenshot.category, func.count())
        .filter(Screenshot.user_id == current_user.id)
        .group_by(Screenshot.category)
        .all()
    )

    return {
        "total": total,
        "low_confidence_rate": round(low_confidence / total, 2) if total else 0,
        "by_category": dict(by_category)
    }