import { Platform } from 'react-native';

// Monospace everywhere for the retro-arcade look, without shipping a font.
export const FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });
