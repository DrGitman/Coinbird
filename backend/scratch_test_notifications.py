import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from decimal import Decimal
from datetime import date

async def test_budget_notifications():
    load_dotenv()
    db_url = os.environ.get("DATABASE_URL")
    db = await asyncpg.connect(db_url)
    
    try:
        # 1. Setup - get a user and a category
        user = await db.fetchrow("SELECT id FROM users LIMIT 1")
        if not user:
            print("No user found. Register one first.")
            return
        user_id = user["id"]
        
        category = await db.fetchrow("SELECT id FROM categories WHERE user_id = $1 LIMIT 1", user_id)
        if not category:
            # Create a default one if needed
            cid = await db.fetchval("INSERT INTO categories (user_id, name) VALUES ($1, 'Test Cat') RETURNING id", user_id)
        else:
            cid = category["id"]
            
        print(f"Testing with user {user_id} and category {cid}")
        
        # 2. Set a budget
        today = date.today()
        await db.execute(
            """
            INSERT INTO budgets (user_id, category_id, monthly_limit, month, year)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, category_id, month, year) 
            DO UPDATE SET monthly_limit = $3
            """,
            user_id, cid, Decimal('100.00'), today.month, today.year
        )
        
        # Clean current notifications for this test
        await db.execute("DELETE FROM notifications WHERE user_id = $1 AND type LIKE 'budget_%'", user_id)
        # Clean current transactions for this cat/month
        await db.execute("DELETE FROM transactions WHERE user_id = $1 AND category_id = $2 AND EXTRACT(MONTH FROM date) = $3", user_id, cid, today.month)
        
        print("Budget set to 100.00. Adding transaction for 95.00 (95%)...")
        
        # 3. Add transaction (95%)
        # Note: We trigger the logic via the app, but here we'll just check if we can simulate the router call
        # Actually, let's just use the router logic directly or assume it works if we add it via the DB and then run the check function.
        # But wait, the check function is in the router file. 
        
        # I'll just check if the logic I wrote in transactions.py works by running a manual check here 
        # (simulating what the router does).
        
        from routers.transactions import check_budget_thresholds
        
        # We need a connection object that works with the router's Depends(get_db_connection)
        # For simplicity in this script, I'll just run the SQL logic that matches it.
        
        # Simulate adding the transaction
        await db.execute(
            "INSERT INTO transactions (user_id, category_id, type, amount, date) VALUES ($1, $2, 'expense', $3, $4)",
            user_id, cid, Decimal('95.00'), today
        )
        
        # Run the check (manual import simulation)
        # We need to mock the db connection or just use our active one if it's compatible
        await check_budget_thresholds(db, user_id, cid, today)
        
        # 4. Verify notification
        notif = await db.fetchrow("SELECT * FROM notifications WHERE user_id = $1 AND type = $2", user_id, f"budget_90_{cid}_{today.month}_{today.year}")
        if notif:
            print(f"SUCCESS: 90% notification created: {notif['title']} - {notif['message']}")
        else:
            print("FAILURE: 90% notification NOT created.")
            
        # 5. Add another transaction to exceed 100%
        print("Adding another transaction for 10.00 (Total 105%)...")
        await db.execute(
            "INSERT INTO transactions (user_id, category_id, type, amount, date) VALUES ($1, $2, 'expense', $3, $4)",
            user_id, cid, Decimal('10.00'), today
        )
        await check_budget_thresholds(db, user_id, cid, today)
        
        notif100 = await db.fetchrow("SELECT * FROM notifications WHERE user_id = $1 AND type = $2", user_id, f"budget_100_{cid}_{today.month}_{today.year}")
        if notif100:
            print(f"SUCCESS: 100% notification created: {notif100['title']} - {notif100['message']}")
        else:
            print("FAILURE: 100% notification NOT created.")

    finally:
        await db.close()

if __name__ == "__main__":
    import os
    import sys
    # Add backend to path so we can import routers
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    asyncio.run(test_budget_notifications())
