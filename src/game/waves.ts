import {
  FORMATION_SLOT_H,
  FORMATION_SLOT_W,
  PIXEL,
} from '../constants';
import { ALIEN_CRAB, ALIEN_SAUCER, ALIEN_SQUID, spriteCols, spriteRows } from '../sprites';
import { Enemy, EnemyKind } from './types';

// Everything about wave N is derived here so difficulty scales in one place.
//
// Pacing (Subway-Surfers style): the first waves are genuinely easy — small
// all-bug grids, no shooters, no dives — and pressure is added slowly:
//   wave 3+  shooters (top row) and dive attacks
//   wave 5+  tough error glyphs mixed in
//   wave 7, 14, 21… (non-boss) swarm waves — a stream of sine-divers
//   wave 10, 20, 30… boss fights (see boss.ts)
// All values have soft caps so deep runs stay relentless but playable.

export const DIVES_FROM_WAVE = 3;
export const WARNS_FROM_WAVE = 3;
export const ERRORS_FROM_WAVE = 5;

export interface WaveParams {
  cols: number;
  rows: number;
  swayAmp: number; // px of horizontal formation sway
  swaySpeed: number; // rad/s
  descentSpeed: number; // px/s the settled formation creeps down
  diveInterval: number; // s between dive attacks (Infinity = no dives yet)
  diveSpeed: number; // initial dive vy
  fireInterval: number; // s between shots per 'warn' enemy
  bulletSpeed: number; // enemy bullet vy
  hpBonus: number; // extra hp on every enemy
}

export function waveParams(n: number): WaveParams {
  return {
    cols: Math.min(4 + Math.floor(n / 4), 8),
    rows: Math.min(2 + Math.floor(n / 3), 5),
    swayAmp: Math.min(14 + n * 1.5, 46),
    swaySpeed: Math.min(0.5 + n * 0.04, 1.5),
    descentSpeed: Math.min(2 + n * 0.5, 12),
    diveInterval: n < DIVES_FROM_WAVE ? Infinity : Math.max(7.5 - n * 0.25, 2.4),
    diveSpeed: Math.min(120 + n * 8, 320),
    fireInterval: Math.max(3.0 - n * 0.09, 1.1),
    bulletSpeed: Math.min(150 + n * 7, 320),
    hpBonus: Math.floor(n / 10),
  };
}

// Every 10th wave is a boss fight instead of a formation.
export function isBossWave(n: number): boolean {
  return n > 0 && n % 10 === 0;
}

// Every 7th wave (unless it collides with a boss) is a swarm: no formation,
// just a stream of sine-diving creeps.
export function isSwarmWave(n: number): boolean {
  return n > 0 && n % 7 === 0 && !isBossWave(n);
}

export const ENEMY_SIZES: Record<EnemyKind, { w: number; h: number }> = {
  bug: { w: spriteCols(ALIEN_CRAB) * PIXEL, h: spriteRows(ALIEN_CRAB) * PIXEL },
  error: { w: spriteCols(ALIEN_SQUID) * PIXEL, h: spriteRows(ALIEN_SQUID) * PIXEL },
  warn: { w: spriteCols(ALIEN_SAUCER) * PIXEL, h: spriteRows(ALIEN_SAUCER) * PIXEL },
};

const BASE_HP: Record<EnemyKind, number> = { bug: 1, warn: 1, error: 2 };

// --- formation patterns -----------------------------------------------------
// A pattern decides which (row, col) slots of the grid are occupied, so waves
// keep the same difficulty budget but read differently on screen.

export type PatternName = 'grid' | 'vee' | 'diamond' | 'columns' | 'arc';

const PATTERN_CYCLE: PatternName[] = ['grid', 'vee', 'columns', 'diamond', 'arc'];

export function formationPattern(n: number): PatternName {
  if (n <= 2) return 'grid'; // keep the opening waves plain and readable
  return PATTERN_CYCLE[(n - 3) % PATTERN_CYCLE.length];
}

