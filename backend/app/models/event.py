from datetime import datetime
from backend.app.extensions import db

class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    start_at = db.Column(db.DateTime, nullable=False)
    end_at = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    participation_type = db.Column(db.String(20), nullable=False)
    registration_link = db.Column(db.String(500), nullable=True)
    qr_code_url = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), nullable=False)
    organizer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False)
    max_participants = db.Column(db.Integer, nullable=True)
    registration_deadline = db.Column(db.DateTime, nullable=True)
    requires_registration = db.Column(db.Boolean, default=False, nullable=False)
    is_free_entry = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    organizer = db.relationship("User", back_populates="organized_events")
    category = db.relationship("Category", back_populates="events")
    registrations = db.relationship("Registration", back_populates="event", cascade="all, delete-orphan", passive_deletes=True)
    feedback_entries = db.relationship("Feedback", back_populates="event", cascade="all, delete-orphan", passive_deletes=True)
    materials = db.relationship("Material", back_populates="event", cascade="all, delete-orphan", passive_deletes=True)