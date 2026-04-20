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
        result = await db.execute(
            "INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            user_id, badge["id"]
        )
        if result == "INSERT 0 0":
            return False
        
        # 3. Notify user
        notif_type = f"badge_{badge_key}"
        wants_milestones = await db.fetchval(
            "SELECT COALESCE(notif_milestones, true) FROM users WHERE id = $1",
            user_id,
        )
        if wants_milestones:
            await create_notification(
                db, user_id, notif_type,
                "New Milestone Achieved! 🏆",
                f"Congratulations! You've earned the '{badge['title']}' badge.",
                action_url="/profile",
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

    # 3. 30-Day Tracker
    month_days_count = await db.fetchval(
        """
        SELECT COUNT(DISTINCT date)
        FROM transactions
        WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '29 days'
        """,
        user_id,
    )
    if month_days_count >= 30:
        await grant_badge(db, user_id, '30_day_tracker')

    # 4. Awareness badge
    distinct_expense_categories = await db.fetchval(
        """
        SELECT COUNT(DISTINCT category_id)
        FROM transactions
        WHERE user_id = $1 AND type = 'expense' AND category_id IS NOT NULL
        """,
        user_id,
    )
    if distinct_expense_categories >= 5:
        await grant_badge(db, user_id, 'all_categories')

async def check_milestones_budget(db: asyncpg.Connection, user_id: int):
    """
    Checks for milestones related to budgets.
    """
    budget_count = await db.fetchval("SELECT COUNT(*) FROM budgets WHERE user_id = $1", user_id)
    if budget_count >= 1:
        await grant_badge(db, user_id, 'first_budget')


async def evaluate_monthly_milestones(db: asyncpg.Connection, user_id: int, month: int, year: int):
    monthly_tx_count = await db.fetchval(
        """
        SELECT COUNT(*)
        FROM transactions
        WHERE user_id = $1
          AND EXTRACT(MONTH FROM date) = $2
          AND EXTRACT(YEAR FROM date) = $3
        """,
        user_id,
        month,
        year,
    )
    if monthly_tx_count > 0:
        await grant_badge(db, user_id, 'first_full_month')
        await grant_badge(db, user_id, 'first_monthly_review')

    budget_rows = await db.fetch(
        """
        SELECT b.category_id, b.monthly_limit, COALESCE(SUM(t.amount), 0) AS spent
        FROM budgets b
        LEFT JOIN transactions t
          ON t.user_id = b.user_id
         AND t.category_id = b.category_id
         AND t.type = 'expense'
         AND EXTRACT(MONTH FROM t.date) = b.month
         AND EXTRACT(YEAR FROM t.date) = b.year
        WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
        GROUP BY b.id, b.category_id, b.monthly_limit
        """,
        user_id,
        month,
        year,
    )
    if budget_rows:
        within_budget = sum(1 for row in budget_rows if float(row["spent"] or 0) <= float(row["monthly_limit"] or 0))
        if within_budget >= 1:
            await grant_badge(db, user_id, 'on_budget_month')
        if within_budget == len(budget_rows):
            await grant_badge(db, user_id, 'full_control_month')

        previous_period = (year, month - 1) if month > 1 else (year - 1, 12)
        previous_rows = await db.fetch(
            """
            SELECT b.category_id, b.monthly_limit, COALESCE(SUM(t.amount), 0) AS spent
            FROM budgets b
            LEFT JOIN transactions t
              ON t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND EXTRACT(MONTH FROM t.date) = b.month
             AND EXTRACT(YEAR FROM t.date) = b.year
            WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
            GROUP BY b.id, b.category_id, b.monthly_limit
            """,
            user_id,
            previous_period[1],
            previous_period[0],
        )
        if previous_rows:
            was_over = any(float(row["spent"] or 0) > float(row["monthly_limit"] or 0) for row in previous_rows)
            now_within = all(float(row["spent"] or 0) <= float(row["monthly_limit"] or 0) for row in budget_rows)
            if was_over and now_within:
                await grant_badge(db, user_id, 'recovery_master')

    previous_period = (year, month - 1) if month > 1 else (year - 1, 12)
    previous_expenses = await db.fetchval(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE user_id = $1 AND type = 'expense'
          AND EXTRACT(MONTH FROM date) = $2
          AND EXTRACT(YEAR FROM date) = $3
        """,
        user_id,
        previous_period[1],
        previous_period[0],
    )
    current_expenses = await db.fetchval(
        """
        SELECT COALESCE(SUM(amount), 0)
        FROM transactions
        WHERE user_id = $1 AND type = 'expense'
          AND EXTRACT(MONTH FROM date) = $2
          AND EXTRACT(YEAR FROM date) = $3
        """,
        user_id,
        month,
        year,
    )
    if float(previous_expenses or 0) > 0 and float(current_expenses or 0) < float(previous_expenses or 0):
        await grant_badge(db, user_id, 'spending_improved')
