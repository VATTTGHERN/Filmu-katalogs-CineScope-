from app import db
from werkzeug.security import generate_password_hash, check_password_hash
import json
db = SQLAlchemy()

#  Lietotāja modelis – reģistrēts lietotājs, kurš var pievienot atsauksmes, sūdzības utt.
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)  # Lietotājvārds
    email = db.Column(db.String(120), unique=True, nullable=False)     # E-pasts (unikāls)
    password_hash = db.Column(db.String(200), nullable=False)          # Paroles hash
    role = db.Column(db.String(20), nullable=False, default="user")    # Loma: user / moderator / admin
    is_blocked = db.Column(db.Boolean, default=False)                  # Vai lietotājs ir bloķēts

    # Paroles šifrēšana
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Paroles pārbaude autentifikācijā
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_moderator(self):
        return self.role == "moderator"

    def is_admin(self):
        return self.role == "admin"

    def __repr__(self):
        return f'<User {self.username} - Role: {self.role}>'
    
#  Lietotāja sūdzība par filmu vai atsauksmi
class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(120), nullable=False)                     # Sūdzētāja e-pasts
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # Lietotāja ID (FK)
    movie_id = db.Column(db.Integer, db.ForeignKey("movie.id"), nullable=False)# Filmas ID (FK)
    subject = db.Column(db.String(255), nullable=False)                        # Tēma (piemēram: “Nepiemērots saturs”)
    text = db.Column(db.Text, nullable=False)                                  # Sūdzības teksts
    status = db.Column(db.String(50), nullable=True, default="neatrisināta")   # Statuss (neatrisināta / atrisināta)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())   # Izveidošanas laiks
    review_id = db.Column(db.Integer, db.ForeignKey("review.id"), nullable=True) # Atsauksmes ID (ja ir saistīta)
    moderator_comment = db.Column(db.Text, nullable=True)                      # Moderatora atbilde
    is_dismissed_by_user = db.Column(db.Boolean, default=False)                # Vai lietotājs atteicās no sūdzības

    def __repr__(self):
        return f'<Complaint from {self.user_email} on Movie {self.movie_id}>'

#  Filmas modelis – pamatdati par filmu
class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)                # Filmas nosaukums
    description = db.Column(db.Text, nullable=True)                  # Apraksts
    release_date = db.Column(db.Date, nullable=True)                 # Izlaišanas datums
    genres = db.Column(db.Text, nullable=True)                       # Žanri (atdalīti ar komatu)
    trailer_url = db.Column(db.String(255), nullable=True)          # Trailers (YouTube u.c.)
    poster_url = db.Column(db.String(500), nullable=True)           # Postera attēls (URL)
    country = db.Column(db.String(50), nullable=True)               # Ražošanas valsts

    #  Papildu informācija
    box_office = db.Column(db.String(100), nullable=True)           # Kases ieņēmumi
    awards = db.Column(db.Text, nullable=True)                      # Balvas (JSON formatā)
    duration = db.Column(db.Integer, nullable=True)                 # Ilgums minūtēs
    age_rating = db.Column(db.String(10), nullable=True)            # Vecuma ierobežojums

    #  Daudz-daudz attiecības ar aktieriem, režisoriem, scenāristiem
    actors = db.relationship('Actor', secondary='movie_actors', backref=db.backref('movies', lazy='dynamic'))
    directors = db.relationship('Director', secondary='movie_directors', backref=db.backref('movies', lazy='dynamic'))
    writers = db.relationship('Writer', secondary='movie_writers', backref=db.backref('movies', lazy='dynamic'))

    def to_dict(self):
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


# Atsauksmes modelis – reģistrēta lietotāja viedoklis par filmu
class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)  # FK uz filmu
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)    # FK uz lietotāju
    text = db.Column(db.Text, nullable=True)                                      # Atsauksmes teksts (nav obligāts)
    rating = db.Column(db.Integer, nullable=False)                                # Vērtējums (zvaigznes 1-5)
    created_at = db.Column(db.DateTime, nullable=False, default=db.func.now())   # Izveidošanas datums

    user = db.relationship("User", backref="reviews")  # Relācija ar lietotāju

    def __repr__(self):
        return f'<Review {self.id} for Movie {self.movie_id} by User {self.user_id}>'

# Tabula aktieru un filmu daudzu pret daudziem attiecībām
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
