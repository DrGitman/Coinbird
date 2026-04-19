import asyncpg
from typing import Optional
from core.config import settings

# Global variable to hold the pool
_pool: Optional[asyncpg.Pool] = None

async def get_db_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        database_url = settings.database_url
        if not database_url:
            raise ValueError("DATABASE_URL is not configured in .env")
        # We handle ssl in dev potentially differently, but this mimics typical asyncpg setup
        _pool = await asyncpg.create_pool(database_url)
    return _pool

async def close_db_pool():
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None

async def get_db_connection():
    """Dependency to get a DB connection from the pool."""
    pool = await get_db_pool()
    async with pool.acquire() as connection:
        yield connection
