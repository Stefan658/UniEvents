from flask import Blueprint, request, jsonify
from backend.app.services import material_service

material_bp = Blueprint("materials", __name__, url_prefix="/api")


def _serialize_material(material):
    """Helper function to serialize a material object."""
    data = {
        "id": material.id,
        "event_id": material.event_id,
        "uploader_id": material.uploader_id,
        "file_name": material.file_name,
        "file_url": material.file_url,
        "file_type": material.file_type,
        "uploaded_at": material.uploaded_at.isoformat(),
    }
    # If the event relationship was loaded, include event title
    if hasattr(material, 'event') and material.event:
        data['event_title'] = material.event.title
    return data


@material_bp.route("/materials", methods=["GET"])
def get_all_materials_route():
    """Returns a list of all materials."""
    try:
        materials = material_service.get_all_materials()
        return jsonify([_serialize_material(mat) for mat in materials]), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "An internal server error occurred", "details": str(e)}), 500




@material_bp.route("/materials", methods=["POST"])
def add_material():
    """Adds a new material for an event."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    try:
        new_material = material_service.create_material(data)
        return jsonify(_serialize_material(new_material)), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@material_bp.route("/materials/<int:material_id>", methods=["GET"])
def get_material_route(material_id):
    """Retrieves a single material by its ID."""
    try:
        material = material_service.get_material_by_id(material_id)
        if not material:
            return jsonify({"error": "Material not found"}), 404

        return jsonify(_serialize_material(material)), 200
    except Exception:
        # In a real app, you should log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@material_bp.route("/materials/<int:material_id>", methods=["DELETE"])
def delete_material_route(material_id):
    """Deletes a material by its ID."""
    try:
        success = material_service.delete_material(material_id)
        if not success:
            return jsonify({"error": "Material not found"}), 404

        return jsonify({"message": "Material deleted successfully"}), 200
    except Exception:
        # For a production app, it's better to log the exception
        return jsonify({"error": "An internal server error occurred"}), 500


@material_bp.route("/materials/<int:material_id>", methods=["PUT"])
def update_material_route(material_id):
    """Updates an existing material's information."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Payload-ul JSON este invalid sau lipsește."}), 400

    try:
        updated_material = material_service.update_material(material_id, data)

        if updated_material is None:
            return jsonify({"error": "Material not found"}), 404

        return jsonify(_serialize_material(updated_material)), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "A apărut o eroare internă a serverului.", "details": str(e)}), 500