from pydantic import BaseModel
from typing import Optional

class OverrideRequest(BaseModel):
    category: Optional[str] = None
    smart_filename: Optional[str] = None