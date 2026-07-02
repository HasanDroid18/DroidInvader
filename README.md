# Claude Invader 🕷️

An offline, infinite arcade shooter for iOS and Android, built with React Native (Expo). You pilot the Claude Code spider against endless waves of bugs, errors, and warnings — Chicken Invaders style. Survive as long as you can.

## How to play

- **Drag anywhere** to move the spider (it follows your finger's movement, so your finger never covers it).
- The spider **auto-fires** — just dodge and aim.
- Waves are **infinite** and get harder forever: more enemies, faster dives, denser fire, tougher hulls.
- **Every 10th wave is a boss**: a giant monster with a health bar, aimed spread volleys, and a creep escort. Each boss tier is harder than the last.
- Enemies:
  - 🟢 **Bugs** — basic swarmers.
  - 🔴 **Errors (✕)** — tougher, and they dive-bomb you.
  - 🟡 **Warnings (⚠)** — shoot back from the top row.
- Power-up drops: **double shot**, **rapid fire**, **extra life**.
- You have 3 lives. Enemies breaking through the bottom cost a life too.
- Everything (wallet, upgrades, settings, high score) is saved on-device — fully offline, no network, ever.

## Coins & boosters

- Enemies drop **coins**; clearing waves and killing bosses pays out more. Coins bank to your wallet when the run ends (quitting keeps them too).
- The **Shop** sells two boosters, upgradeable to level 10:
  - **Rapid Start** — rapid fire at the start of the run.
  - **X2 Score** — doubled score at the start of the run.
  - Level 1 lasts 10s; each level adds duration up to 60s at level 10.
- Boosters are **consumable**: arm them on the menu before a run and pay their arm cost in coins each time.

## Settings

- **Sound** on/off (all effects are procedurally generated chiptunes — no audio assets downloaded).
- **Dark / light theme.**
- **Spider color** — five skins for the spider.

## Running it

```bash
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on your iPhone or Android phone (both on the same Wi-Fi). For store-ready binaries, use [EAS Build](https://docs.expo.dev/build/introduction/): `npx eas build`.

## Development

```bash
npm run typecheck            # TypeScript
npm test                     # jest unit tests for the game engine & economy
node scripts/gen-assets.js   # regenerate app icons from the spider pixel map
node scripts/gen-sfx.js      # regenerate the chiptune sound effects
```

### Architecture

- `src/game/engine.ts` — the whole simulation as a pure `step(state, dt, input)` function (unit-testable without a device).
- `src/game/waves.ts` — procedural infinite wave generator; formation difficulty scaling lives here.
- `src/game/boss.ts` — boss-fight logic (tiers, spreads, creep spawning), also pure.
- `src/progression/boosters.ts` — the coin economy: booster durations, upgrade and arm costs.
- `src/storage/profile.ts` — one persisted profile blob (wallet, upgrades, settings, high score) with migration.
- `src/theme/` — dark/light palettes, spider skins, and the `ThemeProvider`.
- `src/audio/sfx.ts` — sound manager over `expo-audio`, playing the generated wavs in `assets/sfx/`.
- `src/sprites/index.ts` — every sprite is a pixel map in code; no image assets in the game itself.
- `src/components/PixelSprite.tsx` — renders pixel maps as merged horizontal runs of `View`s.
- `src/screens/` — menu, game (60 fps `requestAnimationFrame` loop), shop, settings, game-over.
