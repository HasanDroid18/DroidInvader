import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { PixelSprite } from '../components/PixelSprite';
import { COLORS } from '../constants';
import { SPIDER } from '../sprites';
import { FONT } from '../ui';

interface Props {
  highScore: number;
  onPlay: () => void;
}

export function MenuScreen({ highScore, onPlay }: Props) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CLAUDE</Text>
      <Text style={styles.subtitle}>INVADER</Text>
      <Animated.View style={{ transform: [{ translateY }], marginVertical: 36 }}>
        <PixelSprite map={SPIDER} pixel={8} />
      </Animated.View>
      <Text style={styles.highScore}>
        {highScore > 0 ? `HIGH SCORE  ${highScore}` : 'NO HIGH SCORE YET'}
      </Text>
      <Pressable onPress={onPlay} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
        <Text style={styles.playText}>PLAY</Text>
      </Pressable>
      <Text style={styles.hint}>DRAG TO MOVE · AUTO-FIRE</Text>
      <Text style={styles.hint}>SURVIVE THE INFINITE BUG WAVES</Text>
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
  title: {
    fontFamily: FONT,
    fontSize: 46,
    letterSpacing: 10,
    color: COLORS.terracotta,
    fontWeight: 'bold',
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: 30,
    letterSpacing: 14,
    color: COLORS.ivory,
    marginTop: 4,
  },
  highScore: {
    fontFamily: FONT,
    fontSize: 15,
    color: COLORS.dim,
    marginBottom: 28,
    letterSpacing: 2,
  },
  playButton: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 54,
    paddingVertical: 16,
    borderRadius: 4,
    marginBottom: 30,
  },
  pressed: {
    backgroundColor: COLORS.terracottaDark,
  },
  playText: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.bg,
    letterSpacing: 6,
  },
  hint: {
    fontFamily: FONT,
    fontSize: 11,
    color: COLORS.dim,
    letterSpacing: 2,
    marginTop: 6,
  },
});
