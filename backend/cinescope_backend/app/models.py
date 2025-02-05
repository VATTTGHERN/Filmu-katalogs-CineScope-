from app import db  # Убедимся, что импорт из app корректный
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)  # Теперь храним хеш пароля
    role = db.Column(db.String(10), nullable=False, default="user")  # Поле для роли (user, moderator, admin)

    def set_password(self, password):
        """Хеширует пароль перед сохранением"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Проверяет пароль при авторизации"""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'


class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    release_date = db.Column(db.Date, nullable=True)
    genres = db.Column(db.Text, nullable=True)  # Поле для жанра

    # Связь многие-ко-многим с актёрами
    actors = db.relationship('Actor', secondary='movie_actors', backref=db.backref('movies', lazy='dynamic'))

    def __repr__(self):
        return f'<Movie {self.title}>'


class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)  # Ссылка на фильм
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Ссылка на пользователя
    text = db.Column(db.Text, nullable=False)  # Текст отзыва
    rating = db.Column(db.Integer, nullable=False)  # Рейтинг (1-5)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())  # Дата создания

    def __repr__(self):
        return f'<Review {self.id} for Movie {self.movie_id}>'


# Таблица для связи "многие ко многим" между актёрами и фильмами
movie_actors = db.Table('movie_actors',
    db.Column('movie_id', db.Integer, db.ForeignKey('movie.id'), primary_key=True),
    db.Column('actor_id', db.Integer, db.ForeignKey('actor.id'), primary_key=True)
)

class Actor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # Имя актёра
    bio = db.Column(db.Text, nullable=True)  # Биография
    birth_date = db.Column(db.Date, nullable=True)  # Дата рождения
    death_date = db.Column(db.Date, nullable=True)

    def __repr__(self):
        return f'<Actor {self.name}>'


class Director(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    death_date = db.Column(db.Date, nullable=True)


class Writer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    death_date = db.Column(db.Date, nullable=True)


class MovieDirectors(db.Model):
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), primary_key=True)
    director_id = db.Column(db.Integer, db.ForeignKey('director.id'), primary_key=True)


class MovieWriters(db.Model):
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), primary_key=True)
    writer_id = db.Column(db.Integer, db.ForeignKey('writer.id'), primary_key=True)
