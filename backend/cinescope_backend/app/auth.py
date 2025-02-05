import jwt
from flask import request, jsonify, g
from datetime import datetime, timedelta
from functools import wraps

from flask import current_app as app
from app import db

from app.models import User
from app.config import SECRET_KEY  

# ✅ Декоратор для проверки токена и роли пользователя
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Токен отсутствует"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            g.current_user = User.query.get(data["id"])
            if g.current_user is None:
                return jsonify({"error": "Пользователь не найден"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Срок действия токена истек"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Неверный токен"}), 401

        return f(*args, **kwargs)
    return decorated

# ✅ Декоратор для администраторов
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.current_user.role != "admin":
            return jsonify({"error": "Требуются права администратора"}), 403
        return f(*args, **kwargs)
    return token_required(decorated)

# ✅ Декоратор для модераторов
def moderator_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if g.current_user.role not in ["admin", "moderator"]:
            return jsonify({"error": "Требуются права модератора"}), 403
        return f(*args, **kwargs)
    return token_required(decorated)

# ✅ Регистрация пользователей
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not (username and email and password):
            return jsonify({"error": "Заполните все поля"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Этот email уже зарегистрирован"}), 400

        new_user = User(username=username, email=email)
        new_user.set_password(password)  # Хешируем пароль
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Регистрация прошла успешно!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Авторизация пользователей
@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Неверный email или пароль"}), 401

        token = jwt.encode(
            {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "exp": datetime.utcnow() + timedelta(hours=2)  # Токен живёт 2 часа
            },
            SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({"token": token}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
