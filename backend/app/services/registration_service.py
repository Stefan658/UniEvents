from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from backend.app.extensions import db
from backend.app.models.registration import Registration
from backend.app.models.user import User
from backend.app.models.event import Event
from backend.app.services import email_service, calendar_service


def create_registration(user_id, event_id):
    """Creates a new event registration. Returns (registration, email_status)."""
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
        
        # Send confirmation email
        email_status = "skipped"
        try:
            ics_content = calendar_service.generate_ics(event)
            email_status = email_service.send_registration_confirmation(user, event, ics_content)
        except Exception:
            email_status = "failed"

        return new_registration, email_status
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
    """Deletes an event registration by its ID. Returns (success, email_status)."""
    registration = Registration.query.options(
        joinedload(Registration.user),
        joinedload(Registration.event),
    ).get(registration_id)
    
    if not registration:
        return False, "skipped"

    user = registration.user
    event = registration.event

    db.session.delete(registration)
    db.session.commit()

    # Send cancellation email
    email_status = "skipped"
    try:
        email_status = email_service.send_registration_cancellation(user, event)
    except Exception:
        email_status = "failed"

    return True, email_status


ALLOWED_REGISTRATION_STATUSES = ["confirmed", "cancelled", "pending"]


def update_registration_status(registration_id, status):
    """Updates the status of a specific registration. Returns (registration, email_status)."""
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
        return None, "skipped"

    old_status = registration.status
    registration.status = normalized_status
    db.session.commit()

    # Send cancellation email if it was confirmed and now it's cancelled
    email_status = "skipped"
    if normalized_status == "cancelled" and old_status != "cancelled":
        try:
            email_status = email_service.send_registration_cancellation(registration.user, registration.event)
        except Exception:
            email_status = "failed"

    return registration, email_status


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


def get_registrations_for_user(user_id):
    """Returns all registrations for a specific user, including event details."""
    registrations = (
        Registration.query.filter_by(user_id=user_id)
        .options(
            joinedload(Registration.user),
            joinedload(Registration.event),
        )
        .order_by(Registration.registered_at.desc())
        .all()
    )
    return registrations