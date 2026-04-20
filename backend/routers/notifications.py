from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from core.security import get_current_user
from db.database import get_db_connection
import asyncpg

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscriptionSchema(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys

@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        user_id = current_user["id"]
        records = await db.fetch(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            user_id
        )
        return [dict(r) for r in records]
    except Exception as e:
        print("Get notifications error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.post("/subscribe")
async def subscribe_push(
    sub: PushSubscriptionSchema,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        await db.execute(
            """
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (endpoint) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                updated_at = NOW()
            """,
            current_user["id"], sub.endpoint, sub.keys.p256dh, sub.keys.auth
        )
        return {"message": "Subscribed to push notifications."}
    except Exception as e:
        print("Subscribe error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to subscribe.")

@router.post("/unsubscribe")
async def unsubscribe_push(
    endpoint: str,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        await db.execute(
            "DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2",
            endpoint, current_user["id"]
        )
        return {"message": "Unsubscribed from push notifications."}
    except Exception as e:
        print("Unsubscribe error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to unsubscribe.")

@router.put("/{id}/read")
async def mark_as_read(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        user_id = current_user["id"]
        result = await db.execute(
            "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2",
            id, user_id
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        return {"message": "Notification marked as read."}
    except HTTPException:
        raise
    except Exception as e:
        print("Mark as read error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.delete("/{id}")
async def delete_notification(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        user_id = current_user["id"]
        result = await db.execute(
            "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
            id, user_id
        )
        if result == "DELETE 0":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
        return {"message": "Notification deleted."}
    except HTTPException:
        raise
    except Exception as e:
        print("Delete notification error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")
