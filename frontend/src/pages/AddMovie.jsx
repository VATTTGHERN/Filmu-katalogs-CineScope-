import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AddMovie.css";

// Komponents jaunas filmas pievienošanai 
const AddMovie = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [releaseDate, setReleaseDate] = useState("");
    const [genres, setGenres] = useState("");
    const [posterUrl, setPosterUrl] = useState("");
    const [trailerUrl, setTrailerUrl] = useState("");
    const [country, setCountry] = useState("");
    const [boxOffice, setBoxOffice] = useState("");
    const [awards, setAwards] = useState("");
    const [duration, setDuration] = useState("");
    const [ageRating, setAgeRating] = useState("");
    const [actors, setActors] = useState("");
    const [directors, setDirectors] = useState("");
    const [writers, setWriters] = useState("");
    const [errors, setErrors] = useState({});
    const [addSuccess, setAddSuccess] = useState(false);

    const navigate = useNavigate();

    // Validācijas funkcija — pārbauda, vai dati ir korekti aizpildīti
    const validate = () => {
        const newErrors = {};

        if (!title.trim()) newErrors.title = "Lūdzu, ievadiet filmas nosaukumu!";
        if (!releaseDate) newErrors.releaseDate = "Lūdzu, izvēlieties izlaišanas datumu!";
        if (!genres.trim()) newErrors.genres = "Lūdzu, ievadiet vismaz vienu žanru!";
        if (trailerUrl && !trailerUrl.includes("youtube.com") && !trailerUrl.includes("youtu.be"))
            newErrors.trailerUrl = "Treilera saitei jābūt no YouTube!";
        if (duration && isNaN(duration)) newErrors.duration = "Ilgumam jābūt skaitlim!";
        if (boxOffice && !/^\$?\d+[MK]?$/.test(boxOffice)) newErrors.boxOffice = "Kases ieņēmumu formāts nav derīgs!";

        return newErrors;
    };

    // Apstrādā formas iesniegšanu un nosūta datus uz serveri
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formErrors = validate();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setErrors({});

        // Sagatavo filmas objektu sūtīšanai uz serveri
        const movieData = {
            title: title.trim(),
            description: description.trim(),
            release_date: releaseDate,
            genres: genres.split(",").map(g => g.trim()),
            poster_url: posterUrl.trim() || null,
            trailer_url: trailerUrl.trim() || null,
            country: country.trim() || null,
            box_office: boxOffice.trim() || null,
            awards: awards ? awards.split(";").map(a => a.trim()) : [],
            duration: duration ? parseInt(duration) : null,
            age_rating: ageRating.trim() || null,
            // Atbalsta arī aktieru, režisoru un scenāristu sarakstus
            actors: actors ? actors.split(",").map(a => a.trim()) : [],
            directors: directors ? directors.split(",").map(d => d.trim()) : [],
            writers: writers ? writers.split(",").map(w => w.trim()) : []
        };

        try {
            const response = await fetch("http://127.0.0.1:5000/add-movie", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(movieData)
            });

            const data = await response.json();
            if (response.ok) {
                setAddSuccess(true); // Parāda veiksmes paziņojumu
            } else {
                alert(`Kļūda: ${data.error || "Neizdevās pievienot filmu!"}`);
            }
        } catch (error) {
            console.error("Servera kļūda:", error);
            alert("Neizdevās savienoties ar serveri!");
        }
    };
};

    return (
        <div className="add-movie-container">
            <h2>Pievienot filmu</h2>
            <form onSubmit={handleSubmit} className="add-movie-form">
                <input
                    type="text"
                    placeholder="Nosaukums*"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ border: errors.title ? "2px solid red" : undefined }}
                />
                {errors.title && <p className="error-message">{errors.title}</p>}

                <textarea
                    placeholder="Apraksts"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    style={{ border: errors.releaseDate ? "2px solid red" : undefined }}
                />
                {errors.releaseDate && <p className="error-message">{errors.releaseDate}</p>}

                <input
                    type="text"
                    placeholder="Žanri (atdalīt ar komatu)*"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    style={{ border: errors.genres ? "2px solid red" : undefined }}
                />
                {errors.genres && <p className="error-message">{errors.genres}</p>}

                <input
                    type="text"
                    placeholder="Postera URL"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Treilera URL"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    style={{ border: errors.trailerUrl ? "2px solid red" : undefined }}
                />
                {errors.trailerUrl && <p className="error-message">{errors.trailerUrl}</p>}

                <input
                    type="text"
                    placeholder="Valsts"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Kases ieņēmumi (piemērs: $500M)"
                    value={boxOffice}
                    onChange={(e) => setBoxOffice(e.target.value)}
                    style={{ border: errors.boxOffice ? "2px solid red" : undefined }}
                />
                {errors.boxOffice && <p className="error-message">{errors.boxOffice}</p>}

                <textarea
                    placeholder="Balvas (atdalīt ar ';')"
                    value={awards}
                    onChange={(e) => setAwards(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Ilgums (minūtes)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={{ border: errors.duration ? "2px solid red" : undefined }}
                />
                {errors.duration && <p className="error-message">{errors.duration}</p>}

                <input
                    type="text"
                    placeholder="Vecuma ierobežojums (piemērs: PG-13)"
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value)}
                />

                <button type="submit">Pievienot filmu</button>
            </form>
        </div>
    );
};

export default AddMovie;
