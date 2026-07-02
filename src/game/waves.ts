import {
  FORMATION_SLOT_H,
  FORMATION_SLOT_W,
  PIXEL,
} from '../constants';
import { BUG, ERROR_GLYPH, WARN_GLYPH, spriteCols, spriteRows } from '../sprites';
import { Enemy, EnemyKind } from './types';

// Everything about wave N is derived here so difficulty scales in one place.
// All values have soft caps so the game stays playable (but relentless)
// arbitrarily deep into a run.

export interface WaveParams {
  cols: number;
  rows: number;
  swayAmp: number; // px of horizontal formation sway
  swaySpeed: number; // rad/s
  descentSpeed: number; // px/s the settled formation creeps down
  diveInterval: number; // s between dive attacks
  diveSpeed: number; // initial dive vy
  fireInterval: number; // s between shots per 'warn' enemy
  bulletSpeed: number; // enemy bullet vy
  hpBonus: number; // extra hp on every enemy
}

// Every 10th wave is a boss fight instead of a formation.
export function isBossWave(n: number): boolean {
  return n > 0 && n % 10 === 0;
}

export function waveParams(n: number): WaveParams {
  return {
    cols: Math.min(5 + Math.floor(n / 3), 8),
    rows: Math.min(2 + Math.floor((n - 1) / 2), 5),
    swayAmp: Math.min(18 + n * 2, 46),
    swaySpeed: Math.min(0.6 + n * 0.05, 1.5),
    descentSpeed: Math.min(3 + n * 0.7, 13),
    diveInterval: Math.max(6.5 - n * 0.3, 2.2),
    diveSpeed: Math.min(130 + n * 9, 330),
    fireInterval: Math.max(2.6 - n * 0.1, 1.0),
    bulletSpeed: Math.min(170 + n * 8, 330),
    hpBonus: Math.floor(n / 8),
  };
}

export const ENEMY_SIZES: Record<EnemyKind, { w: number; h: number }> = {
  bug: { w: spriteCols(BUG) * PIXEL, h: spriteRows(BUG) * PIXEL },
  error: { w: spriteCols(ERROR_GLYPH) * PIXEL, h: spriteRows(ERROR_GLYPH) * PIXEL },
  warn: { w: spriteCols(WARN_GLYPH) * PIXEL, h: spriteRows(WARN_GLYPH) * PIXEL },
};

const BASE_HP: Record<EnemyKind, number> = { bug: 1, warn: 1, error: 2 };

function slotKind(n: number, row: number, rng: () => number): EnemyKind {
  // Top row turns into shooters from wave 2; error glyphs get sprinkled in
  // from wave 3, more often as waves go on.
  if (row === 0 && n >= 2) return 'warn';
  if (n >= 3 && rng() < Math.min(0.08 + n * 0.03, 0.35)) return 'error';
  return 'bug';
}

export function createWave(
  n: number,
  screenW: number,
  startId: number,
  rng: () => number = Math.random
): { enemies: Enemy[]; nextId: number } {
  const p = waveParams(n);
  const enemies: Enemy[] = [];
  let id = startId;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const kind = slotKind(n, r, rng);
      const size = ENEMY_SIZES[kind];
      const slotX = (c - (p.cols - 1) / 2) * FORMATION_SLOT_W;
      const slotY = r * FORMATION_SLOT_H;
      enemies.push({
        id: id++,
        kind,
        hp: BASE_HP[kind] + p.hpBonus,
        slotX,
        slotY,
        mode: 'formation',
        x: screenW / 2 + slotX - size.w / 2,
        y: -200 + slotY,
        w: size.w,
        h: size.h,
        vx: 0,
        vy: 0,
        phase: 0,
        fireCooldown: kind === 'warn' ? 1 + rng() * p.fireInterval * 2 : 0,
        flashTime: 0,
      });
    }
  }
  return { enemies, nextId: id };
}
