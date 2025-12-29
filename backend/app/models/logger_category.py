from sqlalchemy import Column, Integer, Text, String, Boolean, Float, Date, DateTime, Uuid, JSON
from app.db.base_class import Base

class LoggerCategory(Base):
    __tablename__ = "logger_categories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    schema_definition = Column(JSON, nullable=False)