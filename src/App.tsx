import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HeroScreen from './UI/components/HeroScreen';
import QuizDisplay from './UI/pages/QuizDisplay';
import QuizGameView from './UI/pages/QuizGameView';
import QuizResults from './UI/components/QuizResults';
import { QuizContextProvider } from './context/QuixContext';
import LandingPage from './UI/pages/LandingPage';
import { AboutUs } from './UI/pages/AboutUs';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <QuizContextProvider>
        <Routes>
          {/* Landing page */}
          <Route path='/' element={<LandingPage />} />

          {/* Quiz setup screen */}
          <Route path='/quiz' element={<QuizDisplay />} />

          {/* Waiting room with room code */}
          <Route path='/room/:roomCode' element={<QuizDisplay />} />

          <Route path='/AboutUs' element={<AboutUs />} />

          {/* Active quiz game */}
          <Route path='/game/:roomCode' element={<QuizGameView />} />

          {/* Results screen */}
          <Route path='/results/:roomCode' element={<QuizResults />} />

          {/* Redirect any unknown routes to home */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </QuizContextProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
