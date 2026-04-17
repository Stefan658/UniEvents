from backend.app.extensions import db
from backend.app.models.category import Category
from sqlalchemy.exc import IntegrityError


def get_all_categories():
    """Retrieves all categories, ordered by name."""
    return Category.query.order_by(Category.name).all()


def get_category_by_id(category_id):
    """Retrieves a single category by its ID."""
    return Category.query.get(category_id)


def create_category(data):
    """Creates a new category."""
    name = data.get("name")
    description = data.get("description")

    if not name or not name.strip():
        raise ValueError("Numele categoriei este obligatoriu.")

    # Check for uniqueness (case-insensitive)
    if Category.query.filter(Category.name.ilike(name.strip())).first():
        raise ValueError(f"O categorie cu numele '{name}' există deja.")

    new_category = Category(name=name.strip(), description=description)

    try:
        db.session.add(new_category)
        db.session.commit()
        return new_category
    except IntegrityError:  # Fallback for race conditions
        db.session.rollback()
        raise ValueError(f"O categorie cu numele '{name}' există deja.")


def update_category(category_id, data):
    """Updates an existing category."""
    category = Category.query.get(category_id)
    if not category:
        return None  # Will be handled as 404 in the route

    update_fields = ["name", "description"]
    if not data or not any(field in data for field in update_fields):
        raise ValueError(
            "Payload-ul este gol sau nu conține câmpuri valide pentru actualizare (name, description)."
        )

    if "name" in data and data["name"] is not None:
        new_name = data["name"].strip()
        if not new_name:
            raise ValueError("Numele categoriei nu poate fi gol.")

        # Check for uniqueness only if the name is actually changing
        if new_name.lower() != category.name.lower():
            existing = Category.query.filter(Category.name.ilike(new_name), Category.id != category_id).first()
            if existing:
                raise ValueError(f"O categorie cu numele '{new_name}' există deja.")
            category.name = new_name

    if "description" in data: # Allow setting description to empty string
        category.description = data["description"]

    db.session.commit()
    return category


def delete_category(category_id):
    """Deletes a category by its ID."""
    category = Category.query.get(category_id)
    if not category:
        return False  # Indicate that the category was not found

    db.session.delete(category)
    db.session.commit()
    return True  # Indicate success
