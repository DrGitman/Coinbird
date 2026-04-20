import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Path to the .env file in the backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

async def migrate():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in .env")
        return

    print(f"Connecting to {database_url}...")
    conn = await asyncpg.connect(database_url)
    
    try:
        print("Adding notification columns to users table...")
        await conn.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS notif_budget_alerts BOOLEAN DEFAULT true
        """)
        
        print("Creating notifications table...")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        print("Creating index for notifications...")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)")
        
        print("Migration successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
