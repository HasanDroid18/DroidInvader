import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Tiny retro sound-effect manager over expo-audio. One preloaded player per
// sound; play() rewinds and fires. Fully offline (generated wavs, see
// scripts/gen-sfx.js). Never throws — sound must not crash the game.

const SOURCES = {
  shoot: require('../../assets/sfx/shoot.wav'),
  hit: require('../../assets/sfx/hit.wav'),
  explosion: require('../../assets/sfx/explosion.wav'),
  coin: require('../../assets/sfx/coin.wav'),
  powerup: require('../../assets/sfx/powerup.wav'),
  playerHit: require('../../assets/sfx/playerHit.wav'),
  wave: require('../../assets/sfx/wave.wav'),
  boss: require('../../assets/sfx/boss.wav'),
  gameOver: require('../../assets/sfx/gameOver.wav'),
  click: require('../../assets/sfx/click.wav'),
} as const;

export type SfxName = keyof typeof SOURCES;

const VOLUMES: Partial<Record<SfxName, number>> = {
  shoot: 0.3,
  hit: 0.5,
};

const MIN_REPLAY_MS = 60; // per-sound throttle so bullet spam can't stutter

class SfxManager {
  private players = new Map<SfxName, AudioPlayer>();
  private lastPlayed = new Map<SfxName, number>();
  private enabled = true;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      for (const name of Object.keys(SOURCES) as SfxName[]) {
        const player = createAudioPlayer(SOURCES[name]);
        player.volume = VOLUMES[name] ?? 0.7;
        this.players.set(name, player);
      }
    } catch {
      // No audio (e.g. simulator quirk): stay silent instead of crashing.
      this.players.clear();
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    const player = this.players.get(name);
    if (!player) return;
    const now = Date.now();
    const last = this.lastPlayed.get(name) ?? 0;
    if (now - last < MIN_REPLAY_MS) return;
    this.lastPlayed.set(name, now);
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // ignore — a dropped sound effect is fine
    }
  }
}

export const sfx = new SfxManager();
