import { DEFAULT_ROBOT_COLOR, GAME_COLORS } from '../theme/palettes';

// Pixel-art sprites as character maps. '.' is transparent; every other char
// looks up a color in the palette. Rendered by components/PixelSprite.
// Pure TS (no react-native imports) so the engine stays node-testable.

export interface PixelMap {
  rows: string[];
  palette: Record<string, string>;
}

// The hero: a little droid robot — antennae, round head with eyes, body
// flanked by arms, two legs. Body color is skinnable (Settings).
const ROBOT_ROWS = [
  '..R.........R..',
  '...R.......R...',
  '..RRRRRRRRRRR..',
  '.RRRRRRRRRRRRR.',
  '.RRWWRRRRRWWRR.',
  '.RRRRRRRRRRRRR.',
  '...............',
  'RR.RRRRRRRRR.RR',
  'RR.RRRRRRRRR.RR',
  'RR.RRRRRRRRR.RR',
  '...RRRRRRRRR...',
  '....RR...RR....',
  '....RR...RR....',
];

export function makeRobotMap(bodyHex: string): PixelMap {
  return { rows: ROBOT_ROWS, palette: { R: bodyHex, W: '#FFFFFF' } };
}

export const ROBOT: PixelMap = makeRobotMap(DEFAULT_ROBOT_COLOR.hex);

// Basic alien: the classic invader crab (olive green).
export const ALIEN_CRAB: PixelMap = {
  rows: [
    '..G.....G..',
    '...G...G...',
    '..GGGGGGG..',
    '.GGDGGGDGG.',
    'GGGGGGGGGGG',
    'G.GGGGGGG.G',
    'G.G.....G.G',
    '...GG.GG...',
  ],
  palette: { G: GAME_COLORS.alienBasic, D: GAME_COLORS.alienBasicDark },
};

// Tough alien: a dark-green squid with red eyes (2 HP, dive-bombs).
export const ALIEN_SQUID: PixelMap = {
  rows: [
    '...GGGGG...',
    '.GGGGGGGGG.',
    'GGRRGGGRRGG',
    'GGGGGGGGGGG',
    'G.G.G.G.G.G',
    '.G..G.G..G.',
  ],
  palette: { G: GAME_COLORS.alienTough, R: GAME_COLORS.alienToughEye },
};

// Shooter alien: a chartreuse saucer with a dark visor (fires from the top row).
export const ALIEN_SAUCER: PixelMap = {
  rows: [
    '.....G.....',
    '...GGGGG...',
    '.GGGDDDGGG.',
    'GGGGGGGGGGG',
    '.G..G.G..G.',
  ],
  palette: { G: GAME_COLORS.alienShooter, D: GAME_COLORS.alienShooterDark },
};

// The every-10th-wave monster: a giant horned mother alien.
export const BOSS: PixelMap = {
  rows: [
    '...BB...........BB...',
    '....BB.........BB....',
    '..BBBBBBBBBBBBBBBBB..',
    '.BBBBBBBBBBBBBBBBBBB.',
    '.BBEEBBBBBBBBBBBEEBB.',
    '.BBEEBBBBBBBBBBBEEBB.',
    'BBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBBB',
    '.BBBBBBBBBBBBBBBBBBB.',
    '..BBTBBTBBBBBTBBTBB..',
    '...BB.BB.BBB.BB.BB...',
    '..BB...BB...BB...BB..',
    '..BB...BB...BB...BB..',
  ],
  palette: { B: GAME_COLORS.boss, E: GAME_COLORS.bossEye, T: GAME_COLORS.bossTeeth },
};

export const GEM: PixelMap = {
  rows: [
    '.GGGG.',
    'GSGGGG',
    'GGGGGG',
    '.GGGG.',
    '..GG..',
    '...G..',
  ],
  palette: { G: GAME_COLORS.gem, S: GAME_COLORS.gemShine },
};

export const POWERUP_SHIELD: PixelMap = {
  rows: [
    '.SSSS.',
    'SS..SS',
    'S....S',
    'S....S',
    'SS..SS',
    '.SSSS.',
  ],
  palette: { S: GAME_COLORS.shield },
};

export const COIN: PixelMap = {
  rows: [
    '.CCCC.',
    'CddddC',
    'CdCCdC',
    'CdCCdC',
    'CddddC',
    '.CCCC.',
  ],
  palette: { C: GAME_COLORS.coin, d: GAME_COLORS.coinDark },
};

export const POWERUP_DOUBLE: PixelMap = {
  rows: ['.C...C.', '.C...C.', '.C...C.', '.C...C.', '.C...C.'],
  palette: { C: GAME_COLORS.powerDouble },
};

export const POWERUP_RAPID: PixelMap = {
  rows: ['...WW..', '..WW...', '.WWWW..', '...WW..', '..WW...', '.WW....'],
  palette: { W: GAME_COLORS.powerRapid },
};

export const POWERUP_LIFE: PixelMap = {
  rows: ['.HH.HH.', 'HHHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'],
  palette: { H: GAME_COLORS.powerLife },
};

export function spriteCols(map: PixelMap): number {
  return map.rows[0].length;
}

export function spriteRows(map: PixelMap): number {
  return map.rows.length;
}
