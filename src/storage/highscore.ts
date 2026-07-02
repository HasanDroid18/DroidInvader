import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'claude-invader/high-score';

export async function loadHighScore(): Promise<number> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    const n = v ? parseInt(v, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function saveHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(score));
  } catch {
    // Offline-only nicety; losing a high score is not worth crashing over.
  }
}
