from flask import Blueprint, jsonify, request
from backend.app.services import category_service

categories_bp = Blueprint("categories", __name__)


def _serialize_category(category):
    """Helper function to serialize a category object."""
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "created_at": category.created_at.isoformat() if category.created_at else None,
    }


@categories_bp.route("/api/categories", methods=["GET"])
def get_categories():
    """Returns a list of all categories."""
    try:
        categories = category_service.get_all_categories()
        return jsonify([_serialize_category(cat) for cat in categories]), 200
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@categories_bp.route("/api/categories", methods=["POST"])
def add_category():
    """Creates a new category."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload."}), 400

    try:
        new_category = category_service.create_category(data)
        return jsonify(_serialize_category(new_category)), 201
    except ValueError:
        # Catches validation errors from the service (e.g., name is required)
        return jsonify({"error": "Invalid input data."}), 400
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@categories_bp.route("/api/categories/<int:category_id>", methods=["GET"])
def get_category_route(category_id):
    """Retrieves a single category by its ID."""
    try:
        category = category_service.get_category_by_id(category_id)
        if not category:
            return jsonify({"error": "Category not found."}), 404

        return jsonify(_serialize_category(category)), 200
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@categories_bp.route("/api/categories/<int:category_id>", methods=["PUT"])
def update_category_route(category_id):
    """Updates an existing category."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload."}), 400

    try:
        updated_category = category_service.update_category(category_id, data)
        if updated_category is None:
            return jsonify({"error": "Category not found."}), 404

        return jsonify(_serialize_category(updated_category)), 200
    except ValueError:
        return jsonify({"error": "Invalid input data."}), 400
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500


@categories_bp.route("/api/categories/<int:category_id>", methods=["DELETE"])
def delete_category_route(category_id):
    """Deletes a category by its ID."""
    try:
        success = category_service.delete_category(category_id)
        if not success:
            return jsonify({"error": "Category not found."}), 404

        return jsonify({"message": "Category deleted successfully."}), 200
    except Exception:
        return jsonify({"error": "An internal server error occurred."}), 500