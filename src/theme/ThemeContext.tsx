import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import { makeSpiderMap, PixelMap } from '../sprites';
import { Settings } from '../storage/profile';
import { Palette, PALETTES, spiderColorById } from './palettes';

// Monospace everywhere for the retro-arcade look, without shipping a font.
export const FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

export interface Theme {
  palette: Palette;
  isDark: boolean;
  spiderHex: string;
  spiderMap: PixelMap; // the player sprite in the chosen skin
}

const DEFAULT_THEME: Theme = {
  palette: PALETTES.dark,
  isDark: true,
  spiderHex: spiderColorById('terracotta').hex,
  spiderMap: makeSpiderMap(spiderColorById('terracotta').hex),
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
    const hex = spiderColorById(settings.spiderColor).hex;
    return {
      palette: PALETTES[settings.theme],
      isDark: settings.theme === 'dark',
      spiderHex: hex,
      spiderMap: makeSpiderMap(hex),
    };
  }, [settings.theme, settings.spiderColor]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
