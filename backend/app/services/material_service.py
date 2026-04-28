from sqlalchemy.orm import joinedload
from backend.app.extensions import db
from backend.app.models.material import Material
from backend.app.models.event import Event  # Import Event model for joinedload
from backend.app.models.user import User # Import User model for joinedload (uploader)


def get_all_materials():
    """
    Retrieves all materials, eagerly loading associated event and uploader data.
    """
    materials = Material.query.options(
        joinedload(Material.event),
        joinedload(Material.uploader) # Assuming Material has an 'uploader' relationship to User
    ).order_by(Material.uploaded_at.desc()).all() # Order by uploaded_at descending
    return materials

def create_material(data):
    """Creates a new material entry in the database."""
    event_id = data.get("event_id")
    uploader_id = data.get("uploader_id")
    file_name = data.get("file_name")
    file_url = data.get("file_url")
    file_type = data.get("file_type")

    if not all([event_id, uploader_id, file_name, file_url, file_type]):
        raise ValueError("Missing required material data")

    new_material = Material(
        event_id=event_id,
        uploader_id=uploader_id,
        file_name=file_name,
        file_url=file_url,
        file_type=file_type
    )
    db.session.add(new_material)
    db.session.commit()
    return new_material


def delete_material(material_id):
    """Deletes a material by its ID."""
    material = Material.query.get(material_id)
    if material:
        db.session.delete(material)
        db.session.commit()
        return True
    return False


def get_material_by_id(material_id):
    """
    Retrieves a single material by its ID, with its associated event.
    """
    # Eager load the 'event' relationship to get event details for serialization
    return Material.query.options(joinedload(Material.event)).get(material_id)


def update_material(material_id, data):
    """
    Updates an existing material's information (file_name, file_url, file_type).
    """
    material_to_update = Material.query.options(joinedload(Material.event)).get(material_id)
    if not material_to_update:
        return None  # Indicate material not found

    update_fields = ['file_name', 'file_url', 'file_type']
    if not data or not any(field in data and data.get(field) is not None for field in update_fields):
        raise ValueError("Payload is empty or does not contain valid fields for update (file_name, file_url, file_type).")

    if 'file_name' in data and data.get('file_name') is not None:
        material_to_update.file_name = data['file_name'].strip()

    if 'file_url' in data and data.get('file_url') is not None:
        material_to_update.file_url = data['file_url'].strip()

    if 'file_type' in data and data.get('file_type') is not None:
        material_to_update.file_type = data['file_type'].strip()

    db.session.commit()
    return material_to_update