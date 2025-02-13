document.addEventListener("DOMContentLoaded", function () {
    const movieData = JSON.parse(localStorage.getItem("selectedMovie"));

    if (movieData) {
        // Динамически подставляем данные фильма
        document.getElementById("movie-title").textContent = movieData.title;
        document.getElementById("movie-year").textContent = movieData.year;
        document.getElementById("movie-country").textContent = movieData.country;
        document.getElementById("movie-genre").textContent = movieData.genre;
        document.getElementById("movie-description").textContent = movieData.description;
        document.getElementById("movie-poster").src = movieData.poster;
        
        // Сохраняем ID фильма для использования в запросах
        const movieId = movieData.id;  // Предположим, что у тебя есть уникальный ID для каждого фильма
        initializeRating(movieId);  // Инициализация системы оценки
        loadTrailer(movieId);  // Загружаем трейлер
        loadReviews(movieId); // Загружаем отзывы
    }
});

// Функция для загрузки трейлера
function loadTrailer(movieId) {
    const movieTrailerId = 'abc123';  // Здесь должен быть реальный ID трейлера
    const trailerElement = document.getElementById('movie-trailer');
    trailerElement.src = `https://www.youtube.com/embed/${movieTrailerId}`;
}

// Инициализация системы оценки
let currentRating = 0;

function updateStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        const value = parseInt(star.getAttribute('data-value'));
        if (value <= rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });

    // Обновляем текст с рейтингом
    document.getElementById('rating-value').textContent = `${rating} из 5`;
}

function initializeRating(movieId) {
    const userId = localStorage.getItem('user_id'); // Предположим, что user_id сохраняется в localStorage после входа
    
    // Получаем средний рейтинг фильма с бэкенда
    fetch(`/api/movies/${movieId}/rating`)
        .then(response => response.json())
        .then(data => {
            const averageRating = data.average_rating || 0;
            document.getElementById('rating-value').textContent = `${averageRating.toFixed(1)} из 5`;
            updateStars(averageRating); // Обновляем звезды на основе средней оценки
        });

    // Обработчик кликов по звездами
    document.getElementById('rating-stars').addEventListener('click', (event) => {
        if (event.target.classList.contains('star')) {
            const value = parseInt(event.target.getAttribute('data-value'));

            // Если пользователь снова кликает на ту же звезду, сбрасываем рейтинг
            if (value === currentRating) {
                currentRating = 0;
            } else {
                currentRating = value;
            }

            // Обновляем отображение звезд
            updateStars(currentRating);

            // Отправляем новый рейтинг на сервер
            fetch(`/api/movies/${movieId}/rating`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,  // Используем реальный ID пользователя
                    rating: currentRating
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
            });
        }
    });
}

// Функция для загрузки отзывов
function loadReviews(movieId) {
    const reviewsList = document.getElementById("reviews-list");
    reviewsList.innerHTML = ""; // Очищаем текущие отзывы

    // Получаем список отзывов для фильма
    const reviews = JSON.parse(localStorage.getItem("movie-reviews")) || [];
    reviews.forEach(function (review) {
        const reviewElement = document.createElement("div");
        reviewElement.classList.add("review-item");
        reviewElement.innerHTML = `
            <p class="review-author">${review.user}</p>
            <p>${review.text}</p>
        `;
        reviewsList.appendChild(reviewElement);
    });
}

// Логика для отзыва
document.getElementById("review-text").addEventListener("input", function () {
    const remainingCharacters = 500 - this.value.length;
    document.getElementById("remaining-characters").textContent = `Осталось ${remainingCharacters} символов`;
});

// Отправка отзыва
document.getElementById("submit-review").addEventListener("click", function () {
    const reviewText = document.getElementById("review-text").value;

    if (reviewText.trim() === "") {
        alert("Отзыв не может быть пустым!");
        return;
    }

    if (reviewText.length > 500) {
        alert("Отзыв превышает 500 символов!");
        return;
    }

    // Сохраняем отзыв в localStorage
    let reviews = JSON.parse(localStorage.getItem("movie-reviews")) || [];
    reviews.push({ user: "Аноним", text: reviewText });
    localStorage.setItem("movie-reviews", JSON.stringify(reviews));

    // Очищаем поле ввода
    document.getElementById("review-text").value = "";

    // Перезагружаем список отзывов
    loadReviews(movieId);
});
