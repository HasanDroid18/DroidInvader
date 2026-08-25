// Pure color data — NO react-native imports, so sprites/engine stay
// runnable under plain node (jest).

// Colors that are part of the game world and identical in both themes.
export const GAME_COLORS = {
  eye: '#14181A',
  // The three alien tiers, all green but readable at a glance:
  alienBasic: '#7CB342', // olive crab
  alienBasicDark: '#33691E',
  alienTough: '#558B2F', // dark squid
  alienToughEye: '#FF5252',
  alienShooter: '#C0CA33', // chartreuse saucer
  alienShooterDark: '#1B1F1B',
  enemyBullet: '#FF6E6E',
  danger: '#EF5350', // game-over text, enraged boss bar
  highlight: '#FFC107', // NEW BEST badge
  powerDouble: '#4FC3F7',
  powerRapid: '#FFD966',
  powerLife: '#EF5350',
  coin: '#F2C14E',
  coinDark: '#C08A2E',
  gem: '#4ED4E8',
  gemShine: '#B5F3FB',
  shield: '#80DEEA',
  boss: '#2E7D32', // the deep-green mother alien
  bossEye: '#FF5252',
  bossTeeth: '#E8F5E9',
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
    bg: '#0F1210',
    text: '#ECF2EC',
    textDim: '#8A948A',
    accent: '#3DDC84', // Android green
    accentPressed: '#2FB56A',
    onAccent: '#0F1210',
    star: '#2C332C',
    starBright: '#465046',
    playerBullet: '#D9F5E6',
    overlay: 'rgba(10, 14, 10, 0.85)',
    cardBg: '#1A211A',
    cardBorder: '#2E382E',
  },
  light: {
    bg: '#F1F5F1',
    text: '#1C231C',
    textDim: '#6E786E',
    accent: '#1E9E5A', // darker green for contrast on light
    accentPressed: '#177B46',
    onAccent: '#F7FBF7',
    star: '#D3DCD3',
    starBright: '#B8C4B8',
    playerBullet: '#1E7A48',
    overlay: 'rgba(241, 245, 241, 0.88)',
    cardBg: '#E2E9E2',
    cardBorder: '#CBD6CB',
  },
};

// Selectable robot skins (Settings). The default is the classic droid green.
export interface RobotColor {
  id: string;
  label: string;
  hex: string;
}

export const ROBOT_COLORS: RobotColor[] = [
  { id: 'green', label: 'GREEN', hex: '#3DDC84' },
  { id: 'sky', label: 'SKY', hex: '#4FC3F7' },
  { id: 'coral', label: 'CORAL', hex: '#FF7043' },
  { id: 'violet', label: 'VIOLET', hex: '#9B7EDE' },
  { id: 'gold', label: 'GOLD', hex: '#FFC107' },
];

export const DEFAULT_ROBOT_COLOR = ROBOT_COLORS[0];

export function robotColorById(id: string): RobotColor {
  return ROBOT_COLORS.find((c) => c.id === id) ?? DEFAULT_ROBOT_COLOR;
}
