import React, { useEffect, useState } from "react";

const MovieList = () => {
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        // Запрос к бэкенду (замени URL на свой реальный API)
        fetch("http://127.0.0.1:5000/movies")
            .then((response) => response.json())
            .then((data) => setMovies(data))
            .catch((error) => console.error("Ошибка загрузки фильмов:", error));
    }, []);

    return (
        <div>
            <h2>Каталог фильмов</h2>
            <ul>
                {movies.map((movie) => (
                    <li key={movie.id}>
                        <strong>{movie.title}</strong> ({movie.release_date})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MovieList;
