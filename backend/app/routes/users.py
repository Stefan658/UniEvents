from flask import Blueprint, jsonify, request
from backend.app.services import user_service
from backend.app.utils.decorators import token_required
from backend.app.extensions import db
from backend.app.models.registration import Registration
from backend.app.models.feedback import Feedback
from backend.app.models.event import Event
from backend.app.models.category import Category

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


@users_bp.route("/api/users/me/badges", methods=["GET"])
@token_required
def get_my_badges(current_user):
    """Computes and returns dynamic badges for the current student user."""
    try:
        if not current_user.role or current_user.role.name != 'student':
            return jsonify([]), 200

        user_id = current_user.id

        # 1. Total confirmed registrations
        total_confirmed = db.session.query(Registration).filter_by(
            user_id=user_id, status="confirmed"
        ).count()

        # 2. Total feedback entries
        total_feedback = db.session.query(Feedback).filter_by(
            user_id=user_id
        ).count()

        # 3. Confirmed registrations per category
        category_counts_query = (
            db.session.query(Category.name, db.func.count(Registration.id))
            .join(Event, Event.category_id == Category.id)
            .join(Registration, Registration.event_id == Event.id)
            .filter(Registration.user_id == user_id)
            .filter(Registration.status == "confirmed")
            .group_by(Category.name)
            .all()
        )
        cat_counts = {name: count for name, count in category_counts_query}

        # Helper to get count with default 0
        def get_count(cat_name):
            return cat_counts.get(cat_name, 0)

        # 4. Define and compute badges
        badges = []

        # A. Campus Active
        target_campus = 3
        prog_campus = total_confirmed
        badges.append({
            "code": "campus_active",
            "title": "Campus Active",
            "description": f"Join at least {target_campus} university events.",
            "icon": "Trophy",
            "earned": prog_campus >= target_campus,
            "progress": min(prog_campus, target_campus),
            "target": target_campus,
            "reward": "Eligible for campus recognition"
        })

        # B. Feedback Contributor
        target_fb = 1
        prog_fb = total_feedback
        badges.append({
            "code": "feedback_contributor",
            "title": "Feedback Contributor",
            "description": "Leave feedback for an event you attended.",
            "icon": "MessageSquare",
            "earned": prog_fb >= target_fb,
            "progress": min(prog_fb, target_fb),
            "target": target_fb,
            "reward": "Feedback contributor badge"
        })

        # C. Career Starter
        target_career = 1
        prog_career = get_count("Career")
        badges.append({
            "code": "career_starter",
            "title": "Career Starter",
            "description": "Attend a Career-related event.",
            "icon": "Briefcase",
            "earned": prog_career >= target_career,
            "progress": min(prog_career, target_career),
            "target": target_career,
            "reward": "Career readiness recognition"
        })

        # D. Volunteer Spirit
        target_vol = 1
        prog_vol = get_count("Volunteering")
        badges.append({
            "code": "volunteer_spirit",
            "title": "Volunteer Spirit",
            "description": "Join a volunteering event to help the community.",
            "icon": "Heart",
            "earned": prog_vol >= target_vol,
            "progress": min(prog_vol, target_vol),
            "target": target_vol,
            "reward": "Social involvement certificate eligibility"
        })

        # E. Sports Participant
        target_sport = 1
        prog_sport = get_count("Sport")
        badges.append({
            "code": "sports_participant",
            "title": "Sports Participant",
            "description": "Participate in a campus sports event.",
            "icon": "Dumbbell",
            "earned": prog_sport >= target_sport,
            "progress": min(prog_sport, target_sport),
            "target": target_sport,
            "reward": "Campus sport recognition"
        })

        # F. Tech Explorer
        target_tech = 2
        prog_tech = get_count("Workshop") + get_count("Conference")
        badges.append({
            "code": "tech_explorer",
            "title": "Tech Explorer",
            "description": "Attend at least 2 Workshops or Conferences.",
            "icon": "Code",
            "earned": prog_tech >= target_tech,
            "progress": min(prog_tech, target_tech),
            "target": target_tech,
            "reward": "Tech community recognition"
        })

        return jsonify(badges), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
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