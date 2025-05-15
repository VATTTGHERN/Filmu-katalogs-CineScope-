import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/MovieCatalog.css";

const MovieCatalog = () => {
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [genre, setGenre] = useState("");
    const [genres, setGenres] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    
    useEffect(() => {
        fetchMovies();
        fetchGenres();

        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);

        const role = localStorage.getItem("role");
        setUserRole(role);
    }, []);
    
    const fetchMovies = (query = "") => {
        let url = "http://127.0.0.1:5000/get-movies";
        if (query) {
            url = `http://127.0.0.1:5000/search-movies?${query}`;
        }
        fetch(url)
            .then((response) => response.json())
            .then((data) => setMovies(data.movies || []))
            .catch((error) => console.error("Kļūda filmas ielādē:", error));
    };
    
    const fetchGenres = () => {
        fetch("http://127.0.0.1:5000/get-movies")
            .then((response) => response.json())
            .then((data) => {
                const allGenres = new Set();
                data.movies.forEach(movie => {
                    movie.genres.forEach(genre => allGenres.add(genre));
                });
                setGenres([...allGenres]);
            })
            .catch((error) => console.error("Kļūda žanru ielādē:", error));
    };
    
    const handleSearch = () => {
        let query = "";
        if (searchTerm) query += `title=${searchTerm}&`;
        if (genre) query += `genre=${genre}&`;
        fetchMovies(query);
    };
    
    const resetFilters = () => {
        setSearchTerm("");
        setGenre("");
        fetchMovies();
    };

    return (
        <div className="catalog-container">
    {/* 🔥 Новый Header с заголовком */}
    <h2 className="catalog-title">Filmu katalogs "CineScope"</h2>

    <div className="top-navigation">
        <button className="latvian-movies-btn" onClick={() => navigate("/latvian-movies")}>
            Latviešu filmas
        </button>
        {isLoggedIn && (
    <button className="favorite-list-button fixed-button" onClick={() => navigate("/favorites")}>
        Mans favorītu saraksts
    </button>
)}

{userRole === "moderator" && (
    <button className="moderator-button fixed-button" onClick={() => navigate("/moderator")}>
        Sūdzības
    </button>
)}

        {/* 🔥 Кнопки для администратора */}
        {localStorage.getItem("role") === "admin" && (
    <div className="admin-buttons">
        <button onClick={() => navigate("/add-movie")} className="admin-button fixed-button">Pievienot filmu</button>
        <button onClick={() => navigate("/manage-users")} className="admin-button fixed-button">Lietotāji</button>
    </div>
)}

        <div className="auth-buttons">
            {!isLoggedIn ? (
                <>
                    <button className="auth-button login-button" onClick={() => navigate("/login")}>Ienākt</button>
                    <button className="auth-button register-button" onClick={() => navigate("/register")}>Reģistrēties</button>
                </>
            ) : (
                <>
                    <button className="profile-button" onClick={() => navigate("/profile")}>Profils</button>
                    <button className="logout-button" onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("role"); // 🔥 Удаляем роль при выходе
                        setIsLoggedIn(false);
                        navigate("/catalog");
                    }}>Izrakstīties</button>
                </>
            )}
        </div>
    </div>

            <div className="search-filter-container">
                <input 
                    type="text" 
                    placeholder="Meklēt filmu..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">Visi žanri</option>
                    {genres.map((g, index) => (
                        <option key={index} value={g}>{g}</option>
                    ))}
                </select>
                <button className="search-btn" onClick={handleSearch}>Meklēt</button>
                <button className="reset-btn" onClick={resetFilters}>Atiestatīt</button>
            </div>

            <div className="movie-grid">
                {movies.map((movie) => (
                    <div key={movie.id} className="movie-card">
                        <img src={movie.poster_url} alt={movie.title} className="movie-image" />
                        <Link to={`/movie/${movie.id}`} className="movie-title">{movie.title}</Link>
                        <p className="movie-description">{movie.description}</p>
                        <p className="movie-details"><strong>Izdošanas datums:</strong> {movie.release_date}</p>
                        <p className="movie-details"><strong>Žanri:</strong> {movie.genres.join(", ")}</p>
                    </div>
                ))}
            </div>
            <footer className="footer">
                <p>Autori: Maksims Goldmann, Timofejs Kravčuks, P2-4</p>
                <p>Filmu katalogs "CineScope"</p>
            </footer>
        </div>
    );
};

export default MovieCatalog;
