import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/EditMovie.css";

const EditMovie = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/get-movie/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.title) {
                    setMovie(data);
                } else {
                    setError("Filma nav atrasta");
                }
                setLoading(false);
            })
            .catch((err) => {
                setError("Nevar ielādēt filmas datus!");
                setLoading(false);
            });
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const updatedMovie = {
            title: movie.title,
            description: movie.description,
            release_date: movie.release_date,
            genres: movie.genres,
            poster_url: movie.poster_url,
            trailer_url: movie.trailer_url,
            country: movie.country,
            box_office: movie.box_office,
            awards: movie.awards,
            duration: movie.duration,
            age_rating: movie.age_rating
        };

        try {
            const response = await fetch(`http://127.0.0.1:5000/update-movie/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedMovie)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Filma veiksmīgi atjaunināta!");
                navigate(`/movie/${id}`);
            } else {
                alert(`Kļūda: ${data.error}`);
            }
        } catch (err) {
            alert("Neizdevās atjaunināt filmu!");
        }
    };

    if (loading) return <p>Ielādēšana...</p>;
    if (error) return <p>{error}</p>;

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
