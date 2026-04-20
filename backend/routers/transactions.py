from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from core.security import get_current_user
from db.database import get_db_connection
from core.notifications import create_notification
from core.milestones import check_milestones_transaction
import asyncpg

router = APIRouter(prefix="/transactions", tags=["transactions"])

class TransactionCreateUpdate(BaseModel):
    amount: float = Field(..., gt=0)
    type: str # 'income' or 'expense'
    date: date
    category_id: Optional[int] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    payment_method: Optional[str] = None

async def check_budget_thresholds(db: asyncpg.Connection, user_id: int, category_id: int, tx_date: date):
    if not category_id:
        return

    month = tx_date.month
    year = tx_date.year

    # 1. Fetch budget limit
    budget = await db.fetchrow(
        "SELECT monthly_limit FROM budgets WHERE user_id = $1 AND category_id = $2 AND month = $3 AND year = $4",
        user_id, category_id, month, year
    )
    if not budget:
        return

    limit = float(budget["monthly_limit"])

    # 2. Calculate total spent in this category for this month
    spent_record = await db.fetchrow(
        """
        SELECT SUM(amount) as total FROM transactions
        WHERE user_id = $1 AND category_id = $2 AND type = 'expense'
          AND EXTRACT(MONTH FROM date) = $3 AND EXTRACT(YEAR FROM date) = $4
        """,
        user_id, category_id, month, year
    )
    spent = float(spent_record["total"] or 0)

    # 3. Check thresholds (One-time notification per threshold/category/month)
    
    # 80% threshold
    if spent >= limit * 0.8 and spent < limit * 0.9:
        notif_type = f"budget_80_{category_id}_{month}_{year}"
        existing = await db.fetchrow("SELECT id FROM notifications WHERE user_id = $1 AND type = $2", user_id, notif_type)
        if not existing:
            cat_name = await db.fetchval("SELECT name FROM categories WHERE id = $1", category_id)
            await create_notification(
                db, user_id, notif_type,
                "Budget Awareness",
                f"You've used 80% of your budget for {cat_name}. Looking good, stay mindful!"
            )

    # 90% threshold
    if spent >= limit * 0.9 and spent < limit:
        notif_type = f"budget_90_{category_id}_{month}_{year}"
        existing = await db.fetchrow("SELECT id FROM notifications WHERE user_id = $1 AND type = $2", user_id, notif_type)
        if not existing:
            cat_name = await db.fetchval("SELECT name FROM categories WHERE id = $1", category_id)
            await create_notification(
                db, user_id, notif_type,
                "Budget Warning",
                f"You've used over 90% of your budget for {cat_name} this month."
            )

    # 100% threshold
    if spent >= limit:
        notif_type = f"budget_100_{category_id}_{month}_{year}"
        existing = await db.fetchrow("SELECT id FROM notifications WHERE user_id = $1 AND type = $2", user_id, notif_type)
        if not existing:
            cat_name = await db.fetchval("SELECT name FROM categories WHERE id = $1", category_id)
            await create_notification(
                db, user_id, notif_type,
                "Budget Exceeded",
                f"You've exceeded your monthly budget for {cat_name}!"
            )

