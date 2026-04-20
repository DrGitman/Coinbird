import asyncio
import os
from dotenv import load_dotenv
import asyncpg

async def check_db():
    load_dotenv()
    db_url = os.environ.get("DATABASE_URL")
    print(f"Checking connection to: {db_url}")
    try:
        conn = await asyncpg.connect(db_url)
        print("✅ Connection successful!")
        await conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
