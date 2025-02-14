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

# ✅ Регистрация пользователей
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')

        if not (username and email and password):
            return jsonify({"error": "Заполните все поля"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Этот email уже зарегистрирован"}), 400

        new_user = User(username=username, email=email, role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Регистрация прошла успешно!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Авторизация пользователей
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Неверный email или пароль"}), 401

        # ✅ Передаем только ID пользователя как строку
        token = create_access_token(identity=str(user.id))

        return jsonify({"token": token}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Защищенный маршрут
@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Пользователь не найден"}), 404

    return jsonify({"id": user.id, "username": user.username, "role": user.role}), 200

# ✅ Декоратор для проверки роли
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

# ✅ Декоратор для администраторов
admin_required = role_required(["admin"])

# ✅ Декоратор для модераторов
moderator_required = role_required(["admin", "moderator"])
