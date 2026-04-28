from flask import Blueprint, request, jsonify
from backend.app.services import auth_service

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/organizer/login", methods=["POST"])
def organizer_login():
    """Handles organizer login."""
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required."}), 400

    email = data.get("email")
    password = data.get("password")

    try:
        token, user_info = auth_service.login_organizer(email, password)
        return jsonify({"token": token, "user": user_info}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401  # Unauthorized (e.g., "Invalid credentials.")
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    """Handles admin login."""
    data = request.get_json()
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required."}), 400

    email = data.get("email")
    password = data.get("password")

    try:
        token, user_info = auth_service.login_admin(email, password)
        return jsonify({"token": token, "user": user_info}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401  # Unauthorized (e.g., "Invalid credentials.")
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@auth_bp.route("/student/google", methods=["POST"])
def student_google_login():
    """Handles student login/registration via mock Google Sign-In."""
    data = request.get_json()
    if not data or not data.get("email"):
        return jsonify({"error": "Email is required."}), 400

    email = data.get("email")
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    try:
        token, user_info = auth_service.login_or_register_student_google(
            email, first_name, last_name
        )
        return jsonify({"token": token, "user": user_info}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400  # Bad Request for validation errors
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@auth_bp.route("/refresh", methods=["POST"])
def refresh_token_route():
    """Handles JWT refresh."""
    data = request.get_json()
    token = data.get("token")
    if not token:
        return jsonify({"error": "Token is required."}), 400

    try:
        new_token, user_info = auth_service.refresh_token(token)
        return jsonify({"token": new_token, "user": user_info}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401  # Unauthorized for token errors (e.g., "Invalid or expired token.")
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Handles user logout. This is a stateless endpoint.
    The client is responsible for deleting the JWT.
    """
    # This endpoint doesn't need to do anything on the server for a stateless JWT implementation.
    return jsonify({"message": "Logout successful."}), 200
