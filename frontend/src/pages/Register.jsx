import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css"; 

// Lietotāja reģistrācija
const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // Reģistrācijas formas apstrāde
    const handleRegister = async (e) => {
        e.preventDefault();

        // Validācijas kļūdu objekts
        const newErrors = {};

        // Pamata validācija — pārbauda tukšos laukus
        if (!username.trim()) newErrors.username = "Lūdzu, ievadiet lietotājvārdu!";
        if (!email.trim()) newErrors.email = "Lūdzu, ievadiet e-pastu!";
        if (!password.trim()) newErrors.password = "Lūdzu, ievadiet paroli!";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:5000/add-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // Ja serveris atgriež kļūdu, tad to izmetam
                throw new Error(data.error || "Nezināma kļūda");
            }

            // Ja reģistrācija veiksmīga — novirza uz login lapu
            navigate("/login");
        } catch (err) {
            // Parāda kļūdu, kas radusies reģistrācijas laikā
            setError(err.message);
        }
    };

    return (
        <div className="register-container">
            <h2>Reģistrēties</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleRegister} className="register-form">
                <input type="text" placeholder="Lietotājvārds" value={username} onChange={(e) => setUsername(e.target.value)} required />
                <input type="email" placeholder="E-pasts" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Parole" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Reģistrēties</button>
            </form>

            {/* Кнопка возврата в каталог */}
            <button className="back-button" onClick={() => navigate("/catalog")}>Atgriezties katalogā</button>

            {/* Футер внизу страницы */}
            <footer className="register-footer">
                <p>Autori: Maksims Goldmann, Timofejs Kravčuks, P2-4</p>
                <p>Filmu katalogs "CineScope"</p>
            </footer>
        </div>
    );
};

export default Register;
