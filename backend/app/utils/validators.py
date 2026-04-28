from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.event import Event


def validate_id(value, model_class, field_name):
    """Validates that an ID is an integer and the entity exists in the database."""
    if not isinstance(value, int) or value <= 0:
        raise ValueError(f"'{field_name}' must be a positive integer.")

    entity = db.session.get(model_class, value)
    if not entity:
        raise ValueError(f"{model_class.__name__} with ID {value} not found.")
    return entity


def validate_rating(rating):
    """Validates that the rating is an integer between 1 and 5."""
    if not isinstance(rating, int) or not (1 <= rating <= 5):
        raise ValueError("Rating must be an integer between 1 and 5.")
    return rating


def validate_feedback_payload(data):
    """Validates the data received for creating feedback."""
    if not isinstance(data, dict):
        raise ValueError("Feedback data must be in JSON format.")

    user_id = data.get("user_id")
    event_id = data.get("event_id")
    rating = data.get("rating")
    comment = data.get("comment")

    validate_id(user_id, User, "user_id")  # Will raise ValueError if invalid
    validate_id(event_id, Event, "event_id")  # Will raise ValueError if invalid
    validate_rating(rating)  # Will raise ValueError if invalid

    # Comentariul este opțional, nu necesită validare strictă aici

    return {"user_id": user_id, "event_id": event_id, "rating": rating, "comment": comment}