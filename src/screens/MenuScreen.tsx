import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { sfx } from '../audio/sfx';
import { PixelSprite } from '../components/PixelSprite';
import { RetroButton } from '../components/RetroButton';
import {
  BOOSTER_IDS,
  BOOSTERS,
  BoosterId,
  boosterDuration,
} from '../progression/boosters';
import { COIN, GEM } from '../sprites';
import { FONT, useTheme } from '../theme/ThemeContext';

interface Props {
  highScore: number;
  coins: number;
  gems: number;
  boosterLevels: Record<BoosterId, number>;
  armed: Record<BoosterId, boolean>;
  canArm: (id: BoosterId) => boolean;
  onToggleArm: (id: BoosterId) => void;
  onPlay: () => void;
  onShop: () => void;
  onSettings: () => void;
}

export function MenuScreen({
  highScore,
  coins,
  gems,
  boosterLevels,
  armed,
  canArm,
  onToggleArm,
  onPlay,
  onShop,
  onSettings,
}: Props) {
  const { palette, robotMap } = useTheme();
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
      <View style={styles.walletRow}>
        <PixelSprite map={COIN} pixel={3} />
        <Text style={[styles.walletText, { color: palette.text }]}>{coins}</Text>
        <View style={styles.walletGap} />
        <PixelSprite map={GEM} pixel={3} />
        <Text style={[styles.walletText, { color: palette.text }]}>{gems}</Text>
      </View>

      <Text style={[styles.title, { color: palette.accent }]}>DROID</Text>
      <Text style={[styles.subtitle, { color: palette.text }]}>INVADER</Text>
      <Animated.View style={{ transform: [{ translateY }], marginVertical: 26 }}>
        <PixelSprite map={robotMap} pixel={8} />
      </Animated.View>
      <Text style={[styles.highScore, { color: palette.textDim }]}>
        {highScore > 0 ? `HIGH SCORE  ${highScore}` : 'NO HIGH SCORE YET'}
      </Text>

      {/* arm boosters for the next run (consumable: costs coins every run) */}
      <View style={styles.boosterRow}>
        {BOOSTER_IDS.map((id) => {
          const level = boosterLevels[id];
          const isArmed = armed[id];
          const owned = level > 0;
          const enabled = owned && (isArmed || canArm(id));
          return (
            <Pressable
              key={id}
              disabled={!enabled}
              onPress={() => {
                sfx.play('click');
                onToggleArm(id);
              }}
              style={[
                styles.boosterPill,
                { borderColor: isArmed ? palette.accent : palette.cardBorder, backgroundColor: palette.cardBg },
                !enabled && styles.boosterDisabled,
              ]}
            >
              <Text style={[styles.boosterName, { color: isArmed ? palette.accent : palette.text }]}>
                {BOOSTERS[id].name}
              </Text>
              <Text style={[styles.boosterMeta, { color: palette.textDim }]}>
                {owned ? `LV ${level} · ${boosterDuration(level)}s` : 'BUY IN SHOP'}
              </Text>
              <Text style={[styles.boosterMeta, { color: isArmed ? palette.accent : palette.textDim }]}>
                {owned ? (isArmed ? `ARMED · -${BOOSTERS[id].armCost}` : `ARM FOR ${BOOSTERS[id].armCost}`) : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <RetroButton label="PLAY" onPress={onPlay} style={styles.play} />
      <View style={styles.navRow}>
        <RetroButton label="SHOP" onPress={onShop} variant="ghost" size="small" style={styles.navButton} />
        <RetroButton label="SETTINGS" onPress={onSettings} variant="ghost" size="small" style={styles.navButton} />
      </View>
      <Text style={[styles.hint, { color: palette.textDim }]}>DRAG TO MOVE · AUTO-FIRE</Text>
      <Text style={[styles.hint, { color: palette.textDim }]}>BOSS EVERY 10TH WAVE</Text>
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
  walletRow: {
    position: 'absolute',
    top: 58,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletText: {
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 7,
  },
  walletGap: {
    width: 14,
  },
  title: {
    fontFamily: FONT,
    fontSize: 44,
    letterSpacing: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontFamily: FONT,
    fontSize: 28,
    letterSpacing: 14,
    marginTop: 4,
  },
  highScore: {
    fontFamily: FONT,
    fontSize: 14,
    marginBottom: 18,
    letterSpacing: 2,
  },
  boosterRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  boosterPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 6,
    alignItems: 'center',
    minWidth: 140,
  },
  boosterDisabled: {
    opacity: 0.4,
  },
  boosterName: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  boosterMeta: {
    fontFamily: FONT,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 3,
  },
  play: {
    marginBottom: 16,
    minWidth: 220,
  },
  navRow: {
    flexDirection: 'row',
    marginBottom: 22,
  },
  navButton: {
    marginHorizontal: 8,
    minWidth: 120,
  },
  hint: {
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 6,
  },
});
