import { BOSS_PIXEL } from '../constants';
import { BOSS, spriteCols, spriteRows } from '../sprites';
import { Boss, BossKind, Enemy, GameState, StepEvents } from './types';
import { ENEMY_SIZES } from './waves';

// Boss fights: every 10th wave. Tier = wave / 10; each tier is tougher, and
// the archetype cycles so consecutive bosses play differently:
//   tier 1, 4, 7…  'spreader' — sweeps and fires aimed fan volleys + creeps
//   tier 2, 5, 8…  'rain'     — sweeps fast, drops vertical bullet curtains
//   tier 3, 6, 9…  'charger'  — telegraphs, dive-charges the player, fires a
//                               ring while recovering back to the top
// Every boss enrages below half HP: faster movement and denser fire.
// Pure logic (no react-native / rendering imports) — unit-tested headlessly.

export const BOSS_W = spriteCols(BOSS) * BOSS_PIXEL;
export const BOSS_H = spriteRows(BOSS) * BOSS_PIXEL;
const BOSS_TOP = 100; // y where the boss hovers after flying in
const ENTRY_SPEED = 120;
const ENRAGE_FIRE_MULT = 0.65; // cooldowns shrink when enraged
const ENRAGE_SPEED_MULT = 1.35;

const KIND_CYCLE: BossKind[] = ['spreader', 'rain', 'charger'];

export function bossKind(tier: number): BossKind {
  return KIND_CYCLE[(tier - 1) % KIND_CYCLE.length];
}

export interface BossParams {
  hp: number;
  speed: number; // horizontal sweep px/s
  fireInterval: number;
  spreadCount: number; // bullets per volley (spreader / ring size for charger)
  bulletSpeed: number;
  spawnInterval: number; // s between creep spawns
  maxCreeps: number;
  creepSpeed: number;
  chargeSpeed: number; // charger dive speed
  coinReward: number;
  gemReward: number; // the rare currency — bosses are the reliable source
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
    chargeSpeed: Math.min(380 + 25 * tier, 560),
    coinReward: 20 * tier,
    gemReward: 1 + Math.floor(tier / 2),
    score: 500 * tier,
  };
}

export function createBoss(tier: number, screenW: number): Boss {
  const p = bossParams(tier);
  return {
    kind: bossKind(tier),
    x: screenW / 2 - BOSS_W / 2,
    y: -BOSS_H - 30,
    w: BOSS_W,
    h: BOSS_H,
    hp: p.hp,
    maxHp: p.hp,
    tier,
    dir: 1,
    phase: 0,
    state: 'hover',
    stateTime: 0,
    enraged: false,
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

function fireBullet(s: GameState, x: number, y: number, vx: number, vy: number) {
  s.enemyBullets.push({ id: s.nextId++, x: x - 3, y, w: 6, h: 8, vx, vy });
}

// Aimed fan volley (spreader + enraged charger ring).
function fireSpread(s: GameState, boss: Boss, count: number, bulletSpeed: number) {
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h;
  const px = s.player.x + s.player.w / 2;
  const py = s.player.y + s.player.h / 2;
  const aim = Math.atan2(py - cy, px - cx);
  const spreadStep = 0.22;
  for (let i = 0; i < count; i++) {
    const angle = aim + (i - (count - 1) / 2) * spreadStep;
    fireBullet(s, cx, cy - 4, Math.cos(angle) * bulletSpeed, Math.abs(Math.sin(angle)) * bulletSpeed);
  }
}

// Vertical curtain across the boss's width, with one random safe gap.
function fireCurtain(s: GameState, boss: Boss, params: BossParams, rng: () => number) {
  const columns = 5 + Math.min(boss.tier, 4);
  const gap = Math.floor(rng() * columns);
  for (let i = 0; i < columns; i++) {
    if (i === gap) continue;
    const x = boss.x + (i + 0.5) * (boss.w / columns);
    fireBullet(s, x, boss.y + boss.h - 4, 0, params.bulletSpeed);
  }
}

// Downward half-ring fired while the charger recovers.
function fireRing(s: GameState, boss: Boss, params: BossParams) {
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h;
  const count = params.spreadCount + 2;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * (i + 0.5)) / count; // 0..PI, pointing down
    fireBullet(s, cx, cy - 4, Math.cos(angle) * params.bulletSpeed, Math.sin(angle) * params.bulletSpeed);
  }
}

function sweep(s: GameState, boss: Boss, speed: number, dt: number) {
  boss.x += boss.dir * speed * dt;
  if (boss.x < 8) {
    boss.x = 8;
    boss.dir = 1;
  } else if (boss.x + boss.w > s.screenW - 8) {
    boss.x = s.screenW - 8 - boss.w;
    boss.dir = -1;
  }
  boss.y = BOSS_TOP + Math.sin(boss.phase * 1.4) * 10;
}

