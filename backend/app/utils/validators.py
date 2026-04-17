from backend.app.extensions import db
from backend.app.models.user import User
from backend.app.models.event import Event


def validate_id(value, model_class, field_name):
    """Validează că un ID este un număr întreg și că entitatea există în baza de date."""
    if not isinstance(value, int) or value <= 0:
        raise ValueError(f"'{field_name}' trebuie să fie un număr întreg pozitiv.")

    entity = db.session.get(model_class, value)
    if not entity:
        raise ValueError(f"{model_class.__name__} cu ID-ul {value} nu a fost găsit.")
    return entity


def validate_rating(rating):
    """Validează că rating-ul este un număr întreg între 1 și 5."""
    if not isinstance(rating, int) or not (1 <= rating <= 5):
        raise ValueError("Rating-ul trebuie să fie un număr întreg între 1 și 5.")
    return rating


def validate_feedback_payload(data):
    """Validează datele primite pentru crearea unui feedback."""
    if not isinstance(data, dict):
        raise ValueError("Datele de feedback trebuie să fie în format JSON.")

    user_id = data.get("user_id")
    event_id = data.get("event_id")
    rating = data.get("rating")
    comment = data.get("comment")

    validate_id(user_id, User, "user_id")  # Va ridica ValueError dacă nu e valid
    validate_id(event_id, Event, "event_id")  # Va ridica ValueError dacă nu e valid
    validate_rating(rating)  # Va ridica ValueError dacă nu e valid

    # Comentariul este opțional, nu necesită validare strictă aici

    return {"user_id": user_id, "event_id": event_id, "rating": rating, "comment": comment}