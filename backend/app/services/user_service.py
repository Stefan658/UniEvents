from sqlalchemy.orm import joinedload
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.extensions import db
from werkzeug.security import generate_password_hash


def get_all_users():
    """
    Retrieves all users from the database.
    """
    users = User.query.options(joinedload(User.role)).order_by(
        User.last_name, User.first_name
    ).all()
    return users


def get_organizers():
    """
    Retrieves all users with the 'organizer' role.
    """
    # Eagerly load the role relationship to avoid N+1 queries
    organizers = (
        User.query.options(joinedload(User.role))
        .join(Role)
        .filter(Role.name == "organizer")
        .order_by(User.last_name, User.first_name)
        .all()
    )
    return organizers


def get_user_by_id(user_id):
    """
    Retrieves a single user by their ID, with their associated role.
    """
    return User.query.options(joinedload(User.role)).get(user_id)


def update_user(user_id, data):
    """
    Updates an existing user's information (first_name, last_name, email).
    """
    user_to_update = User.query.options(joinedload(User.role)).get(user_id)
    if not user_to_update:
        return None  # Caller will handle the 404 response.

    # Validate that there's something to update
    update_fields = ['first_name', 'last_name', 'email']
    if not data or not any(field in data and data.get(field) is not None for field in update_fields):
        raise ValueError("Payload is empty or does not contain valid fields for update (first_name, last_name, email).")

    if 'email' in data and data.get('email') is not None:
        normalized_email = data['email'].strip().lower()
        if normalized_email != user_to_update.email:
            # Check for email uniqueness only if it's being changed
            existing_user = User.query.filter(User.email == normalized_email, User.id != user_id).first()
            if existing_user:
                raise ValueError("A user with this email already exists.")
            user_to_update.email = normalized_email

    if 'first_name' in data and data.get('first_name') is not None:
        user_to_update.first_name = data['first_name'].strip()

    if 'last_name' in data and data.get('last_name') is not None:
        user_to_update.last_name = data['last_name'].strip()

    db.session.commit()
    return user_to_update


def create_organizer(data):
    """
    Creates a new user with the organizer role.
    """
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")

    if not all([first_name, last_name, email, password]):
        raise ValueError("Fields first_name, last_name, email, and password are required.")

    normalized_email = email.strip().lower()

    # Check for email uniqueness
    if User.query.filter_by(email=normalized_email).first():
        raise ValueError("A user with this email already exists.")

    # Get organizer role from database
    organizer_role = Role.query.filter_by(name="organizer").first()
    if not organizer_role:
        raise ValueError("'organizer' role not found in the system.")

    # Create new user
    new_user = User(
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        email=normalized_email,
        password_hash=generate_password_hash(password),
        role_id=organizer_role.id
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user


def create_user(data):
    """
    Creates a new user with a specified role.
    """
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    role_name = data.get("role_name")

    if not all([first_name, last_name, email, password, role_name]):
        raise ValueError("Fields first_name, last_name, email, password, and role_name are required.")

    normalized_email = email.strip().lower()

    if User.query.filter_by(email=normalized_email).first():
        raise ValueError("A user with this email already exists.")

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        raise ValueError(f"Role '{role_name}' not found in the system.")

    new_user = User(
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        email=normalized_email,
        password_hash=generate_password_hash(password),
        role_id=role.id
    )

    db.session.add(new_user)
    db.session.commit()
    return new_user


def delete_user(user_id):
    """
    Deletes a user by their ID.
    """
    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return False  # Indicate that the user was not found

    db.session.delete(user_to_delete)
    db.session.commit()
    return True  # Indicate success