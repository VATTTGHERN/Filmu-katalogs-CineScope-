import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:CineScope2025!@localhost/cinescope_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = "a94c1fcb6a97b1d0cbe8725af7e890dd83a2d5a830f1c2b9b7c6de59f7c3eabb"
