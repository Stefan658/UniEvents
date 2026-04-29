import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from flask import current_app

logger = logging.getLogger(__name__)

def send_email(to_email, subject, body, attachment_content=None, attachment_filename=None):
    """
    Sends an email using the SMTP configuration in the app config.
    Returns: "sent", "skipped", or "failed".
    """
    config = current_app.config
    
    smtp_host = config.get("SMTP_HOST")
    smtp_port = config.get("SMTP_PORT")
    smtp_user = config.get("SMTP_USERNAME")
    smtp_pass = config.get("SMTP_PASSWORD")
    from_email = config.get("SMTP_FROM_EMAIL")
    use_tls = config.get("SMTP_USE_TLS", True)

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.warning(
            f"SMTP not fully configured. Skipping email to {to_email}. "
            f"Subject: {subject}. Body snippet: {body[:50]}..."
        )
        return "skipped"

    try:
        msg = MIMEMultipart()
        msg["From"] = from_email
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        if attachment_content and attachment_filename:
            part = MIMEApplication(attachment_content, Name=attachment_filename)
            part["Content-Disposition"] = f'attachment; filename="{attachment_filename}"'
            msg.attach(part)

        server = smtplib.SMTP(smtp_host, smtp_port)
        if use_tls:
            server.starttls()
        
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return "sent"
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return "failed"

def send_registration_confirmation(user, event, ics_content=None):
    """Sends a registration confirmation email. Returns status: 'sent', 'skipped', 'failed'."""
    subject = f"Registration Confirmed: {event.title}"
    body = (
        f"Hello {user.full_name or user.email},\n\n"
        f"Your registration for the event '{event.title}' has been confirmed.\n\n"
        f"Event Details:\n"
        f"Title: {event.title}\n"
        f"Date: {event.start_at.strftime('%Y-%m-%d %H:%M')}\n"
        f"Location: {event.location}\n\n"
        f"We look forward to seeing you there!\n\n"
        f"Best regards,\n"
        f"UniEvents Team"
    )
    
    filename = f"event-{event.id}.ics" if ics_content else None
    return send_email(user.email, subject, body, ics_content, filename)

def send_registration_cancellation(user, event):
    """Sends a registration cancellation email. Returns status: 'sent', 'skipped', 'failed'."""
    subject = f"Registration Cancelled: {event.title}"
    body = (
        f"Hello {user.full_name or user.email},\n\n"
        f"Your registration for the event '{event.title}' has been cancelled.\n\n"
        f"Event Details:\n"
        f"Title: {event.title}\n"
        f"Date: {event.start_at.strftime('%Y-%m-%d %H:%M')}\n"
        f"Location: {event.location}\n\n"
        f"If this was a mistake, please register again through our platform.\n\n"
        f"Best regards,\n"
        f"UniEvents Team"
    )
    return send_email(user.email, subject, body)
