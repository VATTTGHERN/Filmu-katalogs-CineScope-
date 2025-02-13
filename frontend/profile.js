document.addEventListener("DOMContentLoaded", function () {
    // Пример: получаем данные пользователя из localStorage (или с бэкенда)
    const userData = JSON.parse(localStorage.getItem('userData')); // Или получаем через API

    if (userData) {
        document.getElementById('username').textContent = userData.username;
        document.getElementById('email').textContent = userData.email;
    }

    // Обработчик кнопки "Выйти из аккаунта"
    document.getElementById('logout-btn').addEventListener('click', function () {
        // Очистка данных о пользователе из localStorage
        localStorage.removeItem('userData');
        window.location.href = 'login.html'; // Перенаправление на страницу логина
    });

    // Обработчик кнопки "На главную"
    document.getElementById('home-btn').addEventListener('click', function () {
        window.location.href = 'index.html'; // Перенаправление на главную страницу
    });
});
