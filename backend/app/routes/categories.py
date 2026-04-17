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
    except Exception as e:
        return jsonify({"error": "An internal server error occurred", "details": str(e)}), 500


@categories_bp.route("/api/categories", methods=["POST"])
def add_category():
    """Creates a new category."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload JSON invalid sau lipsă."}), 400

    try:
        new_category = category_service.create_category(data)
        return jsonify(_serialize_category(new_category)), 201
    except ValueError as e:
        # Catches validation errors from the service
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Catches other unexpected errors
        import traceback

        traceback.print_exc()
        return jsonify(
            {"error": "A apărut o eroare internă a serverului.", "details": str(e)}
        ), 500


@categories_bp.route("/api/categories/<int:category_id>", methods=["GET"])
def get_category_route(category_id):
    """Retrieves a single category by its ID."""
    try:
        category = category_service.get_category_by_id(category_id)
        if not category:
            return jsonify({"error": "Categoria nu a fost găsită."}), 404

        return jsonify(_serialize_category(category)), 200
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify(
            {"error": "A apărut o eroare internă a serverului.", "details": str(e)}
        ), 500


@categories_bp.route("/api/categories/<int:category_id>", methods=["PUT"])
def update_category_route(category_id):
    """Updates an existing category."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload JSON invalid sau lipsă."}), 400

    try:
        updated_category = category_service.update_category(category_id, data)
        if updated_category is None:
            return jsonify({"error": "Categoria nu a fost găsită."}), 404

        return jsonify(_serialize_category(updated_category)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify(
            {"error": "A apărut o eroare internă a serverului.", "details": str(e)}
        ), 500


@categories_bp.route("/api/categories/<int:category_id>", methods=["DELETE"])
def delete_category_route(category_id):
    """Deletes a category by its ID."""
    try:
        success = category_service.delete_category(category_id)
        if not success:
            return jsonify({"error": "Categoria nu a fost găsită."}), 404

        return jsonify({"message": "Categoria a fost ștearsă cu succes."}), 200
    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify(
            {"error": "A apărut o eroare internă a serverului.", "details": str(e)}
        ), 500