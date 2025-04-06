export type GameStatus =
  | 'setup'
  | 'waiting'
  | 'selection'
  | 'playing'
  | 'ended';

export interface Player {
  id: string;
  playerId?: string;
  nickname: string;
  isHost: boolean;
  score?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
}

export interface PlayerAnswer {
  playerId: string;
  answer: string;
  isCorrect?: boolean;
  nickname?: string;
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

// Actualizar la interfaz GameResults para adaptarla a lo que envía el servidor
export interface GameResults {
  [playerId: string]: {
    nickname: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
  };
}
