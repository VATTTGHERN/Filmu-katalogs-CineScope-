from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")  # <=== Дефолтное значение 'user'
    is_blocked = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username} - Role: {self.role}>'
    
    def is_moderator(self):
        return self.role == "moderator"
    
    def is_admin(self):
        return self.role == "admin"
    
class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    text = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=True, default="neatrisināta") 
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    review_id = db.Column(db.Integer, db.ForeignKey("review.id"), nullable=True)
    moderator_comment = db.Column(db.Text, nullable=True)
    is_dismissed_by_user = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<Complaint from {self.user_email} on {self.movie_id}>'

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    release_date = db.Column(db.Date, nullable=True)
    genres = db.Column(db.Text, nullable=True)
    trailer_url = db.Column(db.String(255), nullable=True)
    poster_url = db.Column(db.String(500), nullable=True)
    country = db.Column(db.String(50), nullable=True) 

    box_office = db.Column(db.String(100), nullable=True) 
    awards = db.Column(db.Text, nullable=True) 
    duration = db.Column(db.Integer, nullable=True) 
    age_rating = db.Column(db.String(10), nullable=True)

    # Связь многие-ко-многим с актёрами
    actors = db.relationship('Actor', secondary='movie_actors', backref=db.backref('movies', lazy='dynamic'))

    # Связь многие-ко-многим с режиссерами
    directors = db.relationship('Director', secondary='movie_directors', backref=db.backref('movies', lazy='dynamic'))

    # Связь многие-ко-многим со сценаристами
    writers = db.relationship('Writer', secondary='movie_writers', backref=db.backref('movies', lazy='dynamic'))

    def to_dict(self):
        """Конвертирует объект в словарь для JSON-ответа"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "release_date": self.release_date.strftime("%Y-%m-%d") if self.release_date else None,
            "genres": self.genres.split(", ") if self.genres else [],
            "trailer_url": self.trailer_url,
            "poster_url": self.poster_url,
            "box_office": self.box_office,
            "awards": json.loads(self.awards) if self.awards else [],
            "duration": self.duration,
            "age_rating": self.age_rating,
            "actors": [actor.to_dict() for actor in self.actors],
            "directors": [director.to_dict() for director in self.directors],
            "writers": [writer.to_dict() for writer in self.writers],
        }

    def __repr__(self):
        return f'<Movie {self.title}>'

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    text = db.Column(db.Text, nullable=True) 
    rating = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())

    user = db.relationship("User", backref="reviews")

    def __repr__(self):
        return f'<Review {self.id} for Movie {self.movie_id} by User {self.user_id}>'

# Таблица для связи "многие ко многим" между актёрами и фильмами
movie_actors = db.Table('movie_actors',
    db.Column('movie_id', db.Integer, db.ForeignKey('movie.id'), primary_key=True),
    db.Column('actor_id', db.Integer, db.ForeignKey('actor.id'), primary_key=True)
)

class Actor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
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

class FavoriteMovie(db.Model):
    __tablename__ = "favorite_movie"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)

    user = db.relationship("User", backref="favorites")
    movie = db.relationship("Movie", backref="favorited_by")