function slotOccupied(pattern: PatternName, r: number, c: number, rows: number, cols: number): boolean {
  const mid = (cols - 1) / 2;
  switch (pattern) {
    case 'grid':
      return true;
    case 'vee':
      // wings sweep down and outwards: row r keeps cols at distance >= mid - r
      return Math.abs(c - mid) >= Math.max(mid - r, 0) - 0.01;
    case 'diamond': {
      const rMid = (rows - 1) / 2;
      return Math.abs(c - mid) + Math.abs(r - rMid) <= mid + 0.01;
    }
    case 'columns':
      // two flanking blocks with a corridor in the middle
      return Math.abs(c - mid) > mid / 2 - 0.01;
    case 'arc':
      // shallow upside-down arc: middle columns sit one row lower
      return r > 0 || Math.abs(c - mid) > mid * 0.55;
  }
}

function slotKind(n: number, row: number, rng: () => number): EnemyKind {
  if (row === 0 && n >= WARNS_FROM_WAVE) return 'warn';
  if (n >= ERRORS_FROM_WAVE && rng() < Math.min(0.05 + n * 0.02, 0.35)) return 'error';
  return 'bug';
}

function makeEnemy(
  id: number,
  kind: EnemyKind,
  slotX: number,
  slotY: number,
  x: number,
  y: number,
  hpBonus: number,
  fireInterval: number,
  rng: () => number
): Enemy {
  const size = ENEMY_SIZES[kind];
  return {
    id,
    kind,
    hp: BASE_HP[kind] + hpBonus,
    slotX,
    slotY,
    mode: 'formation',
    x,
    y,
    w: size.w,
    h: size.h,
    vx: 0,
    vy: 0,
    phase: 0,
    fireCooldown: kind === 'warn' ? 1 + rng() * fireInterval * 2 : 0,
    flashTime: 0,
  };
}

export function createWave(
  n: number,
  screenW: number,
  startId: number,
  rng: () => number = Math.random
): { enemies: Enemy[]; nextId: number } {
  if (isSwarmWave(n)) return createSwarm(n, screenW, startId, rng);

  const p = waveParams(n);
  const pattern = formationPattern(n);
  const enemies: Enemy[] = [];
  let id = startId;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (!slotOccupied(pattern, r, c, p.rows, p.cols)) continue;
      const kind = slotKind(n, r, rng);
      const size = ENEMY_SIZES[kind];
      const slotX = (c - (p.cols - 1) / 2) * FORMATION_SLOT_W;
      const slotY = r * FORMATION_SLOT_H;
      enemies.push(
        makeEnemy(
          id++,
          kind,
          slotX,
          slotY,
          screenW / 2 + slotX - size.w / 2,
          -200 + slotY,
          p.hpBonus,
          p.fireInterval,
          rng
        )
      );
    }
  }
  return { enemies, nextId: id };
}

// Swarm wave: the whole difficulty budget spent on 'creep'-mode divers that
// stream in from the top and wrap until shot down.
function createSwarm(
  n: number,
  screenW: number,
  startId: number,
  rng: () => number
): { enemies: Enemy[]; nextId: number } {
  const p = waveParams(n);
  const count = Math.min(8 + Math.floor(n / 2), 18);
  const enemies: Enemy[] = [];
  let id = startId;
  for (let i = 0; i < count; i++) {
    const kind: EnemyKind = n >= ERRORS_FROM_WAVE && rng() < 0.2 ? 'error' : 'bug';
    const size = ENEMY_SIZES[kind];
    const e = makeEnemy(
      id++,
      kind,
      0,
      0,
      rng() * (screenW - size.w),
      // staggered entries so they arrive as a stream, not a blob
      -size.h - 20 - i * 70,
      p.hpBonus,
      p.fireInterval,
      rng
    );
    e.mode = 'creep';
    e.vy = Math.min(100 + n * 6, 220) * (0.85 + rng() * 0.3);
    e.phase = rng() * Math.PI * 2;
    enemies.push(e);
  }
  return { enemies, nextId: id };
}
