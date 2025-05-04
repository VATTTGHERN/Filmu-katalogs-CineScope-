import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [loginSuccess, setLoginSuccess] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!email.trim()) newErrors.email = "Lūdzu, ievadiet e-pastu!";
        if (!password.trim()) newErrors.password = "Lūdzu, ievadiet paroli!";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setError("");

        try {
            const response = await fetch("http://127.0.0.1:5000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Nezināma kļūda");
                return;
            }

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            localStorage.setItem("role", data.user.role);

            setLoginSuccess(true); // показываем сообщение
        } catch (err) {
            setError("Neizdevās pieslēgties. Pārbaudiet interneta savienojumu.");
        }
    };

    return (
        <div className="login-container">
            {loginSuccess && (
                <div className="login-success-popup">
                    <p>Veiksmīga pieslēgšanās!</p>
                    <button onClick={() => navigate("/catalog")}>Turpināt</button>
                </div>
            )}

            <h2>Pieslēgties</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleLogin} className="login-form">
                <input
                    type="email"
                    placeholder="E-pasts"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ border: errors.email ? "2px solid red" : undefined }}
                />
                {errors.email && <p className="error-message">{errors.email}</p>}

                <input
                    type="password"
                    placeholder="Parole"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ border: errors.password ? "2px solid red" : undefined }}
                />
                {errors.password && <p className="error-message">{errors.password}</p>}

                <button type="submit">Ienākt</button>
            </form>

            <button className="back-button" onClick={() => navigate("/catalog")}>
                Atgriezties katalogā
            </button>

            <footer className="login-footer">
                <p>Autori: Maksims Goldmann, Timofejs Kravčuks, P2-4</p>
                <p>Filmu katalogs "CineScope"</p>
            </footer>
        </div>
    );
};

export default Login;
