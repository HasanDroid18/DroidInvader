// Pure color data — NO react-native imports, so sprites/engine stay
// runnable under plain node (jest).

// Colors that are part of the game world and identical in both themes.
export const GAME_COLORS = {
  eye: '#1F1B16',
  bugGreen: '#7FBF6C',
  bugDark: '#2E4E26',
  errorRed: '#E5484D',
  warnYellow: '#E9B44C',
  enemyBullet: '#FF7B72',
  powerDouble: '#7CC7FF',
  powerRapid: '#FFD966',
  powerLife: '#E5484D',
  coin: '#F2C14E',
  coinDark: '#C08A2E',
  boss: '#9B4DCA',
  bossEye: '#FF5555',
  bossTeeth: '#F0EEE6',
};

// Theme-dependent UI/ambience colors.
export interface Palette {
  bg: string;
  text: string;
  textDim: string;
  accent: string;
  accentPressed: string;
  onAccent: string;
  star: string;
  starBright: string;
  playerBullet: string;
  overlay: string;
  cardBg: string;
  cardBorder: string;
}

export type ThemeName = 'dark' | 'light';

export const PALETTES: Record<ThemeName, Palette> = {
  dark: {
    bg: '#1A1915',
    text: '#F0EEE6',
    textDim: '#8F887B',
    accent: '#CC785C',
    accentPressed: '#A85B3F',
    onAccent: '#1A1915',
    star: '#4A453D',
    starBright: '#6B655B',
    playerBullet: '#F5D8C6',
    overlay: 'rgba(20, 18, 14, 0.85)',
    cardBg: '#24221D',
    cardBorder: '#3A362E',
  },
  light: {
    bg: '#F0EEE6',
    text: '#2B2620',
    textDim: '#7D7568',
    accent: '#C1613F',
    accentPressed: '#9C4C30',
    onAccent: '#F8F5EE',
    star: '#D6D1C4',
    starBright: '#BEB7A6',
    playerBullet: '#8A5A44',
    overlay: 'rgba(240, 238, 230, 0.88)',
    cardBg: '#E4E0D4',
    cardBorder: '#CFC9B9',
  },
};

// Selectable spider skins (Settings). The default matches the Claude mascot.
export interface SpiderColor {
  id: string;
  label: string;
  hex: string;
}

export const SPIDER_COLORS: SpiderColor[] = [
  { id: 'terracotta', label: 'TERRACOTTA', hex: '#CC785C' },
  { id: 'sky', label: 'SKY', hex: '#6CB8E8' },
  { id: 'lime', label: 'LIME', hex: '#8FBF5C' },
  { id: 'violet', label: 'VIOLET', hex: '#9B7EDE' },
  { id: 'gold', label: 'GOLD', hex: '#E9B44C' },
];

export const DEFAULT_SPIDER_COLOR = SPIDER_COLORS[0];

export function spiderColorById(id: string): SpiderColor {
  return SPIDER_COLORS.find((c) => c.id === id) ?? DEFAULT_SPIDER_COLOR;
}
