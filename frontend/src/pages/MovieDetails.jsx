import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Убедись, что useNavigate импортирован
import "../styles/MovieDetails.css";
import { useTranslation } from 'react-i18next';

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
    const [editingReview, setEditingReview] = useState(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(0);
    const [isComplaintOpen, setIsComplaintOpen] = useState(false); // Флаг отображения формы жалобы
    const [complaintSubject, setComplaintSubject] = useState(""); // Тема жалобы
    const [complaintText, setComplaintText] = useState(""); // Текст жалобы
    const [reviewError, setReviewError] = useState("");
    const [reviewSuccess, setReviewSuccess] = useState("");
    const [reviewMessage, setReviewMessage] = useState("");
    const [reviewMessageError, setReviewMessageError] = useState("");
    const [globalMessage, setGlobalMessage] = useState("");
    const [globalMessageType, setGlobalMessageType] = useState(""); // 'success' или 'error'
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const { t, i18n } = useTranslation();

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

    // ✅ Функция для обновления фильма и отзывов
const fetchMovie = async () => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/get-movie/${id}`);
        const data = await response.json();

        if (data.movie) {
            setMovie(data.movie);
            setReviews(data.movie.reviews || []);
        } else {
            setMovie(data);
            setReviews(data.reviews || []);
        }
    } catch (err) {
        console.error("Kļūda, ielādējot filmas datus:", err);
        setError("Filmas ielādes kļūda");
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
            setGlobalMessage("Filma pievienota vēlmju sarakstam!");
            setGlobalMessageType("success");
            setTimeout(() => setGlobalMessage(""), 4000);
        } else {
            setGlobalMessage(data.error || "Kļūda, pievienojot filmu!");
            setGlobalMessageType("error");
            setTimeout(() => setGlobalMessage(""), 4000);
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
    
        if (!isLoggedIn) return;
    
        const userEmail = localStorage.getItem("email");
        if (!userEmail) return;
    
        if (!rating && !reviewText.trim()) {
            setReviewError("Jābūt vismaz vērtējumam vai tekstam!");
            setTimeout(() => setReviewError(""), 4000);
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
    
            await fetchMovie(); // ✅ обновляем отзывы и рейтинг
            setRating(0);
            setReviewText("");
            setReviewSuccess(t("success"));
            setTimeout(() => setReviewSuccess(""), 4000);
        } catch (err) {
            setReviewMessageError("Kļūda, pievienojot atsauksmi: " + err.message);
            setTimeout(() => setReviewMessageError(""), 5000);
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
                setGlobalMessage(data.message);
                setGlobalMessageType("success");
                setTimeout(() => {
                    setGlobalMessage("");
                    navigate("/catalog");
            }, 4000);
                navigate("/catalog");
            } else {
                alert(`Kļūda: ${data.error}`);
            }
        } catch (err) {
            alert("Neizdevās dzēst filmu!");
        }
    };

    const handleEditReview = async (reviewId) => {
        const userEmail = localStorage.getItem("email");
    
        const updatedReview = {
    text: editText.trim(),
    rating: Number.isInteger(editRating) ? editRating : 0
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
    
            await fetchMovie(); // обновляем отзывы
            setReviewMessage("Atsauksme veiksmīgi rediģēta!");
            setTimeout(() => setReviewMessage(""), 4000);
            setEditingReview(null);
        } catch (err) {
            setReviewMessageError("Kļūda, rediģējot atsauksmi: " + err.message);
            setTimeout(() => setReviewMessageError(""), 5000);
        }
    };    

    const handleSubmitComplaint = async (e) => {
        e.preventDefault();
    
        const email = localStorage.getItem("email");
        if (!email) {
            alert("Nepieciešams lietotāja e-pasts! Lūdzu, piesakieties.");
            return;
        }
    
        if (!complaintSubject.trim() || !complaintText.trim()) {
            alert("Lūdzu, aizpildiet abus laukus: tēmu un tekstu!");
            return;
        }
    
        try {
            const response = await fetch("/send-complaint", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Email": email  // ✅ Отправляем корректный email
                },
                body: JSON.stringify({
                    movie_id: parseInt(id),  // ✅ Убедились, что `movie_id` - число
                    subject: complaintSubject.trim(),
                    text: complaintText.trim()
                })
            });
    
            const data = await response.json();
    
            if (!response.ok) throw new Error(data.error || "Nezināma kļūda");
    
            setGlobalMessage("Sūdzība veiksmīgi nosūtīta!");
            setGlobalMessageType("success");
            setTimeout(() => setGlobalMessage(""), 4000);
            setIsComplaintOpen(false);
            setComplaintSubject("");
            setComplaintText("");
        } catch (error) {
            console.error("Kļūda, nosūtot sūdzību:", error);
            setGlobalMessage("Neizdevās nosūtīt sūdzību: " + error.message);
            setGlobalMessageType("error");
            setTimeout(() => setGlobalMessage(""), 4000);
        }
    };
    
    const handleDeleteReview = async (reviewId) => {
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
    
            setReviewMessage("Atsauksme veiksmīgi dzēsta!");
            setTimeout(() => setReviewMessage(""), 4000);
            setConfirmDeleteId(null); // скрываем подтверждение
            await fetchMovie();
        } catch (err) {
            setReviewMessageError("Kļūda, dzēšot atsauksmi: " + err.message);
            setTimeout(() => setReviewMessageError(""), 5000);
        }
    };
       
    
    return (
        <div className="movie-details-container">
            {/* Верхняя навигация */}
<div className="top-navigation">
    <div className="left-navigation">
        <button className="back-button" onClick={() => navigate("/catalog")}>
            {t("backToCatalog")}
        </button>
    </div>

    <div className="auth-buttons">
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
            <button
                className="logout-button"
                onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    navigate("/catalog");
                }}
            >
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

{isLoggedIn && (
    <>
        <button className="complaint-button" onClick={() => setIsComplaintOpen(!isComplaintOpen)}>
            Sūtīt sūdzību
        </button>

        {isComplaintOpen && (
            <div className="complaint-form">
                <h3>Nosūtīt sūdzību</h3>
                <form onSubmit={handleSubmitComplaint}>
                    <label>Tēma:</label>
                    <input
                        type="text"
                        value={complaintSubject}
                        onChange={(e) => setComplaintSubject(e.target.value)}
                        placeholder="Ievadiet sūdzības tēmu"
                    />

                    <label>Sūdzības teksts:</label>
                    <textarea
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        placeholder="Ievadiet savu sūdzību"
                    />

                    <button type="submit">Nosūtīt</button>
                </form>
            </div>
        )}
    </>
)}

<h3>Lietotāju atsauksmes:</h3>
{globalMessage && (
  <p className={globalMessageType === "success" ? "success-message" : "error-message"}>
    {globalMessage}
  </p>
)}
{reviewMessage && <p className="success-message">{reviewMessage}</p>}
<ul className="reviews-list">
    {isLoggedIn && (
        <div className="review-form">
            <h3 className="review-section-title">{t("addReview")}:</h3>

<div className="review-messages">
  {reviewError && (
    <div className="review-error-container">
      <p className="error-message">{reviewError}</p>
    </div>
  )}
  {reviewMessageError && (
    <div className="review-error-container">
      <p className="error-message">{reviewMessageError}</p>
    </div>
  )}
  {reviewSuccess && <p className="success-message">{reviewSuccess}</p>}
</div>

<form onSubmit={handleReviewSubmit}>
                <label>{t("rating")}:</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    <option value="0">{t("noRating")}</option>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
                </select>

                <label>{t("reviewText")}:</label>
                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Ievadiet savu atsauksmi (nav obligāti)"
                />

                <button type="submit">{t("submit")}</button>
            </form>
        </div>
    )}

    {movie.reviews?.length > 0 ? (
        movie.reviews.map((review) => (
            <li key={review.id}>
                <strong>{review.user}</strong>
{Number(review.rating) > 0 && (
  <span style={{ marginLeft: "5px", color: "#ffc107" }}>
    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
  </span>
)} <br />
                <small>
                    Izveidots: {new Date(review.created_at).toLocaleString("lv-LV", { 
                        year: 'numeric', month: '2-digit', day: '2-digit', 
                        hour: '2-digit', minute: '2-digit' 
                    })}
                </small>
                <p>{review.text}</p>

                {editingReview === review.id && (
  <div className="edit-review-form">
    <label>Jauns vērtējums:</label>
    <select value={editRating} onChange={(e) => setEditRating(Number(e.target.value))}>
  <option value={0}>Nav vērtējuma</option>
  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
</select>

    <label>Jauns teksts:</label>
    <textarea 
      value={editText} 
      onChange={(e) => setEditText(e.target.value)} 
      placeholder="Rediģējiet savu atsauksmi" 
    />

    <button className="edit-btn" onClick={() => handleEditReview(review.id)}>Saglabāt</button>
    <button className="cancel" onClick={() => setEditingReview(null)}>Atcelt</button>
  </div>
)}

                {/* Кнопки "Редактировать" и "Удалить" отображаются только у автора отзыва */}
                {isLoggedIn && localStorage.getItem("email") === review.user && (
    <div className="review-actions">
        <button 
  className="edit-btn" 
  onClick={() => {
    setEditingReview(review.id);
    setEditText(review.text);
    setEditRating(review.rating);
  }}
>
  Rediģēt
</button>
        {confirmDeleteId === review.id ? (
  <div className="delete-confirm-box">
    <p>{t("confirmDelete")}</p>
    <button className="confirm" onClick={() => handleDeleteReview(review.id)}>Jā</button>
    <button className="cancel" onClick={() => setConfirmDeleteId(null)}>Nē</button>
  </div>
) : (
<button className="delete-btn" onClick={() => setConfirmDeleteId(review.id)}>
  {t("delete")}
</button>
)}
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
