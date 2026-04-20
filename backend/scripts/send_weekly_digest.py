import asyncio
import os
import sys

# Add parent directory to sys.path so we can import 'core.*'
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

import asyncpg
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from core.config import settings
from core.reports_logic import get_weekly_stats
from core.pdf import generate_pdf
from core.email import send_email_with_attachment

async def run_weekly_digest():
    """
    Main automation script to send weekly reports to all opted-in users.
    """
    # 1. Setup DB connection
    db = await asyncpg.connect(settings.database_url)
    
    # 2. Setup Jinja2
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "core", "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template("weekly_digest.html")
    
    try:
        # 3. Get all users with email notifications enabled
        users = await db.fetch("SELECT id, name, email FROM users WHERE notif_email = true")
        print(f"Found {len(users)} users for weekly digest...")
        
        for user in users:
            try:
                print(f"Processing report for {user['email']}...")
                
                # A. Aggregate stats
                stats = await get_weekly_stats(db, user['id'])
                
                # B. Render HTML
                html_content = template.render(
                    name=user['name'],
                    start_date=stats['start_date'].strftime('%b %d'),
                    end_date=stats['end_date'].strftime('%b %d'),
                    total_expenses=float(stats['total_expenses']),
                    total_income=float(stats['total_income']),
                    net_savings=float(stats['net_savings']),
                    categories=stats['categories'],
                    largest_expense=stats['largest_expense'],
                    budget_status=stats['budget_status']
                )
                
                # C. Generate PDF
                pdf_data = generate_pdf(html_content)
                
                # D. Send Email
                success = send_email_with_attachment(
                    to_email=user['email'],
                    subject=f"Your Coinbird Weekly Digest ({stats['start_date'].strftime('%b %d')} - {stats['end_date'].strftime('%b %d')})",
                    html_body=html_content,
                    attachment_data=pdf_data,
                    attachment_name=f"Coinbird_Report_{stats['start_date'].strftime('%Y_%m_%d')}.pdf"
                )
                
                if success:
                    print(f"Successfully sent digest to {user['email']}")
                else:
                    print(f"Failed to send digest to {user['email']}")
                    
            except Exception as e:
                print(f"Error processing user {user['email']}: {e}")
                
    finally:
        await db.close()

if __name__ == "__main__":
    # Add parent to sys path so we can import core.*
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    
    asyncio.run(run_weekly_digest())