@router.get("/summary")
async def get_transactions_summary(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    now = datetime.now()
    m = month if month is not None else now.month
    y = year if year is not None else now.year
    user_id = current_user["id"]

    try:
        stats_record = await db.fetchrow(
            """
            SELECT
              SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
              SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
              COUNT(*) as transaction_count
            FROM transactions
            WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
            """,
            user_id, m, y
        )
        
        by_category_records = await db.fetch(
            """
            SELECT c.name, c.icon, c.color, SUM(t.amount) as total
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = $1 AND t.type = 'expense'
              AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
            GROUP BY c.id, c.name, c.icon, c.color
            ORDER BY total DESC
            """,
            user_id, m, y
        )

        balance_record = await db.fetchrow(
            "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance FROM transactions WHERE user_id = $1",
            user_id
        )

        stats = dict(stats_record) if stats_record else {}
        # Map Decimal to float for JSON serialization if needed, though FastAPI handles pydantic models well. We return raw dict here.
        return {
            "total_income": float(stats.get("total_income") or 0),
            "total_expenses": float(stats.get("total_expenses") or 0),
            "transaction_count": int(stats.get("transaction_count") or 0),
            "balance": float(balance_record["balance"] or 0) if balance_record else 0,
            "by_category": [dict(r) for r in by_category_records],
        }
    except Exception as e:
        print("Summary error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.get("/")
async def get_transactions(
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        query = """
          SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          WHERE t.user_id = $1
        """
        params = [current_user["id"]]
        idx = 2

        if month and year:
            query += f" AND EXTRACT(MONTH FROM t.date) = ${idx} AND EXTRACT(YEAR FROM t.date) = ${idx+1}"
            params.extend([month, year])
            idx += 2
        if category_id:
            query += f" AND t.category_id = ${idx}"
            params.append(category_id)
            idx += 1
        if type:
            query += f" AND t.type = ${idx}"
            params.append(type)
            idx += 1
        if q:
            query += f" AND (t.description ILIKE ${idx} OR t.merchant ILIKE ${idx})"
            params.append(f"%{q}%")
            idx += 1

        query += f" ORDER BY t.date DESC, t.created_at DESC LIMIT ${idx} OFFSET ${idx+1}"
        params.extend([limit, offset])

        records = await db.fetch(query, *params)

        count_query = "SELECT COUNT(*) FROM transactions t WHERE t.user_id = $1"
        count_params = [current_user["id"]]
        cidx = 2
        
        if month and year:
            count_query += f" AND EXTRACT(MONTH FROM t.date) = ${cidx} AND EXTRACT(YEAR FROM t.date) = ${cidx+1}"
            count_params.extend([month, year])
            cidx += 2
        if category_id:
            count_query += f" AND t.category_id = ${cidx}"
            count_params.append(category_id)
            cidx += 1
        if type:
            count_query += f" AND t.type = ${cidx}"
            count_params.append(type)
            cidx += 1
        if q:
            count_query += f" AND (t.description ILIKE ${cidx} OR t.merchant ILIKE ${cidx})"
            count_params.append(f"%{q}%")
            cidx += 1

        count_record = await db.fetchrow(count_query, *count_params)

        # Serialize transactions
        return {
            "transactions": [dict(r) for r in records],
            "total": int(count_record["count"])
        }

    except Exception as e:
        print("Get transactions error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    tx: TransactionCreateUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    if tx.type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type must be income or expense")

    try:
        record = await db.fetchrow(
            """
            INSERT INTO transactions (user_id, category_id, type, amount, description, merchant, payment_method, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
            """,
            current_user["id"], tx.category_id, tx.type, tx.amount, tx.description, tx.merchant, tx.payment_method, tx.date
        )
        
        full = await db.fetchrow(
            """
            SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
            FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = $1
            """,
            record["id"]
        )
        
        # Budget check if expense
        if tx.type == "expense":
            await check_budget_thresholds(db, current_user["id"], tx.category_id, tx.date)

        # Milestone check (Consistency etc)
        await check_milestones_transaction(db, current_user["id"])

        return dict(full)
    except Exception as e:
        print("Create transaction error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.put("/{tx_id}")
async def update_transaction(
    tx_id: int,
    tx: TransactionCreateUpdate,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        check = await db.fetchrow("SELECT id FROM transactions WHERE id = $1 AND user_id = $2", tx_id, current_user["id"])
        if not check:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")

        record = await db.fetchrow(
            """
            UPDATE transactions SET
              amount = COALESCE($1, amount),
              type = COALESCE($2, type),
              category_id = COALESCE($3, category_id),
              description = COALESCE($4, description),
              merchant = COALESCE($5, merchant),
              payment_method = COALESCE($6, payment_method),
              date = COALESCE($7, date),
              updated_at = NOW()
            WHERE id = $8 AND user_id = $9 RETURNING *
            """,
            tx.amount, tx.type, tx.category_id, tx.description, tx.merchant, tx.payment_method, tx.date, tx_id, current_user["id"]
        )
        
        full = await db.fetchrow(
            """
            SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
            FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.id = $1
            """,
            record["id"]
        )

        # Budget check if expense
        if tx.type == "expense" or (tx.type is None and full["type"] == "expense"):
            # We use the updated or existing values
            await check_budget_thresholds(
                db, 
                current_user["id"], 
                tx.category_id if tx.category_id is not None else full["category_id"],
                tx.date if tx.date is not None else full["date"]
            )

        # Milestone check (Consistency etc)
        await check_milestones_transaction(db, current_user["id"])

        return dict(full)
    except HTTPException:
        raise
    except Exception as e:
        print("Update transaction error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")

@router.delete("/{tx_id}")
async def delete_transaction(
    tx_id: int,
    current_user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db_connection)
):
    try:
        record = await db.fetchrow("DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id", tx_id, current_user["id"])
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
        return {"message": "Transaction deleted.", "id": record["id"]}
    except HTTPException:
        raise
    except Exception as e:
        print("Delete transaction error:", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error.")
