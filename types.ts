
export type GameStatus = 'START' | 'PLAYING' | 'GAME_OVER';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  type: 'CACTUS' | 'BIRD' | 'COIN';
  y: number;
  collected?: boolean;
}

export interface GameState {
  score: number;
  coins: number;
  highScore: number;
  status: GameStatus;
  dinoY: number;
  velocity: number;
  isJumping: boolean;
  obstacles: Obstacle[];
  gameSpeed: number;
  aiMessage: string;
  showAiMessage: boolean;
}
