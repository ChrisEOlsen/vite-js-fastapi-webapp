from sqlalchemy import Column, Integer, Text, String, Boolean, Float, Date, DateTime, Uuid, JSON
from app.db.base_class import Base

class LoggerEntry(Base):
    __tablename__ = "logger_entries"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False)
    logged_at = Column(DateTime(timezone=True), nullable=False)