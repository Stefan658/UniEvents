import os

class Config:
    """Flask configuration variables."""

    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@db:5432/uni_events"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False