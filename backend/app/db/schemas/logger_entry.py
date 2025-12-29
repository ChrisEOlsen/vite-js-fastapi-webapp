from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# Pydantic model for creating a new LoggerEntry
class LoggerEntryCreate(BaseModel):
    category_id: int
    data: Dict[str, Any]
    logged_at: datetime

# Pydantic model for updating a LoggerEntry
# All fields are optional for partial updates
class LoggerEntryUpdate(BaseModel):
    category_id: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    logged_at: Optional[datetime] = None

# Pydantic model for reading/returning a LoggerEntry
# This is the base model that includes fields present in the database
class LoggerEntry(BaseModel):
    id: int
    category_id: int
    data: Dict[str, Any]
    logged_at: datetime

    class Config:
        from_attributes = True