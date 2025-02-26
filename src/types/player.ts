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
