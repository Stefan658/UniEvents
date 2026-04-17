from datetime import datetime
from backend.app.extensions import db

class Registration(db.Model):
    __tablename__ = "registrations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    registered_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    check_in_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "event_id", name="uq_user_event_registration"),
    )

    # Relationships
    user = db.relationship("User", back_populates="registrations")
    event = db.relationship("Event", back_populates="registrations")
