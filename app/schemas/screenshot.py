from pydantic import BaseModel
from datetime import datetime

class ScreenshotResponse(BaseModel):
    id: str
    filename: str
    category: str
    extracted_text: str
    created_at: datetime

    class Config:
        from_attributes = True

from typing import List

class BulkScreenshotRequest(BaseModel):
    ids: List[str]