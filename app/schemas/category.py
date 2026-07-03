from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    count: Optional[int] = 0
    thumbnails: list[str] = []

    class Config:
        from_attributes = True
