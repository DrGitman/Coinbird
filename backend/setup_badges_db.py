import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def setup_db():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return
        
    db = await asyncpg.connect(db_url)
    try:
        print("Creating badges and user_badges tables...")
        await db.execute("""
            CREATE TABLE IF NOT EXISTS badges (
              id SERIAL PRIMARY KEY,
              badge_key VARCHAR(50) UNIQUE NOT NULL,
              title VARCHAR(100) NOT NULL,
              description TEXT,
              icon VARCHAR(50),
              category VARCHAR(50)
            );
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_badges (
              id SERIAL PRIMARY KEY,
              user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
              badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
              earned_at TIMESTAMP DEFAULT NOW(),
              progress INTEGER DEFAULT 100,
              UNIQUE(user_id, badge_id)
            );
        """)
        print("Tables ensured.")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(setup_db())
