import {
  BOOSTER_IDS,
  BOOSTERS,
  boosterDuration,
  MAX_BOOSTER_LEVEL,
  reviveCost,
  shieldDuration,
  upgradeCost,
} from '../src/progression/boosters';

describe('boosterDuration', () => {
  it('is 0 when not owned', () => {
    expect(boosterDuration(0)).toBe(0);
  });

  it('spans 10s at level 1 to 60s at level 10', () => {
    expect(boosterDuration(1)).toBe(10);
    expect(boosterDuration(MAX_BOOSTER_LEVEL)).toBe(60);
  });

  it('grows monotonically with level', () => {
    for (let l = 1; l < MAX_BOOSTER_LEVEL; l++) {
      expect(boosterDuration(l + 1)).toBeGreaterThan(boosterDuration(l));
    }
  });

  it('clamps beyond max level', () => {
    expect(boosterDuration(99)).toBe(60);
  });
});

describe('upgradeCost', () => {
  it('prices the first unlock and later levels', () => {
    expect(upgradeCost(0)).toBe(75);
    expect(upgradeCost(1)).toBe(150);
    expect(upgradeCost(9)).toBe(750);
  });

  it('returns null once maxed', () => {
    expect(upgradeCost(MAX_BOOSTER_LEVEL)).toBeNull();
  });
});

describe('booster definitions', () => {
  it('every booster has a positive arm cost', () => {
    for (const id of BOOSTER_IDS) {
      expect(BOOSTERS[id].armCost).toBeGreaterThan(0);
    }
  });
});

describe('shieldDuration', () => {
  it('works at level 0 without an unlock (5s base)', () => {
    expect(shieldDuration(0)).toBe(5);
  });

  it('adds half a second per level up to 10s', () => {
    expect(shieldDuration(1)).toBe(5.5);
    expect(shieldDuration(MAX_BOOSTER_LEVEL)).toBe(10);
    expect(shieldDuration(99)).toBe(10);
  });
});

describe('reviveCost', () => {
  it('escalates like Subway keys: 1, 2, 3, ...', () => {
    expect(reviveCost(0)).toBe(1);
    expect(reviveCost(1)).toBe(2);
    expect(reviveCost(2)).toBe(3);
    expect(reviveCost(9)).toBe(10);
  });
});
