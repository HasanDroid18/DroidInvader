import { bossParams, createBoss, stepBoss } from '../src/game/boss';
import { createGameState } from '../src/game/engine';
import { isBossWave } from '../src/game/waves';

const NO_INPUT = { targetX: null, targetY: null };

describe('isBossWave', () => {
  it('marks every 10th wave', () => {
    expect(isBossWave(9)).toBe(false);
    expect(isBossWave(10)).toBe(true);
    expect(isBossWave(11)).toBe(false);
    expect(isBossWave(20)).toBe(true);
  });
});

describe('bossParams', () => {
  it('each tier is tougher than the last', () => {
    const t1 = bossParams(1);
    const t2 = bossParams(2);
    expect(t2.hp).toBeGreaterThan(t1.hp);
    expect(t2.spreadCount).toBeGreaterThan(t1.spreadCount);
    expect(t2.coinReward).toBeGreaterThan(t1.coinReward);
    expect(t2.score).toBeGreaterThan(t1.score);
    expect(t2.fireInterval).toBeLessThan(t1.fireInterval);
  });

  it('caps attack density so deep tiers stay playable', () => {
    const deep = bossParams(50);
    expect(deep.spreadCount).toBeLessThanOrEqual(7);
    expect(deep.bulletSpeed).toBeLessThanOrEqual(340);
    expect(deep.fireInterval).toBeGreaterThanOrEqual(1.1);
    expect(deep.maxCreeps).toBeLessThanOrEqual(6);
  });
});

describe('stepBoss', () => {
  function bossState() {
    const s = createGameState(400, 800);
    s.waveBannerTime = 0;
    s.wave = 10;
    s.enemies = [];
    s.boss = createBoss(1, 400);
    s.boss.y = 100; // already flown in
    return s;
  }

  it('fires an aimed spread once its cooldown elapses', () => {
    const s = bossState();
    const ev = {
      shot: false,
      hit: false,
      enemyKilled: false,
      playerHit: false,
      powerup: false,
      coin: false,
      waveCleared: false,
      bossDefeated: false,
      gameOver: false,
    };
    stepBoss(s, 2.0, ev); // > initial 1.5s cooldown
    const spread = bossParams(1).spreadCount;
    expect(s.enemyBullets.length).toBe(spread);
    // Volley is aimed: bullets fan out horizontally and all head downward.
    expect(s.enemyBullets.some((b) => b.vx !== 0)).toBe(true);
    expect(s.enemyBullets.every((b) => b.vy > 0)).toBe(true);
  });

  it('spawns creeps up to the cap', () => {
    const s = bossState();
    const ev = { ...({} as any) };
    for (let i = 0; i < 300; i++) stepBoss(s, 0.1, ev); // 30 simulated seconds
    expect(s.enemies.length).toBeGreaterThan(0);
    expect(s.enemies.length).toBeLessThanOrEqual(bossParams(1).maxCreeps);
    expect(s.enemies.every((e) => e.mode === 'creep')).toBe(true);
  });

  it('holds fire until it has flown in', () => {
    const s = bossState();
    s.boss!.y = -100;
    const ev = { ...({} as any) };
    stepBoss(s, 0.5, ev);
    expect(s.enemyBullets).toHaveLength(0);
    expect(s.boss!.y).toBeGreaterThan(-100); // but it is descending
  });
});
