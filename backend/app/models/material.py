from datetime import datetime
from backend.app.extensions import db

class Material(db.Model):
    __tablename__ = "materials"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete='CASCADE'), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    # Relația cu Event este definită în Event.materials
    event = db.relationship("Event", back_populates="materials")
    # Relația cu User este definită în User.uploaded_materials
    uploader = db.relationship("User", back_populates="uploaded_materials")