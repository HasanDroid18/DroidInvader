export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EnemyKind = 'bug' | 'error' | 'warn';
export type EnemyMode = 'formation' | 'diving' | 'returning';

export interface Enemy extends Rect {
  id: number;
  kind: EnemyKind;
  hp: number;
  // Formation slot: horizontal offset from screen center, vertical offset
  // from the formation top. Formation-mode enemies derive x/y from these.
  slotX: number;
  slotY: number;
  mode: EnemyMode;
  vx: number;
  vy: number;
  fireCooldown: number; // only 'warn' enemies shoot
  flashTime: number; // hit-flash countdown
}

export interface Bullet extends Rect {
  id: number;
  vx: number;
  vy: number;
}

export type PowerupKind = 'double' | 'rapid' | 'life';

export interface Powerup extends Rect {
  id: number;
  kind: PowerupKind;
  vy: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Player extends Rect {
  fireCooldown: number;
  invulnTime: number;
  weapon: 'single' | 'double';
  rapidTime: number;
}

export interface GameState {
  screenW: number;
  screenH: number;
  time: number;
  wave: number;
  score: number;
  lives: number;
  gameOver: boolean;
  player: Player;
  enemies: Enemy[];
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  powerups: Powerup[];
  particles: Particle[];
  formationY: number; // y of the formation's top row
  diveTimer: number;
  waveBannerTime: number;
  nextId: number;
}

export interface StepInput {
  targetX: number | null;
  targetY: number | null;
}

// Per-step happenings the UI reacts to (haptics, screen transitions).
export interface StepEvents {
  enemyKilled: boolean;
  playerHit: boolean;
  powerup: boolean;
  waveCleared: boolean;
  gameOver: boolean;
}
