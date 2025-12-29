from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Pydantic model for creating a new LoggerCategory
class LoggerCategoryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    schema_definition: List[Dict[str, Any]] = []

# Pydantic model for updating a LoggerCategory
# All fields are optional for partial updates
class LoggerCategoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    schema_definition: Optional[List[Dict[str, Any]]] = None

# Pydantic model for reading/returning a LoggerCategory
# This is the base model that includes fields present in the database
class LoggerCategory(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    schema_definition: List[Dict[str, Any]]

    class Config:
        from_attributes = True
