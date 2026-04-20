import asyncio
import asyncpg
import os
from dotenv import load_dotenv

async def run_setup():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found")
        return
        
    db = await asyncpg.connect(db_url)
    try:
        with open("db_setup.sql", "r") as f:
            sql = f.read()
            # We want to run the whole thing, but psql setup usually handles table creation
            # to avoid duplicate errors, I'll pass it to execute
            print("Applying database schema...")
            await db.execute(sql)
            print("Successfully updated database schema.")
    except Exception as e:
        print(f"Error applying database: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(run_setup())
