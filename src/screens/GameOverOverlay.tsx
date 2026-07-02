import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { FONT } from '../ui';

interface Props {
  score: number;
  wave: number;
  highScore: number;
  isNewBest: boolean;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverOverlay({ score, wave, highScore, isNewBest, onRetry, onMenu }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.gameOver}>GAME OVER</Text>
      <Text style={styles.waveText}>REACHED WAVE {wave}</Text>
      <Text style={styles.score}>{score}</Text>
      {isNewBest ? (
        <Text style={styles.newBest}>★ NEW BEST ★</Text>
      ) : (
        <Text style={styles.best}>BEST  {highScore}</Text>
      )}
      <Pressable onPress={onRetry} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>PLAY AGAIN</Text>
      </Pressable>
      <Pressable onPress={onMenu} style={({ pressed }) => [styles.buttonGhost, pressed && styles.pressedGhost]}>
        <Text style={styles.buttonGhostText}>MENU</Text>
      </Pressable>
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
    color: COLORS.errorRed,
    fontWeight: 'bold',
  },
  waveText: {
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 3,
    color: COLORS.dim,
    marginTop: 10,
  },
  score: {
    fontFamily: FONT,
    fontSize: 56,
    color: COLORS.ivory,
    fontWeight: 'bold',
    marginVertical: 14,
  },
  newBest: {
    fontFamily: FONT,
    fontSize: 16,
    letterSpacing: 3,
    color: COLORS.warnYellow,
    marginBottom: 34,
  },
  best: {
    fontFamily: FONT,
    fontSize: 14,
    letterSpacing: 3,
    color: COLORS.dim,
    marginBottom: 34,
  },
  button: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 14,
  },
  pressed: {
    backgroundColor: COLORS.terracottaDark,
  },
  buttonText: {
    fontFamily: FONT,
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.bg,
    letterSpacing: 4,
  },
  buttonGhost: {
    borderColor: COLORS.dim,
    borderWidth: 1,
    paddingHorizontal: 44,
    paddingVertical: 12,
    borderRadius: 4,
  },
  pressedGhost: {
    borderColor: COLORS.ivory,
  },
  buttonGhostText: {
    fontFamily: FONT,
    fontSize: 15,
    color: COLORS.ivory,
    letterSpacing: 4,
  },
});
