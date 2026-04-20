import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from core.config import settings

def send_email_with_attachment(to_email: str, subject: str, html_body: str, attachment_data=None, attachment_name="report.pdf"):
    """
    Sends an HTML email with an optional PDF attachment.
    """
    try:
        msg = MIMEMultipart()
        msg['From'] = f"Coinbird <{settings.smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))

        # Attach PDF if provided
        if attachment_data:
            pdf_attachment = MIMEApplication(attachment_data.read(), _subtype="pdf")
            pdf_attachment.add_header('Content-Disposition', 'attachment', filename=attachment_name)
            msg.attach(pdf_attachment)

        # Connect and send
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_pass)
            server.send_message(msg)
            
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
