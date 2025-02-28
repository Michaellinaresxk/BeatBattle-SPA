import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuizSocket } from '../hooks/useQuizSocket';
import type {
  GameResults,
  Player,
  PlayerAnswer,
  Question,
  Option,
} from '../types/player';
import { Socket } from 'socket.io-client';

// Create proper type for the context
interface QuizContextType {
  socket: Socket | null;
  connectionError: string | null;
  isConnecting: boolean;
  roomCode: string;
  players: Player[];
  isHost: boolean;
  gameStatus: 'setup' | 'waiting' | 'playing' | 'ended';
  currentQuestion: Question | null;
  options: Option[];
  timeRemaining: number;
  playerAnswers: Record<string, PlayerAnswer>;
  gameResults: GameResults | null;
  selectedCategory: string | null;
  createRoom: (category?: any) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  requestNextQuestion: () => void;
  toggleReady: (isReady: boolean) => void;
  leaveRoom: () => void;
  setGameStatus: React.Dispatch<
    React.SetStateAction<'setup' | 'waiting' | 'playing' | 'ended'>
  >;
}

// Create the context with default values
const QuizContext = createContext<QuizContextType | null>(null);

// Context provider component
export const QuizContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const quizSocketData = useQuizSocket();

  // Use the gameStatus from the socket hook to initialize our state
  const [gameStatus, setGameStatus] = useState<
    'setup' | 'waiting' | 'playing' | 'ended'
  >(quizSocketData.gameStatus);

  // Sync gameStatus with the one from socket hook when it changes
  useEffect(() => {
    setGameStatus(quizSocketData.gameStatus);
  }, [quizSocketData.gameStatus]);

  // Expose a way for components to directly update game status
  // and also update the socket hook's gameStatus
  const updateGameStatus = (
    newStatus: 'setup' | 'waiting' | 'playing' | 'ended'
  ) => {
    setGameStatus(newStatus);
    quizSocketData.setGameStatus(newStatus);
  };

  // Listen for socket events that affect game state
  useEffect(() => {
    const { socket } = quizSocketData;
    if (!socket) return;

    // Handle the game_started event
    const handleGameStarted = (data: any) => {
      console.log('Game started event received in QuizContext:', data);
      updateGameStatus('playing');
    };

    // Handle the game_ended event
    const handleGameEnded = (data: any) => {
      console.log('Game ended event received in QuizContext:', data);
      updateGameStatus('ended');
    };

    // Register event handlers
    socket.on('game_started', handleGameStarted);
    socket.on('game_ended', handleGameEnded);

    // Cleanup on unmount
    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('game_ended', handleGameEnded);
    };
  }, [quizSocketData.socket]);

  // Create the context value by combining socket data with local state
  const contextValue: QuizContextType = {
    ...quizSocketData,
    gameStatus,
    setGameStatus: updateGameStatus,
  };

  return (
    <QuizContext.Provider value={contextValue}>{children}</QuizContext.Provider>
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
