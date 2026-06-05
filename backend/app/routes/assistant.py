from flask import Blueprint, jsonify, request
from backend.app.services import assistant_service

assistant_bp = Blueprint("assistant", __name__)

@assistant_bp.route("/api/assistant/chat", methods=["POST"])
def chat():
    """
    Handles POST requests for the rule-based assistant.
    Guest safe; does not currently require authentication.
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    try:
        # Note: current_user extraction will be added later for personalized answers.
        # For now, we pass None to the service.
        response_payload = assistant_service.handle_assistant_message(message, current_user=None)
        return jsonify(response_payload), 200
    except Exception as e:
        return jsonify({
            "answer": "An internal error occurred while processing your request.",
            "suggestions": [],
            "events": []
        }), 500
