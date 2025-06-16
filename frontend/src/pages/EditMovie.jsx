import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/EditMovie.css";

# Filmu rediģēšanas iespējas
const EditMovie = () => {
    const { id } = useParams(); // Filmas ID tiek iegūts no URL
    const navigate = useNavigate();

    const [movie, setMovie] = useState(null); // Filmas dati
    const [loading, setLoading] = useState(true); // Ielādes indikators
    const [error, setError] = useState(""); // Kļūdas ziņojums
    const [updateSuccess, setUpdateSuccess] = useState(false); // Vai filma ir veiksmīgi atjaunināta

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/get-movie/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.title) {
                    setMovie(data); // Iestatīt filmas informāciju, ja dati saņemti veiksmīgi
                } else {
                    setError("Filma nav atrasta"); // Ja dati nav atrasti
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Nevar ielādēt filmas datus!"); // Tīkla vai servera kļūda
                setLoading(false);
            });
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Apstrādāt datus korektā formātā pirms nosūtīšanas uz serveri
        const updatedMovie = {
            title: movie.title,
            description: movie.description,
            release_date: movie.release_date,
            genres: typeof movie.genres === "string"
                ? movie.genres.split(",").map(g => g.trim())
                : movie.genres,
            poster_url: movie.poster_url,
            trailer_url: movie.trailer_url,
            country: movie.country,
            box_office: movie.box_office,
            awards: typeof movie.awards === "string"
                ? movie.awards.split(";").map(a => a.trim())
                : movie.awards,
            duration: movie.duration ? parseInt(movie.duration) : null,
            age_rating: movie.age_rating
            actors: movie.actors,
            directors: movie.directors,
            writers: movie.writers
        };

        try {
            const response = await fetch(`http://127.0.0.1:5000/update-movie/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}` // JWT token autentifikācijai
                },
                body: JSON.stringify(updatedMovie)
            });

            const data = await response.json();

            if (response.ok) {
                setUpdateSuccess(true); // Rāda veiksmīgas atjaunināšanas paziņojumu
            } else {
                alert(`Kļūda: ${data.error || "Neizdevās atjaunināt filmu!"}`); // Validācijas kļūda no servera
            }
        } catch (err) {
            alert("Neizdevās atjaunināt filmu!"); // Kļūda, nosūtot pieprasījumu
        }
    };

    if (loading) return <p>Ielādēšana...</p>; // Ja dati vēl tiek ielādēti
    if (error) return <p>{error}</p>; // Ja ir kļūda ielādes laikā
};

    return (
        <div className="edit-movie-container">
            <h2>Rediģēt filmu</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" value={movie.title} onChange={(e) => setMovie({ ...movie, title: e.target.value })} required />
                <textarea value={movie.description} onChange={(e) => setMovie({ ...movie, description: e.target.value })} />
                <input type="date" value={movie.release_date} onChange={(e) => setMovie({ ...movie, release_date: e.target.value })} required />
                <input type="text" value={movie.genres} onChange={(e) => setMovie({ ...movie, genres: e.target.value.split(",") })} required />
                <input type="text" value={movie.poster_url} onChange={(e) => setMovie({ ...movie, poster_url: e.target.value })} />
                <input type="text" value={movie.trailer_url} onChange={(e) => setMovie({ ...movie, trailer_url: e.target.value })} />
                <input type="text" value={movie.country} onChange={(e) => setMovie({ ...movie, country: e.target.value })} />
                <input type="text" value={movie.box_office} onChange={(e) => setMovie({ ...movie, box_office: e.target.value })} />
                <textarea value={movie.awards} onChange={(e) => setMovie({ ...movie, awards: e.target.value })} />
                <input type="number" value={movie.duration} onChange={(e) => setMovie({ ...movie, duration: e.target.value })} />
                <input type="text" value={movie.age_rating} onChange={(e) => setMovie({ ...movie, age_rating: e.target.value })} />
                <button type="submit">Saglabāt izmaiņas</button>
            </form>
        </div>
    );
};

export default EditMovie;
