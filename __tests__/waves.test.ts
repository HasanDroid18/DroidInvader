import {
  createWave,
  formationPattern,
  isBossWave,
  isSwarmWave,
  waveParams,
} from '../src/game/waves';

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

  it('wave 3 introduces the shooter top row (grid pattern, full count)', () => {
    const { enemies } = createWave(3, 400, 1);
    const p = waveParams(3);
    expect(enemies).toHaveLength(p.cols * p.rows);
    const topRow = enemies.filter((e) => e.slotY === 0);
    expect(topRow).toHaveLength(p.cols);
    expect(topRow.every((e) => e.kind === 'warn')).toBe(true);
  });

  it('waves 1-2 have no shooters and no dives (easy start)', () => {
    for (const n of [1, 2]) {
      const { enemies } = createWave(n, 400, 1, () => 0);
      expect(enemies.every((e) => e.kind === 'bug')).toBe(true);
      expect(waveParams(n).diveInterval).toBe(Infinity);
    }
    expect(waveParams(3).diveInterval).toBeLessThan(Infinity);
  });

  it('mixes in error glyphs when the rng says so (from wave 5)', () => {
    expect(createWave(4, 400, 1, () => 0).enemies.some((e) => e.kind === 'error')).toBe(false);
    expect(createWave(5, 400, 1, () => 0).enemies.some((e) => e.kind === 'error')).toBe(true);
  });

  it('assigns unique ids continuing from startId', () => {
    const { enemies, nextId } = createWave(3, 400, 50);
    const ids = new Set(enemies.map((e) => e.id));
    expect(ids.size).toBe(enemies.length);
    expect(Math.min(...ids)).toBe(50);
    expect(nextId).toBe(50 + enemies.length);
  });
});

describe('wave variety', () => {
  it('cycles formation patterns after the plain opening waves', () => {
    expect(formationPattern(1)).toBe('grid');
    expect(formationPattern(2)).toBe('grid');
    const seen = new Set([3, 4, 5, 6, 8].map((n) => formationPattern(n)));
    expect(seen.size).toBeGreaterThan(3); // several distinct shapes early on
  });

  it('patterned waves still produce sane formations', () => {
    for (const n of [3, 4, 5, 6, 8, 9, 11, 12, 13]) {
      const { enemies } = createWave(n, 400, 1);
      expect(enemies.length).toBeGreaterThan(3);
      // no two enemies share a slot
      const slots = new Set(enemies.map((e) => `${e.slotX},${e.slotY}`));
      expect(slots.size).toBe(enemies.length);
      expect(enemies.every((e) => e.mode === 'formation')).toBe(true);
    }
  });

  it('every 7th non-boss wave is a swarm of creep divers', () => {
    expect(isSwarmWave(7)).toBe(true);
    expect(isSwarmWave(14)).toBe(true);
    expect(isSwarmWave(70)).toBe(false); // boss wins the collision
    expect(isBossWave(70)).toBe(true);
    const { enemies } = createWave(7, 400, 1);
    expect(enemies.length).toBeGreaterThan(5);
    expect(enemies.every((e) => e.mode === 'creep' && e.vy > 0)).toBe(true);
  });
});
