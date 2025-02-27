import { Socket } from 'socket.io-client';
import {
  Player,
  PlayerAnswer,
  Question,
  Option,
  GameResults,
  GameStatus,
} from '../types/player';

export interface QuizContextType {
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

export interface QuizContextProviderProps {
  children: React.ReactNode;
}
