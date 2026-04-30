import asyncpg


SCHEMA_UPDATES = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_budget_alerts BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_push BOOLEAN DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_budget_warning BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_budget_exceeded BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_overspending BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_reminders BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_monthly_summary BOOLEAN DEFAULT true",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_milestones BOOLEAN DEFAULT true",
    "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT",
    # Backfill created_at for users who registered before the column existed
    "UPDATE users SET created_at = NOW() WHERE created_at IS NULL",
]


async def ensure_schema_updates(db: asyncpg.Connection):
    for statement in SCHEMA_UPDATES:
        await db.execute(statement)
