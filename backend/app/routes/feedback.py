from datetime import datetime
from flask import Blueprint, request, jsonify
from backend.app.services import feedback_service
from backend.app.utils.validators import validate_feedback_payload
from backend.app.utils.decorators import token_required
from backend.app.models.registration import Registration
from backend.app.models.event import Event

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
@token_required
def add_feedback(current_user):
    """Adaugă un nou feedback pentru un eveniment."""
    data = request.get_json()

    try:
        if not data:
            return jsonify({"error": "Invalid JSON payload."}), 400
            
        event_id = data.get("event_id")
        if not event_id:
            return jsonify({"error": "Event ID is required."}), 400

        # Override user_id with authenticated current_user
        data["user_id"] = current_user.id
        
        validated_data = validate_feedback_payload(data) 
        
        # Guard: Check if user is a confirmed attendee
        registration = Registration.query.filter_by(
            user_id=current_user.id,
            event_id=event_id,
            status="confirmed"
        ).first()
        
        if not registration:
            return jsonify({"error": "Only confirmed attendees can leave feedback."}), 403

        # Guard: Check if event has passed
        event = Event.query.get(event_id)
        if not event:
             return jsonify({"error": "Event not found."}), 404
             
        # Fallback to start_at if end_at is missing
        event_end_time = event.end_at if event.end_at else event.start_at
        if event_end_time > datetime.utcnow():
            return jsonify({"error": "Feedback can only be submitted after the event has ended."}), 403

        new_feedback = feedback_service.create_feedback(
            user_id=current_user.id,
            event_id=event_id,
            rating=validated_data["rating"],
            comment=validated_data["comment"],
        )
        
        # Reload to ensure relationships are available for serialization
        full_feedback = feedback_service.get_feedback_by_id(new_feedback.id)
        
        return jsonify({
            "message": "Feedback created successfully.",
            "data": _serialize_feedback(full_feedback)
        }), 201 
    except ValueError as e:
        if str(e).startswith("FeedbackDuplicateError:"): 
            return jsonify({"error": "You have already submitted feedback for this event."}), 409
        return jsonify({"error": str(e)}), 400 
    except Exception: 
        return jsonify({"error": "An internal server error occurred."}), 500


@feedback_bp.route("/api/feedback", methods=["GET"])
def get_all_feedback_route():
    """Retrieves a list of all feedback entries."""
    try:
        feedback_list = feedback_service.get_all_feedback()
        return jsonify([_serialize_feedback(f) for f in feedback_list]), 200
    except Exception: # Changed message, removed traceback and details
        return jsonify({"error": "An internal server error occurred."}), 500



@feedback_bp.route("/api/feedback/event/<int:event_id>", methods=["GET"])
def get_event_feedback(event_id):
    """Retrieves all feedback for a specific event."""
    try:
        feedback_list = feedback_service.get_feedback_for_event(event_id)

        # The service returns None if the event itself is not found.
        if feedback_list is None:
            return jsonify({"error": "Event not found."}), 404 # Changed message

        return jsonify([_serialize_feedback(f) for f in feedback_list]), 200
    except Exception: # Changed message, removed comment
        return jsonify({"error": "An internal server error occurred."}), 500


@feedback_bp.route("/api/events/<int:event_id>/feedback/summary", methods=["GET"])
def get_event_feedback_summary(event_id):
    """
    Retrieves a summary of feedback for a specific event.
    """
    try:
        summary = feedback_service.get_feedback_summary_for_event(event_id)
        if summary is None:
            return jsonify({"error": "Event not found."}), 404 # Changed message

        return jsonify(summary), 200
    except Exception: # Changed message, removed comment
        return jsonify({"error": "An internal server error occurred."}), 500


@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["GET"])
def get_feedback_by_id_route(feedback_id):
    """Retrieves a single feedback entry by its ID."""
    try:
        feedback = feedback_service.get_feedback_by_id(feedback_id)
        if not feedback: # Changed message
            return jsonify({"error": "Feedback not found."}), 404
        
        return jsonify(_serialize_feedback(feedback)), 200
    except Exception: # Changed message, removed traceback and details
        return jsonify({"error": "An internal server error occurred."}), 500


@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["PUT"])
def update_feedback_route(feedback_id):
    """Updates an existing feedback entry."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload."}), 400 # Changed message

    try: # This can raise ValueError with Romanian messages
        updated_feedback = feedback_service.update_feedback(feedback_id, data) 

        if not updated_feedback: # Changed message
            return jsonify({"error": "Feedback not found."}), 404

        return jsonify(_serialize_feedback(updated_feedback)), 200

    except ValueError: # Changed message
        return jsonify({"error": "Invalid input data."}), 400
    except Exception: # Changed message, removed traceback and details
        return jsonify({"error": "An internal server error occurred."}), 500


@feedback_bp.route("/api/feedback/<int:feedback_id>", methods=["DELETE"])
def delete_feedback_route(feedback_id):
    """Deletes a feedback entry by its ID."""
    try:
        success = feedback_service.delete_feedback(feedback_id) # Changed message
        if not success: # Changed message
            return jsonify({"error": "Feedback not found."}), 404
        
        return jsonify({"message": "Feedback deleted successfully."}), 200 # Changed message
    except Exception: # Changed message, removed traceback and details
        return jsonify({"error": "An internal server error occurred."}), 500