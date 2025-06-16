import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MovieCatalog from "./pages/MovieCatalog";
import MovieDetails from "./pages/MovieDetails";
import LatvianMovies from "./pages/LatvianMovies";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddMovie from "./pages/AddMovie";
import EditMovie from "./pages/EditMovie";
import "./styles/global.css"; 
import Profile from "./pages/Profile";
import ManageUsers from "./pages/ManageUsers";
import FavoriteMovies from "./pages/FavoriteMovies";
import ModeratorPanel from "./pages/ModeratorPanel";

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/catalog" element={<MovieCatalog />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/latvian-movies" element={<LatvianMovies />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/add-movie" element={<AddMovie />} />
                <Route path="/edit-movie/:id" element={<EditMovie />} /> 
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<MovieCatalog />} />
                <Route path="/manage-users" element={<ManageUsers />} />
                <Route path="/favorites" element={<FavoriteMovies />} />
                <Route path="/moderator" element={<ModeratorPanel />} />
            </Routes>
        </Router>
    );
};

export default App;
