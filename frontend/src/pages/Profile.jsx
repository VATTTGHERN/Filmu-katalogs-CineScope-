import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

// Lietotāja profila lapa
const Profile = () => {
    const [profile, setProfile] = useState(null); // Lietotāja profila dati
    const [userReviews, setUserReviews] = useState([]); // Lietotāja atsauksmes
    const [userComplaints, setUserComplaints] = useState([]); // Lietotāja sūdzības
    const [dismissedComplaints, setDismissedComplaints] = useState([]); // Slēptās sūdzības
    const [profileMessage, setProfileMessage] = useState(""); // Veiksmīga atjauninājuma ziņojums
    const [profileError, setProfileError] = useState(""); // Kļūdu ziņojums
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        current_password: "",
        new_password: ""
    });

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setProfile(null); // Nav autorizācijas
            return;
        }

        // Iegūstam profila datus
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");
        const role = localStorage.getItem("role");

        setProfile({ username, email, role });
        setFormData({ ...formData, username, email });
        fetchUserReviews(token);
        fetchUserComplaints(token);
    }, []);

    // Atsauksmju iegūšana no servera
    const fetchUserReviews = async (token) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/get-user-reviews", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setUserReviews(data.reviews || []);
        } catch (err) {
            console.error("Kļūda, ielādējot atsauksmes:", err);
        }
    };

    // Sūdzību iegūšana
    const fetchUserComplaints = async (token) => {
        try {
            const response = await fetch("http://127.0.0.1:5000/get-user-complaints", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setUserComplaints(data.complaints || []);
        } catch (err) {
            console.error("Kļūda, ielādējot sūdzības:", err);
        }
    };

    const handleDismissComplaint = async (complaintId, index) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/dismiss-complaint/${complaintId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (response.ok) {
                setDismissedComplaints([...dismissedComplaints, index]);
            } else {
                console.error("Neizdevās paslēpt sūdzību.");
            }
        } catch (err) {
            console.error("Kļūda, slēpjot sūdzību:", err);
        }
    };

    // Profila formas datu maiņa
    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Profila datu atjaunināšana
    const handleProfileUpdate = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                setProfileMessage("Profils veiksmīgi atjaunināts!");
                setProfileError("");
                localStorage.setItem("username", data.username);
                localStorage.setItem("email", data.email);
                setProfile({ ...profile, ...data });
            } else {
                setProfileMessage("");
                setProfileError(data.error || "Kļūda!");
            }
        } catch (err) {
            setProfileMessage("");
            setProfileError("Servera kļūda");
        }
    };

    // Atsauksmes zvaigžņu attēlošana
    const renderStars = (rating) => {
        const full = "★".repeat(rating);
        const empty = "☆".repeat(5 - rating);
        return (
            <span style={{ color: "#ffc107", marginLeft: "5px" }}>{full}{empty}</span>
        );
    };

    // Ja nav autorizēts, parādam brīdinājumu
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

            <div className="user-complaints">
                <h3>Manas sūdzības (apstrādātas):</h3>
                {userComplaints.length === 0 ? (
                    <p>Nav atrisinātu sūdzību.</p>
                ) : (
                    <div className="complaint-cards">
                        {userComplaints.map((c, i) => (
                            !dismissedComplaints.includes(i) && (
                                <div key={i} className="complaint-card">
                                    <p><strong>Tēma:</strong> {c.subject}</p>
                                    <p><strong>Apraksts:</strong> {c.text}</p>
                                    <p><strong>Statuss:</strong> {c.status}</p>
                                    {c.comment && (
                                        <p><strong>Noraidījuma iemesls:</strong> {c.comment}</p>
                                    )}
                                    <small>{c.created_at}</small>
                                    <button onClick={() => handleDismissComplaint(c.id, i)} className="dismiss-button">OK</button>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
