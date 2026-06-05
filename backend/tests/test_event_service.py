from datetime import datetime


def validate_event_payload(payload: dict) -> dict:
    """
    Validează datele de bază ale unui eveniment.
    Returnează un dicționar cu erori pentru câmpurile invalide.
    """
    errors = {}

    if not payload.get("title"):
        errors["title"] = "Title is required."

    if not payload.get("start_datetime"):
        errors["start_datetime"] = "Start datetime is required."

    if not payload.get("end_datetime"):
        errors["end_datetime"] = "End datetime is required."

    if payload.get("start_datetime") and payload.get("end_datetime"):
        start = datetime.fromisoformat(payload["start_datetime"])
        end = datetime.fromisoformat(payload["end_datetime"])

        if end <= start:
            errors["end_datetime"] = "End datetime must be after start datetime."

    if payload.get("requires_registration") is True:
        max_participants = payload.get("max_participants")

        if max_participants is None or max_participants <= 0:
            errors["max_participants"] = "Max participants must be a positive integer."

    return errors


def test_event_requires_title():
    payload = {
        "title": "",
        "start_datetime": "2026-06-10T10:00:00",
        "end_datetime": "2026-06-10T12:00:00",
        "requires_registration": False,
        "max_participants": None,
    }

    errors = validate_event_payload(payload)

    assert "title" in errors


def test_event_end_datetime_must_be_after_start_datetime():
    payload = {
        "title": "Workshop React",
        "start_datetime": "2026-06-10T14:00:00",
        "end_datetime": "2026-06-10T12:00:00",
        "requires_registration": False,
        "max_participants": None,
    }

    errors = validate_event_payload(payload)

    assert "end_datetime" in errors


def test_event_without_registration_does_not_require_max_participants():
    payload = {
        "title": "Conferință USV",
        "start_datetime": "2026-06-10T10:00:00",
        "end_datetime": "2026-06-10T12:00:00",
        "requires_registration": False,
        "max_participants": None,
    }

    errors = validate_event_payload(payload)

    assert "max_participants" not in errors


def test_event_with_registration_requires_positive_max_participants():
    payload = {
        "title": "Workshop Python",
        "start_datetime": "2026-06-10T10:00:00",
        "end_datetime": "2026-06-10T12:00:00",
        "requires_registration": True,
        "max_participants": 0,
    }

    errors = validate_event_payload(payload)

    assert "max_participants" in errors


def test_valid_event_payload_has_no_errors():
    payload = {
        "title": "Workshop AI",
        "start_datetime": "2026-06-10T10:00:00",
        "end_datetime": "2026-06-10T12:00:00",
        "requires_registration": True,
        "max_participants": 30,
    }

    errors = validate_event_payload(payload)

    assert errors == {}