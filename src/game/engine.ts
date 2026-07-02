import * as C from '../constants';
import { SPIDER, spriteCols, spriteRows } from '../sprites';
import { intersects } from './collision';
import {
  Bullet,
  Enemy,
  GameState,
  Powerup,
  PowerupKind,
  StepEvents,
  StepInput,
} from './types';
import { createWave, waveParams } from './waves';

const PLAYER_W = spriteCols(SPIDER) * C.PIXEL;
const PLAYER_H = spriteRows(SPIDER) * C.PIXEL;

const KILL_SCORE: Record<Enemy['kind'], number> = {
  bug: C.SCORE_BUG,
  warn: C.SCORE_WARN,
  error: C.SCORE_ERROR,
};

const ENEMY_COLOR: Record<Enemy['kind'], string> = {
  bug: C.COLORS.bugGreen,
  warn: C.COLORS.warnYellow,
  error: C.COLORS.errorRed,
};

export function createGameState(screenW: number, screenH: number): GameState {
  const wave = createWave(1, screenW, 1);
  return {
    screenW,
    screenH,
    time: 0,
    wave: 1,
    score: 0,
    lives: C.START_LIVES,
    gameOver: false,
    player: {
      x: screenW / 2 - PLAYER_W / 2,
      y: screenH - PLAYER_H - 110,
      w: PLAYER_W,
      h: PLAYER_H,
      fireCooldown: 0.4,
      invulnTime: 0,
      weapon: 'single',
      rapidTime: 0,
    },
    enemies: wave.enemies,
    playerBullets: [],
    enemyBullets: [],
    powerups: [],
    particles: [],
    formationY: -220,
    diveTimer: 4,
    waveBannerTime: C.WAVE_BANNER_TIME,
    nextId: wave.nextId,
  };
}

function newEvents(): StepEvents {
  return {
    enemyKilled: false,
    playerHit: false,
    powerup: false,
    waveCleared: false,
    gameOver: false,
  };
}

function moveToward(current: number, target: number, maxDelta: number): number {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}

