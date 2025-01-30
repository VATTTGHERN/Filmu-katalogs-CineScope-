import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:CineScope2025!@localhost/cinescope_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
