import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddMovie = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [releaseDate, setReleaseDate] = useState("");
    const [genres, setGenres] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://127.0.0.1:5000/add-movie", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    release_date: releaseDate,
                    genres: genres.split(", ")
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Neizdevās pievienot filmu!");
            }

            alert("Filma veiksmīgi pievienota!");
            navigate("/catalog");
        } catch (err) {
            alert("Kļūda: " + err.message);
        }
    };

    return (
        <div>
            <h2>Pievienot filmu</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Nosaukums" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <textarea placeholder="Apraksts" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} required />
                <input type="text" placeholder="Žanri (atdalīt ar komatu)" value={genres} onChange={(e) => setGenres(e.target.value)} required />
                <button type="submit">Pievienot</button>
            </form>
        </div>
    );
};

export default AddMovie;
