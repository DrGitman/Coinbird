from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from core.security import get_current_user
from db.database import get_db_connection
import asyncpg
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/milestones", tags=["milestones"])

class BadgeResponse(BaseModel):
    badge_key: str
    title: str
    description: str
    icon: str
    category: str
    earned_at: Optional[datetime]
    progress: int

@router.get("", response_model=List[BadgeResponse])
async def get_user_badges(
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        user_id = current_user["id"]
        # Fetch all badges and left join with user's earned badges
        records = await db.fetch(
            """
            SELECT 
                b.badge_key, b.title, b.description, b.icon, b.category,
                ub.earned_at,
                COALESCE(ub.progress, 0) as progress
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
            ORDER BY b.id ASC
            """,
            user_id
        )
        return [dict(r) for r in records]
    except Exception as e:
        print("Get badges error:", e)
        raise HTTPException(status_code=500, detail="Server error.")
