from app import db  # Убедимся, что импорт из app корректный

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="user")  # Новое поле для роли

    def __repr__(self):
        return f'<User {self.username}>'

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    release_date = db.Column(db.Date, nullable=True)
    genres = db.Column(db.Text, nullable=True)  # Новое поле для жанра

    def __repr__(self):
        return f'<Movie {self.title}>'

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)  # Ссылка на фильм
    text = db.Column(db.Text, nullable=False)  # Текст отзыва
    rating = db.Column(db.Integer, nullable=False)  # Рейтинг (1-5)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())  # Дата создания

    def __repr__(self):
        return f'<Review {self.id} for Movie {self.movie_id}>'
