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
import { BOSS_PIXEL, PIXEL, REVIVE_COUNTDOWN } from '../constants';
import { createGameState, nextReviveCost, revive, step } from '../game/engine';
import { GameState, RunOptions, StepEvents, StepInput } from '../game/types';
import { isBossWave } from '../game/waves';
import {
  ALIEN_CRAB,
  ALIEN_SAUCER,
  ALIEN_SQUID,
  BOSS,
  COIN,
  GEM,
  PixelMap,
  POWERUP_DOUBLE,
  POWERUP_LIFE,
  POWERUP_RAPID,
  POWERUP_SHIELD,
} from '../sprites';
import { GAME_COLORS } from '../theme/palettes';
import { FONT, useTheme } from '../theme/ThemeContext';

const ENEMY_SPRITES: Record<'bug' | 'error' | 'warn', PixelMap> = {
  bug: ALIEN_CRAB,
  error: ALIEN_SQUID,
  warn: ALIEN_SAUCER,
};

const POWERUP_SPRITES = {
  double: POWERUP_DOUBLE,
  rapid: POWERUP_RAPID,
  life: POWERUP_LIFE,
  shield: POWERUP_SHIELD,
} as const;

export interface RunResult {
  score: number;
  wave: number;
  coins: number;
  gems: number;
}

interface Props {
  runOptions: RunOptions;
  gems: number; // wallet gems available for revives
  onSpendGems: (amount: number) => void;
  onGameOver: (result: RunResult) => void;
  onQuit: (result: RunResult) => void;
}

function runResult(s: GameState): RunResult {
  return { score: s.score, wave: s.wave, coins: s.runCoins, gems: s.runGems };
}

