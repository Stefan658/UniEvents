from flask import Blueprint, jsonify, request
from datetime import datetime
from sqlalchemy.orm import joinedload
from backend.app.models.event import Event
from backend.app.models.material import Material
from backend.app.services import event_service

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


def _serialize_material(material):
    """Helper function to serialize a material object."""
    return {
        "id": material.id,
        "event_id": material.event_id,
        "uploader_id": material.uploader_id,
        "file_name": material.file_name,
        "file_url": material.file_url,
        "file_type": material.file_type,
        "uploaded_at": material.uploaded_at.isoformat(),
        "uploader_full_name": material.uploader.full_name
        if material.uploader
        else None,
    }


def _serialize_calendar_event(event):
    """Helper function to serialize an event for the calendar view."""
    return {
        "id": event.id,
        "title": event.title,
        "start": event.start_at.isoformat(),
        "end": event.end_at.isoformat(),
        "location": event.location,
        "status": event.status,
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


@events_bp.route("/api/events/<int:event_id>/materials", methods=["GET"])
def get_event_materials(event_id):
    """Returns a list of materials for a specific event."""
    try:
        # First, check if the event exists to return a 404 if not.
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

        # Query for materials related to the event, joining the uploader to get their name.
        materials = (
            Material.query.options(joinedload(Material.uploader))
            .filter_by(event_id=event_id)
            .order_by(Material.uploaded_at.desc())
            .all()
        )

        return jsonify([_serialize_material(m) for m in materials]), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@events_bp.route("/api/events/calendar", methods=["GET"])
def get_calendar_events_route():
    """
    Returns events in a format suitable for a calendar.
    Supports 'from' and 'to' query parameters for date range filtering.
    """
    try:
        from_str = request.args.get("from")
        to_str = request.args.get("to")

        from_date = None
        to_date = None

        if from_str and to_str:
            from_date = datetime.fromisoformat(from_str)
            to_date = datetime.fromisoformat(to_str)
        elif from_str or to_str:
            # If only one is provided, it's an invalid request for a range
            return jsonify({"error": "Both 'from' and 'to' parameters are required for date range filtering."}), 400

        events = event_service.get_calendar_events(from_date, to_date)
        return jsonify([_serialize_calendar_event(e) for e in events]), 200

    except ValueError:
        # This catches errors from fromisoformat
        return jsonify({"error": "Invalid date format for 'from' or 'to' parameters. Use ISO 8601 format."}), 400
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500



@events_bp.route("/api/events", methods=["POST"])
def create_event():
    """Creates a new event."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    try:
        new_event = event_service.create_event(data)
        return jsonify(_serialize_event(new_event)), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@events_bp.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event_route(event_id):
    """Updates an existing event."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    try:
        updated_event = event_service.update_event(event_id, data)
        if not updated_event:
            return jsonify({"error": "Event not found"}), 404

        return jsonify(_serialize_event(updated_event)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500


@events_bp.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event_route(event_id):
    """Deletes an existing event."""
    try:
        success = event_service.delete_event(event_id)
        if not success:
            return jsonify({"error": "Event not found"}), 404

        return jsonify({"message": "Event deleted successfully"}), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@events_bp.route("/api/events/<int:event_id>/status", methods=["PUT"])
def update_event_status_route(event_id):
    """Updates the status of an existing event."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    new_status = data.get("status")
    if not new_status:
        return jsonify({"error": "'status' is a required field."}), 400

    try:
        updated_event = event_service.update_event_status(event_id, new_status)
        if not updated_event:
            return jsonify({"error": "Event not found"}), 404

        return jsonify(_serialize_event(updated_event)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@events_bp.route("/api/events/search", methods=["GET"])
def search_events_route():
    """
    Searches and filters events based on query parameters.
    Supported filters: title, category_id, organizer_id, participation_type, status, location.
    """
    try:
        filters = {
            key: request.args.get(key)
            for key in [
                "title",
                "category_id",
                "organizer_id",
                "participation_type",
                "status",
                "location",
            ]
            if request.args.get(key) is not None
        }

        # If no filters are provided, the service will return all events, which is demo-friendly.
        events = event_service.search_events(filters)
        return jsonify([_serialize_event(event) for event in events]), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500