import { createWave, waveParams } from '../src/game/waves';

describe('waveParams', () => {
  it('scales difficulty with wave number', () => {
    const w1 = waveParams(1);
    const w10 = waveParams(10);
    expect(w10.cols).toBeGreaterThan(w1.cols);
    expect(w10.rows).toBeGreaterThan(w1.rows);
    expect(w10.descentSpeed).toBeGreaterThan(w1.descentSpeed);
    expect(w10.diveSpeed).toBeGreaterThan(w1.diveSpeed);
    expect(w10.bulletSpeed).toBeGreaterThan(w1.bulletSpeed);
    expect(w10.fireInterval).toBeLessThan(w1.fireInterval);
    expect(w10.diveInterval).toBeLessThan(w1.diveInterval);
  });

  it('caps difficulty so deep waves stay playable', () => {
    const deep = waveParams(500);
    expect(deep.cols).toBeLessThanOrEqual(8);
    expect(deep.rows).toBeLessThanOrEqual(5);
    expect(deep.descentSpeed).toBeLessThanOrEqual(13);
    expect(deep.diveSpeed).toBeLessThanOrEqual(330);
    expect(deep.bulletSpeed).toBeLessThanOrEqual(330);
    expect(deep.fireInterval).toBeGreaterThanOrEqual(1.0);
    expect(deep.diveInterval).toBeGreaterThanOrEqual(2.2);
  });

  it('keeps adding hp forever (the infinite part)', () => {
    expect(waveParams(80).hpBonus).toBeGreaterThan(waveParams(8).hpBonus);
  });
});

describe('createWave', () => {
  it('wave 1 is all basic bugs', () => {
    const { enemies } = createWave(1, 400, 1);
    const p = waveParams(1);
    expect(enemies).toHaveLength(p.cols * p.rows);
    expect(enemies.every((e) => e.kind === 'bug')).toBe(true);
    expect(enemies.every((e) => e.hp === 1)).toBe(true);
  });

  it('wave 10 has a shooter top row and full enemy count', () => {
    const { enemies } = createWave(10, 400, 1);
    const p = waveParams(10);
    expect(enemies).toHaveLength(p.cols * p.rows);
    const topRow = enemies.filter((e) => e.slotY === 0);
    expect(topRow).toHaveLength(p.cols);
    expect(topRow.every((e) => e.kind === 'warn')).toBe(true);
  });

  it('mixes in error glyphs when the rng says so', () => {
    const { enemies } = createWave(10, 400, 1, () => 0); // rng always below threshold
    expect(enemies.some((e) => e.kind === 'error')).toBe(true);
  });

  it('assigns unique ids continuing from startId', () => {
    const { enemies, nextId } = createWave(3, 400, 50);
    const ids = new Set(enemies.map((e) => e.id));
    expect(ids.size).toBe(enemies.length);
    expect(Math.min(...ids)).toBe(50);
    expect(nextId).toBe(50 + enemies.length);
  });
});
