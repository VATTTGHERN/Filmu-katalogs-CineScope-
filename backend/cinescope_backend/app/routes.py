from flask import Blueprint, jsonify, request  # Добавлен импорт request для работы с данными из запроса
from app import db
from app.models import User, Movie, Review, Actor # Импортируем модель Review для работы с таблицей отзывов

bp = Blueprint('routes', __name__)

@bp.route('/')
def home():
    return "Hello, CineScope!"

@bp.route('/init-db')
def init_db():
    try:
        db.create_all()  # Создание таблиц в базе данных
        return jsonify({"message": "Таблицы успешно созданы!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/check-tables', methods=['GET'])
def check_tables():
    try:
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        return {"message": f"Найденные таблицы: {tables}"}
    except Exception as e:
        return {"message": f"Ошибка: {str(e)}"}, 500

@bp.route('/force-init-db', methods=['GET'])
def force_init_db():
    try:
        from app.models import User, Movie, Review  # Убедимся, что модели импортированы
        db.create_all()  # Принудительное создание таблиц
        current_db = db.engine.url.database  # Получим текущую базу данных
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()  # Проверим созданные таблицы
        return {
            "message": "Таблицы успешно созданы вручную!",
            "database": current_db,
            "created_tables": tables
        }, 200
    except Exception as e:
        return {"message": f"Ошибка: {str(e)}"}, 500

@bp.route('/add-user', methods=['POST'])
def add_user():
    try:
        # Получаем данные из запроса
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        # Проверка обязательных полей
        if not username or not email or not password:
            return jsonify({"error": "Все поля (username, email, password) обязательны"}), 400

        # Создаем нового пользователя
        new_user = User(username=username, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Пользователь успешно добавлен", "user_id": new_user.id}), 201
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

@bp.route('/add-movie', methods=['POST'])
def add_movie():
    from datetime import datetime
    try:
        # Получаем данные из запроса
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        release_date = data.get('release_date')  # Ожидается в формате YYYY-MM-DD

        # Проверка обязательных полей
        if not title:
            return jsonify({"error": "Поле 'title' обязательно"}), 400

        # Конвертация даты (если указана)
        release_date_obj = None
        if release_date:
            try:
                release_date_obj = datetime.strptime(release_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

        # Создаем новый фильм
        new_movie = Movie(title=title, description=description, release_date=release_date_obj)
        db.session.add(new_movie)
        db.session.commit()

        return jsonify({"message": "Фильм успешно добавлен", "movie_id": new_movie.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-movies', methods=['GET'])
def get_movies():
    try:
        # Получаем все фильмы из базы данных
        movies = Movie.query.all()
        # Преобразуем объекты фильмов в список словарей
        movie_list = [
            {
                "id": movie.id,
                "title": movie.title,
                "description": movie.description,
                "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None
            }
            for movie in movies
        ]
        return jsonify({"movies": movie_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/search-movies', methods=['GET'])
def search_movies():
    try:
        # Получаем параметры из запроса
        title = request.args.get('title')
        release_date_after = request.args.get('release_date_after')

        # Начинаем формировать запрос к базе данных
        query = Movie.query

        if title:
            query = query.filter(Movie.title.ilike(f"%{title}%"))  # Фильтрация по названию

        if release_date_after:
            try:
                from datetime import datetime
                date_obj = datetime.strptime(release_date_after, '%Y-%m-%d').date()
                query = query.filter(Movie.release_date > date_obj)  # Фильтрация по дате
            except ValueError:
                return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

        # Выполняем запрос
        movies = query.all()

        # Преобразуем результат в JSON
        movie_list = [
            {
                "id": movie.id,
                "title": movie.title,
                "description": movie.description,
                "release_date": movie.release_date.strftime('%Y-%m-%d') if movie.release_date else None
            }
            for movie in movies
        ]

        return jsonify({"movies": movie_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/add-review', methods=['POST'])
def add_review():
    try:
        data = request.get_json()
        movie_id = data.get('movie_id')
        text = data.get('text')
        rating = data.get('rating')

        # Проверка обязательных полей
        if not movie_id or not text or not rating:
            return jsonify({"error": "Все поля (movie_id, text, rating) обязательны"}), 400

        # Проверка допустимого значения рейтинга
        if not (1 <= rating <= 5):
            return jsonify({"error": "Рейтинг должен быть от 1 до 5"}), 400

        # Проверяем, существует ли фильм
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Фильм с таким ID не найден"}), 404

        # Создаем новый отзыв
        new_review = Review(movie_id=movie_id, text=text, rating=rating)
        db.session.add(new_review)
        db.session.commit()

        return jsonify({"message": "Отзыв успешно добавлен", "review_id": new_review.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/get-reviews/<int:movie_id>', methods=['GET'])
def get_reviews(movie_id):
    try:
        # Проверяем, существует ли фильм
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Фильм с таким ID не найден"}), 404

        # Получаем отзывы для фильма
        reviews = Review.query.filter_by(movie_id=movie_id).all()
        review_list = [
            {
                "id": review.id,
                "text": review.text,
                "rating": review.rating,
                "created_at": review.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for review in reviews
        ]
        return jsonify({"movie_id": movie_id, "reviews": review_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/update-movie/<int:movie_id>', methods=['PUT'])
def update_movie(movie_id):
    try:
        # Проверка роли пользователя (в реальной системе здесь будет токен или другой механизм авторизации)
        user_id = request.headers.get('User-ID')  # Получаем ID пользователя из заголовка
        user = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Доступ запрещён. Только администраторы могут обновлять фильмы."}), 403

        # Получаем данные из запроса
        data = request.get_json()
        title = data.get('title')
        description = data.get('description')
        release_date = data.get('release_date')

        # Ищем фильм в базе данных
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Фильм с таким ID не найден"}), 404

        # Обновляем данные фильма
        if title:
            movie.title = title
        if description:
            movie.description = description
        if release_date:
            try:
                from datetime import datetime
                movie.release_date = datetime.strptime(release_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

        db.session.commit()
        return jsonify({"message": "Информация о фильме обновлена!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@bp.route('/delete-movie/<int:movie_id>', methods=['DELETE'])
def delete_movie(movie_id):
    try:
        # Получаем ID пользователя (например, из заголовка запроса)
        user_id = request.headers.get('User-ID')
        user = User.query.get(user_id)

        # Проверяем, является ли пользователь администратором
        if not user or user.role != "admin":
            return jsonify({"error": "Доступ запрещён. Только администраторы могут удалять фильмы."}), 403

        # Ищем фильм в базе данных
        movie = Movie.query.get(movie_id)
        if not movie:
            return jsonify({"error": "Фильм с таким ID не найден"}), 404

        # Удаляем сначала все отзывы, связанные с этим фильмом
        Review.query.filter_by(movie_id=movie.id).delete()

        # Теперь удаляем сам фильм
        db.session.delete(movie)
        db.session.commit()

        return jsonify({"message": f"Фильм '{movie.title}' и все его отзывы успешно удалены"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/add-actor', methods=['POST'])
def add_actor():
    try:
        data = request.get_json()
        name = data.get('name')
        bio = data.get('bio')
        birth_date = data.get('birth_date')

        if not name:
            return jsonify({"error": "Поле 'name' обязательно"}), 400

        birth_date_obj = None
        if birth_date:
            try:
                from datetime import datetime
                birth_date_obj = datetime.strptime(birth_date, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

        new_actor = Actor(name=name, bio=bio, birth_date=birth_date_obj)
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
        actor_list = [{"id": actor.id, "name": actor.name, "bio": actor.bio, "birth_date": str(actor.birth_date)} for actor in actors]

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
