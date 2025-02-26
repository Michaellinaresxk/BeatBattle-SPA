import React, { createContext, useContext } from 'react';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { Socket } from 'socket.io-client';
import {
  Player,
  PlayerAnswer,
  Question,
  Option,
  GameResults,
  GameStatus,
} from '../types/player';

// Define the context type
interface QuizContextType {
  socket: Socket | null;
  roomCode: string;
  players: Player[];
  isHost: boolean;
  gameStatus: GameStatus;
  currentQuestion: Question | null;
  options: Option[];
  timeRemaining: number;
  playerAnswers: Record<string, PlayerAnswer>;
  gameResults: GameResults | null;
  createRoom: () => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  startGame: () => void;
  submitAnswer: (optionId: string) => void;
  resetGame: () => void;
  leaveRoom: () => void;
}

// Create the context with default values
const QuizContext = createContext<QuizContextType | null>(null);

// Props type for the provider component
interface QuizContextProviderProps {
  children: React.ReactNode;
}

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
