document.addEventListener("DOMContentLoaded", function () {
    const wishlistContainer = document.querySelector('.wishlist-container');
    const noItemsMessage = document.querySelector('.no-items-message');

    // Получаем список желаемых фильмов из localStorage
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    // Функция для отображения фильмов
    function renderWishlist() {
        wishlistContainer.innerHTML = ''; // Очищаем контейнер

        if (wishlist.length === 0) {
            // Если нет фильмов, показываем сообщение
            noItemsMessage.style.display = 'block';
        } else {
            // Скрываем сообщение о пустом списке
            noItemsMessage.style.display = 'none';

            wishlist.forEach(movie => {
                const movieItem = document.createElement('div');
                movieItem.classList.add('movie-item');

                movieItem.innerHTML = `
                    <img src="${movie.poster}" alt="${movie.title} Poster">
                    <h3>${movie.title}</h3>
                    <p><strong>Год:</strong> ${movie.year}</p>
                    <p><strong>Жанр:</strong> ${movie.genre}</p>
                    <p><strong>Страна:</strong> ${movie.country}</p>
                `;

                wishlistContainer.appendChild(movieItem);
            });
        }
    }

    // Рендерим список желаемых фильмов при загрузке страницы
    renderWishlist();
});
