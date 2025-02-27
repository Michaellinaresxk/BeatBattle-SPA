import React, { createContext, useContext } from 'react';
import { useQuizSocket } from '../hooks/useQuizSocket';
import {
  QuizContextProviderProps,
  QuizContextType,
} from '../types/quizContextType';

// Create the context with default values
const QuizContext = createContext<QuizContextType | null>(null);

// Context provider component
export const QuizContextProvider: React.FC<QuizContextProviderProps> = ({
  children,
}) => {
  const quizSocketData = useQuizSocket();

  return (
    <QuizContext.Provider value={quizSocketData}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use the Quiz context
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error('useQuiz must be used within a QuizContextProvider');
  }

  return context;
};
