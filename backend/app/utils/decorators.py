import jwt
from functools import wraps
from flask import request, jsonify, current_app
from backend.app.models.user import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            payload = jwt.decode(
                token, 
                current_app.config['SECRET_KEY'], 
                algorithms=['HS256']
            )
            current_user = User.query.get(int(payload['sub']))
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'error': 'Token is invalid!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated
