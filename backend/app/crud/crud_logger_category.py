from app.db.base import CRUDBase
from app.models.logger_category import LoggerCategory
from app.db.schemas.logger_category import LoggerCategoryCreate, LoggerCategoryUpdate

# Create a CRUD object for the LoggerCategory model,
# inheriting all the basic CRUD methods from the CRUDBase.
crud_logger_category = CRUDBase[LoggerCategory, LoggerCategoryCreate, LoggerCategoryUpdate](LoggerCategory)