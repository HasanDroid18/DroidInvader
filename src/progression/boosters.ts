// Pure booster economy — all coin/duration math lives here (unit-tested).
//
// Boosters are consumable per run: the LEVEL is bought once per step in the
// Shop, but arming a booster for a run costs coins every time. Level only
// raises the effect duration: 10s at Lv1 up to 60s at Lv10.

export type BoosterId = 'rapid' | 'score2x';

export interface BoosterDef {
  id: BoosterId;
  name: string;
  description: string;
  armCost: number; // coins to activate for one run
}

export const MAX_BOOSTER_LEVEL = 10;
export const MIN_DURATION = 10; // seconds at level 1
export const MAX_DURATION = 60; // seconds at level 10

export const BOOSTERS: Record<BoosterId, BoosterDef> = {
  rapid: {
    id: 'rapid',
    name: 'RAPID START',
    description: 'Begin every armed run with rapid fire.',
    armCost: 20,
  },
  score2x: {
    id: 'score2x',
    name: 'X2 SCORE',
    description: 'Double all score gains at the start of the run.',
    armCost: 25,
  },
};

export const BOOSTER_IDS: BoosterId[] = ['rapid', 'score2x'];

// Level 1 → 10s, Level 10 → 60s, linear in between. Level 0 = not owned.
export function boosterDuration(level: number): number {
  if (level <= 0) return 0;
  const l = Math.min(level, MAX_BOOSTER_LEVEL);
  return Math.round(MIN_DURATION + ((l - 1) * (MAX_DURATION - MIN_DURATION)) / (MAX_BOOSTER_LEVEL - 1));
}

// Coins to buy the NEXT level given the current one; null when maxed.
export function upgradeCost(currentLevel: number): number | null {
  if (currentLevel >= MAX_BOOSTER_LEVEL) return null;
  return 75 * (currentLevel + 1);
}
