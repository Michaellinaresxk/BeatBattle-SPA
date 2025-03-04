import { Socket } from 'socket.io-client';
import {
  GameResults,
  GameStatus,
  Option,
  Player,
  PlayerAnswer,
  Question,
} from './player';
import { ReactNode } from 'react';

export interface QuizContextType {
  socket: Socket | null;
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  connectionError: string | null;
  gameStatus: GameStatus;
  selectedCategory: string | null;
  selectedCategoryType: string | null;
  currentQuestion: Question | null;
  options: Option[] | null;
  timeRemaining: number;
  playerAnswers: Record<string, string>;
  gameResults: any | null;

  // Methods
  createRoom: (category: Category, nickname?: string) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  leaveRoom: () => void;
  startGame: (
    roomCode: string,
    categoryId?: string,
    categoryType?: string
  ) => void;
  submitAnswer: (answer: string) => void;
  setGameStatus: (status: GameStatus) => void;
  updateCategory: (roomCode: string, categoryType: string) => void;
  updateRoomCategory: (
    roomCode: string,
    categoryType: string,
    categoryId: string
  ) => void;
  selectQuizType: (roomCode: string, quizType: string) => void;
  selectCategory: (roomCode: string, categoryId: string) => void;
}

export interface QuizContextProviderProps {
  children: ReactNode;
}
