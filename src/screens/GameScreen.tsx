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
import { sfx } from '../audio/sfx';
import { PixelSprite } from '../components/PixelSprite';
import { RetroButton } from '../components/RetroButton';
import { Starfield } from '../components/Starfield';
import { PIXEL, BOSS_PIXEL } from '../constants';
import { createGameState, step } from '../game/engine';
import { GameState, RunOptions, StepEvents, StepInput } from '../game/types';
import { isBossWave } from '../game/waves';
import {
  BOSS,
  BUG,
  COIN,
  ERROR_GLYPH,
  PixelMap,
  POWERUP_DOUBLE,
  POWERUP_LIFE,
  POWERUP_RAPID,
  WARN_GLYPH,
} from '../sprites';
import { GAME_COLORS } from '../theme/palettes';
import { FONT, useTheme } from '../theme/ThemeContext';

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

interface RunResult {
  score: number;
  wave: number;
  coins: number;
}

interface Props {
  runOptions: RunOptions;
  onGameOver: (result: RunResult) => void;
  onQuit: (result: RunResult) => void;
}

function playStepSfx(ev: StepEvents) {
  // Priority order: one haptic per frame, but sounds can overlap.
  if (ev.shot) sfx.play('shoot');
  if (ev.hit) sfx.play('hit');
  if (ev.coin) sfx.play('coin');
  if (ev.powerup) sfx.play('powerup');
  if (ev.bossDefeated) sfx.play('explosion');
  else if (ev.enemyKilled) sfx.play('explosion');
  if (ev.playerHit) sfx.play('playerHit');
  if (ev.waveCleared) sfx.play('wave');

  if (ev.playerHit) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  } else if (ev.powerup || ev.coin) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else if (ev.enemyKilled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function GameScreen({ runOptions, onGameOver, onQuit }: Props) {
  const { width, height } = useWindowDimensions();
  const { palette, spiderMap, spiderHex } = useTheme();

  const stateRef = useRef<GameState | null>(null);
  if (stateRef.current == null) {
    stateRef.current = createGameState(width, height, { ...runOptions, spiderColorHex: spiderHex });
  }

  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const inputRef = useRef<StepInput>({ targetX: null, targetY: null });
  const dragStart = useRef({ playerX: 0, playerY: 0, touchX: 0, touchY: 0 });
  const callbacksRef = useRef({ onGameOver, onQuit });
  callbacksRef.current = { onGameOver, onQuit };
  const bossAnnouncedRef = useRef(false);

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
      playStepSfx(ev);

      // Announce the boss the moment its wave banner appears.
      if (s.boss && !bossAnnouncedRef.current) {
        bossAnnouncedRef.current = true;
        sfx.play('boss');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      } else if (!s.boss) {
        bossAnnouncedRef.current = false;
      }

      if (ev.gameOver) {
        alive = false;
        cancelAnimationFrame(raf);
        sfx.play('gameOver');
        // Let the final explosion render once before switching screens.
        forceRender();
        setTimeout(
          () => callbacksRef.current.onGameOver({ score: s.score, wave: s.wave, coins: s.runCoins }),
          650
        );
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
  const bossWave = isBossWave(s.wave);

  return (
    <View style={[styles.container, { backgroundColor: palette.bg }]} {...pan.panHandlers}>
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

      {/* boss */}
      {s.boss && (
        <View
          pointerEvents="none"
          style={[styles.entity, { transform: [{ translateX: s.boss.x }, { translateY: s.boss.y }] }]}
        >
          <PixelSprite
            map={BOSS}
            pixel={BOSS_PIXEL}
            style={s.boss.flashTime > 0 ? styles.hitFlash : undefined}
          />
        </View>
      )}

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
            { width: b.w, height: b.h, backgroundColor: palette.playerBullet },
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
            { width: b.w, height: b.h, backgroundColor: GAME_COLORS.enemyBullet },
            { transform: [{ translateX: b.x }, { translateY: b.y }] },
          ]}
        />
      ))}

      {/* coins & powerups */}
      {s.coinDrops.map((c) => (
        <View
          key={c.id}
          pointerEvents="none"
          style={[styles.entity, { transform: [{ translateX: c.x }, { translateY: c.y }] }]}
        >
          <PixelSprite map={COIN} pixel={3} />
        </View>
      ))}
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
          <PixelSprite map={spiderMap} pixel={PIXEL} />
        </View>
      )}

      {/* boss health bar */}
      {s.boss && (
        <View style={styles.bossBarWrap} pointerEvents="none">
          <Text style={[styles.bossBarLabel, { color: GAME_COLORS.boss }]}>
            BOSS · TIER {s.boss.tier}
          </Text>
          <View style={[styles.bossBarTrack, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
            <View
              style={[
                styles.bossBarFill,
                { backgroundColor: GAME_COLORS.boss, width: `${Math.max((s.boss.hp / s.boss.maxHp) * 100, 0)}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* HUD */}
      <View style={styles.hud} pointerEvents="box-none">
        <View>
          <Text style={[styles.hudLabel, { color: palette.textDim }]}>SCORE</Text>
          <Text style={[styles.hudScore, { color: palette.text }]}>{s.score}</Text>
          <View style={styles.livesRow}>
            {Array.from({ length: s.lives }).map((_, i) => (
              <PixelSprite key={i} map={spiderMap} pixel={1.4} style={styles.lifeIcon} />
            ))}
          </View>
        </View>
        <View style={styles.hudCenter}>
          <Text style={[styles.hudWave, { color: palette.textDim }]}>WAVE {s.wave}</Text>
          <View style={styles.hudCoins}>
            <PixelSprite map={COIN} pixel={2} />
            <Text style={[styles.hudCoinText, { color: palette.text }]}>{s.runCoins}</Text>
          </View>
        </View>
        <Pressable onPress={() => setPausedBoth(true)} style={styles.pauseButton} hitSlop={12}>
          <Text style={[styles.pauseGlyph, { color: palette.textDim }]}>❚❚</Text>
        </Pressable>
      </View>

      {/* status pills */}
      {(s.player.rapidTime > 0 || s.player.weapon === 'double' || s.scoreMultTime > 0) && (
        <View style={styles.pillRow} pointerEvents="none">
          {s.player.weapon === 'double' && (
            <Text style={[styles.pill, { color: GAME_COLORS.powerDouble, borderColor: GAME_COLORS.powerDouble }]}>
              DOUBLE SHOT
            </Text>
          )}
          {s.player.rapidTime > 0 && (
            <Text style={[styles.pill, { color: GAME_COLORS.powerRapid, borderColor: GAME_COLORS.powerRapid }]}>
              RAPID {Math.ceil(s.player.rapidTime)}
            </Text>
          )}
          {s.scoreMultTime > 0 && (
            <Text style={[styles.pill, { color: GAME_COLORS.coin, borderColor: GAME_COLORS.coin }]}>
              X2 SCORE {Math.ceil(s.scoreMultTime)}
            </Text>
          )}
        </View>
      )}

      {/* wave banner */}
      {s.waveBannerTime > 0 && (
        <View style={styles.bannerWrap} pointerEvents="none">
          <Text style={[styles.banner, { color: bossWave ? GAME_COLORS.boss : palette.accent }]}>
            {bossWave ? `⚠ BOSS ${s.wave / 10} ⚠` : `WAVE ${s.wave}`}
          </Text>
        </View>
      )}

      {/* pause overlay */}
      {paused && (
        <View style={[styles.pauseOverlay, { backgroundColor: palette.overlay }]}>
          <Text style={[styles.pausedText, { color: palette.text }]}>PAUSED</Text>
          <RetroButton label="RESUME" onPress={() => setPausedBoth(false)} style={styles.resume} />
          <RetroButton
            label="QUIT TO MENU"
            variant="ghost"
            size="small"
            onPress={() =>
              callbacksRef.current.onQuit({ score: s.score, wave: s.wave, coins: s.runCoins })
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  bossBarWrap: {
    position: 'absolute',
    top: 92,
    left: 40,
    right: 40,
    alignItems: 'center',
  },
  bossBarLabel: {
    fontFamily: FONT,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bossBarTrack: {
    height: 8,
    borderWidth: 1,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  bossBarFill: {
    height: '100%',
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
  },
  hudScore: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: 'bold',
  },
  hudWave: {
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: 2,
    marginTop: 4,
  },
  hudCenter: {
    alignItems: 'center',
  },
  hudCoins: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  hudCoinText: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
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
  },
  pillRow: {
    position: 'absolute',
    top: 124,
    left: 18,
    flexDirection: 'row',
  },
  pill: {
    fontFamily: FONT,
    fontSize: 10,
    letterSpacing: 1,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    overflow: 'hidden',
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
  },
  pauseOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedText: {
    fontFamily: FONT,
    fontSize: 30,
    letterSpacing: 8,
    fontWeight: 'bold',
    marginBottom: 34,
  },
  resume: {
    marginBottom: 18,
    minWidth: 200,
  },
});
