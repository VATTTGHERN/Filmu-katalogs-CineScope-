import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ Забираем данные из localStorage
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("userEmail");
        const role = localStorage.getItem("role");

        // ✅ Если нет данных → пользователь не вошёл
        if (!username || !email || !role) {
            setProfile(null);
            return;
        }

        setProfile({ username, email, role });
    }, []);

    if (!profile) {
        return <h2 style={{ color: "red" }}>Nav autorizēts! Lūdzu, piesakieties.</h2>;
    }

    return (
        <div className="profile-container">
            <h2>Profils</h2>
            <p><strong>Lietotājvārds:</strong> {profile.username}</p>
            <p><strong>E-pasts:</strong> {profile.email}</p>
            <p><strong>Loma:</strong> {profile.role}</p>
            <button className="back-button" onClick={() => navigate("/catalog")}>Atgriezties katalogā</button>
        </div>
    );
};

export default Profile;
