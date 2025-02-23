import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // Подключаем отдельный CSS файл для Login

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
    
        try {
            const response = await fetch("http://127.0.0.1:5000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",  // ✅ Добавляем, чтобы передавались cookie
                body: JSON.stringify({ email, password })
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                setError(data.error || "Nezināma kļūda");
                return;
            }
    
            // ✅ Сохраняем роль в localStorage
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            localStorage.setItem("role", data.user.role); // 🔥 Добавляем роль
    
            alert("Veiksmīga pieslēgšanās!");
            navigate("/catalog");
        } catch (err) {
            console.error("Login request failed:", err);
            setError("Neizdevās pieslēgties. Pārbaudiet interneta savienojumu.");
        }
    };

    return (
        <div className="login-container">
            <h2>Pieslēgties</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleLogin} className="login-form">
                <input type="email" placeholder="E-pasts" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Parole" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Ienākt</button>
            </form>

            {/* Кнопка возврата в каталог */}
            <button className="back-button" onClick={() => navigate("/catalog")}>Atgriezties katalogā</button>

            {/* Футер внизу страницы */}
            <footer className="login-footer">
                <p>Autori: Maksims Goldmann, Timofejs Kravčuks, P2-4</p>
                <p>Filmu katalogs "CineScope"</p>
            </footer>
        </div>
    );
};

export default Login;
