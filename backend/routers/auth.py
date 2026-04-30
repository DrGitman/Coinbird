from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from core.security import get_password_hash, verify_password, create_access_token, get_current_user
from db.database import get_db_connection
import asyncpg
from asyncpg.exceptions import UniqueViolationError

router = APIRouter(prefix="/auth", tags=["auth"])

DEFAULT_CATEGORIES = [
  {"name": 'Groceries', "icon": 'shopping-bag', "color": '#4ade80'},
  {"name": 'Housing', "icon": 'home', "color": '#22c55e'},
  {"name": 'Transport', "icon": 'car', "color": '#16a34a'},
  {"name": 'Leisure', "icon": 'gamepad-2', "color": '#15803d'},
  {"name": 'Well-being', "icon": 'heart-pulse', "color": '#166534'},
  {"name": 'Dining', "icon": 'utensils', "color": '#14532d'},
  {"name": 'Utilities', "icon": 'zap', "color": '#4ade80'},
  {"name": 'Income', "icon": 'briefcase', "color": '#86efac'},
  {"name": 'Healthcare', "icon": 'stethoscope', "color": '#bbf7d0'},
  {"name": 'Shopping', "icon": 'shopping-cart', "color": '#dcfce7'},
  {"name": 'Education', "icon": 'book-open', "color": '#f0fdf4'},
  {"name": 'Other', "icon": 'tag', "color": '#6b7280'},
]

class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister, db: asyncpg.Connection = Depends(get_db_connection)):
    try:
        password_hash = get_password_hash(user.password)
        result = await db.fetchrow(
            """
            INSERT INTO users (name, email, password_hash) 
            VALUES ($1, $2, $3) 
            RETURNING id, name, email, currency, theme, timezone, avatar_url, created_at,
                      notif_email, notif_budget_alerts, notif_push, notif_budget_warning,
                      notif_budget_exceeded, notif_overspending, notif_reminders,
                      notif_monthly_summary, notif_milestones
            """,
            user.name, user.email, password_hash
        )
        new_user = dict(result)
        
        # Seed default categories
        for cat in DEFAULT_CATEGORIES:
            await db.execute(
                """
                INSERT INTO categories (user_id, name, icon, color, is_default)
                VALUES ($1, $2, $3, $4, true)
                """,
                new_user["id"], cat["name"], cat["icon"], cat["color"]
            )
            
        token = create_access_token(subject={"id": new_user["id"], "email": new_user["email"]})
        return {"token": token, "user": new_user}
    
    except UniqueViolationError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
    except Exception as e:
        print("Register error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error during registration.")

@router.post("/login")
async def login(user: UserLogin, db: asyncpg.Connection = Depends(get_db_connection)):
    try:
        result = await db.fetchrow("SELECT * FROM users WHERE email = $1", user.email)
        if not result:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
        
        db_user = dict(result)
        if not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
            
        token = create_access_token(subject={"id": db_user["id"], "email": db_user["email"]})
        db_user.pop("password_hash", None)
        return {"token": token, "user": db_user}
    except HTTPException:
        raise
    except Exception as e:
        print("Login error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error during login.")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db_connection)):
    try:
        user_id = current_user["id"]
        result = await db.fetchrow(
            """
            SELECT id, name, email, currency, timezone, theme, avatar_url, created_at,
                   notif_email, notif_budget_alerts, notif_push, notif_budget_warning,
                   notif_budget_exceeded, notif_overspending, notif_reminders,
                   notif_monthly_summary, notif_milestones
            FROM users WHERE id = $1
            """,
            user_id
        )
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return dict(result)
    except HTTPException:
        raise
    except Exception as e:
        print("Get me error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.put("/change-password")
async def change_password(
    data: PasswordChange,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        user_id = current_user["id"]
        # Fetch current hash
        user_record = await db.fetchrow("SELECT password_hash FROM users WHERE id = $1", user_id)
        if not user_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
        # Verify old password
        if not verify_password(data.old_password, user_record["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password incorrect.")
        
        # Hash new password
        new_hash = get_password_hash(data.new_password)
        
        # Update
        await db.execute("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", new_hash, user_id)
        
        return {"message": "Password updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print("Change password error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")
