from flask import Blueprint, jsonify, request, current_app
import jwt
from backend.app.services import assistant_service
from backend.app.models.user import User

assistant_bp = Blueprint("assistant", __name__)

def _get_current_user_optional():
    """Helper to get current user if token is provided, without requiring it."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            return User.query.get(int(payload['sub']))
        except:
            pass
    return None

@assistant_bp.route("/api/assistant/chat", methods=["POST"])
def chat():
    """
    Handles POST requests for the rule-based assistant.
    Guest safe; optionally uses authentication for personalized answers.
    """
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    try:
        current_user = _get_current_user_optional()
        response_payload = assistant_service.handle_assistant_message(message, current_user=current_user)
        return jsonify(response_payload), 200
    except Exception as e:
        return jsonify({
            "answer": "An internal error occurred while processing your request.",
            "suggestions": [],
            "events": []
        }), 500
