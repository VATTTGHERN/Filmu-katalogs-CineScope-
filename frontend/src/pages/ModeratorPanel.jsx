import React, { useEffect, useState } from "react";
import "../styles/ModeratorPanel.css";
import { useNavigate } from "react-router-dom";

const ModeratorPanel = () => {
    const [complaints, setComplaints] = useState([]);
    const [error, setError] = useState("");
    const navigate = useNavigate();

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

            setComplaints((prev) =>
                prev.map((c) =>
                    c.id === id ? { ...c, status: action === "resolved" ? "atrisināta" : "noraidīta" } : c
                )
            );
        } catch (err) {
            alert("Kļūda, mainot sūdzības statusu: " + err.message);
        }
    };

    return (
        <div className="moderator-panel">
            <button
                className="back-to-catalog"
                onClick={() => navigate("/catalog")}
            >
                Atgriezties uz katalogu
            </button>

            <h2>Sūdzību pārvaldība</h2>

            {error && <p className="error-message">{error}</p>}

            {complaints.length === 0 ? (
                <p>Nav nevienas sūdzības.</p>
            ) : (
                <ul className="complaints-list">
                    {complaints.map((complaint) => {
                        const status = complaint.status || "neatrisināta";

                        return (
                            <li key={complaint.id} className="complaint-item">
                                <p><strong>Lietotājs:</strong> {complaint.user_email}</p>
                                <p><strong>Filmas nosaukums:</strong> {complaint.movie_title}</p>
                                <p><strong>Tēma:</strong> {complaint.subject}</p>
                                <p><strong>Apraksts:</strong> {complaint.text}</p>
                                <p><strong>Statuss:</strong> {status}</p>

                                {status === "neatrisināta" && (
                                    <div className="moderator-actions">
                                        <button onClick={() => handleComplaintAction(complaint.id, "resolved")}>
                                            Atrisināt
                                        </button>
                                        <button onClick={() => handleComplaintAction(complaint.id, "rejected")}>
                                            Noraidīt
                                        </button>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ModeratorPanel;