function spawnParticles(s: GameState, cx: number, cy: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 160;
    const life = 0.35 + Math.random() * 0.3;
    s.particles.push({
      id: s.nextId++,
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life,
      maxLife: life,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function damagePlayer(s: GameState, ev: StepEvents) {
  if (s.player.invulnTime > 0 || s.gameOver) return;
  s.lives -= 1;
  s.player.invulnTime = C.INVULN_TIME;
  s.player.weapon = 'single';
  s.player.rapidTime = 0;
  ev.playerHit = true;
  spawnParticles(
    s,
    s.player.x + s.player.w / 2,
    s.player.y + s.player.h / 2,
    C.COLORS.terracotta,
    14
  );
  if (s.lives <= 0) {
    s.gameOver = true;
    ev.gameOver = true;
  }
}

function killEnemy(s: GameState, enemy: Enemy, ev: StepEvents, scored: boolean) {
  ev.enemyKilled = true;
  if (scored) {
    const mult = enemy.mode === 'diving' ? C.DIVER_MULTIPLIER : 1;
    s.score += KILL_SCORE[enemy.kind] * mult;
  }
  spawnParticles(s, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, ENEMY_COLOR[enemy.kind], 9);
  if (scored) maybeDropPowerup(s, enemy);
}

function maybeDropPowerup(s: GameState, enemy: Enemy) {
  const r = Math.random();
  let kind: PowerupKind | null = null;
  if (r < C.DROP_LIFE_CHANCE) kind = 'life';
  else if (r < C.DROP_RAPID_CHANCE) kind = 'rapid';
  else if (r < C.DROP_DOUBLE_CHANCE) kind = 'double';
  if (!kind) return;
  s.powerups.push({
    id: s.nextId++,
    kind,
    x: enemy.x + enemy.w / 2 - 10,
    y: enemy.y + enemy.h / 2,
    w: 20,
    h: 18,
    vy: C.POWERUP_FALL_SPEED,
  });
}

function applyPowerup(s: GameState, p: Powerup) {
  if (p.kind === 'life') {
    if (s.lives < C.MAX_LIVES) s.lives += 1;
    else s.score += 50;
  } else if (p.kind === 'rapid') {
    s.player.rapidTime = C.RAPID_DURATION;
  } else {
    if (s.player.weapon === 'double') s.score += 50;
    else s.player.weapon = 'double';
  }
}

function firePlayerBullets(s: GameState) {
  const p = s.player;
  const cx = p.x + p.w / 2;
  const xs = p.weapon === 'double' ? [cx - 12, cx + 12] : [cx];
  for (const x of xs) {
    s.playerBullets.push({
      id: s.nextId++,
      x: x - 2,
      y: p.y - 10,
      w: 4,
      h: 10,
      vx: 0,
      vy: -C.BULLET_SPEED,
    });
  }
}

// Advance the whole game by dt seconds. Mutates state in place and returns
// the events the UI layer should react to. Pure with respect to everything
// except Math.random, so it is unit-testable without a device.
export function step(s: GameState, dt: number, input: StepInput): StepEvents {
  const ev = newEvents();
  if (s.gameOver) return ev;

  s.time += dt;
  const params = waveParams(s.wave);
  const p = s.player;

  if (s.waveBannerTime > 0) s.waveBannerTime -= dt;

  // --- player: chase the drag target, clamped to the lower part of the screen
  if (input.targetX != null) p.x = moveToward(p.x, input.targetX, C.PLAYER_MAX_SPEED * dt);
  if (input.targetY != null) p.y = moveToward(p.y, input.targetY, C.PLAYER_MAX_SPEED * dt);
  p.x = Math.min(Math.max(p.x, 4), s.screenW - p.w - 4);
  p.y = Math.min(Math.max(p.y, s.screenH * 0.4), s.screenH - p.h - 24);

  p.invulnTime = Math.max(0, p.invulnTime - dt);
  p.rapidTime = Math.max(0, p.rapidTime - dt);

  // --- auto-fire
  p.fireCooldown -= dt;
  if (p.fireCooldown <= 0) {
    p.fireCooldown = p.rapidTime > 0 ? C.RAPID_FIRE_INTERVAL : C.FIRE_INTERVAL;
    firePlayerBullets(s);
  }

  // --- formation motion: fly in fast, then creep downward while swaying
  const entered = s.formationY >= C.FORMATION_TOP;
  if (!entered) {
    s.formationY = Math.min(
      s.formationY + C.FORMATION_ENTRY_SPEED * dt,
      C.FORMATION_TOP
    );
  } else {
    s.formationY += params.descentSpeed * dt;
  }
  const swayX = Math.sin(s.time * params.swaySpeed) * params.swayAmp;

  // --- enemies
  const playerCx = p.x + p.w / 2;
  let breachedLife = false;
  for (let i = s.enemies.length - 1; i >= 0; i--) {
    const e = s.enemies[i];
    e.flashTime = Math.max(0, e.flashTime - dt);

    const slotScreenX = s.screenW / 2 + e.slotX - e.w / 2 + swayX;
    const slotScreenY = s.formationY + e.slotY;

    if (e.mode === 'formation') {
      e.x = slotScreenX;
      e.y = slotScreenY;

      if (e.kind === 'warn' && entered && s.waveBannerTime <= 0) {
        e.fireCooldown -= dt;
        if (e.fireCooldown <= 0) {
          e.fireCooldown = params.fireInterval * (0.7 + Math.random() * 0.8);
          s.enemyBullets.push({
            id: s.nextId++,
            x: e.x + e.w / 2 - 2,
            y: e.y + e.h,
            w: 4,
            h: 10,
            vx: 0,
            vy: params.bulletSpeed,
          });
        }
      }

      // Formation ground breach: enemy is removed and costs a life.
      if (e.y + e.h > s.screenH - C.BOTTOM_MARGIN) {
        s.enemies.splice(i, 1);
        breachedLife = true;
        continue;
      }
    } else if (e.mode === 'diving') {
      e.vy += C.DIVE_GRAVITY * dt;
      e.vx += Math.sign(playerCx - (e.x + e.w / 2)) * C.DIVE_HOMING * dt;
      e.vx = Math.min(Math.max(e.vx, -C.DIVE_MAX_VX), C.DIVE_MAX_VX);
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.y > s.screenH + 40) {
        // Missed: loop back in from the top and rejoin the formation.
        e.mode = 'returning';
        e.y = -e.h - 20;
        e.vx = 0;
        e.vy = 0;
      }
    } else {
      // returning: glide back to the formation slot
      const dx = slotScreenX - e.x;
      const dy = slotScreenY - e.y;
      const dist = Math.hypot(dx, dy);
      const stepDist = C.RETURN_SPEED * dt;
      if (dist <= stepDist || dist < 6) {
        e.x = slotScreenX;
        e.y = slotScreenY;
        e.mode = 'formation';
      } else {
        e.x += (dx / dist) * stepDist;
        e.y += (dy / dist) * stepDist;
      }
    }
  }
  if (breachedLife) {
    // Bypasses invulnerability on purpose: letting the swarm land always hurts.
    s.lives -= 1;
    s.player.invulnTime = Math.max(s.player.invulnTime, C.INVULN_TIME);
    ev.playerHit = true;
    if (s.lives <= 0) {
      s.gameOver = true;
      ev.gameOver = true;
    }
  }

  // --- dive attacks
  if (entered && s.waveBannerTime <= 0 && s.enemies.length > 0) {
    s.diveTimer -= dt;
    if (s.diveTimer <= 0) {
      s.diveTimer = params.diveInterval * (0.75 + Math.random() * 0.5);
      const inFormation = s.enemies.filter((e) => e.mode === 'formation');
      const errors = inFormation.filter((e) => e.kind === 'error');
      const pool = errors.length > 0 ? errors : inFormation;
      if (pool.length > 0) {
        const diver = pool[Math.floor(Math.random() * pool.length)];
        diver.mode = 'diving';
        diver.vx = 0;
        diver.vy = params.diveSpeed * 0.6;
      }
    }
  }

  // --- bullets
  for (let i = s.playerBullets.length - 1; i >= 0; i--) {
    const b = s.playerBullets[i];
    b.y += b.vy * dt;
    if (b.y + b.h < -20) s.playerBullets.splice(i, 1);
  }
  for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
    const b = s.enemyBullets[i];
    b.y += b.vy * dt;
    if (b.y > s.screenH + 20) s.enemyBullets.splice(i, 1);
  }

  // --- player bullets vs enemies
  for (let bi = s.playerBullets.length - 1; bi >= 0; bi--) {
    const b = s.playerBullets[bi];
    for (let eiIdx = s.enemies.length - 1; eiIdx >= 0; eiIdx--) {
      const e = s.enemies[eiIdx];
      if (!intersects(b, e)) continue;
      s.playerBullets.splice(bi, 1);
      e.hp -= 1;
      e.flashTime = 0.08;
      if (e.hp <= 0) {
        s.enemies.splice(eiIdx, 1);
        killEnemy(s, e, ev, true);
      }
      break;
    }
  }

  // --- enemy bullets & enemy bodies vs player
  for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
    if (intersects(s.enemyBullets[i], p)) {
      s.enemyBullets.splice(i, 1);
      damagePlayer(s, ev);
    }
  }
  for (let i = s.enemies.length - 1; i >= 0; i--) {
    const e = s.enemies[i];
    if (p.invulnTime <= 0 && !s.gameOver && intersects(e, p)) {
      s.enemies.splice(i, 1);
      killEnemy(s, e, ev, false);
      damagePlayer(s, ev);
    }
  }

  // --- powerups
  for (let i = s.powerups.length - 1; i >= 0; i--) {
    const pu = s.powerups[i];
    pu.y += pu.vy * dt;
    if (pu.y > s.screenH + 20) {
      s.powerups.splice(i, 1);
    } else if (intersects(pu, p)) {
      s.powerups.splice(i, 1);
      applyPowerup(s, pu);
      ev.powerup = true;
    }
  }

  // --- particles
  for (let i = s.particles.length - 1; i >= 0; i--) {
    const pt = s.particles[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      s.particles.splice(i, 1);
      continue;
    }
    pt.vy += 300 * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
  }

  // --- wave cleared -> next wave, forever
  if (s.enemies.length === 0 && !s.gameOver) {
    ev.waveCleared = true;
    s.score += C.WAVE_BONUS_BASE + s.wave * C.WAVE_BONUS_PER_WAVE;
    s.wave += 1;
    const next = createWave(s.wave, s.screenW, s.nextId);
    s.enemies = next.enemies;
    s.nextId = next.nextId;
    const rows = waveParams(s.wave).rows;
    s.formationY = -(rows * 42 + 100);
    s.waveBannerTime = C.WAVE_BANNER_TIME;
    s.diveTimer = 4;
    s.enemyBullets = [];
  }

  return ev;
}
