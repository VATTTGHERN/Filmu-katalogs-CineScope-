import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/MovieDetails.css";
import { useTranslation } from 'react-i18next';

const MovieDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();  // Navigācijai starp lapām
    const [movie, setMovie] = useState(null);  // Filmas objekts
    const [error, setError] = useState(null);  // Kļūdas ziņojums
    const [isLoggedIn, setIsLoggedIn] = useState(false);  // Pieslēgšanās statuss
    const [rating, setRating] = useState(0);  // Atsauksmes vērtējums (1–5 zvaigznes)
    const [reviewText, setReviewText] = useState("");  // Atsauksmes teksts
    const [reviews, setReviews] = useState([]);  // Atsauksmju saraksts
    const [isFavorite, setIsFavorite] = useState(false);  // Vai filma ir favorītos
    const currentUser = localStorage.getItem("user_email");  // Lietotāja e-pasts
    const [editingReview, setEditingReview] = useState(null);  // Atsauksme rediģēšanai
    const [editText, setEditText] = useState("");  // Rediģētais teksts
    const [editRating, setEditRating] = useState(0);  // Rediģētais vērtējums
    const [isComplaintOpen, setIsComplaintOpen] = useState(false);  // Vai atvērta sūdzības forma
    const [complaintSubject, setComplaintSubject] = useState("");  // Sūdzības tēma
    const [complaintText, setComplaintText] = useState("");  // Sūdzības saturs
    const [reviewError, setReviewError] = useState("");  // Atsauksmes kļūda
    const [reviewSuccess, setReviewSuccess] = useState("");  // Atsauksmes panākumu ziņa
    const [reviewMessage, setReviewMessage] = useState("");  // Atsauksmes statusa paziņojums
    const [reviewMessageError, setReviewMessageError] = useState("");  // Atsauksmes kļūda
    const [globalMessage, setGlobalMessage] = useState("");  // Globāls paziņojums visai lapai
    const [globalMessageType, setGlobalMessageType] = useState("");  // 'success' vai 'error'
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);  // Atsauksmes ID dzēšanai
    const [selectedReviewId, setSelectedReviewId] = useState(null);  // Atlasītās atsauksmes ID

    useEffect(() => {
        const backendUrl = "http://127.0.0.1:5000";

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
                    checkIfFavorite();
                } else if (data.title) {
                    setMovie(data);
                    checkIfFavorite();
                } else {
                    setError("Filma nav atrasta");
                }
            })
            .catch((error) => {
                console.error("Filmas ielādes kļūda:", error);
                setError("Filmas ielādes kļūda");
            });

        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, [id]);

    // Pārbauda vai filma jau ir pievienota favorītiem
    const checkIfFavorite = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://127.0.0.1:5000/favorites", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.favorites) {
                setIsFavorite(data.favorites.some(fav => fav.id === parseInt(id)));
            }
        } catch (error) {
            console.error("Kļūda, pārbaudot favorītus:", error);
        }
    };

    // Ielādē filmas datus kopā ar atsauksmēm
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

    // Pievieno filmu favorītiem
    const handleAddToFavorites = async () => {
        if (!isLoggedIn) {
            setGlobalMessage("Lai pievienotu filmu, nepieciešams pieslēgties");
            setGlobalMessageType("error");
            setTimeout(() => setGlobalMessage(""), 4000);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://127.0.0.1:5000/add-to-favorites", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ movie_id: id })
            });

            const data = await response.json();
            if (response.ok) {
                setIsFavorite(true);
                setGlobalMessage("Filma pievienota vēlmju sarakstam!");
                setGlobalMessageType("success");
            } else {
                setGlobalMessage(data.error || "Kļūda, pievienojot filmu!");
                setGlobalMessageType("error");
            }
        } catch (error) {
            console.error("Kļūda, pievienojot filmu favorītiem:", error);
            setGlobalMessage("Neizdevās savienoties ar serveri");
            setGlobalMessageType("error");
        }

        // Attīra globālo ziņu pēc 4 sekundēm
        setTimeout(() => setGlobalMessage(""), 4000);
    };

// Iesniedz atsauksmi par filmu
const handleReviewSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!isLoggedIn || !token) return;

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
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Nezināma kļūda");

        await fetchMovie(); // Atjauno atsauksmju sarakstu
        setRating(0);
        setReviewText("");
        setReviewSuccess(t("success"));
        setTimeout(() => setReviewSuccess(""), 4000);
    } catch (err) {
        setReviewMessageError("Kļūda, pievienojot atsauksmi: " + err.message);
        setTimeout(() => setReviewMessageError(""), 5000);
    }
};
    return (
        <div className="movie-details-container">
            {/* Augšējā navigācija */}
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

{isLoggedIn && localStorage.getItem("role") === "admin" && (
    <div className="admin-buttons-container">
        <button
            className="edit-movie-btn"
            onClick={() => navigate(`/edit-movie/${movie.id}`)}
        >
            Rediģēt filmu
        </button>
        <button
            className="delete-movie-btn"
            onClick={() => handleDelete(movie.id)}
        >
            Dzēst filmu
        </button>
    </div>
)}

{/* Filmas treileris */}
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
            <strong>{review.user_name}</strong>
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

            {/* Poga sūdzību iesniegšanai par atsauksmi*/}
            {isLoggedIn && localStorage.getItem("email") !== review.user_email && review.text && (
                <button
                    className="complaint-button"
                    onClick={() => {
                        setIsComplaintOpen(true);
                        setComplaintSubject("Sūdzība par atsauksmi");
                        setComplaintText(`Atsauksme: "${review.text}"`);
                        setSelectedReviewId(review.id);
                    }}
                >
                    Sūdzība
                </button>
            )}

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

            {/* Autora pogas "Rediģēt" un "Dzēst" */}
            {isLoggedIn && localStorage.getItem("email") === review.user_email && (
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

            {/* Atsauksmes dzēšanas poga moderatoram/adminam */}
            {isLoggedIn &&
                (localStorage.getItem("role") === "moderator" || localStorage.getItem("role") === "admin") &&
                localStorage.getItem("email") !== review.user_email && (
                    <div className="review-actions">
                        <button
                            className="delete-btn"
                            onClick={() => handleDeleteReview(review.id)}
                        >
                            Dzēst atsauksmi
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
