import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { sfx } from './src/audio/sfx';
import { Starfield } from './src/components/Starfield';
import { RunOptions } from './src/game/types';
import {
  BOOSTER_IDS,
  BOOSTERS,
  BoosterId,
  boosterDuration,
  upgradeCost,
} from './src/progression/boosters';
import { GameOverOverlay } from './src/screens/GameOverOverlay';
import { GameScreen } from './src/screens/GameScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { loadProfile, Profile, saveProfile, Settings } from './src/storage/profile';
import { PALETTES } from './src/theme/palettes';
import { ThemeProvider } from './src/theme/ThemeContext';

type Mode = 'menu' | 'playing' | 'gameover' | 'shop' | 'settings';

interface RunResult {
  score: number;
  wave: number;
  coins: number;
}

const NO_ARMED: Record<BoosterId, boolean> = { rapid: false, score2x: false };

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<Mode>('menu');
  const [gameId, setGameId] = useState(0);
  const [armed, setArmed] = useState<Record<BoosterId, boolean>>(NO_ARMED);
  const [runOptions, setRunOptions] = useState<RunOptions>({});
  const [lastRun, setLastRun] = useState<RunResult>({ score: 0, wave: 1, coins: 0 });
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    sfx.init();
    loadProfile().then((p) => {
      setProfile(p);
      sfx.setEnabled(p.settings.soundOn);
    });
  }, []);

  const updateProfile = useCallback((updater: (p: Profile) => Profile) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveProfile(next); // fire-and-forget; profile state is the source of truth
      return next;
    });
  }, []);

  // --- boosters: arming (per run) and upgrading (shop) ---------------------

  const armedCost = (a: Record<BoosterId, boolean>) =>
    BOOSTER_IDS.reduce((sum, id) => sum + (a[id] ? BOOSTERS[id].armCost : 0), 0);

  const canArm = (id: BoosterId): boolean => {
    if (!profile) return false;
    if (armed[id]) return true; // can always un-arm
    return profile.coins >= armedCost(armed) + BOOSTERS[id].armCost;
  };

  const toggleArm = (id: BoosterId) =>
    setArmed((a) => ({ ...a, [id]: !a[id] }));

  const handleUpgrade = (id: BoosterId) => {
    if (!profile) return;
    const cost = upgradeCost(profile.boosterLevels[id]);
    if (cost == null || profile.coins < cost) return;
    sfx.play('powerup');
    updateProfile((p) => ({
      ...p,
      coins: p.coins - cost,
      boosterLevels: { ...p.boosterLevels, [id]: p.boosterLevels[id] + 1 },
    }));
  };

  // --- run lifecycle --------------------------------------------------------

  const startGame = useCallback(() => {
    if (!profile) return;
    // Arm every selected booster we can afford (in a fixed order).
    let budget = profile.coins;
    const active: Partial<Record<BoosterId, boolean>> = {};
    for (const id of BOOSTER_IDS) {
      if (armed[id] && profile.boosterLevels[id] > 0 && budget >= BOOSTERS[id].armCost) {
        budget -= BOOSTERS[id].armCost;
        active[id] = true;
      }
    }
    const spent = profile.coins - budget;
    if (spent > 0) updateProfile((p) => ({ ...p, coins: p.coins - spent }));
    setRunOptions({
      rapidDuration: active.rapid ? boosterDuration(profile.boosterLevels.rapid) : undefined,
      scoreMultDuration: active.score2x
        ? boosterDuration(profile.boosterLevels.score2x)
        : undefined,
    });
    setGameId((id) => id + 1);
    setMode('playing');
  }, [profile, armed, updateProfile]);

  const bankRun = useCallback(
    (result: RunResult): boolean => {
      const newBest = profile != null && result.score > profile.highScore;
      updateProfile((p) => ({
        ...p,
        coins: p.coins + result.coins,
        highScore: Math.max(p.highScore, result.score),
      }));
      return newBest;
    },
    [profile, updateProfile]
  );

  const handleGameOver = useCallback(
    (result: RunResult) => {
      setIsNewBest(bankRun(result));
      setLastRun(result);
      setMode('gameover');
    },
    [bankRun]
  );

  const handleQuit = useCallback(
    (result: RunResult) => {
      bankRun(result); // quitting still keeps the coins collected
      setMode('menu');
    },
    [bankRun]
  );

  // --- settings -------------------------------------------------------------

  const handleSettingsChange = (patch: Partial<Settings>) => {
    if (patch.soundOn != null) sfx.setEnabled(patch.soundOn);
    updateProfile((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  };

  if (!profile) {
    // One frame of blank while the profile loads from disk.
    return <View style={[styles.container, { backgroundColor: PALETTES.dark.bg }]} />;
  }

  return (
    <ThemeProvider settings={profile.settings}>
      <View style={[styles.container, { backgroundColor: PALETTES[profile.settings.theme].bg }]}>
        <StatusBar style={profile.settings.theme === 'dark' ? 'light' : 'dark'} />
        {mode === 'playing' ? (
          <GameScreen
            key={gameId}
            runOptions={runOptions}
            onGameOver={handleGameOver}
            onQuit={handleQuit}
          />
        ) : (
          <View style={styles.container}>
            <Starfield />
            {mode === 'menu' && (
              <MenuScreen
                highScore={profile.highScore}
                coins={profile.coins}
                boosterLevels={profile.boosterLevels}
                armed={armed}
                canArm={canArm}
                onToggleArm={toggleArm}
                onPlay={startGame}
                onShop={() => setMode('shop')}
                onSettings={() => setMode('settings')}
              />
            )}
            {mode === 'shop' && (
              <ShopScreen
                coins={profile.coins}
                boosterLevels={profile.boosterLevels}
                onUpgrade={handleUpgrade}
                onBack={() => setMode('menu')}
              />
            )}
            {mode === 'settings' && (
              <SettingsScreen
                settings={profile.settings}
                onChange={handleSettingsChange}
                onBack={() => setMode('menu')}
              />
            )}
            {mode === 'gameover' && (
              <GameOverOverlay
                score={lastRun.score}
                wave={lastRun.wave}
                coinsEarned={lastRun.coins}
                highScore={profile.highScore}
                isNewBest={isNewBest}
                onRetry={startGame}
                onMenu={() => setMode('menu')}
              />
            )}
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
