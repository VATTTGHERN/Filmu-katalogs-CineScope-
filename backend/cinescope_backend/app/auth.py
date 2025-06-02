import jwt
from flask import request, jsonify, g
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint
from flask_jwt_extended import (
    create_access_token, get_jwt_identity,
    jwt_required, JWTManager
)
from app.models import db, User
from app.config import Config

auth_bp = Blueprint("auth", __name__)

@auth_bp.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Šis e-pasts jau ir reģistrēts!"}), 400

        new_user = User(username=username, email=email, role="user")
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Lietotājs veiksmīgi reģistrēts!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Nepareizs e-pasts vai parole!"}), 401

        if user.is_blocked:
            return jsonify({"error": "Jūsu konts ir bloķēts!"}), 403

        return jsonify({
            "message": "Veiksmīgi pieslēdzies!",
            "user": {
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    return jsonify({"id": user.id, "username": user.username, "role": user.role}), 200

def role_required(required_roles):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return jsonify({"error": "Пользователь не найден"}), 404

            if user.role not in required_roles:
                return jsonify({"error": "Недостаточно прав"}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

admin_required = role_required(["admin"])

moderator_required = role_required(["admin", "moderator"])
