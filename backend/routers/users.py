from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from core.security import get_current_user
from db.database import get_db_connection
import asyncpg

router = APIRouter(prefix="/users", tags=["users"])

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    currency: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    notif_email: Optional[bool] = None
    notif_budget_alerts: Optional[bool] = None

class SavingsGoalCreateUpdate(BaseModel):
    name: str
    target_amount: float
    current_amount: Optional[float] = 0
    target_date: Optional[date] = None

@router.put("/profile")
async def update_profile(
    profile: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            """
            UPDATE users SET 
              name = COALESCE($1, name), 
              avatar_url = COALESCE($2, avatar_url),
              updated_at = NOW()
            WHERE id = $3 RETURNING id, name, email, currency, timezone, theme, avatar_url
            """,
            profile.name, profile.avatar_url, current_user["id"]
        )
        return dict(record)
    except Exception as e:
        print("Profile update error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.put("/settings")
async def update_settings(
    settings: UserSettingsUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            """
            UPDATE users SET 
              currency = COALESCE($1, currency), 
              timezone = COALESCE($2, timezone), 
              theme = COALESCE($3, theme),
              notif_email = COALESCE($4, notif_email),
              notif_budget_alerts = COALESCE($5, notif_budget_alerts),
              updated_at = NOW()
            WHERE id = $6 RETURNING id, name, email, currency, timezone, theme, notif_email, notif_budget_alerts
            """,
            settings.currency, settings.timezone, settings.theme, 
            settings.notif_email, settings.notif_budget_alerts, current_user["id"]
        )
        return dict(record)
    except Exception as e:
        print("Settings update error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.get("/savings-goals")
async def get_savings_goals(
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        records = await db.fetch("SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC", current_user["id"])
        return [dict(r) for r in records]
    except Exception as e:
        print("Get savings goals error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.post("/savings-goals", status_code=status.HTTP_201_CREATED)
async def create_savings_goal(
    goal: SavingsGoalCreateUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            """
            INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
            """,
            current_user["id"], goal.name, goal.target_amount, goal.current_amount, goal.target_date
        )
        return dict(record)
    except Exception as e:
        print("Create goal error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.put("/savings-goals/{id}")
async def update_savings_goal(
    id: int,
    goal: SavingsGoalCreateUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow(
            """
            UPDATE savings_goals SET
              name = COALESCE($1, name),
              target_amount = COALESCE($2, target_amount),
              current_amount = COALESCE($3, current_amount),
              target_date = COALESCE($4, target_date),
              updated_at = NOW()
            WHERE id = $5 AND user_id = $6 RETURNING *
            """,
            goal.name, goal.target_amount, goal.current_amount, goal.target_date, id, current_user["id"]
        )
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
        return dict(record)
    except HTTPException:
        raise
    except Exception as e:
        print("Update goal error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.delete("/savings-goals/{id}")
async def delete_savings_goal(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow("DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id", id, current_user["id"])
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
        return {"message": "Goal deleted."}
    except HTTPException:
        raise
    except Exception as e:
        print("Delete goal error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

from fastapi import File, UploadFile
import os
import uuid

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image.")
        
        # Create unique filename
        ext = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        
        # Determine base directory (backend/)
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        save_path = os.path.join(base_dir, "static", "avatars", filename)
        
        # Ensure directories exist
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # Save file
        with open(save_path, "wb") as buffer:
            buffer.write(await file.read())
            
        # Update user record
        # Note: We return the relative URL for the frontend
        avatar_url = f"/static/avatars/{filename}"
        await db.execute("UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2", avatar_url, current_user["id"])
        
        return {"avatar_url": avatar_url}
    except HTTPException:
        raise
    except Exception as e:
        print("Avatar upload error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error during upload.")
