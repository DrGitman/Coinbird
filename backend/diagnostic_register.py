import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from decimal import Decimal
from datetime import date

async def diagnostic():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return
        
    db = await asyncpg.connect(db_url)
    
    try:
        # 1. Get all users
        users = await db.fetch("SELECT id, name FROM users")
        print(f"--- Users ({len(users)}) ---")
        for u in users:
            print(f"ID: {u['id']}, Name: {u['name']}")
            
        # 2. Check Budgets
        budgets = await db.fetch("SELECT * FROM budgets")
        print(f"\n--- Budgets ({len(budgets)}) ---")
        for b in budgets:
            print(f"User: {b['user_id']}, Cat: {b['category_id']}, Limit: {b['monthly_limit']}, Month: {b['month']}, Year: {b['year']}")
            
        # 3. Check Transactions for current month
        today = date.today()
        txs = await db.fetch(
            "SELECT user_id, category_id, SUM(amount) as total FROM transactions WHERE type='expense' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2 GROUP BY user_id, category_id",
            today.month, today.year
        )
        print(f"\n--- Current Month Spending by User/Cat ---")
        for t in txs:
            print(f"User: {t['user_id']}, Cat: {t['category_id']}, Spent: {t['total']}")
            
        # 4. Check Notifications
        notifs = await db.fetch("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10")
        print(f"\n--- Recent Notifications ({len(notifs)}) ---")
        for n in notifs:
            print(f"User: {n['user_id']}, Type: {n['type']}, Read: {n['is_read']}, Title: {n['title']}")
            
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(diagnostic())
