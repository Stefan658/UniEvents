from flask import Blueprint, request, jsonify
from backend.app.services import registration_service


registrations_bp = Blueprint(
    "registrations", __name__, url_prefix="/api/registrations"
)


def _serialize_registration(registration):
    """Funcție helper pentru a serializa un obiect Registration."""
    return {
        "id": registration.id,
        "user_id": registration.user_id,
        "event_id": registration.event_id,
        "status": registration.status,
        "registered_at": registration.registered_at.isoformat()
        if registration.registered_at
        else None,
        "user_email": registration.user.email if registration.user else None,
        "event_title": registration.event.title if registration.event else None,
    }


@registrations_bp.route("", methods=["POST"])
def add_registration():
    """Creează o nouă înregistrare la un eveniment."""
    data = request.get_json()
    if not data or "user_id" not in data or "event_id" not in data:
        return jsonify({"error": "Datele 'user_id' și 'event_id' sunt obligatorii."}), 400

    try:
        new_registration = registration_service.create_registration(
            user_id=data["user_id"], event_id=data["event_id"]
        )
        return (
            jsonify(
                {"message": "Înregistrare creată cu succes", "id": new_registration.id}
            ),
            201,
        )
    except ValueError as e:
        if "DuplicateRegistrationError" in str(e):
            return jsonify({"error": "Utilizatorul este deja înregistrat la acest eveniment."}), 409
        if "not found" in str(e):
            return jsonify({"error": str(e)}), 404
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "A apărut o eroare internă a serverului."}), 500


@registrations_bp.route("/<int:id>", methods=["GET"])
def get_registration(id):
    """Returnează detaliile unei înregistrări specifice."""
    try:
        registration = registration_service.get_registration_by_id(id)
        if not registration:
            return jsonify({"error": "Înregistrarea nu a fost găsită"}), 404

        return jsonify(_serialize_registration(registration)), 200
    except Exception:
        return jsonify({"error": "A apărut o eroare internă a serverului."}), 500


@registrations_bp.route("/<int:id>", methods=["DELETE"])
def remove_registration(id):
    """Șterge o înregistrare."""
    try:
        success = registration_service.delete_registration(id)
        if not success:
            return jsonify({"error": "Înregistrarea nu a fost găsită"}), 404
        return jsonify({"message": "Înregistrarea a fost ștearsă cu succes"}), 200
    except Exception:
        return jsonify({"error": "A apărut o eroare internă a serverului."}), 500