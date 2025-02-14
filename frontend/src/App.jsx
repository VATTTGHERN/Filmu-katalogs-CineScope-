import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MovieCatalog from "./pages/MovieCatalog";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<h1>Добро пожаловать в CineScope</h1>} />
                <Route path="/catalog" element={<MovieCatalog />} />
            </Routes>
        </Router>
    );
}

export default App;
