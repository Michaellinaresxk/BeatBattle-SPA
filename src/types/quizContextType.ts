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
  connectionError: string | null;
  isConnecting: boolean;
  roomCode: string;
  players: Player[];
  isHost: boolean;
  gameStatus: GameStatus;
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
  leaveRoom: () => void;
}

export interface QuizContextProviderProps {
  children: ReactNode;
}
