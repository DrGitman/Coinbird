import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def seed_badges():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return
        
    db = await asyncpg.connect(db_url)
    
    badges = [
        # Consistency
        ('first_entry', 'First Entry', 'Your first step into a larger financial world.', 'Zap', 'consistency'),
        ('7_day_tracker', '7-Day Tracker', 'Seven days of consistent transaction logging.', 'Calendar', 'consistency'),
        ('30_day_tracker', 'Consistency Champion', 'A full month of expense tracking mastery.', 'Award', 'consistency'),
        ('first_full_month', 'First Month Completed', 'Completed your first full month of budgeting activity.', 'CalendarRange', 'consistency'),
        
        # Discipline
        ('first_budget', 'Planning Ahead', 'Your first monthly budget has been established.', 'Target', 'discipline'),
        ('on_budget_month', 'On Budget', 'Stayed within budget for at least one tracked category.', 'ShieldCheck', 'discipline'),
        ('full_control_month', 'Full Control', 'Stayed within all budgets for a full month.', 'Shield', 'discipline'),
        ('recovery_master', 'Recovery', 'Corrected an overspent category from the previous month.', 'TrendingUp', 'discipline'),
        ('spending_improved', 'Spending Improved', 'Reduced your spending compared to the prior month.', 'TrendingDown', 'discipline'),
        
        # Awareness
        ('all_categories', 'Awareness Master', 'Tracked expenses in all major categories.', 'LayoutGrid', 'awareness'),
        ('first_monthly_review', 'Reviewer', 'Completed your first full monthly financial review.', 'FileText', 'awareness'),
    ]
    
    try:
        print("Seeding badges...")
        for key, title, desc, icon, cat in badges:
            await db.execute(
                """
                INSERT INTO badges (badge_key, title, description, icon, category)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (badge_key) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    icon = EXCLUDED.icon,
                    category = EXCLUDED.category
                """,
                key, title, desc, icon, cat
            )
        print("Successfully seeded badges.")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(seed_badges())
