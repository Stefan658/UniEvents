import os

class Config:
    """Flask configuration variables."""

    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@db:5432/uni_events"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Email configuration
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@uni-events.ro")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() == "true"