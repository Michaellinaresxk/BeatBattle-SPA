export type GameStatus = 'setup' | 'waiting' | 'playing' | 'ended';

export interface Player {
  id: string;
  playerId?: string; // Para compatibilidad
  nickname: string;
  isHost: boolean;
  score?: number;
}

export interface PlayerAnswer {
  playerId: string;
  answer: string;
}

export interface Question {
  id: string;
  question: string;
  correctOptionId: string;
  order: number;
  totalQuestions: number;
  audioUrl?: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface GameResults {
  players: Player[];
  questions: Question[];
}
