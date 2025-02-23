import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MovieCatalog from "./pages/MovieCatalog";  // <-- добавляем `pages/`
import MovieDetails from "./pages/MovieDetails";  // <-- добавляем `pages/`
import LatvianMovies from "./pages/LatvianMovies";
import Login from "./pages/Login";  // <-- добавляем `pages/`
import Register from "./pages/Register";  // <-- добавляем `pages/`
import "./styles/global.css"; // Подключаем общий CSS
import AddMovie from "./pages/AddMovie";


const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/catalog" element={<MovieCatalog />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/latvian-movies" element={<LatvianMovies />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<MovieCatalog />} /> {/* Перенаправление на /catalog по умолчанию */}
                <Route path="/add-movie" element={<AddMovie />} />
            </Routes>
        </Router>
    );
};

export default App;
