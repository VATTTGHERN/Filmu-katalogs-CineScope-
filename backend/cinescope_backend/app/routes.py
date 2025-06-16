from flask import Blueprint, jsonify, request 
from app import db
from app.models import User, Movie, Review, Actor, Director, Writer, MovieDirectors, MovieWriters, FavoriteMovie, Complaint
from datetime import datetime
from app.auth import *
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.sql import text
import json
from app.forbidden_words import contains_forbidden_word

from app.auth import admin_required, moderator_required

bp = Blueprint('routes', __name__)

@bp.route('/')
def home():
    return "Hello, CineScope!"

@bp.route('/init-db')
def init_db():
    try:
        db.create_all() 
        return jsonify({"message": "Tabulas ir veiksmīgi izveidotas!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/check-tables', methods=['GET'])
def check_tables():
    try:
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        return {"message": f"Atrastās tabulas: {tables}"}
    except Exception as e:
        return {"message": f"Error: {str(e)}"}, 500

@bp.route('/force-init-db', methods=['GET'])
def force_init_db():
    try:
        from app.models import User, Movie, Review 
        db.create_all() 
        current_db = db.engine.url.database 
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        return {
            "message": "Tabulas veiksmīgi izveidotas manuāli!",
            "database": current_db,
            "created_tables": tables
        }, 200
    except Exception as e:
        return {"message": f"Error: {str(e)}"}, 500

@bp.route('/add-user', methods=['POST'])
def add_user():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({"error": "Visi lauki ir obligāti"}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Lietotājs ar šo e-pastu jau pastāv"}), 400

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Lietotājs veiksmīgi reģistrēts"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        user_list = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_blocked": user.is_blocked 
            }
            for user in users
        ]
        return jsonify({"users": user_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Filmas pievienošanas maršruts
@bp.route("/add-movie", methods=["POST"])
@jwt_required()
def add_movie():
    """
    Pievieno jaunu filmu datubāzei. Pieejams tikai administratoriem.
    """
    try:
        # Iegūst lietotāja ID no JWT tokena
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Tikai administrators var pievienot filmas
        if not user or user.role != "admin":
            return jsonify({"error": "Tikai administratoriem ir atļauts pievienot filmas."}), 403

        # Datu izgūšana no pieprasījuma
        data = request.get_json()
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        release_date = (data.get("release_date") or "").strip()
        genres = data.get("genres", [])
        poster_url = (data.get("poster_url") or "").strip()
        trailer_url = (data.get("trailer_url") or "").strip()
        country = (data.get("country") or "").strip()
        box_office = (data.get("box_office") or "").strip()
        awards = json.dumps(data.get("awards", []))
        duration = data.get("duration")
        age_rating = (data.get("age_rating") or "").strip()

        # Papildu lauki – aktieri, režisori, scenāristi
        actors = json.dumps(data.get("actors", []))
        directors = json.dumps(data.get("directors", []))
        writers = json.dumps(data.get("writers", []))

        # Obbligātie lauki
        if not title or not release_date or not genres:
            return jsonify({"error": "Nepieciešams nosaukums, izlaišanas datums un žanrs."}), 400

        # Datuma validācija
        try:
            release_date = datetime.strptime(release_date, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Nepareizs datums! Izmantojiet YYYY-MM-DD formātu."}), 400

        # Žanru formatēšana
        genres_str = ", ".join(genres) if isinstance(genres, list) else genres

        # Jaunas filmas objekta izveide
        new_movie = Movie(
            title=title,
            description=description,
            release_date=release_date,
            genres=genres_str,
            poster_url=poster_url if poster_url else None,
            trailer_url=trailer_url if trailer_url else None,
            country=country if country else None,
            box_office=box_office if box_office else None,
            awards=awards if awards else None,
            duration=duration if duration else None,
            age_rating=age_rating if age_rating else None,
            actors=actors if actors else None,
            directors=directors if directors else None,
            writers=writers if writers else None
        )

        # Saglabāšana datubāzē
        db.session.add(new_movie)
        db.session.commit()

        return jsonify({
            "message": "Filma veiksmīgi pievienota!",
            "movie_id": new_movie.id
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Maršruts, kas atgriež visas filmas no datubāzes
@bp.route('/get-movies', methods=['GET'])
def get_movies():
    try:
        # Iegūst visas filmas no datubāzes
        movies = Movie.query.all()

        # Sagatavo rezultātu sarakstu ar nepieciešamajiem laukiem
        movie_list = [{
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
            "genres": movie.genres.split(", ") if movie.genres else [],
            "poster_url": movie.poster_url
        } for movie in movies]

        # Atgriež filmu sarakstu JSON formātā
        return jsonify({"movies": movie_list}), 200
    except Exception as e:
        # Ja rodas kļūda, tiek atgriezts kļūdas paziņojums
        return jsonify({"error": str(e)}), 500
    
# Atgriež visus Latvijas filmas ar iespēju filtrēt pēc nosaukuma un žanra
@bp.route('/get-latvian-movies', methods=['GET'])
def get_latvian_movies():
    try:
        title = request.args.get('title')  # Nosaukuma filtrs (pēc daļas)
        genre = request.args.get('genre')  # Žanra filtrs

        # Meklējam tikai tās filmas, kuru valsts ir "Latvia"
        query = Movie.query.filter_by(country="Latvia")

        if title:
            query = query.filter(Movie.title.ilike(f"%{title}%"))  # Nejutīgs pret reģistru

        if genre:
            query = query.filter(Movie.genres.ilike(f"%{genre}%"))

        movies = query.all()

        # Formatējam rezultātu sarakstu JSON struktūrā
        movie_list = [{
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
            "genres": movie.genres.split(", ") if movie.genres else [],
            "poster_url": movie.poster_url
        } for movie in movies]

        return jsonify({"movies": movie_list}), 200

    except Exception as e:
        # Atgriežam kļūdas paziņojumu, ja kaut kas noiet greizi
        return jsonify({"error": str(e)}), 500
    
def search_latvian_movies():
    try:
        title = request.args.get('title')
        genre = request.args.get('genre')
        sort_by = request.args.get('sort_by', 'title')
        order = request.args.get('order', 'asc')

        query = Movie.query.filter_by(country="Latvia")

        if title:
            query = query.filter(Movie.title.ilike(f"%{title}%"))

        if genre:
            query = query.filter(Movie.genres.ilike(f"%{genre}%"))

        if sort_by in ["title", "release_date"]:
            query = query.order_by(getattr(Movie, sort_by).asc() if order == "asc" else getattr(Movie, sort_by).desc())

        movies = query.all()
        movie_list = [{
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
            "genres": movie.genres.split(", ") if movie.genres else [],
            "poster_url": movie.poster_url
        } for movie in movies]

        return jsonify({"movies": movie_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/search-movies', methods=['GET'])
def search_movies():
    """
    Meklē filmas.
    """
    try:
        title = request.args.get('title')
        release_date_after = request.args.get('release_date_after')
        genre = request.args.get('genre')
        sort_by = request.args.get('sort_by')
        order = request.args.get('order', 'asc')

        query = Movie.query

        # Filtrēšana
        if title:
            query = query.filter(Movie.title.ilike(f"%{title}%"))

        if release_date_after:
            try:
                date_obj = datetime.strptime(release_date_after, '%Y-%m-%d').date()
                query = query.filter(Movie.release_date > date_obj)
            except ValueError:
                return jsonify({"error": "Datums jānorāda formātā YYYY-MM-DD"}), 400

        if genre:
            query = query.filter(Movie.genres.ilike(f"%{genre}%"))

        # Kārtošana
        if sort_by:
            if sort_by == "title":
                query = query.order_by(Movie.title.asc() if order == "asc" else Movie.title.desc())
            elif sort_by == "release_date":
                query = query.order_by(Movie.release_date.asc() if order == "asc" else Movie.release_date.desc())

        movies = query.all()

        movie_list = [
            {
                "id": movie.id,
                "title": movie.title,
                "description": movie.description,
                "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
                "genres": movie.genres.split(", ") if movie.genres else [],
                "poster_url": movie.poster_url
            }
            for movie in movies
        ]

        return jsonify({"movies": movie_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Definējam maršrutu POST pieprasījumam, lai pievienotu atsauksmi
@bp.route('/add-review', methods=['POST'])
@jwt_required()  
def add_review():
    user_id = get_jwt_identity()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Nevar parsēt JSON!"}), 400

    # Izgūstam attiecīgos laukus no JSON
    movie_id = data.get('movie_id')
    rating = data.get('rating')
    text = data.get("text")

    # Apstrādājam tekstu: noņemam liekās atstarpes vai uzstādam tukšu virkni
    text = (text or "").strip()

    # Pārbaudām, vai vismaz viens no laukiem (vērtējums vai teksts) ir aizpildīts
    if rating is None and text == "":
        return jsonify({"error": "Jābūt vismaz vērtējumam vai tekstam!"}), 400

    # Ja vērtējums ir iesniegts, pārliecināmies, ka tas ir derīgs skaitlis 1-5
    if rating is not None:
        try:
            rating = int(rating)
        except (ValueError, TypeError):
            return jsonify({"error": "Vērtējumam jābūt skaitlim no 1 līdz 5!"}), 400

        if rating < 1 or rating > 5:
            return jsonify({"error": "Vērtējumam jābūt no 1 līdz 5!"}), 400

    # Pārbaudām, vai filma eksistē
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({"error": "Filma nav atrasta!"}), 404

    # Pārbaudām, vai lietotājs jau nav pievienojis atsauksmi par šo filmu
    existing_review = Review.query.filter_by(movie_id=movie_id, user_id=user_id).first()
    if existing_review:
        return jsonify({"error": "Jūs jau esat atstājis atsauksmi par šo filmu!"}), 400

    # Ja vērtējums nav norādīts, iestatām to uz noklusēto vērtību
    review_rating = rating if rating is not None else 0

    # Pārbaudām, vai tekstā nav neatļautu vārdu
    if text:
        if contains_forbidden_word(text):
            return jsonify({"error": "Atsauksmē ir neatļauti vārdi!"}), 400

    # Izveidojam jaunu atsauksmi un saglabājam datubāzē
    new_review = Review(movie_id=movie_id, user_id=user_id, text=text, rating=review_rating)
    db.session.add(new_review)
    db.session.commit()

    # Pārrēķinām filmas vidējo vērtējumu no visām atsauksmēm
    reviews = Review.query.filter_by(movie_id=movie_id).all()
    valid_ratings = [r.rating for r in reviews if r.rating]
    avg_rating = round(sum(valid_ratings) / len(valid_ratings), 1) if valid_ratings else 0.0

    # Atgriežam atbildi ar veiksmīgu paziņojumu un jauno atsauksmi
    return jsonify({
        "message": "Atsauksme veiksmīgi pievienota!",
        "review": {
            "id": new_review.id,
            "user": user.username,
            "rating": new_review.rating,
            "text": new_review.text
        },
        "average_rating": avg_rating
    }), 201

@bp.route("/update-movie/<int:movie_id>", methods=["PUT"])
@jwt_required()
def update_movie(movie_id):
    """
    Atjaunina filmas datus. Pieejams tikai administratoriem.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Tikai administratoriem ir atļauts rediģēt filmas."}), 403

        data = request.get_json()
        movie = Movie.query.get(movie_id)

        if not movie:
            return jsonify({"error": "Filma nav atrasta"}), 404

        # Galveno lauku atjaunināšana
        movie.title = data.get("title", movie.title)
        movie.description = data.get("description", movie.description)
        if "release_date" in data:
            movie.release_date = datetime.strptime(data["release_date"], "%Y-%m-%d").date()
        if "genres" in data:
            movie.genres = ", ".join(data["genres"])
        movie.poster_url = data.get("poster_url", movie.poster_url)
        movie.trailer_url = data.get("trailer_url", movie.trailer_url)
        movie.country = data.get("country", movie.country)
        movie.box_office = data.get("box_office", movie.box_office)
        movie.awards = json.dumps(data.get("awards", json.loads(movie.awards) if movie.awards else []))
        movie.duration = data.get("duration", movie.duration)
        movie.age_rating = data.get("age_rating", movie.age_rating)

        # Radošās komandas atjaunināšana (aktieri, režisori, scenāristi)
        if "actors" in data:
            movie.actors = json.dumps(data["actors"])
        if "directors" in data:
            movie.directors = json.dumps(data["directors"])
        if "writers" in data:
            movie.writers = json.dumps(data["writers"])

        db.session.commit()
        return jsonify({"message": "Filma veiksmīgi atjaunināta!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/delete-movie/<int:movie_id>', methods=['DELETE'])
@jwt_required()
def delete_movie(movie_id):
    """
    Dzēš filmu no datubāzes. Pieejams tikai administratoriem.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Tikai administratoriem ir tiesības dzēst filmas!"}), 403

        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Filma nav atrasta"}), 404

        db.session.delete(movie)
        db.session.commit()

        return jsonify({"message": f"Filma '{movie.title}' veiksmīgi dzēsta!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/add-actor', methods=['POST'])
def add_actor():
    try:
        data = request.get_json()
        name = data.get('name')
        bio = data.get('bio')
        birth_date = data.get('birth_date')
        death_date = data.get('death_date')

        if not name:
            return jsonify({"error": "Поле 'name' обязательно"}), 400

        birth_date_obj = None
        if birth_date:
            try:
                birth_date_obj = datetime.strptime(birth_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Дата рождения должна быть в формате YYYY-MM-DD"}), 400

        death_date_obj = None
        if death_date:
            try:
                death_date_obj = datetime.strptime(death_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Дата смерти должна быть в формате YYYY-MM-DD"}), 400

        new_actor = Actor(name=name, bio=bio, birth_date=birth_date_obj, death_date=death_date_obj)
        db.session.add(new_actor)
        db.session.commit()

        return jsonify({"message": "Актёр успешно добавлен", "actor_id": new_actor.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/add-actor-to-movie', methods=['POST'])
def add_actor_to_movie():
    try:
        data = request.get_json()
        movie_id = data.get('movie_id')
        actor_id = data.get('actor_id')

        if not movie_id or not actor_id:
            return jsonify({"error": "Нужны 'movie_id' и 'actor_id'"}), 400

        movie = Movie.query.get(movie_id)
        actor = Actor.query.get(actor_id)

        if not movie or not actor:
            return jsonify({"error": "Фильм или актёр не найдены"}), 404

        movie.actors.append(actor)
        db.session.commit()

        return jsonify({"message": f"Актёр {actor.name} добавлен в фильм {movie.title}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-actors-by-movie/<int:movie_id>', methods=['GET'])
def get_actors_by_movie(movie_id):
    try:
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Фильм не найден"}), 404

        actors = movie.actors
        actor_list = [
            {
                "id": actor.id,
                "name": actor.name,
                "bio": actor.bio,
                "birth_date": str(actor.birth_date) if actor.birth_date else None,
                "death_date": str(actor.death_date) if actor.death_date else None 
            }
            for actor in actors
        ]

        return jsonify({"movie": movie.title, "actors": actor_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-movies-by-actor/<int:actor_id>', methods=['GET'])
def get_movies_by_actor(actor_id):
    try:
        actor = Actor.query.get(actor_id)
        if not actor:
            return jsonify({"error": "Актёр не найден"}), 404

        movies = actor.movies
        movie_list = [{"id": movie.id, "title": movie.title, "release_date": str(movie.release_date)} for movie in movies]

        return jsonify({"actor": actor.name, "movies": movie_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Maršruts, kas ļauj administratoram noņemt aktieri no konkrētas filmas
@bp.route('/remove-actor-from-movie', methods=['DELETE'])
@jwt_required() 
def remove_actor_from_movie():
    try:
        # Iegūstam pašreizējo lietotāja identifikatoru no JWT
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({"error": "Pieeja liegta: tikai administratoriem"}), 403

        data = request.get_json()
        movie_id = data.get('movie_id')
        actor_id = data.get('actor_id')

        # Pārbaudām, vai ir sniegti nepieciešamie parametri
        if not movie_id or not actor_id:
            return jsonify({"error": "Nepieciešams 'movie_id' un 'actor_id'"}), 400

        # Iegūstam filmu un aktieri no datubāzes
        movie = Movie.query.get(movie_id)
        actor = Actor.query.get(actor_id)

        if not movie or not actor:
            return jsonify({"error": "Filma vai aktieris nav atrasts"}), 404

        # Ja aktieris ir piesaistīts filmai — noņemam saiti
        if actor in movie.actors:
            movie.actors.remove(actor)
            db.session.commit()  # Saglabājam izmaiņas datubāzē

            return jsonify({
                "message": f"Aktieris '{actor.name}' ir veiksmīgi noņemts no filmas '{movie.title}'"
            }), 200
        else:
            #  Aktieris nav bijis piesaistīts šai filmai
            return jsonify({"error": "Aktieris nav piesaistīts norādītajai filmai"}), 400

    except Exception as e:
        # Neparedzēta kļūda
        return jsonify({"error": str(e)}), 500

# Pievienot režisoru
@bp.route('/add-director', methods=['POST'])
def add_director():
    try:
        data = request.get_json()
        name = data.get('name')
        bio = data.get('bio', '')
        birth_date = data.get('birth_date')
        death_date = data.get('death_date')

        birth_date_obj = datetime.strptime(birth_date, '%Y-%m-%d').date() if birth_date else None
        death_date_obj = datetime.strptime(death_date, '%Y-%m-%d').date() if death_date else None

        new_director = Director(name=name, bio=bio, birth_date=birth_date_obj, death_date=death_date_obj)
        db.session.add(new_director)
        db.session.commit()
        return jsonify({"message": "Режиссёр успешно добавлен", "director_id": new_director.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Pievienot rakstnieku
@bp.route('/add-writer', methods=['POST'])
def add_writer():
    try:
        data = request.get_json()
        name = data.get('name')
        bio = data.get('bio', '')
        birth_date = data.get('birth_date')
        death_date = data.get('death_date')

        birth_date_obj = datetime.strptime(birth_date, '%Y-%m-%d').date() if birth_date else None
        death_date_obj = datetime.strptime(death_date, '%Y-%m-%d').date() if death_date else None

        new_writer = Writer(name=name, bio=bio, birth_date=birth_date_obj, death_date=death_date_obj)
        db.session.add(new_writer)
        db.session.commit()
        return jsonify({"message": "Сценарист успешно добавлен", "writer_id": new_writer.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Pievienot režisoru filmai
@bp.route('/add-director-to-movie', methods=['POST'])
def add_director_to_movie():
    data = request.get_json()
    new_entry = MovieDirectors(movie_id=data['movie_id'], director_id=data['director_id'])
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Режиссёр добавлен к фильму"}), 201

# Pievienojiet filmai scenāristu
@bp.route('/add-writer-to-movie', methods=['POST'])
def add_writer_to_movie():
    data = request.get_json()
    new_entry = MovieWriters(movie_id=data['movie_id'], writer_id=data['writer_id'])
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Сценарист добавлен к фильму"}), 201

# Iegūstiet filmas režisorus
@bp.route('/get-directors-by-movie/<int:movie_id>', methods=['GET'])
def get_directors_by_movie(movie_id):
    try:
        directors = db.session.query(Director).join(MovieDirectors).filter(MovieDirectors.movie_id == movie_id).all()
        return jsonify({
            "movie_id": movie_id,
            "directors": [
                {
                    "id": d.id,
                    "name": d.name,
                    "bio": d.bio,
                    "birth_date": d.birth_date.strftime('%Y-%m-%d') if d.birth_date else None,
                    "death_date": d.death_date.strftime('%Y-%m-%d') if d.death_date else None
                }
                for d in directors
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Iegūstiet filmu scenāristus
@bp.route('/get-writers-by-movie/<int:movie_id>', methods=['GET'])
def get_writers_by_movie(movie_id):
    try:
        writers = db.session.query(Writer).join(MovieWriters).filter(MovieWriters.movie_id == movie_id).all()
        return jsonify({
            "movie_id": movie_id,
            "writers": [
                {
                    "id": w.id,
                    "name": w.name,
                    "bio": w.bio,
                    "birth_date": w.birth_date.strftime('%Y-%m-%d') if w.birth_date else None,
                    "death_date": w.death_date.strftime('%Y-%m-%d') if w.death_date else None
                }
                for w in writers
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Получить фильмы конкретного режиссёра
@bp.route('/get-movies-by-director/<int:director_id>', methods=['GET'])
def get_movies_by_director(director_id):
    movies = db.session.query(Movie).join(MovieDirectors).filter(MovieDirectors.director_id == director_id).all()
    return jsonify({
        "director_id": director_id,
        "movies": [{"id": m.id, "title": m.title} for m in movies]
    })

# Получить фильмы конкретного сценариста
@bp.route('/get-movies-by-writer/<int:writer_id>', methods=['GET'])
def get_movies_by_writer(writer_id):
    movies = db.session.query(Movie).join(MovieWriters).filter(MovieWriters.writer_id == writer_id).all()
    return jsonify({
        "writer_id": writer_id,
        "movies": [{"id": m.id, "title": m.title} for m in movies]
    })

@bp.route('/get-actors', methods=['GET'])
def get_actors():
    try:
        actors = Actor.query.all()
        actor_list = [
            {
                "id": actor.id,
                "name": actor.name,
                "bio": actor.bio,
                "birth_date": actor.birth_date.strftime('%Y-%m-%d') if actor.birth_date else None,
                "death_date": actor.death_date.strftime('%Y-%m-%d') if actor.death_date else None
            }
            for actor in actors
        ]
        return jsonify({"actors": actor_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/delete-review/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    """
    Dzēš konkrētu atsauksmi. Lietotājs drīkst dzēst tikai savas atsauksmes.
    Moderators un administrators — jebkuru.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    review = Review.query.get(review_id)
    if not review:
        return jsonify({"error": "Atsauksme nav atrasta!"}), 404

    # Tiesību pārbaude
    if review.user_id != user.id and user.role not in ["moderator", "admin"]:
        return jsonify({"error": "Jums nav tiesību dzēst šo atsauksmi!"}), 403

    db.session.delete(review)
    db.session.commit()

    return jsonify({"message": "Atsauksme veiksmīgi dzēsta!"}), 200
    
#Šis maršruts ļauj lietotājam pievienot filmu savam vēlmju sarakstam
@bp.route("/add-to-favorites", methods=["POST"])
@jwt_required()  # Nepieciešams derīgs JWT tokens
def add_to_favorites():
    # Saņem datus no klienta puses JSON formātā
    data = request.get_json()
    movie_id = data.get("movie_id")  # Filmas ID, kuru lietotājs vēlas pievienot

    # No JWT iegūstam lietotāja identitāti (šajā gadījumā — e-pastu)
    user_email = get_jwt_identity()
    print(f"DEBUG: Lietotāja e-pasts saņemts -> {user_email}")

    # Ja e-pasts nav norādīts (drošības pārbaude)
    if not user_email:
        return jsonify({"error": "Nav norādīts lietotāja e-pasts!"}), 400

    # Mēģina atrast lietotāju pēc e-pasta datubāzē
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    # Pārbauda, vai šāda filma vispār eksistē
    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({"error": "Filma nav atrasta!"}), 404

    # Pārbauda, vai filma jau nav pievienota favorītiem
    existing_favorite = FavoriteMovie.query.filter_by(user_id=user.id, movie_id=movie_id).first()
    if existing_favorite:
        return jsonify({"error": "Šī filma jau ir pievienota favorītiem!"}), 400

    # Ja viss kārtībā — izveido jaunu favorīta ierakstu
    new_favorite = FavoriteMovie(user_id=user.id, movie_id=movie_id)
    db.session.add(new_favorite)  # Pievieno jauno ierakstu sesijā
    db.session.commit()           # Saglabā izmaiņas datubāzē

    # Atgriež pozitīvu atbildi klientam
    return jsonify({"message": "Filma veiksmīgi pievienota vēlmju sarakstam!"}), 201

# Šis maršruts atgriež visas lietotāja favorītfilmas
@bp.route('/favorites', methods=['GET'])
@jwt_required()  # Nepieciešams derīgs JWT tokens
def get_favorites():
    # Iegūst lietotāja identitāti (e-pastu) no JWT tokena
    user_email = get_jwt_identity()

    # Drošības pārbaude — ja kaut kādu iemeslu dēļ e-pasts nav iegūts
    if not user_email:
        return jsonify({"error": "Nav norādīts lietotāja e-pasts!"}), 400

    # Atrod lietotāju datubāzē
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    # Vaicājums, kas atrod visas filmas, kuras šis lietotājs ir pievienojis kā favorītus
    favorites = (
        db.session.query(Movie)
        .join(FavoriteMovie, Movie.id == FavoriteMovie.movie_id)
        .filter(FavoriteMovie.user_id == user.id)
        .all()
    )

    # Formatē un atgriež atrastās filmas JSON formātā
    return jsonify({
        "favorites": [
            {
                "id": movie.id,
                "title": movie.title,
                "description": movie.description,
                "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else "Nav zināms",
                "genres": movie.genres.split(", ") if movie.genres else ["Nav norādīts"],
                "poster_url": movie.poster_url
            }
            for movie in favorites
        ]
    }), 200

@bp.route('/get-movie/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
    try:
        # Iegūstam filmu pēc ID no datubāzes
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Filma nav atrasta!"}), 404

        # Iegūstam saistītos aktierus (daudz-pre-daudz attiecības)
        actors = [{"id": actor.id, "name": actor.name} for actor in movie.actors]

        # Iegūstam režisorus (caur saistīto tabulu MovieDirectors)
        directors = db.session.query(Director).join(MovieDirectors).filter(MovieDirectors.movie_id == movie_id).all()
        director_list = [{"id": director.id, "name": director.name} for director in directors]

        # Iegūstam scenāristus (caur saistīto tabulu MovieWriters)
        writers = db.session.query(Writer).join(MovieWriters).filter(MovieWriters.movie_id == movie_id).all()
        writer_list = [{"id": writer.id, "name": writer.name} for writer in writers]

        # Iegūstam atsauksmes par filmu
        reviews = Review.query.filter_by(movie_id=movie_id).all()
        review_list = [
            {
                "id": review.id,
                "user_email": review.user.email,  # Lietotāja e-pasts
                "user_name": review.user.username,  # Lietotājvārds
                "text": review.text,
                "rating": review.rating,
                "created_at": review.created_at.strftime('%Y-%m-%d %H:%M:%S')  # Formatēta datuma vērtība
            }
            for review in reviews
        ]

        # Aprēķinām vidējo vērtējumu tikai no atsauksmēm, kur ir norādīts vērtējums
        valid_ratings = [r.rating for r in reviews if r.rating and r.rating > 0]
        average_rating = round(sum(valid_ratings) / len(valid_ratings), 1) if valid_ratings else 0.0

        # Veidojam gala JSON atbildi ar pilnu informāciju par filmu
        return jsonify({
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
            "genres": movie.genres.split(", ") if movie.genres else [],
            "poster_url": movie.poster_url,
            "trailer_url": movie.trailer_url,
            "average_rating": average_rating,
            "reviews": review_list,
            "actors": actors,
            "directors": director_list,
            "writers": writer_list,
            "country": movie.country,
            "box_office": movie.box_office,  # Kases ieņēmumi
            "awards": json.loads(movie.awards) if movie.awards else [],  # Nominācijas/Balvas
            "duration": movie.duration,  # Filmas ilgums minūtēs
            "age_rating": movie.age_rating  # Vecuma ierobežojums
        }), 200

    except Exception as e:
        # Kļūda apstrādes laikā – atgriežam servera kļūdas paziņojumu
        return jsonify({"error": str(e)}), 500
    
# Maršruts, kas noņem filmu no lietotāja favorītiem
@bp.route("/remove-from-favorites", methods=["DELETE"])
@jwt_required()  # Nodrošina, ka tikai autorizēts lietotājs var piekļūt
def remove_from_favorites():
    data = request.get_json()
    movie_id = data.get("movie_id")

    # Iegūst pašreizējā lietotāja e-pastu no JWT identitātes
    user_email = get_jwt_identity()

    if not user_email:
        return jsonify({"error": "Lietotāja identitāte nav atrasta!"}), 400

    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    favorite = FavoriteMovie.query.filter_by(user_id=user.id, movie_id=movie_id).first()
    if not favorite:
        return jsonify({"error": "Filma nav atrasta favorītos!"}), 400

    db.session.delete(favorite)
    db.session.commit()

    return jsonify({"message": "Filma veiksmīgi izņemta no favorītiem!"}), 200

@bp.route('/clean-duplicate-reviews', methods=['DELETE']) #Šis koda fragments nav tik svarīgs, taču tas noņem atkārtotas atsauksmes, ja tās pēkšņi parādījās izstrādes laikā
@jwt_required()
@admin_required
def clean_duplicate_reviews():
    try:
        # Получаем все дубликаты отзывов
        duplicates_query = text("""
            SELECT r1.id 
            FROM review r1
            INNER JOIN review r2 
            ON r1.user_id = r2.user_id 
            AND r1.movie_id = r2.movie_id 
            AND r1.id > r2.id;
        """)
        
        duplicates = db.session.execute(duplicates_query).fetchall()

        # Удаляем все найденные дубликаты
        for duplicate in duplicates:
            review = Review.query.get(duplicate[0])
            db.session.delete(review)

        db.session.commit()
        return jsonify({"message": f"Удалено {len(duplicates)} дублирующихся отзывов"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/auth/get-profile', methods=['GET'])
def get_profile():
    try:
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Nav autorizācijas galvenes!"}), 401
        
        user_role = request.headers.get("User-Role")  # Получаем роль
        user_email = request.headers.get("User-Email")  # Получаем email

        if not user_email:
            return jsonify({"error": "Nav norādīts e-pasts"}), 400

        user = User.query.filter_by(email=user_email).first()

        if not user:
            return jsonify({"error": "Lietotājs nav atrasts"}), 404

        return jsonify({
            "username": user.username,
            "email": user.email,
            "role": user_role
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/toggle-block-user/<int:user_id>', methods=['PUT'])
@jwt_required()
def toggle_block_user(user_id):
    """
    Administratoram ir iespēja bloķēt vai atbloķēt lietotājus.
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)

        if not current_user or current_user.role != "admin":
            return jsonify({"error": "Tikai administratoriem ir tiesības bloķēt lietotājus!"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Lietotājs nav atrasts"}), 404

        user.is_blocked = not user.is_blocked
        db.session.commit()

        status = "bloķēts" if user.is_blocked else "atbloķēts"
        return jsonify({"message": f"Lietotājs {user.username} ir {status}!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Maršruts, kas nodrošina iespēju autentificētam lietotājam rediģēt savu atsauksmi par filmu.
@bp.route('/edit-review/<int:review_id>', methods=['PUT'])
@jwt_required()
def edit_review(review_id):
    user_id = get_jwt_identity()

    if not user_id:
        return jsonify({"error": "Autentifikācija neizdevās!"}), 401

    # Iegūstam lietotāju no datubāzes
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    # Iegūstam atsauksmi pēc ID
    review = Review.query.get(review_id)
    if not review:
        return jsonify({"error": "Atsauksme nav atrasta!"}), 404

    # Saņemam jaunos datus no pieprasījuma
    data = request.get_json()
    new_text = (data.get("text") or "").strip()

    try:
        new_rating = int(data.get("rating", 0))
        if new_rating < 0 or new_rating > 5:
            return jsonify({"error": "Vērtējumam jābūt no 0 līdz 5!"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Vērtējumam jābūt skaitliskai vērtībai no 0 līdz 5!"}), 400

    # Ja teksts ir norādīts — pārbaudām uz aizliegtajiem vārdiem
    if new_text:
        if contains_forbidden_word(new_text):
            return jsonify({"error": "Atsauksmē ir neatļauti vārdi!"}), 400

    # Vismaz tekstam vai vērtējumam ir jābūt — abi lauki nevar būt tukši
    if not new_text and new_rating == 0:
        return jsonify({"error": "Jābūt vismaz vērtējumam vai atsauksmes tekstam!"}), 400

    # Saglabājam atsauksmes izmaiņas datubāzē
    review.text = new_text if new_text else None
    review.rating = new_rating
    db.session.commit()

    # Pārrēķinām vidējo vērtējumu konkrētajai filmai
    movie_id = review.movie_id
    all_reviews = Review.query.filter_by(movie_id=movie_id).all()
    valid_ratings = [r.rating for r in all_reviews if r.rating > 0]
    average_rating = round(sum(valid_ratings) / len(valid_ratings), 1) if valid_ratings else 0.0

    # Atgriežam veiksmīgu atbildi ar jauno atsauksmes saturu un vidējo vērtējumu
    return jsonify({
        "message": "Atsauksme veiksmīgi rediģēta!",
        "review": {
            "id": review.id,
            "text": review.text,
            "rating": review.rating,
            "created_at": review.created_at.strftime('%Y-%m-%d %H:%M:%S')
        },
        "average_rating": average_rating
    }), 200

# Modulis, kas ļauj autentificētiem moderatoram vai administrātoram apskatīt sūdzības par filmām vai atsauksmēm
@bp.route('/view-complaints', methods=['GET'])
@jwt_required()
def view_complaints():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Tikai moderators vai administrators drīkst piekļūt sūdzību sarakstam
        if not user or not (user.is_moderator() or user.is_admin()):
            return jsonify({"error": "Darbība nav atļauta"}), 403

        # Atlasām visas sūdzības ar statusu “neatrisināta”
        complaints = Complaint.query.filter_by(status="neatrisināta").all()

        complaints_list = []
        for c in complaints:
            # Pievienojam filmas nosaukumu, ja tāda pastāv
            movie = Movie.query.get(c.movie_id)
            movie_title = movie.title if movie else f"ID: {c.movie_id}"

            # Ja sūdzība ir par atsauksmi — pievienojam arī tās tekstu
            review = Review.query.get(c.review_id) if c.review_id else None
            review_text = review.text if review else None

            complaints_list.append({
                "id": c.id,
                "user_email": c.user_email,
                "movie_title": movie_title,
                "subject": c.subject,
                "text": c.text,
                "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else None,
                "status": c.status,
                "review_text": review_text,
                "type": "review" if c.review_id else "movie"
            })

        return jsonify({"complaints": complaints_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/send-complaint', methods=['POST'])
@jwt_required()
def send_complaint():
    user_id = get_jwt_identity()
    data = request.get_json()

    # Pārbaudām, vai visi nepieciešamie lauki ir ievadīti
    if not data.get("movie_id") or not data.get("subject") or not data.get("text"):
        return jsonify({"error": "Nepareizi ievadīti dati!"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    # Izveidojam jaunu sūdzību
    new_complaint = Complaint(
        user_email=user.email,
        user_id=user.id,
        movie_id=data["movie_id"],
        subject=data["subject"],
        text=data["text"],
        review_id=data.get("review_id")
    )

    db.session.add(new_complaint)
    db.session.commit()

    return jsonify({"message": "Sūdzība veiksmīgi saņemta!"}), 201

# Modulis, kas ļauj autentificētiem moderatoram vai administrātoram mainīt sūdzības statussu
@bp.route('/resolve-complaint/<int:complaint_id>', methods=['PUT'])
@jwt_required()
def resolve_complaint(complaint_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not (user.is_moderator() or user.is_admin()):
            return jsonify({"error": "Darbība nav atļauta"}), 403

        action = request.args.get("action")  # "resolved" vai "rejected"
        comment = request.args.get("comment", "").strip()

        if action not in ["resolved", "rejected"]:
            return jsonify({"error": "Nepareiza darbība!"}), 400

        complaint = Complaint.query.get(complaint_id)
        if not complaint:
            return jsonify({"error": "Sūdzība nav atrasta!"}), 404

        # Atjaunojam statusu atkarībā no izvēlētās darbības
        complaint.status = "atrisināta" if action == "resolved" else "noraidīta"

        # Ja sūdzība tiek noraidīta — saglabājam komentāru no moderatora
        if action == "rejected" and comment:
            complaint.moderator_comment = comment

        db.session.commit()

        return jsonify({"message": "Sūdzība veiksmīgi apstrādāta!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Maršruts, kas atgriež visus atsauksmes, ko ir uzrakstījis autentificēts lietotājs
@bp.route('/get-user-reviews', methods=['GET'])
@jwt_required()  # Tikai autorizēti lietotāji drīkst piekļūt šai funkcijai
def get_user_reviews():
    try:
        user_id = get_jwt_identity()

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "Lietotājs nav atrasts!"}), 404

        # Iegūstam visas atsauksmes, ko uzrakstījis šis lietotājs
        reviews = Review.query.filter_by(user_id=user.id).all()

        review_list = [{
            "id": r.id,
            "movie_id": r.movie_id,
            "movie_title": Movie.query.get(r.movie_id).title if Movie.query.get(r.movie_id) else "Nezināma filma",
            "text": r.text,
            "rating": r.rating,
            "created_at": r.created_at.strftime('%Y-%m-%d %H:%M') 
        } for r in reviews]

        return jsonify({"reviews": review_list}), 200

    except Exception as e:
        # Ja notiek neparedzēta kļūda
        return jsonify({"error": str(e)}), 500

#Lietotāja profila datu atjaunināšana
@bp.route('/update-profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Lietotājs var atjaunināt savu profilu — vārdu, e-pastu, paroli."""
    user_id = get_jwt_identity()
    data = request.get_json()

    new_username = (data.get("username") or "").strip()
    new_email = (data.get("email") or "").strip()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts!"}), 404

    # Jauna parole.
    if new_password:
        if not current_password or not user.check_password(current_password):
            return jsonify({"error": "Nepareiza pašreizējā parole!"}), 400
        user.set_password(new_password)

    # Lietotājvārda un e-pasta maiņa
    if new_username and new_username != user.username:
        user.username = new_username

    if new_email and new_email != user.email:
        if User.query.filter_by(email=new_email).first():
            return jsonify({"error": "Šis e-pasts jau ir aizņemts!"}), 400
        user.email = new_email

    db.session.commit()

    return jsonify({
        "message": "Profils veiksmīgi atjaunināts!",
        "username": user.username,
        "email": user.email
    }), 200

# Skatīt savas apstrādātās sūdzības.
@bp.route('/get-user-complaints', methods=['GET'])
@jwt_required()
def get_user_complaints():
    """Lietotājs skatās savas sūdzības, kuras jau ir apstrādātas (ne "neatrisināta")."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts"}), 404

    complaints = Complaint.query.filter_by(user_id=user.id).filter(
        Complaint.status != "neatrisināta",
        Complaint.is_dismissed_by_user == False
    ).all()

    result = []
    for c in complaints:
        result.append({
            "id": c.id,
            "subject": c.subject,
            "text": c.text,
            "status": c.status,
            "comment": c.moderator_comment,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify({"complaints": result}), 200

# Paslēpt sūdzību no profila.
@bp.route('/dismiss-complaint/<int:complaint_id>', methods=['PUT'])
@jwt_required()
def dismiss_complaint(complaint_id):
    """
    Lietotājs var paslēpt kādu no savām sūdzībām no profila, ja tā jau ir apstrādāta.
    Tiek atzīmēts lauks `is_dismissed_by_user = True`.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Lietotājs nav atrasts"}), 404

    complaint = Complaint.query.get(complaint_id)
    if not complaint or complaint.user_id != user.id:
        return jsonify({"error": "Sūdzība nav atrasta vai nepieder jums"}), 403

    complaint.is_dismissed_by_user = True
    db.session.commit()

    return jsonify({"message": "Sūdzība paslēpta no profila"}), 200
