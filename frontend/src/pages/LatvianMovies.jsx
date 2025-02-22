import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/LatvianMovies.css";

const LatvianMovies = () => {
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [genre, setGenre] = useState("");
    const [genres, setGenres] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLatvianMovies();
        fetchGenres();
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    const fetchLatvianMovies = (query = "") => {
        let url = `http://127.0.0.1:5000/get-latvian-movies?${query}`;
        console.log("API Request URL:", url);  // 👈 Выведет запрос в консоль
        
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                console.log("Полученные данные:", data);  // 👈 Логируем ответ сервера
                setMovies(data.movies || []);
            })
            .catch((error) => console.error("Kļūda latviešu filmu ielādē:", error));
    };    
    
    const [sortBy, setSortBy] = useState("");

    const handleSearch = () => {
        let queryParams = [];
        if (searchTerm) queryParams.push(`title=${searchTerm}`);
        if (genre) queryParams.push(`genre=${genre}`);
        if (sortBy) queryParams.push(`sort_by=${sortBy}`);
    
        let query = queryParams.join("&");  // Объединяем параметры через `&`
        
        fetchLatvianMovies(query);
    };    

    const fetchGenres = () => {
        fetch("http://127.0.0.1:5000/get-latvian-movies")
            .then((response) => response.json())
            .then((data) => {
                const allGenres = new Set();
                data.movies.forEach(movie => {
                    if (movie.genres && movie.genres.length > 0) {  
                        movie.genres.forEach(genre => allGenres.add(genre));
                    }
                });
                setGenres([...allGenres]);
            })
            .catch((error) => console.error("Kļūda žanru ielādē:", error));
    };      

    const resetFilters = () => {
        setSearchTerm("");
        setGenre("");
        fetchLatvianMovies();
    };

    return (
        <div className="latvian-movies-container">
            <div className="latvian-header">
                <h2>Latviešu Filmas</h2>
                <button className="back-to-main" onClick={() => navigate("/catalog")}>Atpakaļ uz katalogu</button>
            </div>

            <div className="latvian-search-container">
    <input
        type="text"
        placeholder="Meklēt latviešu filmu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
    />
    <select value={genre} onChange={(e) => setGenre(e.target.value)}>
        <option value="">Visi žanri</option>
        {genres.map((g, index) => (
            <option key={index} value={g}>{g}</option>
        ))}
    </select>
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
    <option value="title">Nosaukums</option>
    <option value="release_date">Izdošanas datums</option>
</select>
    <button className="latvian-search-btn" onClick={handleSearch}>Meklēt</button>
    <button className="latvian-reset-btn" onClick={resetFilters}>Atiestatīt</button>
</div>

            <div className="latvian-movie-grid">
                {movies.map((movie) => (
                    <div key={movie.id} className="latvian-movie-card">
                        <img src={movie.poster_url} alt={movie.title} className="latvian-movie-image" />
                        <Link to={`/movie/${movie.id}`} className="latvian-movie-title">{movie.title}</Link>
                        <p className="latvian-movie-description">{movie.description}</p>
                        <p className="latvian-movie-details"><strong>Izdošanas datums:</strong> {movie.release_date}</p>
                        <p className="latvian-movie-details"><strong>Žanri:</strong> {movie.genres.join(", ")}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LatvianMovies;
