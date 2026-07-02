import { createGameState, nextReviveCost, revive, step } from '../src/game/engine';
import { bossKind } from '../src/game/boss';

// --- 1. mortal bot on the retuned curve (should get further than before)
{
  const s = createGameState(390, 844);
  let frames = 0;
  while (!s.gameOver && frames < 60 * 600) {
    const target = s.boss ?? s.enemies[0];
    const input = target
      ? { targetX: target.x + target.w / 2 - s.player.w / 2, targetY: s.player.y }
      : { targetX: null, targetY: null };
    step(s, 1 / 60, input);
    frames++;
  }
  console.log('mortal:', JSON.stringify({ survivedS: Math.round(frames / 60), wave: s.wave, score: s.score }));
}

// --- 2. revive flow: die, revive (escalating), keep playing
{
  const s = createGameState(390, 844);
  let revives = 0;
  let frames = 0;
  const costs: number[] = [];
  while (frames < 60 * 300 && revives < 3) {
    step(s, 1 / 60, { targetX: null, targetY: null }); // sitting duck
    frames++;
    if (s.gameOver) {
      costs.push(nextReviveCost(s));
      revive(s);
      revives++;
    }
  }
  if (JSON.stringify(costs) !== '[1,2,3]') throw new Error('revive costs wrong: ' + costs);
  if (s.gameOver) throw new Error('run did not continue after revive');
  console.log('revive:', JSON.stringify({ revives, costs, waveReached: s.wave }));
}

// --- 3. immortal deep run to wave 31+: all three boss archetypes, stability
{
  const s = createGameState(390, 844, { rapidDuration: 60 });
  const kinds = new Set<string>();
  let maxEntities = 0;
  for (let i = 0; i < 60 * 60 * 40 && s.wave < 31; i++) {
    const target = s.boss ?? s.enemies[0];
    const input = target
      ? { targetX: target.x + target.w / 2 - s.player.w / 2, targetY: s.player.y }
      : { targetX: null, targetY: null };
    step(s, 1 / 60, input);
    if (s.boss) kinds.add(s.boss.kind);
    if (s.lives < 3) { s.lives = 3; s.gameOver = false; }
    s.player.rapidTime = 60; // keep dps up so boss fights end
    maxEntities = Math.max(maxEntities, s.enemies.length + s.playerBullets.length +
      s.enemyBullets.length + s.particles.length + s.powerups.length + s.coinDrops.length + s.gemDrops.length);
    if (!Number.isFinite(s.player.x) || (s.boss && !(Number.isFinite(s.boss.x) && Number.isFinite(s.boss.y))))
      throw new Error('NaN leak at wave ' + s.wave);
  }
  const expected = new Set([bossKind(1), bossKind(2), bossKind(3)]);
  for (const k of expected) if (!kinds.has(k)) throw new Error('never met boss kind ' + k);
  console.log('deep:', JSON.stringify({ wave: s.wave, bossKinds: [...kinds], runGems: s.runGems, runCoins: s.runCoins, maxEntities }));
}
