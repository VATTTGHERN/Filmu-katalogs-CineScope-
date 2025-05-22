import React, { useEffect, useState } from "react";
import "../styles/ModeratorPanel.css";
import { useNavigate } from "react-router-dom";

const ModeratorPanel = () => {
    const [complaints, setComplaints] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(localStorage.getItem("role") || "");

    useEffect(() => {
        const fetchComplaints = async () => {
            const response = await fetch("http://127.0.0.1:5000/view-complaints", {
                headers: {
                    "User-Email": localStorage.getItem("email") || "",
                },
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || "Neizdevās ielādēt sūdzības");
            } else {
                setComplaints(data.complaints || []);
            }
        };

        fetchComplaints();
    }, []);

    const handleComplaintAction = async (id, action) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/resolve-complaint/${id}?action=${action}`, {
                method: "PUT",
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Nezināma kļūda");

            setComplaints((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            alert("Kļūda, mainot sūdzības statusu: " + err.message);
        }
    };

    const handleDeleteReview = async (reviewId, complaintId) => {
    if (!reviewId) {
        alert("Nav atsauksmes ID! Sūdzība nav par atsauksmi.");
        return;
    }

    const confirm = window.confirm("Vai tiešām vēlaties dzēst šo atsauksmi?");
    if (!confirm) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/delete-review/${reviewId}`, {
            method: "DELETE",
            headers: {
                "User-Email": localStorage.getItem("email"),
            },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Nezināma kļūda");

        alert("Atsauksme veiksmīgi dzēsta!");
        await handleComplaintAction(complaintId, "resolved");
    } catch (err) {
        alert("Kļūda dzēšot atsauksmi: " + err.message);
    }
};

    return (
        <div className="moderator-panel">
            <button className="back-to-catalog" onClick={() => navigate("/catalog")}>
                Atgriezties uz katalogu
            </button>

            <h2>Sūdzību pārvaldība</h2>

            {error && <p className="error-message">{error}</p>}

            {complaints.length === 0 ? (
                <p>Nav nevienas sūdzības.</p>
            ) : (
                <ul className="complaints-list">
                    {complaints.map((complaint) => (
                        <li key={complaint.id} className="complaint-item">
                            <p><strong>Lietotājs:</strong> {complaint.user_email}</p>
                            <p><strong>Filmas nosaukums:</strong> {complaint.movie_title}</p>
                            <p><strong>Tēma:</strong> {complaint.subject}</p>
                            <p><strong>Apraksts:</strong> {complaint.text}</p>

                            <p><strong>Sūdzības tips:</strong> {complaint.type === "review" ? "Par atsauksmi" : "Par filmu"}</p>

                            {complaint.review_text && (
    <p><strong>Saistītā atsauksme:</strong> {complaint.review_text}</p>
)}

                            {(complaint.type === "movie" && userRole === "admin") ||
                             (complaint.type === "review" && userRole === "moderator") ? (
                                <div className="moderator-actions">
                                    <button onClick={() => handleComplaintAction(complaint.id, "resolved")}>
                                        Atrisināt
                                    </button>
                                    <button onClick={() => handleComplaintAction(complaint.id, "rejected")}>
                                        Noraidīt
                                    </button>
                                </div>
                            ) : (
                                <p style={{ color: "#999", fontStyle: "italic" }}>
                                    Jums nav tiesību apstrādāt šo sūdzību.
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ModeratorPanel;
