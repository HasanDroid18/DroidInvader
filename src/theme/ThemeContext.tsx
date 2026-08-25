import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import { makeRobotMap, PixelMap } from '../sprites';
import { Settings } from '../storage/profile';
import { Palette, PALETTES, robotColorById } from './palettes';

// Monospace everywhere for the retro-arcade look, without shipping a font.
export const FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

export interface Theme {
  palette: Palette;
  isDark: boolean;
  robotHex: string;
  robotMap: PixelMap; // the player sprite in the chosen skin
}

const DEFAULT_THEME: Theme = {
  palette: PALETTES.dark,
  isDark: true,
  robotHex: robotColorById('green').hex,
  robotMap: makeRobotMap(robotColorById('green').hex),
};

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  settings,
  children,
}: {
  settings: Settings;
  children: React.ReactNode;
}) {
  const theme = useMemo<Theme>(() => {
    const hex = robotColorById(settings.robotColor).hex;
    return {
      palette: PALETTES[settings.theme],
      isDark: settings.theme === 'dark',
      robotHex: hex,
      robotMap: makeRobotMap(hex),
    };
  }, [settings.theme, settings.robotColor]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
