import React, { useEffect, useState } from "react";

const MovieCatalog = () => {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        fetch("http://127.0.0.1:5000/get-movies") // Запрос к backend
            .then((response) => response.json())
            .then((data) => {
                if (data.movies) {
                    setMovies(data.movies);
                }
            })
            .catch((error) => console.error("Ошибка загрузки фильмов:", error));
    }, []);

    return (
        <div>
            <h1>Каталог фильмов</h1>
            <ul>
                {movies.map((movie) => (
                    <li key={movie.id}>
                        <h2>{movie.title}</h2>
                        <p>{movie.description}</p>
                        <p><strong>Дата выхода:</strong> {movie.release_date || "Неизвестно"}</p>
                        <p><strong>Жанры:</strong> {movie.genres.join(", ") || "Не указано"}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MovieCatalog;
