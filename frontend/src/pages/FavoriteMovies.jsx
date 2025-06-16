import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/MovieCatalog.css"; //Izmantojam tos pašus stilus kā katalogam.

const FavoriteMovies = () => {
    const [favorites, setFavorites] = useState([]); // Lietotāja favorītfilmas
    const navigate = useNavigate();
    const [message, setMessage] = useState(""); // Ziņojums par darbību rezultātu
    const [messageType, setMessageType] = useState(""); // Ziņojuma tips: "success" vai "error"

    useEffect(() => {
        fetch("http://127.0.0.1:5000/favorites", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.favorites && Array.isArray(data.favorites)) {
                setFavorites(data.favorites); // Ielādējam favorītfilmas
            } else {
                setFavorites([]); // Ja nav atrastas
            }
        })
        .catch(() => {
            setMessage("Kļūda, ielādējot favorītus!");
            setMessageType("error");
        });
    }, []);

    const handleRemoveFromFavorites = async (movieId) => {
        // Pieprasījums, lai noņemtu filmu no favorītiem ar JWT autentifikāciju
        const response = await fetch("http://127.0.0.1:5000/remove-from-favorites", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ movie_id: movieId }) // Nosūtām filmas ID
        });

        const data = await response.json();

        if (response.ok) {
            // Atjauninām stāvokli, izņemot attiecīgo filmu no saraksta
            setFavorites(favorites.filter(movie => movie.id !== movieId));
            setMessage("Filma veiksmīgi izņemta no favorītiem!");
            setMessageType("success");
        } else {
            setMessage(data.error || "Kļūda, izņemot filmu!");
            setMessageType("error");
        }

        // Ziņojums pazūd pēc 4 sekundēm
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
