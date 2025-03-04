import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuixContext';

// Pages
import LandingPage from './UI/pages/LandingPage';
import QuizDisplay from './UI/pages/QuizDisplay';
import QuizMainSelection from './UI/pages/QuizMainSelection';
import MusicCategorySelection from './UI/pages/MusicCategorySelection';
import EntryCodeScreen from './UI/pages/EntryCodeScreen';
import QuizGameView from './UI/pages/QuizGameView';
import QuizResults from './UI/pages/QuizResults';
import { AboutUs } from './UI/pages/AboutUs';

const AppRoutes = () => {
  return (
    <Router>
      <QuizProvider>
        <Routes>
          {/* Landing Page */}
          <Route path='/' element={<LandingPage />} />

          {/* Flujo principal */}
          <Route path='/quiz' element={<QuizDisplay />} />

          {/* Sala de espera - muestra código y jugadores */}
          <Route path='/room' element={<EntryCodeScreen />} />

          {/* Selección de categoría principal */}
          <Route path='/selection/:roomCode' element={<QuizMainSelection />} />

          {/* Selección de subcategoría */}
          <Route
            path='/categories/:categoryType/:roomCode'
            element={<MusicCategorySelection />}
          />
          {/* Juego y resultados */}
          <Route path='/game/:roomCode' element={<QuizGameView />} />
          <Route path='/results/:roomCode' element={<QuizResults />} />

          {/* Rutas de compatibilidad con el flujo anterior */}
          <Route path='/quiz/:roomCode' element={<QuizDisplay />} />

          <Route path='/about' element={<AboutUs />} />

          {/* Fallback para rutas desconocidas */}
          <Route path='*' element={<LandingPage />} />
        </Routes>
      </QuizProvider>
    </Router>
  );
};

export default AppRoutes;
