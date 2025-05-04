import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/MovieCatalog.css"; // Используем те же стили, что и для каталога

const FavoriteMovies = () => {
    const [favorites, setFavorites] = useState([]);
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // "success" или "error"


    useEffect(() => {
        fetch("http://127.0.0.1:5000/favorites", {
            headers: { "User-Email": localStorage.getItem("email") }
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.favorites && Array.isArray(data.favorites)) { 
                setFavorites(data.favorites);
            } else {
                setFavorites([]);
            }
        })
        .catch(() => {
            alert("Kļūda, ielādējot favorītus!");
            setFavorites([]);
        });
    }, []);

    const handleRemoveFromFavorites = async (movieId) => {
        const response = await fetch("http://127.0.0.1:5000/remove-from-favorites", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "User-Email": localStorage.getItem("email")
            },
            body: JSON.stringify({ movie_id: movieId })
        });
    
        const data = await response.json();
        if (response.ok) {
            setFavorites(favorites.filter(movie => movie.id !== movieId));
            setMessage("Filma veiksmīgi izņemta no favorītiem!");
            setMessageType("success");
        } else {
            setMessage(data.error || "Kļūda, izņemot filmu!");
            setMessageType("error");
        }
    
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 4000);
    };

    return (
        <div className="catalog-container"> 
            <h2 className="catalog-title">Mans favorītu saraksts</h2>

            {message && (
    <div className={`global-message ${messageType}`}>
        {message}
    </div>
)}

            <button className="back-button" onClick={() => navigate("/catalog")}>
                Atpakaļ uz katalogu
            </button>

            {favorites.length === 0 ? (
                <p>Jums nav pievienotu favorītu filmu.</p>
            ) : (
                <div className="movie-grid">
                    {favorites.map((movie) => (
                        <div key={movie.id} className="movie-card">
                            <img src={movie.poster_url} alt={movie.title} className="movie-image" />
                            <Link to={`/movie/${movie.id}`} className="movie-title">{movie.title}</Link>
                            <p className="movie-description">{movie.description}</p>
                            <p className="movie-details"><strong>Izdošanas datums:</strong> {movie.release_date}</p>
                            <p className="movie-details"><strong>Žanri:</strong> {Array.isArray(movie.genres) ? movie.genres.join(", ") : "Nav norādīts"}</p>
                            <button className="remove-button" onClick={() => handleRemoveFromFavorites(movie.id)}>
                                Noņemt no favorītiem
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoriteMovies;
