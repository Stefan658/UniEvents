from datetime import datetime
from backend.app.extensions import db

class Feedback(db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("user_id", "event_id", name="uq_user_event_feedback"),
    )

    # Relationships
    user = db.relationship("User", back_populates="feedback_entries")
    event = db.relationship("Event", back_populates="feedback_entries")
