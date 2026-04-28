from flask import Flask, jsonify
from flask_cors import CORS

from backend.app.config import Config
from backend.app.extensions import db, migrate
from backend.app.routes import (
    health_bp,
    categories_bp,
    events_bp,
    feedback_bp,
    auth_bp,
    reports_bp,
    registration_bp,
    material_bp,
    users_bp,
)


def create_app(config_class=Config):
    """Initialize the core application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Ensure SECRET_KEY is present for JWT generation and security
    if not app.config.get('SECRET_KEY'):
        raise RuntimeError("SECRET_KEY is not set in the environment or configuration.")

    # Initialize Flask extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)

    # Import models to ensure they are registered with SQLAlchemy for migrations.
    from backend.app.models import (
        category,
        event,
        feedback,
        material,
        registration,
        role,
        user,
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(feedback_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(registration_bp)
    app.register_blueprint(material_bp)
    app.register_blueprint(users_bp)

    return app