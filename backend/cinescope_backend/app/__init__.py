from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager 

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    app.config.from_object('app.config.Config')

    CORS(app, supports_credentials=True, origins="http://localhost:5173")

    db.init_app(app)
    jwt.init_app(app) 

    with app.app_context():
        from app.models import User, Movie 
        db.create_all() 

        from app.routes import bp
        app.register_blueprint(bp)

        from app.auth import auth_bp 
        app.register_blueprint(auth_bp, url_prefix="/auth")

    return app
