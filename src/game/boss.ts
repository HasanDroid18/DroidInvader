import { BOSS_PIXEL } from '../constants';
import { BOSS, spriteCols, spriteRows } from '../sprites';
import { Boss, Enemy, GameState, StepEvents } from './types';
import { ENEMY_SIZES } from './waves';

// Boss fights: every 10th wave. Tier = wave / 10; each tier is tougher.
// Pure logic (no react-native / rendering imports) — unit-tested headlessly.

export const BOSS_W = spriteCols(BOSS) * BOSS_PIXEL;
export const BOSS_H = spriteRows(BOSS) * BOSS_PIXEL;
const BOSS_TOP = 100; // y where the boss hovers after flying in
const ENTRY_SPEED = 120;

export interface BossParams {
  hp: number;
  speed: number; // horizontal sweep px/s
  fireInterval: number;
  spreadCount: number; // bullets per volley
  bulletSpeed: number;
  spawnInterval: number; // s between creep spawns
  maxCreeps: number;
  creepSpeed: number;
  coinReward: number;
  score: number;
}

export function bossParams(tier: number): BossParams {
  return {
    hp: Math.round(70 * tier * (1 + 0.1 * (tier - 1))),
    speed: Math.min(60 + 12 * tier, 140),
    fireInterval: Math.max(2.2 - 0.15 * tier, 1.1),
    spreadCount: Math.min(2 + tier, 7),
    bulletSpeed: Math.min(200 + 15 * tier, 340),
    spawnInterval: Math.max(6 - 0.4 * tier, 3),
    maxCreeps: Math.min(2 + tier, 6),
    creepSpeed: Math.min(90 + 12 * tier, 200),
    coinReward: 20 * tier,
    score: 500 * tier,
  };
}

export function createBoss(tier: number, screenW: number): Boss {
  const p = bossParams(tier);
  return {
    x: screenW / 2 - BOSS_W / 2,
    y: -BOSS_H - 30,
    w: BOSS_W,
    h: BOSS_H,
    hp: p.hp,
    maxHp: p.hp,
    tier,
    dir: 1,
    phase: 0,
    fireCooldown: 1.5,
    spawnCooldown: 1.0,
    flashTime: 0,
  };
}

function spawnCreep(s: GameState, boss: Boss, params: BossParams, rng: () => number) {
  const kind = rng() < 0.3 ? 'error' : 'bug';
  const size = ENEMY_SIZES[kind];
  const creep: Enemy = {
    id: s.nextId++,
    kind,
    hp: 1 + Math.floor(boss.tier / 4),
    slotX: 0,
    slotY: 0,
    mode: 'creep',
    x: boss.x + boss.w / 2 - size.w / 2 + (rng() - 0.5) * boss.w * 0.6,
    y: boss.y + boss.h - 10,
    w: size.w,
    h: size.h,
    vx: 0,
    vy: params.creepSpeed,
    phase: rng() * Math.PI * 2,
    fireCooldown: 0,
    flashTime: 0,
  };
  s.enemies.push(creep);
}

// Advance the boss by dt: fly in, sweep, volley aimed spreads, spawn creeps.
// Mutates state; bullet/creep collision handling stays in engine.step.
export function stepBoss(s: GameState, dt: number, ev: StepEvents, rng: () => number = Math.random) {
  const boss = s.boss;
  if (!boss) return;
  const params = bossParams(boss.tier);

  boss.flashTime = Math.max(0, boss.flashTime - dt);
  boss.phase += dt;

  // Fly in, then sweep horizontally with a slight bob.
  if (boss.y < BOSS_TOP) {
    boss.y = Math.min(boss.y + ENTRY_SPEED * dt, BOSS_TOP);
    return; // no attacks until in position
  }
  boss.x += boss.dir * params.speed * dt;
  if (boss.x < 8) {
    boss.x = 8;
    boss.dir = 1;
  } else if (boss.x + boss.w > s.screenW - 8) {
    boss.x = s.screenW - 8 - boss.w;
    boss.dir = -1;
  }
  boss.y = BOSS_TOP + Math.sin(boss.phase * 1.4) * 10;

  if (s.waveBannerTime > 0) return; // hold fire behind the banner

  // Aimed spread volley at the player.
  boss.fireCooldown -= dt;
  if (boss.fireCooldown <= 0) {
    boss.fireCooldown = params.fireInterval * (0.85 + rng() * 0.3);
    const cx = boss.x + boss.w / 2;
    const cy = boss.y + boss.h;
    const px = s.player.x + s.player.w / 2;
    const py = s.player.y + s.player.h / 2;
    const aim = Math.atan2(py - cy, px - cx);
    const n = params.spreadCount;
    const spreadStep = 0.22;
    for (let i = 0; i < n; i++) {
      const angle = aim + (i - (n - 1) / 2) * spreadStep;
      s.enemyBullets.push({
        id: s.nextId++,
        x: cx - 3,
        y: cy - 4,
        w: 6,
        h: 8,
        vx: Math.cos(angle) * params.bulletSpeed,
        vy: Math.abs(Math.sin(angle)) * params.bulletSpeed, // always downward
      });
    }
  }

  // Keep a small escort of creeps alive.
  boss.spawnCooldown -= dt;
  if (boss.spawnCooldown <= 0) {
    boss.spawnCooldown = params.spawnInterval * (0.8 + rng() * 0.4);
    const alive = s.enemies.length;
    const batch = Math.min(1 + Math.floor(boss.tier / 2), params.maxCreeps - alive);
    for (let i = 0; i < batch; i++) spawnCreep(s, boss, params, rng);
  }
}
