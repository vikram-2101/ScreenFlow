from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
import uuid
from app.db.base import Base

class Screenshot(Base):
    __tablename__ = "screenshots"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    original_filename = Column(String, nullable=False)
    smart_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    # SHA-256 hash for duplicate detection
    file_hash = Column(String, nullable=True, index=True)

    # Core classification
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)

    # Rich metadata from Gemini
    summary = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)          # stored as ["tag1", "tag2"]
    extracted_text = Column(Text, nullable=True)
    extracted_entities = Column(JSON, nullable=True)  # reserved for future use
    confidence = Column(Float, nullable=True)

    status = Column(String, default="PROCESSING", nullable=False)
    error_message = Column(Text, nullable=True)

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

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )