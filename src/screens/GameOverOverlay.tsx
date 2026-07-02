import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PixelSprite } from '../components/PixelSprite';
import { RetroButton } from '../components/RetroButton';
import { COIN, GEM } from '../sprites';
import { GAME_COLORS } from '../theme/palettes';
import { FONT, useTheme } from '../theme/ThemeContext';

interface Props {
  score: number;
  wave: number;
  coinsEarned: number;
  gemsEarned: number;
  highScore: number;
  isNewBest: boolean;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverOverlay({
  score,
  wave,
  coinsEarned,
  gemsEarned,
  highScore,
  isNewBest,
  onRetry,
  onMenu,
}: Props) {
  const { palette } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.gameOver}>GAME OVER</Text>
      <Text style={[styles.waveText, { color: palette.textDim }]}>REACHED WAVE {wave}</Text>
      <Text style={[styles.score, { color: palette.text }]}>{score}</Text>
      {isNewBest ? (
        <Text style={styles.newBest}>★ NEW BEST ★</Text>
      ) : (
        <Text style={[styles.best, { color: palette.textDim }]}>BEST  {highScore}</Text>
      )}
      <View style={styles.coinsRow}>
        <PixelSprite map={COIN} pixel={3} />
        <Text style={[styles.coinsText, { color: palette.text }]}>+{coinsEarned}</Text>
        {gemsEarned > 0 && (
          <>
            <View style={styles.earnGap} />
            <PixelSprite map={GEM} pixel={3} />
            <Text style={[styles.coinsText, { color: palette.text }]}>+{gemsEarned}</Text>
          </>
        )}
      </View>
      <RetroButton label="PLAY AGAIN" onPress={onRetry} style={styles.retry} />
      <RetroButton label="MENU" onPress={onMenu} variant="ghost" size="small" style={styles.menu} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  gameOver: {
    fontFamily: FONT,
    fontSize: 34,
    letterSpacing: 8,
    color: GAME_COLORS.errorRed,
    fontWeight: 'bold',
  },
  waveText: {
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 3,
    marginTop: 10,
  },
  score: {
    fontFamily: FONT,
    fontSize: 56,
    fontWeight: 'bold',
    marginVertical: 14,
  },
  newBest: {
    fontFamily: FONT,
    fontSize: 16,
    letterSpacing: 3,
    color: GAME_COLORS.warnYellow,
    marginBottom: 16,
  },
  best: {
    fontFamily: FONT,
    fontSize: 14,
    letterSpacing: 3,
    marginBottom: 16,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  coinsText: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  earnGap: {
    width: 16,
  },
  retry: {
    marginBottom: 14,
    minWidth: 240,
  },
  menu: {
    minWidth: 140,
  },
});
