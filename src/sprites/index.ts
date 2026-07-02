import { DEFAULT_SPIDER_COLOR, GAME_COLORS } from '../theme/palettes';

// Pixel-art sprites as character maps. '.' is transparent; every other char
// looks up a color in the palette. Rendered by components/PixelSprite.
// Pure TS (no react-native imports) so the engine stays node-testable.

export interface PixelMap {
  rows: string[];
  palette: Record<string, string>;
}

// The Claude Code spider from the reference art: rounded body, two square
// eyes, stubby side arms and four legs. Body color is skinnable (Settings).
const SPIDER_ROWS = [
  '..SSSSSSSSSSS..',
  '..SSSSSSSSSSS..',
  '..SEESSSSSEES..',
  '..SEESSSSSEES..',
  'SSSSSSSSSSSSSSS',
  'SSSSSSSSSSSSSSS',
  '..SSSSSSSSSSS..',
  '..SSSSSSSSSSS..',
  '...S..S..S..S..',
  '...S..S..S..S..',
  '...S..S..S..S..',
];

export function makeSpiderMap(bodyHex: string): PixelMap {
  return { rows: SPIDER_ROWS, palette: { S: bodyHex, E: GAME_COLORS.eye } };
}

export const SPIDER: PixelMap = makeSpiderMap(DEFAULT_SPIDER_COLOR.hex);

export const BUG: PixelMap = {
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
  palette: { G: GAME_COLORS.bugGreen, D: GAME_COLORS.bugDark },
};

export const ERROR_GLYPH: PixelMap = {
  rows: [
    'RR.....RR',
    'RRR...RRR',
    '.RRR.RRR.',
    '..RRRRR..',
    '...RRR...',
    '..RRRRR..',
    '.RRR.RRR.',
    'RRR...RRR',
    'RR.....RR',
  ],
  palette: { R: GAME_COLORS.errorRed },
};

export const WARN_GLYPH: PixelMap = {
  rows: [
    '.....Y.....',
    '....YYY....',
    '....YDY....',
    '...YYDYY...',
    '...YYDYY...',
    '..YYYDYYY..',
    '..YYYYYYY..',
    '.YYYYDYYYY.',
    'YYYYYYYYYYY',
  ],
  palette: { Y: GAME_COLORS.warnYellow, D: GAME_COLORS.eye },
};

// The every-10th-wave monster: a giant horned mega-bug.
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
