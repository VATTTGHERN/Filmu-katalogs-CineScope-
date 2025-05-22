import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [userReviews, setUserReviews] = useState([]);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        current_password: "",
        new_password: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");
        const role = localStorage.getItem("role");

        if (!username || !email || !role) {
            setProfile(null);
            return;
        }

        setProfile({ username, email, role });
        setFormData({ ...formData, username, email });
        fetchUserReviews(email);
    }, []);

    const fetchUserReviews = async (email) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/get-user-reviews", {
                headers: {
                    "User-Email": email
                }
            });
            const data = await response.json();
            if (response.ok) {
                setUserReviews(data.reviews || []);
            }
        } catch (err) {
            console.error("Kļūda, ielādējot atsauksmes:", err);
        }
    };

    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProfileUpdate = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "User-Email": localStorage.getItem("email")
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                alert("Profils veiksmīgi atjaunināts!");
                localStorage.setItem("username", data.username);
                localStorage.setItem("email", data.email);
                setProfile({ ...profile, ...data });
            } else {
                alert(data.error || "Kļūda!");
            }
        } catch (err) {
            alert("Servera kļūda");
        }
    };

    const renderStars = (rating) => {
        const full = "★".repeat(rating);
        const empty = "☆".repeat(5 - rating);
        return (
            <span style={{ color: "#ffc107", marginLeft: "5px" }}>{full}{empty}</span>
        );
    };

    if (!profile) {
        return <h2 style={{ color: "red" }}>Nav autorizēts! Lūdzu, piesakieties.</h2>;
    }

    return (
        <div className="profile-container">
            <h2>Profils</h2>
            <button className="back-button" onClick={() => navigate("/catalog")}>
                Atgriezties katalogā
            </button>

            <div className="profile-info">
                <p><strong>Lietotājvārds:</strong> {profile.username}</p>
                <p><strong>E-pasts:</strong> {profile.email}</p>
                <p><strong>Loma:</strong> {profile.role}</p>
            </div>

            <div className="edit-profile-form">
                <h3>Rediģēt profilu</h3>
                <input
                    type="text"
                    name="username"
                    placeholder="Jauns lietotājvārds"
                    value={formData.username}
                    onChange={handleProfileChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Jauns e-pasts"
                    value={formData.email}
                    onChange={handleProfileChange}
                />
                <input
                    type="password"
                    name="current_password"
                    placeholder="Pašreizējā parole"
                    value={formData.current_password}
                    onChange={handleProfileChange}
                />
                <input
                    type="password"
                    name="new_password"
                    placeholder="Jaunā parole"
                    value={formData.new_password}
                    onChange={handleProfileChange}
                />
                <button className="profile-button" onClick={handleProfileUpdate}>
                    Saglabāt izmaiņas
                </button>
            </div>

            <div className="user-reviews">
                <h3>Manas atsauksmes:</h3>
                {userReviews.length === 0 ? (
                    <p>Nav nevienas atsauksmes.</p>
                ) : (
                    <div className="review-cards">
                        {userReviews.map((r) => (
                            <div key={r.id} className="review-card">
                                <p><strong>{r.movie_title}</strong>{renderStars(r.rating)}</p>
                                <small>{r.created_at}</small>
                                <p>{r.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
