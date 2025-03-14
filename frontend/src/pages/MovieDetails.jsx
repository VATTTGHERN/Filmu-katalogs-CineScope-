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
    const [isFavorite, setIsFavorite] = useState(false); // 🔥 Статус избранного
    const currentUser = localStorage.getItem("user_email"); // Получаем email текущего пользователя


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
                    checkIfFavorite(); // 🔥 Проверяем, есть ли фильм в избранном
                } else if (data.title) {
                    setMovie(data);
                    checkIfFavorite(); // 🔥 Проверяем, если фильм найден
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
    
    // ✅ Функция для проверки, добавлен ли фильм в избранное
    const checkIfFavorite = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/favorites", {
                headers: { "User-Email": localStorage.getItem("email") } // 🔥 Передаем email пользователя
            });
    
            const data = await response.json();
            if (data.favorites) {
                setIsFavorite(data.favorites.some(fav => fav.id === parseInt(id)));
            }
        } catch (error) {
            console.error("Kļūda, pārbaudot favorītus!");
        }
    };

    const handleAddToFavorites = async () => {
        if (!isLoggedIn) {
            alert("Jums jāpiesakās, lai pievienotu filmu!");
            return;
        }
    
        const response = await fetch("http://127.0.0.1:5000/add-to-favorites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Email": localStorage.getItem("email") // ✅ Передаем email
            },
            body: JSON.stringify({ movie_id: id })
        });
        
        const data = await response.json();
        if (response.ok) {
            setIsFavorite(true);
            alert("Filma pievienota vēlmju sarakstam!");
        } else {
            alert(data.error || "Kļūda, pievienojot filmu!");
        }
    };

    const handleRemoveFromFavorites = async () => {
        const response = await fetch("http://127.0.0.1:5000/remove-from-favorites", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ movie_id: id })
        });
    
        const data = await response.json();
        if (response.ok) {
            setIsFavorite(false);
            alert("Filma veiksmīgi izņemta no favorītiem!");
        } else {
            alert(data.error || "Kļūda, izņemot filmu!");
        }
    };
    

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
    
        const userEmail = localStorage.getItem("email");
        if (!userEmail) {
            alert("Neizdevās pievienot atsauksmi: Nepieciešama autorizācija!");
            return;
        }
    
        if (!rating && !reviewText.trim()) {
            alert("Jābūt vismaz vērtējumam vai tekstam!");
            return;
        }
    
        const reviewData = {
            movie_id: parseInt(id),
            rating: rating || null,
            text: reviewText.trim() || null
        };
    
        try {
            const response = await fetch("http://127.0.0.1:5000/add-review", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Email": userEmail
                },
                body: JSON.stringify(reviewData)
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Nezināma kļūda");
    
            // ✅ Обновляем отзывы и средний рейтинг на странице
            setReviews([...reviews, { id: data.review.id, user: data.review.user, rating: data.review.rating, text: data.review.text }]);
            setMovie(prevMovie => ({ ...prevMovie, average_rating: data.average_rating }));
    
            // ✅ Очищаем поля формы
            setRating(0);
            setReviewText("");
        } catch (err) {
            alert("Kļūda, pievienojot atsauksmi: " + err.message);
        }
    };
    
    const handleDelete = async (movieId) => {
        const confirmDelete = window.confirm("Vai tiešām vēlaties dzēst šo filmu?");
        if (!confirmDelete) return;
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/delete-movie/${movieId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "User-Role": localStorage.getItem("role"), // ✅ Передаем роль пользователя
                },
            });
    
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                navigate("/catalog");
            } else {
                alert(`Kļūda: ${data.error}`);
            }
        } catch (err) {
            alert("Neizdevās dzēst filmu!");
        }
    };

    const handleEditReview = async (reviewId, currentText, currentRating) => {
        const newText = prompt("Ievadiet jaunu atsauksmi:", currentText);
        if (newText === null) return;
    
        const newRating = Number(prompt("Ievadiet jaunu vērtējumu (1-5):", currentRating));
        if (isNaN(newRating) || newRating < 1 || newRating > 5) {
            alert("Vērtējumam jābūt no 1 līdz 5!");
            return;
        }
    
        const userEmail = localStorage.getItem("email");
        
        const updatedReview = {
            text: newText.trim() || null,
            rating: newRating || null
        };
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/edit-review/${reviewId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "User-Email": userEmail
                },
                body: JSON.stringify(updatedReview)
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Nezināma kļūda");
    
            setReviews(reviews.map(r => r.id === reviewId ? { ...r, text: data.review.text, rating: data.review.rating } : r));
            alert("Atsauksme veiksmīgi rediģēta!");
        } catch (err) {
            alert("Kļūda, rediģējot atsauksmi: " + err.message);
        }
    };
    
    const handleDeleteReview = async (reviewId) => {
        const confirmDelete = window.confirm("Vai tiešām vēlaties dzēst šo atsauksmi?");
        if (!confirmDelete) return;
    
        const userEmail = localStorage.getItem("email");
    
        try {
            const response = await fetch(`http://127.0.0.1:5000/delete-review/${reviewId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "User-Email": userEmail
                }
            });
    
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Nezināma kļūda");
    
            setReviews(reviews.filter(r => r.id !== reviewId));
            alert("Atsauksme veiksmīgi dzēsta!");
        } catch (err) {
            alert("Kļūda, dzēšot atsauksmi: " + err.message);
        }
    };
    
    return (
        <div className="movie-details-container">
            {/* Верхняя навигация */}
            <div className="top-navigation">
                <button className="back-button" onClick={() => navigate("/catalog")}>
                    Atgriezties katalogā
                </button>
    
                {/* Если админ, показываем кнопку "Редактировать фильм" */}

{localStorage.getItem("role") === "admin" && movie && (
    <>
        <button className="edit-movie-btn" onClick={() => navigate(`/edit-movie/${movie.id}`)}>
            Rediģēt filmu
        </button>
        <button className="delete-movie-btn" onClick={() => handleDelete(movie.id)}>
            Dzēst filmu
        </button>
    </>
)}

                <div className="auth-buttons">
                    {/* Если НЕ вошел в аккаунт */}
                    {!localStorage.getItem("token") ? (
                        <>
                            <button className="auth-button login-button" onClick={() => navigate("/login")}>
                                Ienākt
                            </button>
                            <button className="auth-button register-button" onClick={() => navigate("/register")}>
                                Reģistrēties
                            </button>
                        </>
                    ) : (
                        /* Если вошел в аккаунт */
                        <button className="logout-button" onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("role");
                            navigate("/catalog");
                        }}>
                            Izrakstīties
                        </button>
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

{isLoggedIn && (
    <button 
        className="favorite-button" 
        onClick={isFavorite ? null : handleAddToFavorites} 
        disabled={isFavorite}
    >
        {isFavorite ? "Jau pievienots favoritu sarakstam" : "Pievienot favoritu sarakstam"}
    </button>
)}

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

    {movie.reviews?.length > 0 ? (
        movie.reviews.map((review) => (
            <li key={review.id}>
                <strong>{review.user}</strong> (Vērtējums: {review.rating}/5) <br />
                <small>
                    Izveidots: {new Date(review.created_at).toLocaleString("lv-LV", { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit' 
                    })}
                </small>
                <p>{review.text}</p>

                {/* Кнопки "Редактировать" и "Удалить" отображаются только у автора отзыва */}
                {isLoggedIn && localStorage.getItem("email") === review.user && (
    <div className="review-actions">
        <button className="edit-btn" onClick={() => handleEditReview(review.id, review.text, review.rating)}>
            Rediģēt
        </button>
        <button className="delete-btn" onClick={() => handleDeleteReview(review.id)}>
            Dzēst
        </button>
    </div>
)}
            </li>
        ))
    ) : (
        <p>Nav atsauksmju</p>
    )}
</ul>

            {/* Footer */}
            <footer className="footer">
                <p>Autori: Maksims Goldmann, Timofejs Kravčuks, P2-4</p>
                <p>Filmu katalogs "CineScope"</p>
            </footer>
        </div>
    );
};

export default MovieDetails;
