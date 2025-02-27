import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
          <Route path='/' element={<LandingPage />} />
          <Route path='/quiz' element={<QuizDisplay />} />
          <Route path='/room/:roomCode' element={<QuizDisplay />} />
          <Route path='/AboutUs' element={<AboutUs />} />
          <Route path='/game/:roomCode' element={<QuizGameView />} />
          <Route path='/results/:roomCode' element={<QuizResults />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </QuizContextProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
