import * as Haptics from 'expo-haptics';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { PixelSprite } from '../components/PixelSprite';
import { Starfield } from '../components/Starfield';
import { COLORS, PIXEL } from '../constants';
import { createGameState, step } from '../game/engine';
import { GameState, StepInput } from '../game/types';
import {
  BUG,
  ERROR_GLYPH,
  PixelMap,
  POWERUP_DOUBLE,
  POWERUP_LIFE,
  POWERUP_RAPID,
  SPIDER,
  WARN_GLYPH,
} from '../sprites';
import { FONT } from '../ui';

const ENEMY_SPRITES: Record<'bug' | 'error' | 'warn', PixelMap> = {
  bug: BUG,
  error: ERROR_GLYPH,
  warn: WARN_GLYPH,
};

const POWERUP_SPRITES = {
  double: POWERUP_DOUBLE,
  rapid: POWERUP_RAPID,
  life: POWERUP_LIFE,
} as const;

interface Props {
  onGameOver: (score: number, wave: number) => void;
  onQuit: () => void;
}

export function GameScreen({ onGameOver, onQuit }: Props) {
  const { width, height } = useWindowDimensions();

  const stateRef = useRef<GameState | null>(null);
  if (stateRef.current == null) stateRef.current = createGameState(width, height);

  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const inputRef = useRef<StepInput>({ targetX: null, targetY: null });
  const dragStart = useRef({ playerX: 0, playerY: 0, touchX: 0, touchY: 0 });
  const callbacksRef = useRef({ onGameOver, onQuit });
  callbacksRef.current = { onGameOver, onQuit };

  const setPausedBoth = (v: boolean) => {
    pausedRef.current = v;
    setPaused(v);
  };

  // Relative dragging: the spider follows finger *movement*, so the finger
  // never has to sit on top of the sprite.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const s = stateRef.current!;
        dragStart.current = {
          playerX: s.player.x,
          playerY: s.player.y,
          touchX: e.nativeEvent.pageX,
          touchY: e.nativeEvent.pageY,
        };
      },
      onPanResponderMove: (e) => {
        const d = dragStart.current;
        inputRef.current.targetX = d.playerX + (e.nativeEvent.pageX - d.touchX) * 1.15;
        inputRef.current.targetY = d.playerY + (e.nativeEvent.pageY - d.touchY) * 1.15;
      },
      onPanResponderRelease: () => {
        inputRef.current.targetX = null;
        inputRef.current.targetY = null;
      },
      onPanResponderTerminate: () => {
        inputRef.current.targetX = null;
        inputRef.current.targetY = null;
      },
    })
  ).current;

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let last: number | null = null;

    const loop = (t: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(loop);
      if (last == null) {
        last = t;
        return;
      }
      const dt = Math.min((t - last) / 1000, 1 / 30);
      last = t;
      if (pausedRef.current) return;

      const s = stateRef.current!;
      const ev = step(s, dt, inputRef.current);

      if (ev.playerHit) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      } else if (ev.powerup) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (ev.enemyKilled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }

      if (ev.gameOver) {
        alive = false;
        cancelAnimationFrame(raf);
        // Let the final explosion render once before switching screens.
        forceRender();
        setTimeout(() => callbacksRef.current.onGameOver(s.score, s.wave), 650);
        return;
      }
      forceRender();
    };

    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const s = stateRef.current;
  const blinking = s.player.invulnTime > 0 && Math.floor(s.time * 12) % 2 === 0;

  return (
    <View style={styles.container} {...pan.panHandlers}>
      <Starfield />

      {/* particles */}
      {s.particles.map((pt) => (
        <View
          key={pt.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: pt.size,
            height: pt.size,
            backgroundColor: pt.color,
            opacity: pt.life / pt.maxLife,
            transform: [{ translateX: pt.x }, { translateY: pt.y }],
          }}
        />
      ))}

      {/* enemies */}
      {s.enemies.map((e) => (
        <View
          key={e.id}
          pointerEvents="none"
          style={[styles.entity, { transform: [{ translateX: e.x }, { translateY: e.y }] }]}
        >
          <PixelSprite
            map={ENEMY_SPRITES[e.kind]}
            pixel={PIXEL}
            style={e.flashTime > 0 ? styles.hitFlash : undefined}
          />
        </View>
      ))}

      {/* bullets */}
      {s.playerBullets.map((b) => (
        <View
          key={b.id}
          pointerEvents="none"
          style={[
            styles.bullet,
            { width: b.w, height: b.h, backgroundColor: COLORS.playerBullet },
            { transform: [{ translateX: b.x }, { translateY: b.y }] },
          ]}
        />
      ))}
      {s.enemyBullets.map((b) => (
        <View
          key={b.id}
          pointerEvents="none"
          style={[
            styles.bullet,
            { width: b.w, height: b.h, backgroundColor: COLORS.enemyBullet },
            { transform: [{ translateX: b.x }, { translateY: b.y }] },
          ]}
        />
      ))}

      {/* powerups */}
      {s.powerups.map((pu) => (
        <View
          key={pu.id}
          pointerEvents="none"
          style={[styles.entity, { transform: [{ translateX: pu.x }, { translateY: pu.y }] }]}
        >
          <PixelSprite map={POWERUP_SPRITES[pu.kind]} pixel={3} />
        </View>
      ))}

      {/* player */}
      {!s.gameOver && (
        <View
          pointerEvents="none"
          style={[
            styles.entity,
            {
              opacity: blinking ? 0.25 : 1,
              transform: [{ translateX: s.player.x }, { translateY: s.player.y }],
            },
          ]}
        >
          <PixelSprite map={SPIDER} pixel={PIXEL} />
        </View>
      )}

      {/* HUD */}
      <View style={styles.hud} pointerEvents="box-none">
        <View>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudScore}>{s.score}</Text>
          <View style={styles.livesRow}>
            {Array.from({ length: s.lives }).map((_, i) => (
              <PixelSprite key={i} map={SPIDER} pixel={1.4} style={styles.lifeIcon} />
            ))}
          </View>
        </View>
        <Text style={styles.hudWave}>WAVE {s.wave}</Text>
        <Pressable onPress={() => setPausedBoth(true)} style={styles.pauseButton} hitSlop={12}>
          <Text style={styles.pauseGlyph}>❚❚</Text>
        </Pressable>
      </View>

      {/* status pills */}
      {(s.player.rapidTime > 0 || s.player.weapon === 'double') && (
        <View style={styles.pillRow} pointerEvents="none">
          {s.player.weapon === 'double' && <Text style={styles.pill}>DOUBLE SHOT</Text>}
          {s.player.rapidTime > 0 && (
            <Text style={[styles.pill, styles.pillRapid]}>RAPID {Math.ceil(s.player.rapidTime)}</Text>
          )}
        </View>
      )}

      {/* wave banner */}
      {s.waveBannerTime > 0 && (
        <View style={styles.bannerWrap} pointerEvents="none">
          <Text style={styles.banner}>WAVE {s.wave}</Text>
        </View>
      )}

      {/* pause overlay */}
      {paused && (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pausedText}>PAUSED</Text>
          <Pressable
            onPress={() => setPausedBoth(false)}
            style={({ pressed }) => [styles.resumeButton, pressed && styles.resumePressed]}
          >
            <Text style={styles.resumeText}>RESUME</Text>
          </Pressable>
          <Pressable onPress={() => callbacksRef.current.onQuit()} style={styles.quitButton} hitSlop={8}>
            <Text style={styles.quitText}>QUIT TO MENU</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  entity: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  hitFlash: {
    opacity: 0.45,
  },
  bullet: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 2,
  },
  hud: {
    position: 'absolute',
    top: 54,
    left: 18,
    right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hudLabel: {
    fontFamily: FONT,
    fontSize: 10,
    letterSpacing: 2,
    color: COLORS.dim,
  },
  hudScore: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.ivory,
  },
  hudWave: {
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.dim,
    marginTop: 4,
  },
  livesRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  lifeIcon: {
    marginRight: 5,
  },
  pauseButton: {
    padding: 4,
  },
  pauseGlyph: {
    fontFamily: FONT,
    fontSize: 16,
    color: COLORS.dim,
  },
  pillRow: {
    position: 'absolute',
    top: 120,
    left: 18,
    flexDirection: 'row',
  },
  pill: {
    fontFamily: FONT,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.powerDouble,
    borderColor: COLORS.powerDouble,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  pillRapid: {
    color: COLORS.powerRapid,
    borderColor: COLORS.powerRapid,
  },
  bannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    fontFamily: FONT,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: COLORS.terracotta,
  },
  pauseOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedText: {
    fontFamily: FONT,
    fontSize: 30,
    letterSpacing: 8,
    color: COLORS.ivory,
    fontWeight: 'bold',
    marginBottom: 34,
  },
  resumeButton: {
    backgroundColor: COLORS.terracotta,
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: 4,
    marginBottom: 18,
  },
  resumePressed: {
    backgroundColor: COLORS.terracottaDark,
  },
  resumeText: {
    fontFamily: FONT,
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.bg,
    letterSpacing: 4,
  },
  quitButton: {
    padding: 6,
  },
  quitText: {
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 3,
    color: COLORS.dim,
  },
});
