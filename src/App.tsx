import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import QuizDisplay from './UI/pages/QuizDisplay';
import QuizWaitingRoom from './UI/pages/QuizWaitingRoom';
import QuizGameView from './UI/pages/QuizGameView';
import MusicCategorySelection from './UI/pages/MusicCategorySelection';
import { QuizContextProvider } from './context/QuixContext';
import LandingPage from './UI/pages/LandingPage';
import { AboutUs } from './UI/pages/AboutUs';
import QuizResults from './UI/pages/QuizResults';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <QuizContextProvider>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path='/quiz' element={<QuizDisplay />} />
          <Route path='/categories' element={<MusicCategorySelection />} />
          <Route path='/room/:roomCode' element={<QuizWaitingRoom />} />
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
