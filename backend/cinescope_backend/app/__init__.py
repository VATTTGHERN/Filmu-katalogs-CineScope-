from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Создаем экземпляр SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Конфигурации приложения
    app.config.from_object('app.config.Config')

    # Инициализация расширений
    db.init_app(app)
    CORS(app)

    # Подключение моделей
    with app.app_context():
        from app.models import User, Movie  # Явный импорт моделей
        db.create_all()  # Создаем таблицы в базе данных, если их еще нет

        # Регистрация маршрутов
        from app.routes import bp
        app.register_blueprint(bp)

    return app
