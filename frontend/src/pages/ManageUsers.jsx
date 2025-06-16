import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageUsers.css";

const ManageUsers = () => {
  // Saglabājam lietotāju sarakstu
  const [users, setUsers] = useState([]);
  // Lai rādītu ielādes spinneri vai ziņojumu
  const [loading, setLoading] = useState(true);
  // Paziņojumi par veiksmīgām vai neveiksmīgām darbībām
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Funkcija, kas ielādē visus lietotājus no backend
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token") || "";

      const response = await fetch("http://127.0.0.1:5000/get-users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Neizdevās ielādēt lietotājus");

      setUsers(data.users || []);
    } catch (error) {
      console.error("Kļūda lietotāju ielādē:", error);
      setMessage("Neizdevās ielādēt lietotājus");
    } finally {
      setLoading(false);
    }
  };

  // Funkcija, kas bloķē vai atbloķē lietotāju
  const toggleBlockUser = async (userId) => {
    try {
      const token = localStorage.getItem("token") || "";

      const response = await fetch(`http://127.0.0.1:5000/toggle-block-user/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Neizdevās mainīt lietotāja statusu.");

      setMessage(data.message);

      // Atjaunojam lietotāja bloķēšanas statusu, lai UI atsvaidzinātos bez pilnas pārlādes
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_blocked: !user.is_blocked } : user
        )
      );

      // Notīrām paziņojumu pēc 3 sekundēm
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
