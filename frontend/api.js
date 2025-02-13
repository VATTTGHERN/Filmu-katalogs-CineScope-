// api.js

const API_URL = "http://localhost:5000"; // Это твой локальный сервер, в продакшене будет другая ссылка

// Функция для регистрации пользователя
export async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });
        return response.json();
    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        return { error: "Ошибка при регистрации" };
    }
}

// Функция для авторизации пользователя
export async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });
        return response.json();
    } catch (error) {
        console.error("Ошибка при авторизации:", error);
        return { error: "Ошибка при авторизации" };
    }
}
