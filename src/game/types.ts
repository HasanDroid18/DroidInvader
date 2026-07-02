export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EnemyKind = 'bug' | 'error' | 'warn';
// 'creep' = boss minion: no formation slot, sine-descends and wraps to the top.
export type EnemyMode = 'formation' | 'diving' | 'returning' | 'creep';

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
  phase: number; // creep sine phase
  fireCooldown: number; // only 'warn' enemies shoot
  flashTime: number; // hit-flash countdown
}

export interface Boss extends Rect {
  hp: number;
  maxHp: number;
  tier: number; // wave / 10
  dir: 1 | -1; // horizontal sweep direction
  phase: number; // for the vertical bob
  fireCooldown: number;
  spawnCooldown: number;
  flashTime: number;
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

export interface CoinDrop extends Rect {
  id: number;
  vx: number;
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
  runCoins: number; // coins collected this run, banked on game over / quit
  scoreMultTime: number; // >0 while the x2 score booster is active
  playerColor: string; // hex, for hit particles
  gameOver: boolean;
  player: Player;
  enemies: Enemy[];
  boss: Boss | null; // present only on boss waves (every 10th)
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  powerups: Powerup[];
  coinDrops: CoinDrop[];
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

// What a fresh run starts with (armed boosters, cosmetics).
export interface RunOptions {
  rapidDuration?: number; // s of rapid fire from the armed booster
  scoreMultDuration?: number; // s of x2 score from the armed booster
  spiderColorHex?: string;
}

// Per-step happenings the UI reacts to (sfx, haptics, screen transitions).
export interface StepEvents {
  shot: boolean;
  hit: boolean; // bullet connected but the target survived
  enemyKilled: boolean;
  playerHit: boolean;
  powerup: boolean;
  coin: boolean;
  waveCleared: boolean;
  bossDefeated: boolean;
  gameOver: boolean;
}
