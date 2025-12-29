from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.crud.crud_logger_category import crud_logger_category
from app.db.schemas.logger_category import LoggerCategory, LoggerCategoryCreate, LoggerCategoryUpdate
from app.db.connections import get_db

router = APIRouter()

@router.get("/logger_categories/", response_model=List[LoggerCategory])
async def read_logger_categories(
    db: AsyncSession = Depends(get_db), skip: int = 0, limit: int = 100
):
    """
    Retrieve logger_categories.
    """
    items = await crud_logger_category.get_multi(db, skip=skip, limit=limit)
    return items

@router.post("/logger_categories/", response_model=LoggerCategory)
async def create_logger_category(
    *,
    db: AsyncSession = Depends(get_db),
    item_in: LoggerCategoryCreate,
):
    """
    Create new logger_category.
    """
    item = await crud_logger_category.create(db=db, obj_in=item_in)
    return item

@router.put("/logger_categories/{item_id}", response_model=LoggerCategory)
async def update_logger_category(
    *,
    db: AsyncSession = Depends(get_db),
    item_id: int,
    item_in: LoggerCategoryUpdate,
):
    """
    Update a logger_category.
    """
    item = await crud_logger_category.get(db=db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="LoggerCategory not found")
    item = await crud_logger_category.update(db=db, db_obj=item, obj_in=item_in)
    return item

@router.delete("/logger_categories/{item_id}", response_model=LoggerCategory)
async def delete_logger_category(
    *,
    db: AsyncSession = Depends(get_db),
    item_id: int,
):
    """
    Delete a logger_category.
    """
    item = await crud_logger_category.delete(db=db, id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="LoggerCategory not found")
    return item