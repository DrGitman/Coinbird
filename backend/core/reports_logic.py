import asyncpg
from datetime import datetime, timedelta
from decimal import Decimal

async def get_weekly_stats(db: asyncpg.Connection, user_id: int):
    """
    Aggregates financial statistics for the past 7 days for a user.
    """
    today = datetime.now().date()
    seven_days_ago = today - timedelta(days=7)
    
    # 1. Total spending and income
    totals = await db.fetchrow(
        """
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
        FROM transactions 
        WHERE user_id = $1 AND date >= $2 AND date <= $3
        """,
        user_id, seven_days_ago, today
    )
    
    # 2. Category breakdown (expenses)
    category_summary = await db.fetch(
        """
        SELECT c.name, SUM(t.amount) as amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 AND t.type = 'expense' AND t.date >= $2 AND t.date <= $3
        GROUP BY c.name
        ORDER BY amount DESC
        LIMIT 5
        """,
        user_id, seven_days_ago, today
    )
    
    # 3. Largest Expense
    largest_expense = await db.fetchrow(
        """
        SELECT description, amount, date
        FROM transactions 
        WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date <= $3
        ORDER BY amount DESC
        LIMIT 1
        """,
        user_id, seven_days_ago, today
    )
    
    # 4. Budget status
    # Get current month budgets
    budget_status = await db.fetch(
        """
        SELECT c.name, b.monthly_limit, 
               COALESCE(SUM(t.amount), 0) as spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id 
             AND EXTRACT(MONTH FROM t.date) = b.month 
             AND EXTRACT(YEAR FROM t.date) = b.year
             AND t.type = 'expense'
        WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
        GROUP BY c.name, b.monthly_limit
        """,
        user_id, today.month, today.year
    )
    
    return {
        "start_date": seven_days_ago,
        "end_date": today,
        "total_expenses": totals["total_expenses"],
        "total_income": totals["total_income"],
        "net_savings": totals["total_income"] - totals["total_expenses"],
        "categories": [dict(r) for r in category_summary],
        "largest_expense": dict(largest_expense) if largest_expense else None,
        "budget_status": [dict(r) for r in budget_status]
    }
