import { FORMATION_TOP, SCORE_BUG, START_LIVES, WAVE_BONUS_BASE, WAVE_BONUS_PER_WAVE } from '../src/constants';
import { createGameState, step } from '../src/game/engine';
import { GameState } from '../src/game/types';

const NO_INPUT = { targetX: null, targetY: null };

function settledState(): GameState {
  const s = createGameState(400, 800);
  s.waveBannerTime = 0;
  s.formationY = FORMATION_TOP; // skip the fly-in
  step(s, 0.016, NO_INPUT); // one tick so formation enemies get real x/y
  return s;
}

describe('createGameState', () => {
  it('starts wave 1 with lives, enemies and a banner', () => {
    const s = createGameState(400, 800);
    expect(s.wave).toBe(1);
    expect(s.lives).toBe(START_LIVES);
    expect(s.enemies.length).toBeGreaterThan(0);
    expect(s.waveBannerTime).toBeGreaterThan(0);
    expect(s.gameOver).toBe(false);
  });
});

describe('step', () => {
  it('player bullet kills a bug, scores and spawns particles', () => {
    const s = settledState();
    const target = s.enemies[0];
    const before = s.enemies.length;
    const scoreBefore = s.score;
    s.playerBullets.push({
      id: 9999,
      x: target.x + target.w / 2 - 2,
      y: target.y + target.h / 2 - 5,
      w: 4,
      h: 10,
      vx: 0,
      vy: -540,
    });
    const ev = step(s, 0.001, NO_INPUT);
    expect(ev.enemyKilled).toBe(true);
    expect(s.enemies.length).toBe(before - 1);
    expect(s.score).toBe(scoreBefore + SCORE_BUG);
    expect(s.particles.length).toBeGreaterThan(0);
  });

  it('enemy bullet costs a life once, then invulnerability protects', () => {
    const s = settledState();
    const p = s.player;
    s.enemyBullets.push({ id: 9001, x: p.x + p.w / 2, y: p.y + p.h / 2, w: 4, h: 10, vx: 0, vy: 200 });
    const ev = step(s, 0.001, NO_INPUT);
    expect(ev.playerHit).toBe(true);
    expect(s.lives).toBe(START_LIVES - 1);
    expect(s.player.invulnTime).toBeGreaterThan(0);

    s.enemyBullets.push({ id: 9002, x: p.x + p.w / 2, y: p.y + p.h / 2, w: 4, h: 10, vx: 0, vy: 200 });
    const ev2 = step(s, 0.001, NO_INPUT);
    expect(ev2.playerHit).toBe(false);
    expect(s.lives).toBe(START_LIVES - 1);
  });

  it('losing the last life ends the game', () => {
    const s = settledState();
    s.lives = 1;
    const p = s.player;
    s.enemyBullets.push({ id: 9003, x: p.x + p.w / 2, y: p.y + p.h / 2, w: 4, h: 10, vx: 0, vy: 200 });
    const ev = step(s, 0.001, NO_INPUT);
    expect(ev.gameOver).toBe(true);
    expect(s.gameOver).toBe(true);

    // Once over, stepping is a no-op.
    const wave = s.wave;
    step(s, 1, NO_INPUT);
    expect(s.wave).toBe(wave);
  });

  it('clearing a wave awards the bonus and spawns the next wave (infinite loop)', () => {
    const s = settledState();
    const scoreBefore = s.score;
    s.enemies = [];
    const ev = step(s, 0.016, NO_INPUT);
    expect(ev.waveCleared).toBe(true);
    expect(s.wave).toBe(2);
    expect(s.enemies.length).toBeGreaterThan(0);
    expect(s.score).toBe(scoreBefore + WAVE_BONUS_BASE + 1 * WAVE_BONUS_PER_WAVE);
    expect(s.waveBannerTime).toBeGreaterThan(0);
    // New formation flies in from above the screen.
    expect(s.formationY).toBeLessThan(0);
  });

  it('picking up a rapid powerup activates rapid fire', () => {
    const s = settledState();
    const p = s.player;
    s.powerups.push({ id: 9004, kind: 'rapid', x: p.x + p.w / 2 - 10, y: p.y + p.h / 2, w: 20, h: 18, vy: 130 });
    const ev = step(s, 0.001, NO_INPUT);
    expect(ev.powerup).toBe(true);
    expect(s.player.rapidTime).toBeGreaterThan(0);
    expect(s.powerups).toHaveLength(0);
  });

  it('auto-fires bullets over time', () => {
    const s = settledState();
    s.playerBullets = [];
    for (let i = 0; i < 40; i++) step(s, 0.016, NO_INPUT); // ~0.64s > fire interval
    expect(s.playerBullets.length).toBeGreaterThan(0);
  });

  it('clamps the player inside the screen', () => {
    const s = settledState();
    step(s, 1, { targetX: -1000, targetY: -1000 });
    expect(s.player.x).toBeGreaterThanOrEqual(4);
    expect(s.player.y).toBeGreaterThanOrEqual(s.screenH * 0.4);
    step(s, 1, { targetX: 5000, targetY: 5000 });
    expect(s.player.x + s.player.w).toBeLessThanOrEqual(s.screenW - 4);
    expect(s.player.y + s.player.h).toBeLessThanOrEqual(s.screenH - 24);
  });
});