// Advance the boss by dt: fly in, then run its archetype's attack pattern.
// Mutates state; bullet/creep collision handling stays in engine.step.
export function stepBoss(s: GameState, dt: number, ev: StepEvents, rng: () => number = Math.random) {
  const boss = s.boss;
  if (!boss) return;
  const params = bossParams(boss.tier);

  boss.flashTime = Math.max(0, boss.flashTime - dt);
  boss.phase += dt;
  boss.stateTime += dt;

  if (!boss.enraged && boss.hp <= boss.maxHp / 2) {
    boss.enraged = true;
    boss.fireCooldown = Math.min(boss.fireCooldown, 0.4); // angry immediately
  }
  const fireMult = boss.enraged ? ENRAGE_FIRE_MULT : 1;
  const speedMult = boss.enraged ? ENRAGE_SPEED_MULT : 1;

  // Fly in, then attack. The hover bob stays within BOSS_TOP ± 10, so only a
  // genuinely-still-entering boss sits below this threshold.
  if (boss.y < BOSS_TOP - 11) {
    boss.y = Math.min(boss.y + ENTRY_SPEED * dt, BOSS_TOP);
    if (boss.y < BOSS_TOP) return; // no attacks until in position
  }
  if (s.waveBannerTime > 0) return; // hold fire behind the banner

  // --- movement + primary attack by archetype
  if (boss.kind === 'charger') {
    stepCharger(s, boss, params, dt, fireMult, speedMult, rng);
  } else {
    const sweepSpeed = boss.kind === 'rain' ? params.speed * 1.6 : params.speed;
    sweep(s, boss, sweepSpeed * speedMult, dt);

    boss.fireCooldown -= dt;
    if (boss.fireCooldown <= 0) {
      boss.fireCooldown = params.fireInterval * fireMult * (0.85 + rng() * 0.3);
      if (boss.kind === 'rain') fireCurtain(s, boss, params, rng);
      else fireSpread(s, boss, params.spreadCount + (boss.enraged ? 2 : 0), params.bulletSpeed);
    }
  }

  // --- creep escort (all archetypes)
  boss.spawnCooldown -= dt;
  if (boss.spawnCooldown <= 0) {
    boss.spawnCooldown = params.spawnInterval * (0.8 + rng() * 0.4);
    const batch = Math.min(1 + Math.floor(boss.tier / 2), params.maxCreeps - s.enemies.length);
    for (let i = 0; i < batch; i++) spawnCreep(s, boss, params, rng);
  }
}

// hover (sweep + light spreads) -> telegraph (shake in place) ->
// charge (dive at the player) -> recover (ring + glide back up) -> hover
function stepCharger(
  s: GameState,
  boss: Boss,
  params: BossParams,
  dt: number,
  fireMult: number,
  speedMult: number,
  rng: () => number
) {
  switch (boss.state) {
    case 'hover': {
      sweep(s, boss, params.speed * speedMult, dt);
      boss.fireCooldown -= dt;
      if (boss.fireCooldown <= 0) {
        boss.fireCooldown = params.fireInterval * fireMult * (0.85 + rng() * 0.3);
        fireSpread(s, boss, Math.max(params.spreadCount - 1, 2), params.bulletSpeed);
      }
      const hoverTime = (boss.enraged ? 3.2 : 4.5) * (0.8 + rng() * 0.4);
      if (boss.stateTime >= hoverTime) {
        boss.state = 'telegraph';
        boss.stateTime = 0;
      }
      return;
    }
    case 'telegraph': {
      // Shudder in place over the player's column — the "get out of the way" cue.
      boss.x += Math.sin(boss.stateTime * 45) * 3;
      if (boss.stateTime >= 0.7) {
        boss.state = 'charge';
        boss.stateTime = 0;
        boss.dir = s.player.x + s.player.w / 2 > boss.x + boss.w / 2 ? 1 : -1;
      }
      return;
    }
    case 'charge': {
      // Dive toward where the player was, with mild horizontal homing.
      const px = s.player.x + s.player.w / 2;
      const cx = boss.x + boss.w / 2;
      boss.x += Math.sign(px - cx) * Math.min(Math.abs(px - cx) / Math.max(dt, 1e-6), 160) * dt;
      boss.y += params.chargeSpeed * speedMult * dt;
      if (boss.y > s.screenH - boss.h - 40) {
        boss.state = 'recover';
        boss.stateTime = 0;
        fireRing(s, boss, params);
      }
      return;
    }
    case 'recover': {
      boss.y -= params.chargeSpeed * 0.55 * dt;
      if (boss.y <= BOSS_TOP) {
        boss.y = BOSS_TOP;
        boss.state = 'hover';
        boss.stateTime = 0;
      }
      return;
    }
  }
}
