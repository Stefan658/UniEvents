import smtplib
import logging
import io
import qrcode
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from flask import current_app

logger = logging.getLogger(__name__)

def generate_ticket_qr(ticket_code):
    """
    Generates a QR code PNG for a ticket code.
    Returns bytes of the PNG image or None if failed.
    """
    try:
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"unievents-ticket:{ticket_code}")
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        return img_byte_arr.getvalue()
    except Exception as e:
        logger.error(f"Failed to generate QR code for {ticket_code}: {str(e)}")
        return None

def send_email(to_email, subject, body, attachments=None):
    """
    Sends an email using the SMTP configuration in the app config.
    attachments: list of dicts with 'content' (bytes) and 'filename' (str).
    Returns: "sent", "skipped", or "failed".
    """
    config = current_app.config
    
    smtp_host = config.get("SMTP_HOST")
    smtp_port = config.get("SMTP_PORT")
    smtp_user = config.get("SMTP_USERNAME")
    smtp_pass = config.get("SMTP_PASSWORD")
    from_email = config.get("SMTP_FROM_EMAIL")
    use_tls = config.get("SMTP_USE_TLS", True)
    auth_required = config.get("SMTP_AUTH_REQUIRED", True)

    if not smtp_host or (auth_required and (not smtp_user or not smtp_pass)):
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

        if attachments:
            for att in attachments:
                content = att.get("content")
                filename = att.get("filename")
                if content and filename:
                    part = MIMEApplication(content, Name=filename)
                    part["Content-Disposition"] = f'attachment; filename="{filename}"'
                    msg.attach(part)

        server = smtplib.SMTP(smtp_host, smtp_port)
        if use_tls:
            server.starttls()
        
        if auth_required:
            server.login(smtp_user, smtp_pass)
            
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent successfully to {to_email}")
        return "sent"
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return "failed"

def send_registration_confirmation(user, event, ics_content=None, ticket_code=None):
    """Sends a registration confirmation email with optional ICS and QR ticket."""
    subject = f"Registration Confirmed: {event.title}"
    body = (
        f"Hello {user.full_name or user.email},\n\n"
        f"Your registration for the event '{event.title}' has been confirmed.\n\n"
        f"Event Details:\n"
        f"Title: {event.title}\n"
        f"Date: {event.start_at.strftime('%Y-%m-%d %H:%M')}\n"
        f"Location: {event.location}\n\n"
    )
    
    if ticket_code:
        body += f"Your unique ticket code is: {ticket_code}\n"
        body += "You can find your ticket QR code attached to this email.\n\n"
    
    body += (
        f"We look forward to seeing you there!\n\n"
        f"Best regards,\n"
        f"UniEvents Team"
    )
    
    attachments = []
    if ics_content:
        attachments.append({
            "content": ics_content,
            "filename": f"event-{event.id}.ics"
        })
    
    if ticket_code:
        qr_content = generate_ticket_qr(ticket_code)
        if qr_content:
            attachments.append({
                "content": qr_content,
                "filename": "unievents-ticket-qr.png"
            })

    return send_email(user.email, subject, body, attachments)

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
