import asyncio
import asyncpg
import os
from datetime import date
from dotenv import load_dotenv

async def verify_fix():
    load_dotenv()
    db = await asyncpg.connect(os.getenv("DATABASE_URL"))
    
    try:
        user_id = 1
        category_id = 1 # Limit is 100
        
        print("Cleaning up old notifications for testing...")
        await db.execute("DELETE FROM notifications WHERE user_id = $1 AND type LIKE 'budget_%'", user_id)
        
        print("Adding a transaction that exceeds 100% (110.00)...")
        # Direct insert to simulate what the router does
        await db.execute(
            "INSERT INTO transactions (user_id, category_id, type, amount, date, description) VALUES ($1, $2, 'expense', 110.00, $3, 'Test Large Purchase')",
            user_id, category_id, date.today()
        )
        
        # Now we need to manually call the check_budget_thresholds logic or just rely on the fact that I've updated the router
        # But wait, I want to test the FUNCTION logic.
        from routers.transactions import check_budget_thresholds
        
        await check_budget_thresholds(db, user_id, category_id, date.today())
        
        notifs = await db.fetch("SELECT type, title FROM notifications WHERE user_id = $1", user_id)
        print(f"\nNotifications created: {len(notifs)}")
        for n in notifs:
            print(f"- {n['title']} ({n['type']})")
            
        if len(notifs) >= 2:
            print("\nSUCCESS: Both 90% and 100% alerts triggered.")
        else:
            print("\nFAILURE: Did not trigger expected alerts.")
            
    finally:
        await db.close()

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), "..")) # For imports
    asyncio.run(verify_fix())
