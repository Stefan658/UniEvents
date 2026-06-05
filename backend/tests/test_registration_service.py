def can_register_to_event(event: dict, current_participants: int) -> bool:
    """
    Verifică dacă un participant se poate înscrie la un eveniment.
    Reguli:
    - evenimentul trebuie să fie publicat;
    - evenimentul nu trebuie să fie anulat;
    - dacă există limită de locuri, aceasta nu trebuie depășită.
    """
    if event.get("status") != "published":
        return False

    if event.get("status") == "cancelled":
        return False

    if event.get("requires_registration") is False:
        return True

    max_participants = event.get("max_participants")

    if max_participants is None:
        return True

    return current_participants < max_participants


def test_user_can_register_to_published_event_with_available_seats():
    event = {
        "title": "Workshop Python",
        "status": "published",
        "requires_registration": True,
        "max_participants": 30,
    }

    result = can_register_to_event(event, current_participants=10)

    assert result is True


def test_user_cannot_register_to_cancelled_event():
    event = {
        "title": "Workshop AI",
        "status": "cancelled",
        "requires_registration": True,
        "max_participants": 30,
    }

    result = can_register_to_event(event, current_participants=5)

    assert result is False


def test_user_cannot_register_to_draft_event():
    event = {
        "title": "Eveniment nepublicat",
        "status": "draft",
        "requires_registration": True,
        "max_participants": 30,
    }

    result = can_register_to_event(event, current_participants=5)

    assert result is False


def test_user_cannot_register_when_event_is_full():
    event = {
        "title": "Workshop Full",
        "status": "published",
        "requires_registration": True,
        "max_participants": 20,
    }

    result = can_register_to_event(event, current_participants=20)

    assert result is False


def test_free_access_event_without_registration_is_available():
    event = {
        "title": "Prezentare publică",
        "status": "published",
        "requires_registration": False,
        "max_participants": None,
    }

    result = can_register_to_event(event, current_participants=100)

    assert result is True