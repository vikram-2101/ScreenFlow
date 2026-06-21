from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import uuid
from app.db.base import Base
import enum


class PlanEnum(str, enum.Enum):
    free = "free"
    pro = "pro"
    business = "business"


class User(Base):
    __tablename__ = "users"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )

    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    plan = Column(
        SQLEnum(PlanEnum),
        default=PlanEnum.free,
        nullable=False,
    )

    google_calendar_token = Column(String, nullable=True)  # JSON stored as string

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )