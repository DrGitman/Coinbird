from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from core.security import get_current_user
from db.database import get_db_connection
from core.milestones import check_milestones_budget
import asyncpg
from datetime import datetime

router = APIRouter(prefix="/budget", tags=["budget"])

class BudgetCreateUpdate(BaseModel):
    category_id: int
    monthly_limit: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)

@router.get("/")
async def get_budgets(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    now = datetime.now()
    m = month if month is not None else now.month
    y = year if year is not None else now.year
    user_id = current_user["id"]

    try:
        # Note: asyncpg returns records, replacing with dicts
        records = await db.fetch(
            """
            SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
                COALESCE(
                  (SELECT SUM(amount) FROM transactions t
                   WHERE t.category_id = b.category_id AND t.user_id = b.user_id
                     AND t.type = 'expense'
                     AND EXTRACT(MONTH FROM t.date) = b.month
                     AND EXTRACT(YEAR FROM t.date) = b.year),
                  0
                ) as spent
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
            ORDER BY c.name
            """,
            user_id, m, y
        )
        return [dict(record) for record in records]
    except Exception as e:
        print("Get budget error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_update_budget(
    budget: BudgetCreateUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            """
            INSERT INTO budgets (user_id, category_id, monthly_limit, month, year)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, category_id, month, year)
            DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, updated_at = NOW()
            RETURNING *
            """,
            current_user["id"], budget.category_id, budget.monthly_limit, budget.month, budget.year
        )
        await check_milestones_budget(db, current_user["id"])
        return dict(record)
    except Exception as e:
        print("Create budget error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            "DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id",
            budget_id, current_user["id"]
        )
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")
        return {"message": "Budget removed."}
    except HTTPException:
        raise
    except Exception as e:
        print("Delete budget error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")
