import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_BOOSTER_LEVEL, UpgradableId } from '../progression/boosters';
import { ROBOT_COLORS, ThemeName } from '../theme/palettes';

// Single persisted blob for everything the game remembers between launches.

export interface Settings {
  soundOn: boolean;
  theme: ThemeName;
  robotColor: string; // id from ROBOT_COLORS
}

export interface Profile {
  version: 1;
  highScore: number;
  coins: number;
  gems: number; // premium revive currency; every new install starts with 50
  boosterLevels: Record<UpgradableId, number>; // 0 = not owned (shield: base level)
  settings: Settings;
}

const PROFILE_KEY = 'droid-invader/profile-v1';
// Keys used by earlier builds of the game, migrated on first load.
const OLD_PROFILE_KEY = 'claude-invader/profile-v1';
const LEGACY_HIGHSCORE_KEY = 'claude-invader/high-score';

export const STARTING_GEMS = 50; // the free welcome gift

export const DEFAULT_PROFILE: Profile = {
  version: 1,
  highScore: 0,
  coins: 0,
  gems: STARTING_GEMS,
  boosterLevels: { rapid: 0, score2x: 0, shield: 0 },
  settings: { soundOn: true, theme: 'dark', robotColor: 'green' },
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
    // Missing gems field (fresh install or pre-gems profile) → welcome gift.
    // An explicitly saved 0 stays 0.
    gems: clampInt(r.gems, 0, Number.MAX_SAFE_INTEGER, STARTING_GEMS),
    boosterLevels: {
      rapid: clampInt(levels.rapid, 0, MAX_BOOSTER_LEVEL, 0),
      score2x: clampInt(levels.score2x, 0, MAX_BOOSTER_LEVEL, 0),
      shield: clampInt(levels.shield, 0, MAX_BOOSTER_LEVEL, 0),
    },
    settings: {
      soundOn: typeof settings.soundOn === 'boolean' ? settings.soundOn : true,
      theme: settings.theme === 'light' ? 'light' : 'dark',
      // Old profiles stored this as `spiderColor` with different skin ids;
      // anything unknown falls back to the droid green.
      robotColor: ROBOT_COLORS.some(
        (c) => c.id === (settings.robotColor ?? settings.spiderColor)
      )
        ? ((settings.robotColor ?? settings.spiderColor) as string)
        : 'green',
    },
  };
}

export async function loadProfile(): Promise<Profile> {
  try {
    const json = await AsyncStorage.getItem(PROFILE_KEY);
    if (json != null) return normalizeProfile(JSON.parse(json));

    // First run of this version: migrate whatever an older build saved.
    const oldJson = await AsyncStorage.getItem(OLD_PROFILE_KEY);
    let migrated: Profile;
    if (oldJson != null) {
      migrated = normalizeProfile(JSON.parse(oldJson));
    } else {
      const legacy = await AsyncStorage.getItem(LEGACY_HIGHSCORE_KEY);
      migrated = normalizeProfile({ highScore: legacy ? parseInt(legacy, 10) : 0 });
    }
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
