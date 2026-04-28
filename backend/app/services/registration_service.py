from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from backend.app.extensions import db
from backend.app.models.registration import Registration
from backend.app.models.user import User
from backend.app.models.event import Event


def create_registration(user_id, event_id):
    """Creates a new event registration."""
    user = User.query.get(user_id)
    if not user:
        raise ValueError(f"User with ID {user_id} not found.")

    event = Event.query.get(event_id)
    if not event:
        raise ValueError(f"Event with ID {event_id} not found.")

    try:
        new_registration = Registration(
            user_id=user_id,
            event_id=event_id,
            status="confirmed",
        )
        db.session.add(new_registration)
        db.session.commit()
        return new_registration
    except IntegrityError:
        db.session.rollback()
        raise ValueError(
            "DuplicateRegistrationError: This user is already registered for this event."
        )


def get_all_registrations():
    """Returns all registrations, including related user and event details."""
    registrations = (
        Registration.query.options(
            joinedload(Registration.user),
            joinedload(Registration.event),
        )
        .order_by(Registration.registered_at.desc())
        .all()
    )
    return registrations


def get_registrations_for_event(event_id):
    """Returns all registrations for a given event, including user details."""
    event = Event.query.get(event_id)
    if not event:
        return None

    registrations = (
        Registration.query.filter_by(event_id=event_id)
        .options(
            joinedload(Registration.user),
            joinedload(Registration.event),
        )
        .order_by(Registration.registered_at.desc())
        .all()
    )
    return registrations


def delete_registration(registration_id):
    """Deletes an event registration by its ID."""
    registration = Registration.query.get(registration_id)
    if not registration:
        return False

    db.session.delete(registration)
    db.session.commit()
    return True


ALLOWED_REGISTRATION_STATUSES = ["confirmed", "cancelled", "pending"]


def update_registration_status(registration_id, status):
    """Updates the status of a specific registration."""
    if not isinstance(status, str):
        raise ValueError("Status must be a string.")
    
    normalized_status = status.strip().lower()
    if normalized_status not in ALLOWED_REGISTRATION_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Allowed statuses are: {', '.join(ALLOWED_REGISTRATION_STATUSES)}")

    registration = (
        Registration.query.options(
            joinedload(Registration.user),
            joinedload(Registration.event),
        )
        .filter_by(id=registration_id)
        .first()
    )
    if not registration:
        return None

    registration.status = normalized_status
    db.session.commit()

    return registration


def get_registration_by_id(registration_id):
    """Returns a registration by ID, including user and event."""
    registration = (
        Registration.query.options(
            joinedload(Registration.user),
            joinedload(Registration.event),
        )
        .filter_by(id=registration_id)
        .first()
    )
    return registration