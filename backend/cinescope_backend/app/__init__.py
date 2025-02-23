from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager  # ✅ Добавляем JWT

# Создаем экземпляры SQLAlchemy и JWT
db = SQLAlchemy()
jwt = JWTManager()  # ✅ Создаем экземпляр JWT

def create_app():
    app = Flask(__name__)

    # Конфигурации приложения
    app.config.from_object('app.config.Config')

    # ✅ Разрешаем CORS
    CORS(app, supports_credentials=True, origins="http://localhost:5173")

    # Инициализация расширений
    db.init_app(app)
    jwt.init_app(app)  # ✅ Инициализируем JWT в приложении

    # Подключение моделей
    with app.app_context():
        from app.models import User, Movie  # Явный импорт моделей
        db.create_all()  # Создаем таблицы в базе данных, если их еще нет

        # Регистрация маршрутов
        from app.routes import bp
        app.register_blueprint(bp)

        from app.auth import auth_bp  # ✅ Подключаем маршруты аутентификации
        app.register_blueprint(auth_bp, url_prefix="/auth")

    return app
