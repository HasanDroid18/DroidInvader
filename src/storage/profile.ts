import AsyncStorage from '@react-native-async-storage/async-storage';
import { BoosterId, MAX_BOOSTER_LEVEL } from '../progression/boosters';
import { SPIDER_COLORS, ThemeName } from '../theme/palettes';

// Single persisted blob for everything the game remembers between launches.

export interface Settings {
  soundOn: boolean;
  theme: ThemeName;
  spiderColor: string; // id from SPIDER_COLORS
}

export interface Profile {
  version: 1;
  highScore: number;
  coins: number;
  boosterLevels: Record<BoosterId, number>; // 0 = not owned
  settings: Settings;
}

const PROFILE_KEY = 'claude-invader/profile-v1';
const LEGACY_HIGHSCORE_KEY = 'claude-invader/high-score';

export const DEFAULT_PROFILE: Profile = {
  version: 1,
  highScore: 0,
  coins: 0,
  boosterLevels: { rapid: 0, score2x: 0 },
  settings: { soundOn: true, theme: 'dark', spiderColor: 'terracotta' },
};

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? Math.floor(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// Coerce anything (old formats, corrupted JSON, partial objects) into a
// valid Profile. Pure and unit-tested.
export function normalizeProfile(raw: unknown): Profile {
  const r = (raw ?? {}) as Record<string, any>;
  const levels = (r.boosterLevels ?? {}) as Record<string, unknown>;
  const settings = (r.settings ?? {}) as Record<string, unknown>;
  return {
    version: 1,
    highScore: clampInt(r.highScore, 0, Number.MAX_SAFE_INTEGER, 0),
    coins: clampInt(r.coins, 0, Number.MAX_SAFE_INTEGER, 0),
    boosterLevels: {
      rapid: clampInt(levels.rapid, 0, MAX_BOOSTER_LEVEL, 0),
      score2x: clampInt(levels.score2x, 0, MAX_BOOSTER_LEVEL, 0),
    },
    settings: {
      soundOn: typeof settings.soundOn === 'boolean' ? settings.soundOn : true,
      theme: settings.theme === 'light' ? 'light' : 'dark',
      spiderColor: SPIDER_COLORS.some((c) => c.id === settings.spiderColor)
        ? (settings.spiderColor as string)
        : 'terracotta',
    },
  };
}

export async function loadProfile(): Promise<Profile> {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    if (json != null) return normalizeProfile(JSON.parse(json));

    // First run of this version: pull the high score saved by older builds.
    const legacy = await AsyncStorage.getItem(LEGACY_HIGHSCORE_KEY);
    const migrated = normalizeProfile({ highScore: legacy ? parseInt(legacy, 10) : 0 });
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Losing a save write is not worth crashing the game over.
  }
}
