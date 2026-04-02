from flask import Blueprint, jsonify
from backend.app.models.category import Category

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("/api/categories", methods=["GET"])
def get_categories():
    """Returns a list of all categories."""
    categories = Category.query.order_by(Category.name).all()
    category_list = [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "created_at": category.created_at.isoformat(),
        }
        for category in categories
    ]
    return jsonify(category_list)