import os

class Config:
    SECRET_KEY = "a94c1fcb6a97b1d0cbe8725af7e890dd83a2d5a830f1c2b9b7c6de59f7c3eabb"
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:CineScope2025!@localhost/cinescope_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = "super_secret_jwt_key"  # Можешь заменить на свой
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # Время жизни токена (1 час)

    CORS_HEADERS = "Content-Type"
