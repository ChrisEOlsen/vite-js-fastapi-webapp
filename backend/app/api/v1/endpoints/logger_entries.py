from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.crud.crud_logger_entry import crud_logger_entry
from app.db.schemas.logger_entry import LoggerEntry, LoggerEntryCreate, LoggerEntryUpdate
from app.db.connections import get_db

router = APIRouter()

@router.get("/logger_entries/", response_model=List[LoggerEntry])
async def read_logger_entries(
    db: AsyncSession = Depends(get_db), skip: int = 0, limit: int = 100
):
    """
    Retrieve logger_entries.
    """
    items = await crud_logger_entry.get_multi(db, skip=skip, limit=limit)
    return items

@router.post("/logger_entries/", response_model=LoggerEntry)
async def create_logger_entry(
    *,
    db: AsyncSession = Depends(get_db),
    item_in: LoggerEntryCreate,
):
    """
    Create new logger_entry.
    """
    item = await crud_logger_entry.create(db=db, obj_in=item_in)
    return item

@router.put("/logger_entries/{item_id}", response_model=LoggerEntry)
async def update_logger_entry(
    *,
    db: AsyncSession = Depends(get_db),
    item_id: int,
    item_in: LoggerEntryUpdate,
):
    """
    Update a logger_entry.
    """
    item = await crud_logger_entry.get(db=db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="LoggerEntry not found")
    item = await crud_logger_entry.update(db=db, db_obj=item, obj_in=item_in)
    return item

@router.delete("/logger_entries/{item_id}", response_model=LoggerEntry)
async def delete_logger_entry(
    *,
    db: AsyncSession = Depends(get_db),
    item_id: int,
):
    """
    Delete a logger_entry.
    """
    item = await crud_logger_entry.delete(db=db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="LoggerEntry not found")
    return item