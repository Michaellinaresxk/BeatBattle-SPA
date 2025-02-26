export interface Player {
  playerId: string;
  nickname: string;
  isHost?: boolean;
}

export interface PlayerAnswer {
  nickname: string;
  answer: string;
  correct: boolean;
  points: number;
}

export interface Question {
  id: string;
  question: string;
  order: number;
  totalQuestions: number;
  audioUrl?: string;
  correctOptionId?: string;
  image?: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface GameResults {
  [playerId: string]: {
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
  };
}

export type GameStatus = 'setup' | 'waiting' | 'playing' | 'ended';
