export type GameStatus = 'setup' | 'waiting' | 'playing' | 'ended';

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
  isCorrect?: boolean; // Añadir propiedad opcional para indicar si la respuesta es correcta
  nickname?: string; // Añadir propiedad opcional para el nombre del jugador
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
