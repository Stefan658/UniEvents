import jwt
import datetime
from flask import current_app
from backend.app.models.user import User
from backend.app.models.role import Role
from backend.app.extensions import db # This import is not strictly needed in this file, but keeping for minimal diff
from werkzeug.security import check_password_hash

def login_organizer(email, password):
    """
    Handles organizer login, validates credentials, and returns a JWT.
    """
    normalized_email = email.strip().lower()
    user = User.query.filter_by(email=normalized_email).first()

    if not user:
        raise ValueError("Access denied. Not an organizer.")

    # Check if the user has the 'organizer' role
    if not user.role or user.role.name != 'organizer':
        raise ValueError("Invalid credentials")
    if not check_password_hash(user.password_hash, password):
        raise ValueError("Invalid credentials")

    # --- JWT Generation ---
    payload = {
        'sub': str(user.id),
        'role': user.role.name,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    if isinstance(token, bytes):
        token = token.decode('utf-8')

    user_info = {
        "id": user.id,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role.name
    }

    return token, user_info


def login_or_register_student_google(email, first_name, last_name):
    """
    Handles student login/registration via a mock Google Sign-In.
    Creates a new student user if one does not exist.
    Returns a JWT for the student.
    """
    normalized_email = email.strip().lower()
    if not normalized_email or not normalized_email.endswith("@student.usv.ro"):
        raise ValueError("Invalid email. Must be a '@student.usv.ro' address.")

    user = User.query.filter_by(email=normalized_email).first()

    if not user:
        # User does not exist, create a new one
        student_role = Role.query.filter_by(name="student").first()
        if not student_role:
            # This is a server configuration error, should not happen in a seeded DB
            raise Exception("Critical: 'student' role not found in the database.")

        new_user = User(
            email=normalized_email,
            first_name=first_name or "Student",
            last_name=last_name or "USV",
            password_hash="google-oauth-placeholder",  # No password needed for OAuth
            role_id=student_role.id
        )
        db.session.add(new_user)
        db.session.commit()
        user = new_user
    elif user.role.name != 'student':
        # An account with this email exists but is not a student
        raise ValueError("An account with this email already exists but is not a student.")

    # --- JWT Generation ---
    payload = {
        'sub': str(user.id),
        'role': user.role.name,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    if isinstance(token, bytes):
        token = token.decode('utf-8')

    user_info = {
        "id": user.id,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role.name
    }

    return token, user_info


def login_admin(email, password):
    """
    Handles admin login, validates credentials, and returns a JWT.
    """
    normalized_email = email.strip().lower()
    user = User.query.filter_by(email=normalized_email).first()

    if not user:
        raise ValueError("Access denied. Not an admin.")

    if not user.role or user.role.name != 'admin':
        raise ValueError("Invalid credentials")
    if not check_password_hash(user.password_hash, password):
        raise ValueError("Invalid credentials")

    # --- JWT Generation ---
    payload = {
        'sub': str(user.id),
        'role': user.role.name,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    if isinstance(token, bytes):
        token = token.decode('utf-8')

    user_info = {
        "id": user.id,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role.name
    }

    return token, user_info


def refresh_token(token):
    """
    Decodes an existing JWT, validates it, and issues a new one.
    """
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token. Please log in again.")

    user_id_str = payload.get('sub')
    if not user_id_str:
        raise ValueError("Invalid token payload: 'sub' claim is missing.")

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise ValueError("Invalid token payload: 'sub' claim is not a valid user ID.")

    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found.")


    # Generate a new token with a new expiration time
    new_payload = {
        'sub': str(user.id),
        'role': user.role.name,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    new_token = jwt.encode(
        new_payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    if isinstance(new_token, bytes):
        new_token = new_token.decode('utf-8')

    user_info = {
        "id": user.id,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}",
        "role": user.role.name
    }

    return new_token, user_info