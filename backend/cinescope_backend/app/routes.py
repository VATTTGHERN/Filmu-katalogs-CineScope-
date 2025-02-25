from flask import Blueprint, jsonify, request  # Добавлен импорт request для работы с данными из запроса
from app import db
from app.models import User, Movie, Review, Actor, Director, Writer, MovieDirectors, MovieWriters, FavoriteMovie
from datetime import datetime
from app.auth import *
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.sql import text
import json

from app.auth import admin_required, moderator_required

bp = Blueprint('routes', __name__)

@bp.route('/')
def home():
    return "Hello, CineScope!"

@bp.route('/init-db')
def init_db():
    try:
        db.create_all()  # Создание таблиц в базе данных
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
        from app.models import User, Movie, Review  # Убедимся, что модели импортированы
        db.create_all()  # Принудительное создание таблиц
        current_db = db.engine.url.database  # Получим текущую базу данных
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()  # Проверим созданные таблицы
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
        new_user.set_password(password)  # Хешируем пароль перед сохранением
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Lietotājs veiksmīgi reģistrēts"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-users', methods=['GET'])
def get_users():
    try:
        # Получаем всех пользователей из базы данных
        users = User.query.all()
        # Преобразуем объекты пользователей в список словарей
        user_list = [
            {"id": user.id, "username": user.username, "email": user.email}
            for user in users
        ]
        return jsonify({"users": user_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/add-movie", methods=["POST"])
def add_movie():
    try:
        user = User.query.filter_by(role="admin").first()
        if not user:
            return jsonify({"error": "Nav administratora!"}), 403

        data = request.get_json()

        # ✅ Получаем все поля из запроса
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        release_date = data.get("release_date", "").strip()
        genres = data.get("genres", [])
        poster_url = data.get("poster_url", "").strip()
        trailer_url = data.get("trailer_url", "").strip()
        country = data.get("country", "").strip()
        box_office = data.get("box_office", "").strip()
        awards = json.dumps(data.get("awards", []))  # 🔥 Сохраняем как JSON-строку
        duration = data.get("duration")
        age_rating = data.get("age_rating", "").strip()

        if not title or not release_date or not genres:
            return jsonify({"error": "Nepieciešams nosaukums, izlaišanas datums un žanrs."}), 400

        try:
            release_date = datetime.strptime(release_date, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Nepareizs datums! Izmantojiet YYYY-MM-DD formātu."}), 400

        genres_str = ", ".join(genres) if isinstance(genres, list) else genres

        # ✅ Создаем фильм с сохранением всех полей
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
            age_rating=age_rating if age_rating else None
        )

        db.session.add(new_movie)
        db.session.commit()

        return jsonify({"message": "Filma veiksmīgi pievienota!", "movie_id": new_movie.id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-movies', methods=['GET'])
def get_movies():
    try:
        movies = Movie.query.all()
        movie_list = [{
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
            "genres": movie.genres.split(", ") if movie.genres else [],
            "poster_url": movie.poster_url  # <-- Добавляем постеры сюда
        } for movie in movies]

        return jsonify({"movies": movie_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/get-latvian-movies', methods=['GET'])
def get_latvian_movies():
    try:
        title = request.args.get('title')
        genre = request.args.get('genre')

        query = Movie.query.filter_by(country="Latvia")

        if title:
            query = query.filter(Movie.title.ilike(f"%{title}%"))

        if genre:
            query = query.filter(Movie.genres.ilike(f"%{genre}%"))

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
    try:
        title = request.args.get('title')
        release_date_after = request.args.get('release_date_after')
        genre = request.args.get('genre')
        sort_by = request.args.get('sort_by')
        order = request.args.get('order', 'asc')

        query = Movie.query

        if title:
            query = query.filter(Movie.title.ilike(f"%{title}%"))

        if release_date_after:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(release_date_after, '%Y-%m-%d').date()
                query = query.filter(Movie.release_date > date_obj)
            except ValueError:
                return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

        if genre:
            query = query.filter(Movie.genres.ilike(f"%{genre}%"))

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
        "poster_url": movie.poster_url  # ✅ Добавили постер
    }
    for movie in movies
    ]

        return jsonify({"movies": movie_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/add-review', methods=['POST'])
@jwt_required()
def add_review():
    try:
        user_id = get_jwt_identity()
        print(f"DEBUG: Полученный user_id = {user_id}")  # 🔴 Логируем ID пользователя

        if not user_id:
            print("DEBUG: ❌ Ошибка - user_id не найден!")
            return jsonify({"error": "Lietotājs nav atrasts!"}), 401

        data = request.get_json()
        print("DEBUG: Полученные данные:", data)  # 🔴 Логируем входящие данные

        if data is None:
            return jsonify({"error": "Nevar parsēt JSON!"}), 400

        movie_id = int(data.get('movie_id', 0))
        rating = int(data.get('rating', 0))
        text = data.get("text", "").strip()
        text = text if text else None

        print(f"DEBUG: movie_id={movie_id}, rating={rating}, text={text}")

        if not movie_id or rating is None:
            return jsonify({"error": "Nepieciešams norādīt filmas ID un vērtējumu"}), 400

        if not (1 <= rating <= 5):
            return jsonify({"error": "Vērtējumam jābūt no 1 līdz 5"}), 400

        movie = Movie.query.get(movie_id)
        if not movie:
            print(f"DEBUG: ❌ Фильм с ID {movie_id} не найден!")
            return jsonify({"error": "Filma nav atrasta"}), 404

        existing_review = Review.query.filter_by(user_id=user_id, movie_id=movie_id).first()
        if existing_review:
            return jsonify({"error": "Jūs jau esat atstājuši atsauksmi par šo filmu"}), 400

        new_review = Review(movie_id=movie_id, user_id=user_id, text=text, rating=rating)
        db.session.add(new_review)
        db.session.commit()

        print("DEBUG: ✅ Отзыв успешно добавлен!")
        return jsonify({"message": "Atsauksme veiksmīgi pievienota!", "review_id": new_review.id}), 201

    except Exception as e:
        print("DEBUG: ❌ Ошибка на сервере:", str(e))
        return jsonify({"error": str(e)}), 500

@bp.route("/update-movie/<int:movie_id>", methods=["PUT"])
def update_movie(movie_id):
    try:
        data = request.get_json()
        movie = Movie.query.get(movie_id)

        if not movie:
            return jsonify({"error": "Filma nav atrasta"}), 404

        # ✅ Обновляем основные данные фильма
        movie.title = data.get("title", movie.title)
        movie.description = data.get("description", movie.description)
        movie.release_date = datetime.strptime(data["release_date"], "%Y-%m-%d").date() if "release_date" in data else movie.release_date
        movie.genres = ", ".join(data["genres"]) if "genres" in data else movie.genres
        movie.poster_url = data.get("poster_url", movie.poster_url)
        movie.trailer_url = data.get("trailer_url", movie.trailer_url)
        movie.country = data.get("country", movie.country)
        movie.box_office = data.get("box_office", movie.box_office)
        movie.awards = json.dumps(data.get("awards", json.loads(movie.awards) if movie.awards else []))
        movie.duration = data.get("duration", movie.duration)
        movie.age_rating = data.get("age_rating", movie.age_rating)

        db.session.commit()
        return jsonify({"message": "Filma veiksmīgi atjaunināta!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/delete-movie/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    try:
        # ✅ Проверяем, что это админ
        user_role = request.headers.get("User-Role")
        if user_role != "admin":
            return jsonify({"error": "Tikai administratoriem ir tiesības dzēst filmas!"}), 403

        # ✅ Проверяем, существует ли фильм
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Filma nav atrasta"}), 404

        # ✅ Удаляем фильм
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
        death_date = data.get('death_date')  # Новое поле

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
                "death_date": str(actor.death_date) if actor.death_date else None  # Добавляем дату смерти
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

@bp.route('/remove-actor-from-movie', methods=['DELETE'])
def remove_actor_from_movie():
    try:
        data = request.get_json()
        movie_id = data.get('movie_id')
        actor_id = data.get('actor_id')

        if not movie_id or not actor_id:
            return jsonify({"error": "Нужно передать 'movie_id' и 'actor_id'"}), 400

        movie = Movie.query.get(movie_id)
        actor = Actor.query.get(actor_id)

        if not movie or not actor:
            return jsonify({"error": "Фильм или актёр не найдены"}), 404

        # Удаляем связь между фильмом и актёром
        if actor in movie.actors:
            movie.actors.remove(actor)
            db.session.commit()
            return jsonify({"message": f"Актёр {actor.name} удалён из фильма {movie.title}"}), 200
        else:
            return jsonify({"error": "Актёр не был привязан к этому фильму"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Добавить режиссёра
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


# Добавить сценариста
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


# Добавить режиссёра к фильму
@bp.route('/add-director-to-movie', methods=['POST'])
def add_director_to_movie():
    data = request.get_json()
    new_entry = MovieDirectors(movie_id=data['movie_id'], director_id=data['director_id'])
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Режиссёр добавлен к фильму"}), 201

# Добавить сценариста к фильму
@bp.route('/add-writer-to-movie', methods=['POST'])
def add_writer_to_movie():
    data = request.get_json()
    new_entry = MovieWriters(movie_id=data['movie_id'], writer_id=data['writer_id'])
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Сценарист добавлен к фильму"}), 201

# Получить режиссёров фильма
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

# Получить сценаристов фильма
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
@moderator_required  # Только модератор или админ могут удалять отзывы
def delete_review(review_id):
    try:
        review = Review.query.get(review_id)
        if not review:
            return jsonify({"error": "Отзыв не найден"}), 404

        db.session.delete(review)
        db.session.commit()
        return jsonify({"message": "Отзыв успешно удалён"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/add-to-favorites", methods=["POST"])
@jwt_required()
def add_to_favorites():
    user_id = get_jwt_identity()
    data = request.get_json()
    movie_id = data.get("movie_id")

    movie = Movie.query.get(movie_id)
    if not movie:
        return jsonify({"error": "Фильм не найден"}), 404

    existing_favorite = FavoriteMovie.query.filter_by(user_id=user_id, movie_id=movie_id).first()
    if existing_favorite:
        return jsonify({"message": "Фильм уже в избранном"}), 400

    new_favorite = FavoriteMovie(user_id=user_id, movie_id=movie_id)
    db.session.add(new_favorite)
    db.session.commit()

    return jsonify({"message": "Фильм добавлен в избранное"}), 201

@bp.route('/favorites', methods=['GET'])
@jwt_required()
def get_favorites():
    """Получаем список избранных фильмов текущего пользователя"""
    user_id = get_jwt_identity()
    favorites = (
        db.session.query(Movie)
        .join(FavoriteMovie, Movie.id == FavoriteMovie.movie_id)
        .filter(FavoriteMovie.user_id == user_id)
        .all()
    )

    return jsonify({"favorites": [
    {"id": movie.id, "title": movie.title, "year": movie.release_date.year if movie.release_date else None}
    for movie in favorites
]}), 200

@bp.route('/get-movie/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):  # ❌ Убираем @jwt_required(), чтобы не требовалась авторизация
    try:
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Фильм не найден"}), 404

        # Получаем актёров
        actors = [{"id": actor.id, "name": actor.name} for actor in movie.actors]

        # Получаем режиссёров
        directors = db.session.query(Director).join(MovieDirectors).filter(MovieDirectors.movie_id == movie_id).all()
        director_list = [{"id": director.id, "name": director.name} for director in directors]

        # Получаем сценаристов
        writers = db.session.query(Writer).join(MovieWriters).filter(MovieWriters.movie_id == movie_id).all()
        writer_list = [{"id": writer.id, "name": writer.name} for writer in writers]

        # Получаем отзывы
        reviews = Review.query.filter_by(movie_id=movie_id).all()
        review_list = [
            {
                "id": review.id,
                "user": review.user.username,
                "text": review.text,
                "rating": review.rating,
                "created_at": review.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for review in reviews
        ]

        # Пересчитываем средний рейтинг
        average_rating = sum([r.rating for r in reviews]) / len(reviews) if reviews else 0

        # ✅ Добавлены новые поля
        return jsonify({
            "id": movie.id,
            "title": movie.title,
            "description": movie.description,
            "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None,
            "genres": movie.genres.split(", ") if movie.genres else [],
            "poster_url": movie.poster_url,  # ✅ Уже было
            "trailer_url": movie.trailer_url,  # ✅ Уже было
            "average_rating": round(average_rating, 1),
            "reviews": review_list,
            "actors": actors,
            "directors": director_list,
            "writers": writer_list,
            "country": movie.country, 
            "box_office": movie.box_office,  # 💰 Кассовые сборы
            "awards": json.loads(movie.awards) if movie.awards else [],  # 🏆 Список наград (JSON)
            "duration": movie.duration,  # ⏳ Длительность
            "age_rating": movie.age_rating,  # 🔞 Возрастное ограничение
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route("/remove-from-favorites", methods=["DELETE"])
@jwt_required()
def remove_from_favorites():
    user_id = get_jwt_identity()
    data = request.get_json()
    movie_id = data.get("movie_id")

    favorite = FavoriteMovie.query.filter_by(user_id=user_id, movie_id=movie_id).first()
    if not favorite:
        return jsonify({"message": "Фильм не найден в избранном"}), 400

    db.session.delete(favorite)
    db.session.commit()

    return jsonify({"message": "Фильм удалён из избранного"}), 200

@bp.route('/clean-duplicate-reviews', methods=['DELETE']) #Этот кусок кода не настолько важный, но он удаляет дубликаты, если они вдруг во время разработки появились
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
