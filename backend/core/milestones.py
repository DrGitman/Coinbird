import asyncpg
from core.notifications import create_notification

async def grant_badge(db: asyncpg.Connection, user_id: int, badge_key: str):
    """
    Grants a badge to a user and sends a notification.
    """
    # 1. Fetch badge info
    badge = await db.fetchrow("SELECT id, title FROM badges WHERE badge_key = $1", badge_key)
    if not badge:
        return False
        
    # 2. Grant badge (avoid duplicates due to UNIQUE constraint)
    try:
        await db.execute(
            "INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            user_id, badge["id"]
        )
        
        # 3. Notify user
        # We check if a notification of this specific badge type was already sent
        notif_type = f"badge_{badge_key}"
        await create_notification(
            db, user_id, notif_type,
            "New Milestone Achieved! 🏆",
            f"Congratulations! You've earned the '{badge['title']}' badge."
        )
        return True
    except Exception as e:
        print(f"Error granting badge {badge_key}: {e}")
        return False

async def check_milestones_transaction(db: asyncpg.Connection, user_id: int):
    """
    Checks for milestones related to transactions (First Entry, Streaks).
    """
    # 1. First Entry
    tx_count = await db.fetchval("SELECT COUNT(*) FROM transactions WHERE user_id = $1", user_id)
    if tx_count == 1:
        await grant_badge(db, user_id, 'first_entry')
        
    # 2. 7-Day Tracker
    # Count unique days with transactions in the last 7 calendar days
    days_count = await db.fetchval(
        """
        SELECT COUNT(DISTINCT date) 
        FROM transactions 
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'
        """,
        user_id
    )
    if days_count >= 7:
        await grant_badge(db, user_id, '7_day_tracker')

async def check_milestones_budget(db: asyncpg.Connection, user_id: int):
    """
    Checks for milestones related to budgets.
    """
    budget_count = await db.fetchval("SELECT COUNT(*) FROM budgets WHERE user_id = $1", user_id)
    if budget_count >= 1:
        await grant_badge(db, user_id, 'first_budget')
