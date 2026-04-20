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


def calculate_badge_progress(badge_key: str, stats: dict) -> int:
    if badge_key == "first_entry":
        return 100 if stats["transaction_count"] >= 1 else 0
    if badge_key == "7_day_tracker":
        return min(100, int((stats["active_days_7"] / 7) * 100))
    if badge_key == "30_day_tracker":
        return min(100, int((stats["active_days_30"] / 30) * 100))
    if badge_key == "first_full_month":
        return 100 if stats["months_with_transactions"] >= 1 else min(100, int((stats["transaction_count"] / 10) * 100))
    if badge_key == "first_budget":
        return 100 if stats["budget_count"] >= 1 else 0
    if badge_key == "on_budget_month":
        return 100 if stats["within_budget_categories"] >= 1 else 0
    if badge_key == "full_control_month":
        if stats["budget_count"] == 0:
            return 0
        return min(100, int((stats["within_budget_categories"] / stats["budget_count"]) * 100))
    if badge_key == "recovery_master":
        return 100 if stats["has_recovery"] else 0
    if badge_key == "spending_improved":
        return 100 if stats["spending_improved"] else 0
    if badge_key == "all_categories":
        return min(100, int((stats["distinct_expense_categories"] / 5) * 100))
    if badge_key == "first_monthly_review":
        return 100 if stats["months_with_transactions"] >= 1 else min(100, int((stats["transaction_count"] / 10) * 100))
    return 0

@router.get("", response_model=List[BadgeResponse])
async def get_user_badges(
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        user_id = current_user["id"]
        stats_row = await db.fetchrow(
            """
            WITH current_month_budget AS (
                SELECT b.id, b.monthly_limit, COALESCE(SUM(t.amount), 0) AS spent
                FROM budgets b
                LEFT JOIN transactions t
                  ON t.user_id = b.user_id
                 AND t.category_id = b.category_id
                 AND t.type = 'expense'
                 AND EXTRACT(MONTH FROM t.date) = b.month
                 AND EXTRACT(YEAR FROM t.date) = b.year
                WHERE b.user_id = $1
                  AND b.month = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND b.year = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY b.id, b.monthly_limit
            ),
            previous_month_budget AS (
                SELECT b.id, b.monthly_limit, COALESCE(SUM(t.amount), 0) AS spent
                FROM budgets b
                LEFT JOIN transactions t
                  ON t.user_id = b.user_id
                 AND t.category_id = b.category_id
                 AND t.type = 'expense'
                 AND EXTRACT(MONTH FROM t.date) = b.month
                 AND EXTRACT(YEAR FROM t.date) = b.year
                WHERE b.user_id = $1
                  AND b.month = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
                  AND b.year = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
                GROUP BY b.id, b.monthly_limit
            )
            SELECT
                (SELECT COUNT(*) FROM transactions WHERE user_id = $1) AS transaction_count,
                (SELECT COUNT(DISTINCT date) FROM transactions WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days') AS active_days_7,
                (SELECT COUNT(DISTINCT date) FROM transactions WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '29 days') AS active_days_30,
                (SELECT COUNT(*) FROM budgets WHERE user_id = $1) AS budget_count,
                (SELECT COUNT(DISTINCT category_id) FROM transactions WHERE user_id = $1 AND type = 'expense' AND category_id IS NOT NULL) AS distinct_expense_categories,
                (SELECT COUNT(DISTINCT DATE_TRUNC('month', date)) FROM transactions WHERE user_id = $1) AS months_with_transactions,
                (SELECT COUNT(*) FROM current_month_budget WHERE spent <= monthly_limit) AS within_budget_categories,
                EXISTS(SELECT 1 FROM previous_month_budget WHERE spent > monthly_limit)
                    AND EXISTS(SELECT 1 FROM current_month_budget)
                    AND NOT EXISTS(SELECT 1 FROM current_month_budget WHERE spent > monthly_limit) AS has_recovery,
                COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = $1 AND type = 'expense' AND date >= DATE_TRUNC('month', CURRENT_DATE)), 0)
                    <
                COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = $1 AND type = 'expense' AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND date < DATE_TRUNC('month', CURRENT_DATE)), 0) AS spending_improved
            """,
            user_id,
        )
        stats = dict(stats_row) if stats_row else {}

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
        badges = []
        for record in records:
            badge = dict(record)
            badge["progress"] = 100 if badge["earned_at"] else calculate_badge_progress(badge["badge_key"], stats)
            badges.append(badge)

        badges.sort(key=lambda badge: (0 if badge["earned_at"] else 1, -(badge["progress"] or 0), badge["title"]))
        return badges
    except Exception as e:
        print("Get badges error:", e)
        raise HTTPException(status_code=500, detail="Server error.")
