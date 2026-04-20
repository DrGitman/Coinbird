from datetime import date, timedelta

import asyncpg
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from core.config import settings
from core.milestones import evaluate_monthly_milestones
from core.notifications import create_notification


scheduler = AsyncIOScheduler(timezone="UTC")


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(run_weekly_notification_jobs, CronTrigger(day_of_week="mon", hour=8, minute=0))
    scheduler.add_job(run_monthly_notification_jobs, CronTrigger(day=1, hour=8, minute=5))
    scheduler.start()


async def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)


async def run_weekly_notification_jobs():
    db = await asyncpg.connect(settings.database_url)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    previous_week_start = week_start - timedelta(days=7)

    try:
        users = await db.fetch(
            """
            SELECT id, notif_reminders, notif_overspending
            FROM users
            WHERE notif_reminders = true OR notif_overspending = true
            """
        )

        for user in users:
            user_id = user["id"]

            if user["notif_reminders"]:
                tx_count = await db.fetchval(
                    "SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND date >= $2",
                    user_id,
                    week_start,
                )
                if tx_count == 0:
                    await create_notification(
                        db,
                        user_id,
                        f"weekly_reminder_{week_start.isoformat()}",
                        "Weekly Reminder",
                        "Quick check: update your spending for this week.",
                        action_url="/transactions",
                    )

            if user["notif_overspending"]:
                current_total = await db.fetchval(
                    """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM transactions
                    WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
                    """,
                    user_id,
                    week_start,
                    week_start + timedelta(days=7),
                )
                previous_total = await db.fetchval(
                    """
                    SELECT COALESCE(SUM(amount), 0)
                    FROM transactions
                    WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
                    """,
                    user_id,
                    previous_week_start,
                    week_start,
                )

                current_total = float(current_total or 0)
                previous_total = float(previous_total or 0)
                if previous_total > 0 and current_total >= previous_total * 1.15:
                    await create_notification(
                        db,
                        user_id,
                        f"weekly_spending_high_{week_start.isoformat()}",
                        "Overspending Alert",
                        "Spending is higher than usual this week.",
                        action_url="/transactions",
                    )
                elif current_total > 0 and previous_total > 0 and current_total <= previous_total * 0.9:
                    await create_notification(
                        db,
                        user_id,
                        f"weekly_spending_lower_{week_start.isoformat()}",
                        "Savings Awareness",
                        "You spent less than last week. Your habits are moving in the right direction.",
                        action_url="/transactions",
                    )
    finally:
        await db.close()


async def run_monthly_notification_jobs():
    db = await asyncpg.connect(settings.database_url)
    today = date.today()
    month_anchor = today.replace(day=1)
    previous_month_end = month_anchor - timedelta(days=1)
    target_month = previous_month_end.month
    target_year = previous_month_end.year

    try:
        users = await db.fetch(
            """
            SELECT id, notif_monthly_summary, notif_milestones
            FROM users
            WHERE notif_monthly_summary = true OR notif_milestones = true
            """
        )

        for user in users:
            user_id = user["id"]

            if user["notif_monthly_summary"]:
                totals = await db.fetchrow(
                    """
                    SELECT COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses,
                           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income
                    FROM transactions
                    WHERE user_id = $1
                      AND EXTRACT(MONTH FROM date) = $2
                      AND EXTRACT(YEAR FROM date) = $3
                    """,
                    user_id,
                    target_month,
                    target_year,
                )

                budget_status = await db.fetchrow(
                    """
                    SELECT
                      COUNT(*) FILTER (WHERE spent <= monthly_limit) AS within_budget,
                      COUNT(*) FILTER (WHERE spent > monthly_limit) AS over_budget,
                      COUNT(*) AS total_budgets
                    FROM (
                      SELECT b.monthly_limit,
                             COALESCE(SUM(t.amount), 0) AS spent
                      FROM budgets b
                      LEFT JOIN transactions t
                        ON t.user_id = b.user_id
                       AND t.category_id = b.category_id
                       AND t.type = 'expense'
                       AND EXTRACT(MONTH FROM t.date) = b.month
                       AND EXTRACT(YEAR FROM t.date) = b.year
                      WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
                      GROUP BY b.id, b.monthly_limit
                    ) budget_rollup
                    """,
                    user_id,
                    target_month,
                    target_year,
                )

                expenses = float(totals["expenses"] or 0)
                budget_status_dict = dict(budget_status) if budget_status else {}
                over_budget = int(budget_status_dict.get("over_budget", 0) or 0)
                if over_budget == 0:
                    message = "You stayed within your budget this month. Solid work."
                else:
                    message = f"You overspent by {over_budget} budget category{'ies' if over_budget != 1 else ''} last month."

                await create_notification(
                    db,
                    user_id,
                    f"monthly_summary_{target_year}_{target_month}",
                    "Monthly Summary",
                    message if expenses > 0 else "Your monthly summary is ready. Start reviewing where your money went.",
                    action_url="/dashboard",
                )

            await evaluate_monthly_milestones(db, user_id, target_month, target_year)
    finally:
        await db.close()
