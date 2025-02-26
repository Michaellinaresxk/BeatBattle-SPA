import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './UI/components/LandingPage';
import QuizDisplay from './UI/pages/QuizDisplay'; // Ajusta la ruta según tu estructura de carpetas

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/quiz' element={<QuizDisplay />} />
        <Route path="/room/:roomCode" element={<QuizDisplay />} />
      </Routes>
    </Router>
  );
}

export default App;
