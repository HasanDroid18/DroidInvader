import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Starfield } from './src/components/Starfield';
import { COLORS } from './src/constants';
import { GameOverOverlay } from './src/screens/GameOverOverlay';
import { GameScreen } from './src/screens/GameScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { loadHighScore, saveHighScore } from './src/storage/highscore';

type Mode = 'menu' | 'playing' | 'gameover';

export default function App() {
  const [mode, setMode] = useState<Mode>('menu');
  const [gameId, setGameId] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastWave, setLastWave] = useState(1);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    loadHighScore().then(setHighScore);
  }, []);

  const startGame = useCallback(() => {
    setGameId((id) => id + 1);
    setMode('playing');
  }, []);

  const handleGameOver = useCallback(
    (score: number, wave: number) => {
      setLastScore(score);
      setLastWave(wave);
      const newBest = score > highScore;
      setIsNewBest(newBest);
      if (newBest) {
        setHighScore(score);
        saveHighScore(score);
      }
      setMode('gameover');
    },
    [highScore]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {mode === 'playing' ? (
        <GameScreen key={gameId} onGameOver={handleGameOver} onQuit={() => setMode('menu')} />
      ) : (
        <View style={styles.container}>
          <Starfield />
          {mode === 'menu' ? (
            <MenuScreen highScore={highScore} onPlay={startGame} />
          ) : (
            <GameOverOverlay
              score={lastScore}
              wave={lastWave}
              highScore={highScore}
              isNewBest={isNewBest}
              onRetry={startGame}
              onMenu={() => setMode('menu')}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
