from flask import Blueprint, request, jsonify
from backend.app.services import registration_service

registration_bp = Blueprint("registrations", __name__, url_prefix="/api")


def _serialize_registration(registration):
    """Helper function to serialize a registration object."""
    user_full_name = None
    if registration.user:
        first_name = registration.user.first_name or ""
        last_name = registration.user.last_name or ""
        user_full_name = f"{first_name} {last_name}".strip() or None

    return {
        "id": registration.id,
        "user_id": registration.user_id,
        "event_id": registration.event_id,
        "status": registration.status,
        "registered_at": registration.registered_at.isoformat()
        if registration.registered_at
        else None,
        "user_email": registration.user.email if registration.user else None,
        "user_full_name": user_full_name,
        "event_title": registration.event.title if registration.event else None,
    }


@registration_bp.route("/registrations", methods=["GET"])
def get_all_registrations_route():
    """Returns a list with all registrations."""
    try:
        registrations = registration_service.get_all_registrations()
        return jsonify([_serialize_registration(reg) for reg in registrations]), 200
    except Exception as e:
        return jsonify(
            {
                "error": "A apărut o eroare internă a serverului.",
                "details": str(e),
            }
        ), 500


@registration_bp.route("/registrations", methods=["POST"])
def add_registration():
    """Registers a user for an event."""
    data = request.get_json()
    if not data or not data.get("user_id") or not data.get("event_id"):
        return jsonify({"error": "user_id and event_id are required"}), 400

    try:
        new_registration = registration_service.create_registration(
            user_id=data["user_id"],
            event_id=data["event_id"],
        )
        return jsonify(_serialize_registration(new_registration)), 201
    except ValueError as e:
        if "DuplicateRegistrationError:" in str(e):
            return (
                jsonify({"error": str(e).replace("DuplicateRegistrationError: ", "")}),
                409,
            )
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500


@registration_bp.route("/events/<int:event_id>/registrations", methods=["GET"])
def get_event_registrations(event_id):
    """Gets all registrations for a specific event."""
    try:
        registrations = registration_service.get_registrations_for_event(event_id)

        if registrations is None:
            return jsonify({"error": "Event not found"}), 404

        return jsonify([_serialize_registration(reg) for reg in registrations]), 200
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500


@registration_bp.route("/registrations/<int:registration_id>", methods=["GET"])
def get_registration(registration_id):
    """Returns details for a specific registration."""
    try:
        registration = registration_service.get_registration_by_id(registration_id)
        if not registration:
            return jsonify({"error": "Înregistrarea nu a fost găsită"}), 404

        return jsonify(_serialize_registration(registration)), 200
    except Exception as e:
        return jsonify({"error": str(e), "type": e.__class__.__name__}), 500


@registration_bp.route("/registrations/<int:registration_id>", methods=["PUT"])
def update_registration(registration_id):
    """Updates an existing registration's status."""
    data = request.get_json()
    if not data or "status" not in data:
        return jsonify({"error": "Payload-ul JSON este invalid sau câmpul 'status' lipsește."}), 400

    try:
        updated_registration = registration_service.update_registration_status(
            registration_id, data["status"]
        )

        if not updated_registration:
            return jsonify({"error": "Registration not found"}), 404

        return jsonify(_serialize_registration(updated_registration)), 200
    except Exception as e:
        return jsonify({"error": "An internal server error occurred", "details": str(e)}), 500


@registration_bp.route("/registrations/<int:registration_id>", methods=["DELETE"])
def delete_registration_route(registration_id):
    """Deletes an existing event registration."""
    try:
        success = registration_service.delete_registration(registration_id)
        if not success:
            return jsonify({"error": "Registration not found"}), 404

        return jsonify({"message": "Registration deleted successfully"}), 200
    except Exception:
        return jsonify({"error": "An internal server error occurred"}), 500