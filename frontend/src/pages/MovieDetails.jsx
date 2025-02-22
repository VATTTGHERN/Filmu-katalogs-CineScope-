import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Убедись, что useNavigate импортирован
import "../styles/MovieDetails.css";

const MovieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Добавили useNavigate
    const [movie, setMovie] = useState(null);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [rating, setRating] = useState(0); // Хранит оценку (1-5 звезд)
    const [reviewText, setReviewText] = useState(""); // Хранит текст отзыва
    const [reviews, setReviews] = useState([]); // Хранит список отзывов

    useEffect(() => {
        const backendUrl = "http://127.0.0.1:5000/";

        fetch(`${backendUrl}/get-movie/${id}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Kļūda: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("Filmas dati (pilns JSON):", JSON.stringify(data, null, 2));

                if (data.movie) {
                    setMovie(data.movie);
                    setReviews(data.movie.reviews || []);
                } else if (data.title) {
                    setMovie(data);
                } else {
                    setError("Filma nav atrasta");
                }
            })
            .catch((error) => {
                console.error("Filmas ielādes kļūda:", error);
                setError("Filmas ielādes kļūda");
            });

        // Проверяем, есть ли токен пользователя
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, [id]);

    if (error) {
        return <h2>{error}</h2>;
    }

    if (!movie) {
        return <h2>Ielādēšana...</h2>;
    }

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
    
        if (!isLoggedIn) {
            alert("Jums jāpiesakās, lai pievienotu atsauksmi!");
            return;
        }
    
        // Формируем данные отзыва
        const reviewData = {
            movie_id: id,
            rating,
            text: reviewText.trim() || null  // Если пустая строка, отправляем null
        };
    
        // 🔍 Вывод в консоль (F12 → Console) перед отправкой
        console.log("Отправляем данные:", JSON.stringify(reviewData, null, 2));
    
        try {
            const response = await fetch("http://127.0.0.1:5000/add-review", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(reviewData)
            });
    
            const data = await response.json();
    
            if (!response.ok) throw new Error(data.error || "Nezināma kļūda");
    
            // Добавляем новый отзыв в список без перезагрузки страницы
            setReviews([...reviews, { user: "Jūs", rating, text: reviewText }]);
            setRating(0); // Сбрасываем оценку
            setReviewText(""); // Очищаем поле ввода
        } catch (err) {
            alert("Kļūda, pievienojot atsauksmi: " + err.message);
        }
    };    

    return (
        <div className="movie-details-container">
            {/* Навигационные кнопки справа */}
            <div className="top-navigation">
                <button className="back-button" onClick={() => navigate("/catalog")}>Atgriezties katalogā</button>
                <div className="auth-buttons">
                    {!isLoggedIn ? (
                        <>
                            <button className="auth-button login-button" onClick={() => navigate("/login")}>Ienākt</button>
                            <button className="auth-button register-button" onClick={() => navigate("/register")}>Reģistrēties</button>
                        </>
                    ) : (
                        <button className="logout-button" onClick={() => {
                            localStorage.removeItem("token");
                            setIsLoggedIn(false);
                            navigate("/catalog");
                        }}>Izrakstīties</button>
                    )}
                </div>
            </div>

            <h1 className="movie-title">{movie.title}</h1>
            <img src={movie.poster_url || "https://via.placeholder.com/300"} alt={movie.title} className="movie-details-image"/>
            <p className="movie-description">{movie.description}</p>

            <p><strong>Izdošanas datums:</strong> {movie.release_date || "Nav zināms"}</p>
            <p><strong>Žanri:</strong> {Array.isArray(movie.genres) ? movie.genres.join(", ") : "Nav norādīts"}</p>
            <p><strong>Vidējais vērtējums:</strong> {movie.average_rating || "Nav vērtējumu"}</p>
            <p><strong>Kases ieņēmumi:</strong> {movie.box_office || "Nav datu"}</p>
            <p><strong>Valsts:</strong> {movie.country}</p>
            <p><strong>Filmas ilgums:</strong> {movie.duration ? `${movie.duration} minūtes` : "Nav norādīts"}</p>
            <p><strong>Vecuma ierobežojums:</strong> {movie.age_rating || "Nav norādīts"}</p>

<div className="movie-awards">
    <strong>Galvenās balvas:</strong>
    {movie.awards && movie.awards.length > 0 ? (
        <ul>
            {movie.awards.map((award, index) => (
                <li key={index}>{award}</li>
            ))}
        </ul>
    ) : (
        <p>Nav pieejams</p>
    )}
</div>


            <h3>Režisors:</h3>
            <p>{movie.directors?.map(d => d.name).join(", ") || "Nav norādīts"}</p>

            <h3>Scenāristi:</h3>
            <p>{movie.writers?.map(w => w.name).join(", ") || "Nav norādīts"}</p>

            {movie.actors && movie.actors.length > 0 && (
  <>
    <h3 className="actors-title">Galvenie aktieri:</h3>
    <ul className="actors-list">
      {movie.actors.map((actor) => (
        <li key={actor.id} className="actor-item">{actor.name}</li>
      ))}
    </ul>
  </>
)}


            <h3>Lietotāju atsauksmes:</h3>
            <ul className="reviews-list">
                {isLoggedIn && (
    <div className="review-form">
        <h3>Pievienot atsauksmi:</h3>
        <form onSubmit={handleReviewSubmit}>
            <label>Vērtējums:</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                <option value="0">Nav vērtējuma</option>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>

            <label>Atsauksmes teksts:</label>
            <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Ievadiet savu atsauksmi (nav obligāti)"
            />

            <button type="submit">Pievienot atsauksmi</button>
        </form>
    </div>
)}
                {movie.reviews?.length > 0 ? movie.reviews.map((review) => (
                    <li key={review.id}>
                        <strong>{review.user}</strong> (Vērtējums: {review.rating}/5)
                        <p>{review.text}</p>
                    </li>
                )) : <p>Nav atsauksmju</p>}
            </ul>

            {/* Трейлер */}
            {movie.trailer_url && (
                <div className="trailer-container">
                    <h3>Filmas treileris:</h3>
                    <iframe 
                        width="560" 
                        height="315" 
                        src={movie.trailer_url.replace("watch?v=", "embed/")} 
                        title="Filmas treileris" 
                        frameBorder="0" 
                        allowFullScreen
                    ></iframe>
                </div>
            )}

            {/* Footer */}
            <footer className="footer">
                <p>Autori: Maksims Goldmann, Timofejs Kravčuks, P2-4</p>
                <p>Filmu katalogs "CineScope"</p>
            </footer>
        </div>
    );
};

export default MovieDetails;
