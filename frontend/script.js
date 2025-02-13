document.addEventListener("DOMContentLoaded", function () {
    const languageButton = document.querySelector(".language-selector button");
    const languageDropdown = document.querySelector(".language-dropdown");
    const filterButton = document.querySelector(".filter-dropdown button");
    const filterDropdown = document.querySelector(".filter-options");

    // Показываем/скрываем меню языков
    languageButton.addEventListener("click", function () {
        languageDropdown.style.display = languageDropdown.style.display === "block" ? "none" : "block";
    });

    // Показываем/скрываем меню жанров
    filterButton.addEventListener("click", function () {
        filterDropdown.style.display = filterDropdown.style.display === "block" ? "none" : "block";
    });

    // Закрыть меню при клике вне кнопки
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".language-selector")) {
            languageDropdown.style.display = "none";
        }
        if (!e.target.closest(".filter-dropdown")) {
            filterDropdown.style.display = "none";
        }
    });

    // URL для связи с бэкэндом
    const apiUrl = 'https://854a-188-92-22-1.ngrok-free.app/get-movies';

    // Функция для загрузки фильмов с бэкэнда
    function loadMovies() {
        fetch(`${apiUrl}https://854a-188-92-22-1.ngrok-free.app/get-movies`)  // Запрос на получение списка фильмов
            .then(response => response.json())
            .then(data => {
                const moviesContainer = document.querySelector('.movies-container');
                if (data && data.length > 0) {
                    data.forEach(movie => {
                        const movieItem = document.createElement('div');
                        movieItem.classList.add('movie-item');
                        movieItem.dataset.title = movie.title;
                        movieItem.dataset.year = movie.year;
                        movieItem.dataset.country = movie.country;
                        movieItem.dataset.genre = movie.genre;
                        movieItem.dataset.description = movie.description;
                        movieItem.dataset.poster = movie.poster;
                        movieItem.innerHTML = `
                            <img src="${movie.poster}" alt="${movie.title}">
                            <h2>${movie.title}</h2>
                            <p>${movie.year} | ${movie.genre} | ${movie.country}</p>
                        `;
                        moviesContainer.appendChild(movieItem);
                    });
                } else {
                    moviesContainer.innerHTML = '<p>Фильмы не найдены</p>';
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке фильмов: ', error);
            });
    }

    // Загрузить фильмы при загрузке страницы
    loadMovies();

    // Логика для перехода на страницу фильма
    document.querySelectorAll(".movie-item").forEach(movie => {
        movie.addEventListener("click", function () {
            const movieData = {
                title: this.dataset.title,
                year: this.dataset.year,
                country: this.dataset.country,
                genre: this.dataset.genre,
                description: this.dataset.description,
                poster: this.dataset.poster
            };

            // Сохранение данных в localStorage
            localStorage.setItem("selectedMovie", JSON.stringify(movieData));

            // Переход на страницу фильма
            window.location.href = "movie.html";
        });
    });
});
