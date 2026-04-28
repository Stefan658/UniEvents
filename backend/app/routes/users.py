from flask import Blueprint, jsonify, request
from backend.app.services import user_service

users_bp = Blueprint("users", __name__)


def _serialize_user(user):
    """Helper function to serialize a user object for public display."""
    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "role_id": user.role_id,
        "role_name": user.role.name if user.role else None,
    }


@users_bp.route("/api/users", methods=["GET", "POST"])
def users_general_route():
    """Handles listing all users (GET) and creating a new user (POST)."""
    if request.method == "GET":
        try:
            users = user_service.get_all_users()
            return jsonify([_serialize_user(user) for user in users]), 200
        except Exception: # Changed message, removed traceback and details
            return jsonify({"error": "An internal server error occurred."}), 500

    if request.method == "POST":
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format or missing data."}), 400 # Changed message
        try: # This can raise ValueError with Romanian messages from user_service.py
            new_user = user_service.create_user(data) 
            return jsonify(_serialize_user(new_user)), 201
        except ValueError: # Changed message
            return jsonify({"error": "Invalid input data."}), 400
        except Exception: # Changed message, removed details
            return jsonify({"error": "An internal server error occurred."}), 500


@users_bp.route("/api/users/<int:user_id>", methods=["GET"])
def get_user_route(user_id):
    """Retrieves a single user by their ID."""
    try:
        user = user_service.get_user_by_id(user_id)
        if not user: # Changed message
            return jsonify({"error": "User not found."}), 404
        return jsonify(_serialize_user(user)), 200
    except Exception: # Changed message
        return jsonify({"error": "An internal server error occurred."}), 500


@users_bp.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user_route(user_id):
    """Updates an existing user's information."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload."}), 400 # Changed message
    try: # This can raise ValueError with Romanian messages from user_service.py
        updated_user = user_service.update_user(user_id, data) 

        if updated_user is None: # Changed message
            return jsonify({"error": "User not found."}), 404

        return jsonify(_serialize_user(updated_user)), 200

    except ValueError: # Changed message
        return jsonify({"error": "Invalid input data."}), 400
    except Exception: # Changed message, removed traceback and details
        return jsonify({"error": "An internal server error occurred."}), 500


@users_bp.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user_route(user_id):
    """Deletes a user by their ID."""
    try:
        success = user_service.delete_user(user_id) # Changed message
        if not success: # Changed message
            return jsonify({"error": "User not found."}), 404
        
        return jsonify({"message": "User deleted successfully."}), 200 # Changed message
    except Exception: # Changed message, removed traceback and details
        return jsonify({"error": "An internal server error occurred."}), 500


@users_bp.route("/api/users/organizers", methods=["GET"])
def get_organizers_route():
    """Returns a list of all users with the 'organizer' role."""
    try:
        organizers = user_service.get_organizers()
        return jsonify([_serialize_user(user) for user in organizers]), 200
    except Exception: # Changed message, removed comment
        return jsonify({"error": "An internal server error occurred."}), 500


@users_bp.route("/api/users/organizers", methods=["POST"])
def add_organizer():
    """Creates a new user with the 'organizer' role."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON format or missing data."}), 400 # Changed message
    try: # This can raise ValueError with Romanian messages from user_service.py
        new_organizer = user_service.create_organizer(data) 
        
        # Build the JSON response without exposing the hashed password
        response_data = {
            "id": new_organizer.id,
            "first_name": new_organizer.first_name,
            "last_name": new_organizer.last_name,
            "full_name": f"{new_organizer.first_name} {new_organizer.last_name}",
            "email": new_organizer.email,
            "role_id": new_organizer.role_id,
            "role_name": new_organizer.role.name if new_organizer.role else "organizer"
        }
        
        return jsonify(response_data), 201

    except ValueError: # Changed message
        return jsonify({"error": "Invalid input data."}), 400
    except Exception: # Changed message, removed details
        return jsonify({"error": "An internal server error occurred."}), 500