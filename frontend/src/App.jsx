import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MovieCatalog from "./pages/MovieCatalog";
import MovieDetails from "./pages/MovieDetails";
import LatvianMovies from "./pages/LatvianMovies";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AddMovie from "./pages/AddMovie";
import EditMovie from "./pages/EditMovie"; // ✅ Добавляем импорт страницы редактирования
import "./styles/global.css"; 

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
                <Route path="/edit-movie/:id" element={<EditMovie />} /> {/* ✅ Добавлен маршрут редактирования */}
                <Route path="*" element={<MovieCatalog />} /> {/* Перенаправление на каталог по умолчанию */}
            </Routes>
        </Router>
    );
};

export default App;
