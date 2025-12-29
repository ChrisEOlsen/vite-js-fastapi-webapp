from app.db.base import CRUDBase
from app.models.logger_entry import LoggerEntry
from app.db.schemas.logger_entry import LoggerEntryCreate, LoggerEntryUpdate

# Create a CRUD object for the LoggerEntry model,
# inheriting all the basic CRUD methods from the CRUDBase.
crud_logger_entry = CRUDBase[LoggerEntry, LoggerEntryCreate, LoggerEntryUpdate](LoggerEntry)