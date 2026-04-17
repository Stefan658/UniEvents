from flask import Blueprint, request, jsonify
from backend.app.services import feedback_service
from backend.app.utils.validators import validate_feedback_payload

feedback_bp = Blueprint("feedback", __name__)


def _serialize_feedback(feedback):
    """Helper function to serialize a feedback object."""
    user_full_name = None
    if feedback.user:
        first_name = feedback.user.first_name or ""
        last_name = feedback.user.last_name or ""
        user_full_name = f"{first_name} {last_name}".strip() or None

    return {
        "id": feedback.id,
        "user_id": feedback.user_id,
        "event_id": feedback.event_id,
        "rating": feedback.rating,
        "comment": feedback.comment,
        "created_at": feedback.created_at.isoformat(),
        "user_email": feedback.user.email if feedback.user else None,
        "user_full_name": user_full_name,
        "event_title": feedback.event.title if feedback.event else None, # Added for GET /api/feedback
    }


@feedback_bp.route("/api/feedback", methods=["POST"])
def add_feedback():
    """Adaugă un nou feedback pentru un eveniment."""
    data = request.get_json()

    try:
        validated_data = validate_feedback_payload(data)
        new_feedback = feedback_service.create_feedback(
            user_id=validated_data["user_id"],
            event_id=validated_data["event_id"],
            rating=validated_data["rating"],
            comment=validated_data["comment"],
        )
        return (
            jsonify(
                {"message": "Feedback adăugat cu succes", "id": new_feedback.id}
            ),
            201,
        )
    except ValueError as e:
        # Verificăm dacă eroarea este de tip "FeedbackDuplicateError"
        if str(e).startswith("FeedbackDuplicateError:"):
            return jsonify({"error": str(e).replace("FeedbackDuplicateError: ", "")}), 409
        return jsonify({"error": str(e)}), 400
    except Exception: # Prindem orice altă excepție neașteptată
        return jsonify({"error": "A apărut o eroare internă a serverului."}), 500


@feedback_bp.route("/api/feedback", methods=["GET"])
def get_all_feedback_route():
    """Retrieves a list of all feedback entries."""
    try:
        feedback_list = feedback_service.get_all_feedback()
        return jsonify([_serialize_feedback(f) for f in feedback_list]), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "A apărut o eroare internă a serverului.", "details": str(e)}), 500



@feedback_bp.route("/api/feedback/event/<int:event_id>", methods=["GET"])
def get_event_feedback(event_id):
    """Retrieves all feedback for a specific event."""
    try:
        feedback_list = feedback_service.get_feedback_for_event(event_id)

        # The service returns None if the event itself is not found.
        if feedback_list is None:
            return jsonify({"error": "Event not found"}), 404

        return jsonify([_serialize_feedback(f) for f in feedback_list]), 200
    except Exception:
        # In a real app, it's better to log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@feedback_bp.route("/api/events/<int:event_id>/feedback/summary", methods=["GET"])
def get_event_feedback_summary(event_id):
    """
    Retrieves a summary of feedback for a specific event.
    """
    try:
        summary = feedback_service.get_feedback_summary_for_event(event_id)
        if summary is None:
            return jsonify({"error": "Event not found"}), 404

        return jsonify(summary), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["GET"])
def get_feedback_by_id_route(feedback_id):
    """Retrieves a single feedback entry by its ID."""
    try:
        feedback = feedback_service.get_feedback_by_id(feedback_id)
        if not feedback:
            return jsonify({"error": "Feedback not found"}), 404
        
        return jsonify(_serialize_feedback(feedback)), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An internal server error occurred", "details": str(e)}), 500


@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["PUT"])
def update_feedback_route(feedback_id):
    """Updates an existing feedback entry."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload-ul JSON este invalid sau lipsește."}), 400

    try:
        updated_feedback = feedback_service.update_feedback(feedback_id, data)

        if not updated_feedback:
            return jsonify({"error": "Feedback not found"}), 404

        return jsonify(_serialize_feedback(updated_feedback)), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "A apărut o eroare internă a serverului.", "details": str(e)}), 500


@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["DELETE"])
def delete_feedback_route(feedback_id):
    """Deletes a feedback entry by its ID."""
    try:
        success = feedback_service.delete_feedback(feedback_id)
        if not success:
            return jsonify({"error": "Feedback not found"}), 404
        
        return jsonify({"message": "Feedback deleted successfully."}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An internal server error occurred", "details": str(e)}), 500