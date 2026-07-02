import { DEFAULT_PROFILE, normalizeProfile, STARTING_GEMS } from '../src/storage/profile';

describe('normalizeProfile', () => {
  it('turns nothing into the default profile', () => {
    expect(normalizeProfile(undefined)).toEqual(DEFAULT_PROFILE);
    expect(normalizeProfile({})).toEqual(DEFAULT_PROFILE);
  });

  it('keeps valid data', () => {
    const p = normalizeProfile({
      highScore: 1234,
      coins: 55,
      gems: 7,
      boosterLevels: { rapid: 3, score2x: 10, shield: 4 },
      settings: { soundOn: false, theme: 'light', spiderColor: 'violet' },
    });
    expect(p.highScore).toBe(1234);
    expect(p.coins).toBe(55);
    expect(p.gems).toBe(7);
    expect(p.boosterLevels).toEqual({ rapid: 3, score2x: 10, shield: 4 });
    expect(p.settings).toEqual({ soundOn: false, theme: 'light', spiderColor: 'violet' });
  });

  it('gifts 50 gems to new installs and pre-gems profiles', () => {
    expect(STARTING_GEMS).toBe(50);
    expect(normalizeProfile({}).gems).toBe(50);
    expect(normalizeProfile({ highScore: 10, coins: 3 }).gems).toBe(50); // v2 profile
  });

  it('does not re-gift gems that were spent to zero', () => {
    expect(normalizeProfile({ gems: 0 }).gems).toBe(0);
  });

  it('migrates a bare legacy high score', () => {
    expect(normalizeProfile({ highScore: 900 }).highScore).toBe(900);
  });

  it('sanitizes garbage', () => {
    const p = normalizeProfile({
      highScore: -5,
      coins: 'lots',
      gems: -3,
      boosterLevels: { rapid: 999, score2x: -1, shield: 'max' },
      settings: { soundOn: 'yes', theme: 'neon', spiderColor: 'plaid' },
    });
    expect(p.highScore).toBe(0);
    expect(p.coins).toBe(0);
    expect(p.gems).toBe(0);
    expect(p.boosterLevels).toEqual({ rapid: 10, score2x: 0, shield: 0 });
    expect(p.settings).toEqual({ soundOn: true, theme: 'dark', spiderColor: 'terracotta' });
  });
});
