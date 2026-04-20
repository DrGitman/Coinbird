import asyncio
from core.config import settings
from core.security import get_password_hash
import asyncpg
import os
from dotenv import load_dotenv

async def test_register():
    load_dotenv()
    db_url = os.environ.get("DATABASE_URL")
    print(f"Connecting to: {db_url}")
    try:
        db = await asyncpg.connect(db_url)
        print("Connected.")
        
        async with db.transaction():
            name = "Test User"
            email = "test@example.com"
            password = "password123"
            
            print(f"Hashing password...")
            password_hash = get_password_hash(password)
            
            print(f"Inserting user...")
            result = await db.fetchrow(
                """
                INSERT INTO users (name, email, password_hash) 
                VALUES ($1, $2, $3) 
                RETURNING id, name, email
                """,
                name, email, password_hash
            )
            print(f"User created: {dict(result)}")
            
            # Clean up
            await db.execute("DELETE FROM users WHERE email = $1", email)
            print("Cleanup done.")
            
        await db.close()
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_register())
