import { COLORS } from '../constants';

// Pixel-art sprites as character maps. '.' is transparent; every other char
// looks up a color in the palette. Rendered by components/PixelSprite.

export interface PixelMap {
  rows: string[];
  palette: Record<string, string>;
}

// The Claude Code spider from the reference art: terracotta rounded body,
// two black eyes, stubby side arms and four legs.
export const SPIDER: PixelMap = {
  rows: [
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
  ],
  palette: { S: COLORS.terracotta, E: COLORS.eye },
};

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
  palette: { G: COLORS.bugGreen, D: COLORS.bugDark },
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
  palette: { R: COLORS.errorRed },
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
  palette: { Y: COLORS.warnYellow, D: COLORS.eye },
};

export const POWERUP_DOUBLE: PixelMap = {
  rows: ['.C...C.', '.C...C.', '.C...C.', '.C...C.', '.C...C.'],
  palette: { C: COLORS.powerDouble },
};

export const POWERUP_RAPID: PixelMap = {
  rows: ['...WW..', '..WW...', '.WWWW..', '...WW..', '..WW...', '.WW....'],
  palette: { W: COLORS.powerRapid },
};

export const POWERUP_LIFE: PixelMap = {
  rows: ['.HH.HH.', 'HHHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'],
  palette: { H: COLORS.powerLife },
};

export function spriteCols(map: PixelMap): number {
  return map.rows[0].length;
}

export function spriteRows(map: PixelMap): number {
  return map.rows.length;
}
