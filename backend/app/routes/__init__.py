from .auth import auth_bp
from .categories import categories_bp
from .events import events_bp
from .feedback import feedback_bp
from .health import health_bp
from .material import material_bp
from .registration import registration_bp
from .reports import reports_bp
from .users import users_bp

__all__ = [
    "auth_bp",
    "categories_bp",
    "events_bp",
    "feedback_bp",
    "health_bp",
    "material_bp",
    "registration_bp",
    "reports_bp",
    "users_bp",
]