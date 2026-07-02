import { DEFAULT_PROFILE, normalizeProfile } from '../src/storage/profile';

describe('normalizeProfile', () => {
  it('turns nothing into the default profile', () => {
    expect(normalizeProfile(undefined)).toEqual(DEFAULT_PROFILE);
    expect(normalizeProfile({})).toEqual(DEFAULT_PROFILE);
  });

  it('keeps valid data', () => {
    const p = normalizeProfile({
      highScore: 1234,
      coins: 55,
      boosterLevels: { rapid: 3, score2x: 10 },
      settings: { soundOn: false, theme: 'light', spiderColor: 'violet' },
    });
    expect(p.highScore).toBe(1234);
    expect(p.coins).toBe(55);
    expect(p.boosterLevels).toEqual({ rapid: 3, score2x: 10 });
    expect(p.settings).toEqual({ soundOn: false, theme: 'light', spiderColor: 'violet' });
  });

  it('migrates a bare legacy high score', () => {
    expect(normalizeProfile({ highScore: 900 }).highScore).toBe(900);
  });

  it('sanitizes garbage', () => {
    const p = normalizeProfile({
      highScore: -5,
      coins: 'lots',
      boosterLevels: { rapid: 999, score2x: -1 },
      settings: { soundOn: 'yes', theme: 'neon', spiderColor: 'plaid' },
    });
    expect(p.highScore).toBe(0);
    expect(p.coins).toBe(0);
    expect(p.boosterLevels).toEqual({ rapid: 10, score2x: 0 });
    expect(p.settings).toEqual({ soundOn: true, theme: 'dark', spiderColor: 'terracotta' });
  });
});
