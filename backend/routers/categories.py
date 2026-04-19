from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from core.security import get_current_user
from db.database import get_db_connection
import asyncpg

router = APIRouter(prefix="/categories", tags=["categories"])

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "tag"
    color: Optional[str] = "#4ade80"

@router.get("/")
async def get_categories(
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        records = await db.fetch(
            "SELECT * FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name",
            current_user["id"]
        )
        return [dict(record) for record in records]
    except Exception as e:
        print("Get categories error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    if not category.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name required.")
        
    try:
        record = await db.fetchrow(
            "INSERT INTO categories (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *",
            current_user["id"], category.name, category.icon, category.color
        )
        return dict(record)
    except Exception as e:
        print("Create category error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            "DELETE FROM categories WHERE id = $1 AND user_id = $2 AND is_default = false RETURNING id",
            category_id, current_user["id"]
        )
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found or cannot delete default.")
        return {"message": "Category deleted."}
    except HTTPException:
        raise
    except Exception as e:
        print("Delete category error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")
