import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FavoriteMovies.css";

const FavoriteMovies = () => {
    const [favorites, setFavorites] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("http://127.0.0.1:5000/favorites")
            .then((response) => response.json())
            .then((data) => setFavorites(data.favorites || []))
            .catch(() => alert("Kļūda, ielādējot favorītus!"));
    }, []);

    const handleRemoveFromFavorites = async (movieId) => {
        const response = await fetch("http://127.0.0.1:5000/remove-from-favorites", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ movie_id: movieId })
        });

        const data = await response.json();
        if (response.ok) {
            setFavorites(favorites.filter(movie => movie.id !== movieId));
            alert("Filma veiksmīgi izņemta no favorītiem!");
        } else {
            alert(data.error || "Kļūda, izņemot filmu!");
        }
    };

    return (
        <div className="favorites-container">
            <h2>Mans vēlmju saraksts</h2>
            <button className="back-button" onClick={() => navigate("/catalog")}>Atpakaļ uz katalogu</button>
            <div className="movie-grid">
                {favorites.map((movie) => (
                    <div key={movie.id} className="movie-card">
                        <img src={movie.poster_url} alt={movie.title} className="movie-image" />
                        <h3>{movie.title}</h3>
                        <button className="remove-button" onClick={() => handleRemoveFromFavorites(movie.id)}>
                            Noņemt no favorītiem
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FavoriteMovies;
