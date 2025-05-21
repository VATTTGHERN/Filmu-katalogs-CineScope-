import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageUsers.css";

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/get-users");
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error("Kļūda lietotāju ielādē:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlockUser = async (userId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/toggle-block-user/${userId}`, {
                method: "PUT",
                headers: { "User-Role": localStorage.getItem("role") }
            });

            const data = await response.json();
            setMessage(data.message);

            // Обновляем статус блокировки в UI
            setUsers(prev =>
                prev.map(user =>
                    user.id === userId ? { ...user, is_blocked: !user.is_blocked } : user
                )
            );

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage("Neizdevās mainīt lietotāja statusu.");
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="manage-users-container">
            <h2 className="manage-users-title">Lietotāju pārvaldība</h2>

            {message && <div className="global-message success">{message}</div>}

            <button className="back-button" onClick={() => navigate("/catalog")}>
                Atgriezties katalogā
            </button>

            {loading ? (
                <p>Notiek ielāde...</p>
            ) : (
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Lietotājvārds</th>
                            <th>E-pasts</th>
                            <th>Statuss</th>
                            <th>Darbība</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td style={{ color: user.is_blocked ? "red" : "green", fontWeight: "bold" }}>
                                    {user.is_blocked ? "Bloķēts" : "Aktīvs"}
                                </td>
                                <td>
                                    <button
                                        className={user.is_blocked ? "unblock-button" : "block-button"}
                                        onClick={() => toggleBlockUser(user.id)}
                                    >
                                        {user.is_blocked ? "Atbloķēt" : "Bloķēt"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManageUsers;
