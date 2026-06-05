from datetime import datetime


def can_leave_feedback(event: dict, user_registration: dict) -> bool:
    """
    Verifică dacă un utilizator poate lăsa feedback.
    Reguli:
    - utilizatorul trebuie să fi fost înscris;
    - evenimentul trebuie să fie finalizat;
    - evenimentul nu trebuie să fie anulat.
    """
    if user_registration is None:
        return False

    if user_registration.get("status") != "registered":
        return False

    if event.get("status") == "cancelled":
        return False

    event_end = datetime.fromisoformat(event["end_datetime"])
    now = datetime.fromisoformat(event["current_datetime"])

    return event_end < now


def is_valid_rating(rating: int) -> bool:
    """
    Ratingul trebuie să fie între 1 și 5.
    """
    return isinstance(rating, int) and 1 <= rating <= 5


def test_registered_user_can_leave_feedback_after_event_ended():
    event = {
        "title": "Workshop AI",
        "status": "published",
        "end_datetime": "2026-06-10T12:00:00",
        "current_datetime": "2026-06-10T15:00:00",
    }

    registration = {
        "user_id": 1,
        "status": "registered",
    }

    result = can_leave_feedback(event, registration)

    assert result is True


def test_user_cannot_leave_feedback_before_event_ended():
    event = {
        "title": "Workshop AI",
        "status": "published",
        "end_datetime": "2026-06-10T18:00:00",
        "current_datetime": "2026-06-10T15:00:00",
    }

    registration = {
        "user_id": 1,
        "status": "registered",
    }

    result = can_leave_feedback(event, registration)

    assert result is False


def test_user_cannot_leave_feedback_for_cancelled_event():
    event = {
        "title": "Workshop Anulat",
        "status": "cancelled",
        "end_datetime": "2026-06-10T12:00:00",
        "current_datetime": "2026-06-10T15:00:00",
    }

    registration = {
        "user_id": 1,
        "status": "registered",
    }

    result = can_leave_feedback(event, registration)

    assert result is False


def test_valid_rating_between_1_and_5():
    assert is_valid_rating(5) is True


def test_invalid_rating_greater_than_5():
    assert is_valid_rating(6) is False


def test_invalid_rating_zero():
    assert is_valid_rating(0) is False