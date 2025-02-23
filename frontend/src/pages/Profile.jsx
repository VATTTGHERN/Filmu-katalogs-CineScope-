import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("🔍 Token:", localStorage.getItem("token"));
        const fetchProfile = async () => {
            const token = localStorage.getItem("token");
            console.log("Token sent in request:", token);  // ✅ Проверяем токен перед отправкой
        
            if (!token) {
                setError("Nav autorizēts! Lūdzu, piesakieties.");
                return;
            }
        
            try {
                const response = await fetch("http://127.0.0.1:5000/auth/get-profile", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
        
                if (!response.ok) {
                    throw new Error("Neizdevās ielādēt profilu");
                }
        
                const data = await response.json();
                setProfile(data);
            } catch (error) {
                console.error("Profile fetch error:", error);
                setError(error.message);
            }
        };

        fetchProfile();
    }, []);

    if (error) return <h2 style={{ color: "red" }}>{error}</h2>;
    if (!profile) return <h2>Ielādēšana...</h2>;

    return (
        <div className="profile-container">
            <h2>Profils</h2>
            <p><strong>Lietotājvārds:</strong> {profile.username}</p>
            <p><strong>E-pasts:</strong> {profile.email}</p>
            <p><strong>Loma:</strong> {profile.role}</p>
            <button className="back-button" onClick={() => navigate("/catalog")}>Atpakaļ uz katalogu</button>
        </div>
    );
};

export default Profile;
