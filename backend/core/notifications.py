import asyncpg
from typing import Optional
from core.push import send_push_notification
import asyncio

async def create_notification(
    db: asyncpg.Connection,
    user_id: int,
    type: str,
    title: str,
    message: str
):
    """
    Internal utility to create a user notification and trigger a system push alert.
    """
    try:
        # 1. Create database record
        await db.execute(
            """
            INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
            VALUES ($1, $2, $3, $4, false, NOW())
            """,
            user_id, type, title, message
        )
        
        # 2. Trigger Mobile/Desktop System Push
        subs = await db.fetch("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1", user_id)
        
        payload = {
            "title": title,
            "body": message,
            "icon": "/static/favicon.ico", # Default icon
            "tag": type # Used for deduplication across tabs
        }

        for s in subs:
            sub_info = {
                "endpoint": s["endpoint"],
                "keys": {
                    "p256dh": s["p256dh"],
                    "auth": s["auth"]
                }
            }
            # Send push non-blocking
            asyncio.create_task(asyncio.to_thread(send_push_notification, sub_info, payload))

    except Exception as e:
        # We don't want notification failure to break the main transaction,
        # but we should log it.
        print(f"Error creating notification: {e}")