function playStepSfx(ev: StepEvents) {
  // Priority order: one haptic per frame, but sounds can overlap.
  if (ev.shot) sfx.play('shoot');
  if (ev.hit || ev.shielded) sfx.play('hit');
  if (ev.gem) sfx.play('gem');
  else if (ev.coin) sfx.play('coin');
  if (ev.powerup) sfx.play('powerup');
  if (ev.bossDefeated || ev.enemyKilled) sfx.play('explosion');
  if (ev.playerHit) sfx.play('playerHit');
  if (ev.waveCleared) sfx.play('wave');

  if (ev.playerHit) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  } else if (ev.powerup || ev.coin || ev.gem) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else if (ev.enemyKilled) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export function GameScreen({ runOptions, gems, onSpendGems, onGameOver, onQuit }: Props) {
  const { width, height } = useWindowDimensions();
  const { palette, robotMap, robotHex } = useTheme();

  const stateRef = useRef<GameState | null>(null);
  if (stateRef.current == null) {
    stateRef.current = createGameState(width, height, { ...runOptions, robotColorHex: robotHex });
  }

  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  const [paused, setPaused] = useState(false);
  // >0 while the revive offer is on screen; the sim is frozen meanwhile.
  const [reviveCost, setReviveCost] = useState<number | null>(null);
  const [reviveLeft, setReviveLeft] = useState(REVIVE_COUNTDOWN);

  const pausedRef = useRef(false);
  const reviveRef = useRef(false);
  const endedRef = useRef(false);
  const inputRef = useRef<StepInput>({ targetX: null, targetY: null });
  const dragStart = useRef({ playerX: 0, playerY: 0, touchX: 0, touchY: 0 });
  const gemsRef = useRef(gems);
  gemsRef.current = gems;
  const callbacksRef = useRef({ onGameOver, onQuit, onSpendGems });
  callbacksRef.current = { onGameOver, onQuit, onSpendGems };
  const bossAnnouncedRef = useRef(false);

  const setPausedBoth = (v: boolean) => {
    pausedRef.current = v;
    setPaused(v);
  };

  const finishGameOver = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    const s = stateRef.current!;
    sfx.play('gameOver');
    forceRender(); // let the final explosion show
    setTimeout(() => callbacksRef.current.onGameOver(runResult(s)), 650);
  };

  const offerRevive = () => {
    reviveRef.current = true;
    setReviveCost(nextReviveCost(stateRef.current!));
    setReviveLeft(REVIVE_COUNTDOWN);
  };

  const acceptRevive = () => {
    const s = stateRef.current!;
    const cost = nextReviveCost(s);
    if (gemsRef.current < cost) return;
    callbacksRef.current.onSpendGems(cost);
    revive(s);
    sfx.play('revive');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    reviveRef.current = false;
    setReviveCost(null);
  };

  const declineRevive = () => {
    reviveRef.current = false;
    setReviveCost(null);
    finishGameOver();
  };

  // Revive countdown (sim is frozen while the offer is up).
  useEffect(() => {
    if (reviveCost == null) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const left = REVIVE_COUNTDOWN - (Date.now() - startedAt) / 1000;
      if (left <= 0) {
        clearInterval(timer);
        declineRevive();
      } else {
        setReviveLeft(left);
      }
    }, 100);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviveCost]);

  // Relative dragging: the robot follows finger *movement*, so the finger
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
      if (pausedRef.current || reviveRef.current || endedRef.current) return;

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
        // Subway-style second chance: offer a gem revive if affordable.
        if (gemsRef.current >= nextReviveCost(s)) {
          forceRender();
          offerRevive();
        } else {
          finishGameOver();
        }
        return;
      }
      forceRender();
    };

    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = stateRef.current;
  const blinking = s.player.invulnTime > 0 && Math.floor(s.time * 12) % 2 === 0;
  const bossWave = isBossWave(s.wave);
  const shieldOn = s.player.shieldTime > 0;
  const shieldBlinking = shieldOn && s.player.shieldTime < 1.2 && Math.floor(s.time * 8) % 2 === 0;

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
            style={
              s.boss.flashTime > 0 || s.boss.state === 'telegraph'
                ? styles.hitFlash
                : undefined
            }
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

      {/* pickups: coins, gems, powerups */}
      {s.coinDrops.map((c) => (
        <View
          key={c.id}
          pointerEvents="none"
          style={[styles.entity, { transform: [{ translateX: c.x }, { translateY: c.y }] }]}
        >
          <PixelSprite map={COIN} pixel={3} />
        </View>
      ))}
      {s.gemDrops.map((g) => (
        <View
          key={g.id}
          pointerEvents="none"
          style={[styles.entity, { transform: [{ translateX: g.x }, { translateY: g.y }] }]}
        >
          <PixelSprite map={GEM} pixel={3} />
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

      {/* player (+ shield ring) */}
      {!s.gameOver && (
        <>
          {shieldOn && !shieldBlinking && (
            <View
              pointerEvents="none"
              style={[
                styles.shieldRing,
                {
                  width: s.player.w + 16,
                  height: s.player.h + 16,
                  transform: [
                    { translateX: s.player.x - 8 },
                    { translateY: s.player.y - 8 },
                  ],
                },
              ]}
            />
          )}
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
            <PixelSprite map={robotMap} pixel={PIXEL} />
          </View>
        </>
      )}

      {/* boss health bar */}
      {s.boss && (
        <View style={styles.bossBarWrap} pointerEvents="none">
          <Text style={[styles.bossBarLabel, { color: GAME_COLORS.boss }]}>
            {s.boss.enraged ? '⚡ ENRAGED ⚡ · ' : ''}BOSS · TIER {s.boss.tier}
          </Text>
          <View style={[styles.bossBarTrack, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
            <View
              style={[
                styles.bossBarFill,
                {
                  backgroundColor: s.boss.enraged ? GAME_COLORS.danger : GAME_COLORS.boss,
                  width: `${Math.max((s.boss.hp / s.boss.maxHp) * 100, 0)}%`,
                },
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
              <PixelSprite key={i} map={robotMap} pixel={1.4} style={styles.lifeIcon} />
            ))}
          </View>
        </View>
        <View style={styles.hudCenter}>
          <Text style={[styles.hudWave, { color: palette.textDim }]}>WAVE {s.wave}</Text>
          <View style={styles.hudCoins}>
            <PixelSprite map={COIN} pixel={2} />
            <Text style={[styles.hudCoinText, { color: palette.text }]}>{s.runCoins}</Text>
            <View style={styles.hudGemGap} />
            <PixelSprite map={GEM} pixel={2} />
            <Text style={[styles.hudCoinText, { color: palette.text }]}>{s.runGems}</Text>
          </View>
        </View>
        <Pressable onPress={() => setPausedBoth(true)} style={styles.pauseButton} hitSlop={12}>
          <Text style={[styles.pauseGlyph, { color: palette.textDim }]}>❚❚</Text>
        </Pressable>
      </View>

      {/* status pills */}
      {(s.player.rapidTime > 0 || s.player.weapon === 'double' || s.scoreMultTime > 0 || shieldOn) && (
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
          {shieldOn && (
            <Text style={[styles.pill, { color: GAME_COLORS.shield, borderColor: GAME_COLORS.shield }]}>
              SHIELD {Math.ceil(s.player.shieldTime)}
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
            {bossWave ? `⚠ BOSS ${s.wave / 10} ⚠` : s.enemies[0]?.mode === 'creep' ? 'SWARM!' : `WAVE ${s.wave}`}
          </Text>
        </View>
      )}

      {/* revive offer */}
      {reviveCost != null && (
        <View style={[styles.pauseOverlay, { backgroundColor: palette.overlay }]}>
          <Text style={[styles.reviveTitle, { color: palette.text }]}>CONTINUE?</Text>
          <View style={styles.reviveGemRow}>
            <PixelSprite map={GEM} pixel={5} />
            <Text style={[styles.reviveCost, { color: GAME_COLORS.gem }]}>{reviveCost}</Text>
          </View>
          <View style={[styles.reviveBarTrack, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
            <View
              style={[
                styles.reviveBarFill,
                { backgroundColor: GAME_COLORS.gem, width: `${(reviveLeft / REVIVE_COUNTDOWN) * 100}%` },
              ]}
            />
          </View>
          <RetroButton label={`REVIVE · ${reviveCost} GEM${reviveCost > 1 ? 'S' : ''}`} onPress={acceptRevive} style={styles.resume} />
          <RetroButton label="GIVE UP" variant="ghost" size="small" onPress={declineRevive} />
          <Text style={[styles.reviveWallet, { color: palette.textDim }]}>WALLET: {gems} GEMS</Text>
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
            onPress={() => callbacksRef.current.onQuit(runResult(s))}
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
  shieldRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderWidth: 2,
    borderColor: GAME_COLORS.shield,
    borderRadius: 12,
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
  hudGemGap: {
    width: 12,
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
    flexWrap: 'wrap',
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
    marginBottom: 6,
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
    minWidth: 220,
  },
  reviveTitle: {
    fontFamily: FONT,
    fontSize: 32,
    letterSpacing: 8,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  reviveGemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  reviveCost: {
    fontFamily: FONT,
    fontSize: 34,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  reviveBarTrack: {
    height: 10,
    borderWidth: 1,
    borderRadius: 5,
    width: 240,
    overflow: 'hidden',
    marginBottom: 26,
  },
  reviveBarFill: {
    height: '100%',
  },
  reviveWallet: {
    fontFamily: FONT,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 18,
  },
});
