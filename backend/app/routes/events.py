from flask import Blueprint, jsonify
from sqlalchemy.orm import joinedload
from backend.app.models.event import Event

events_bp = Blueprint("events", __name__)


def _serialize_event(event):
    """Helper function to serialize an event object."""
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at.isoformat(),
        "end_at": event.end_at.isoformat(),
        "location": event.location,
        "participation_type": event.participation_type,
        "registration_link": event.registration_link,
        "qr_code_url": event.qr_code_url,
        "status": event.status,
        "max_participants": event.max_participants,
        "registration_deadline": event.registration_deadline.isoformat()
        if event.registration_deadline
        else None,
        "requires_registration": event.requires_registration,
        "is_free_entry": event.is_free_entry,
        "created_at": event.created_at.isoformat(),
        "updated_at": event.updated_at.isoformat() if event.updated_at else None,
        "organizer_id": event.organizer_id,
        "category_id": event.category_id,
        "category_name": event.category.name if event.category else None,
        "organizer_full_name": event.organizer.full_name if event.organizer else None,
    }


@events_bp.route("/api/events", methods=["GET"])
def get_events():
    """Returns a list of all events."""
    events = (
        Event.query.options(joinedload(Event.category), joinedload(Event.organizer))
        .order_by(Event.start_at.desc())
        .all()
    )
    return jsonify([_serialize_event(event) for event in events])


@events_bp.route("/api/events/<int:event_id>", methods=["GET"])
def get_event(event_id):
    """Returns a single event by ID."""
    event = Event.query.options(
        joinedload(Event.category), joinedload(Event.organizer)
    ).get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(_serialize_event(event))