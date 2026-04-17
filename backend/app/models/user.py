from backend.app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)

    # Relationships (back-populated from other models)
    role = db.relationship("Role", back_populates="users")
    organized_events = db.relationship("Event", back_populates="organizer")
    registrations = db.relationship("Registration", back_populates="user")
    feedback_entries = db.relationship("Feedback", back_populates="user")
    uploaded_materials = db.relationship("Material", back_populates="uploader")

    @property
    def full_name(self):
        """Returns the user's full name."""
        return f"{self.first_name} {self.last_name}"