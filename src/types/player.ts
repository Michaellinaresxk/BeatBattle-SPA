export type GameStatus = 'setup' | 'waiting' | 'playing' | 'ended';

export interface Player {
  id: string;
  nickname: string;
  score: number;
  answers: Record<string, string>;
}

export interface PlayerAnswer {
  playerId: string;
  answer: string;
}

export interface Question {
  text: string;
  options: Option[];
  answer: string;
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface GameResults {
  players: Player[];
  questions: Question[];
}
