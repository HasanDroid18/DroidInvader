// Gameplay tuning only. Colors live in src/theme/palettes.ts.
// Pure TS (no react-native imports) so the game logic runs under plain node/jest.

// Rendering scale: game-world pixels per sprite pixel.
export const PIXEL = 3;
export const BOSS_PIXEL = 5;

// Player
export const PLAYER_MAX_SPEED = 1500; // px/s chasing the drag target
export const FIRE_INTERVAL = 0.32; // s between shots
export const RAPID_FIRE_INTERVAL = 0.14;
export const RAPID_DURATION = 8; // s, from the in-game powerup drop
export const BULLET_SPEED = 540;
export const INVULN_TIME = 1.6; // s of blinking after a hit
export const START_LIVES = 3;
export const MAX_LIVES = 5;

// Enemies / formation
export const FORMATION_TOP = 96; // y where the formation settles after entry
export const FORMATION_ENTRY_SPEED = 150; // px/s while flying in
export const FORMATION_SLOT_W = 44;
export const FORMATION_SLOT_H = 42;
export const RETURN_SPEED = 210; // px/s for divers rejoining formation
export const DIVE_GRAVITY = 70;
export const DIVE_HOMING = 90; // horizontal steering accel while diving
export const DIVE_MAX_VX = 170;
export const BOTTOM_MARGIN = 70; // formation reaching screenH - this costs a life

// Drops
export const POWERUP_FALL_SPEED = 130;
export const DROP_LIFE_CHANCE = 0.015;
export const DROP_RAPID_CHANCE = 0.05; // cumulative thresholds, see engine
export const DROP_DOUBLE_CHANCE = 0.09;

// Coins
export const COIN_DROP_CHANCE = 0.2; // per scored kill
export const COIN_FALL_SPEED = 150;
export const COIN_SIZE = 18; // pickup hitbox (sprite is 6x6 at pixel 3)

// Scoring
export const SCORE_BUG = 10;
export const SCORE_WARN = 15;
export const SCORE_ERROR = 25;
export const DIVER_MULTIPLIER = 2;
export const WAVE_BONUS_BASE = 50;
export const WAVE_BONUS_PER_WAVE = 10;

export const WAVE_BANNER_TIME = 1.8; // s the "WAVE N" banner stays up
