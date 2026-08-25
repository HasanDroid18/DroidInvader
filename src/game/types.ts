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

export type BossKind = 'spreader' | 'rain' | 'charger';
// Charger boss state machine: hover -> telegraph -> charge -> recover.
export type BossState = 'hover' | 'telegraph' | 'charge' | 'recover';

export interface Boss extends Rect {
  kind: BossKind;
  hp: number;
  maxHp: number;
  tier: number; // wave / 10
  dir: 1 | -1; // horizontal sweep direction
  phase: number; // for the vertical bob
  state: BossState; // used by the charger archetype
  stateTime: number;
  enraged: boolean; // below half HP: faster, angrier
  fireCooldown: number;
  spawnCooldown: number;
  flashTime: number;
}

export interface Bullet extends Rect {
  id: number;
  vx: number;
  vy: number;
}

export type PowerupKind = 'double' | 'rapid' | 'life' | 'shield';

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

export interface GemDrop extends Rect {
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
  shieldTime: number; // full immunity while > 0 (absorbs bullets)
}

export interface GameState {
  screenW: number;
  screenH: number;
  time: number;
  wave: number;
  score: number;
  lives: number;
  runCoins: number; // coins collected this run, banked on game over / quit
  runGems: number; // gems collected this run (rare), banked the same way
  revivesUsed: number; // escalates the gem price of the next revive
  shieldPickupDuration: number; // s granted by shield pickups (shop level)
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
  gemDrops: GemDrop[];
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
  shieldLevel?: number; // shop level; sets the duration of shield pickups
  robotColorHex?: string;
}

// Per-step happenings the UI reacts to (sfx, haptics, screen transitions).
export interface StepEvents {
  shot: boolean;
  hit: boolean; // bullet connected but the target survived
  enemyKilled: boolean;
  playerHit: boolean;
  powerup: boolean;
  coin: boolean;
  gem: boolean;
  shielded: boolean; // the shield absorbed damage this step
  waveCleared: boolean;
  bossDefeated: boolean;
  gameOver: boolean;
}
