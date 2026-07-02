# Claude Invader 🕷️

An offline, infinite arcade shooter for iOS and Android, built with React Native (Expo). You pilot the Claude Code spider against endless waves of bugs, errors, and warnings — Chicken Invaders style. Survive as long as you can.

## How to play

- **Drag anywhere** to move the spider (it follows your finger's movement, so your finger never covers it).
- The spider **auto-fires** — just dodge and aim.
- Waves are **infinite** and get harder forever: more enemies, faster dives, denser fire, tougher hulls.
- Enemies:
  - 🟢 **Bugs** — basic swarmers.
  - 🔴 **Errors (✕)** — tougher, and they dive-bomb you.
  - 🟡 **Warnings (⚠)** — shoot back from the top row.
- Power-up drops: **double shot**, **rapid fire**, **extra life**.
- You have 3 lives. Enemies breaking through the bottom cost a life too.
- High score is saved on-device (fully offline — no network, ever).

## Running it

```bash
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on your iPhone or Android phone (both on the same Wi-Fi). For store-ready binaries, use [EAS Build](https://docs.expo.dev/build/introduction/): `npx eas build`.

## Development

```bash
npm run typecheck   # TypeScript
npm test            # jest unit tests for the game engine
node scripts/gen-assets.js   # regenerate app icons from the spider pixel map
```

### Architecture

- `src/game/engine.ts` — the whole simulation as a pure `step(state, dt, input)` function (unit-testable without a device).
- `src/game/waves.ts` — procedural infinite wave generator; all difficulty scaling lives here.
- `src/sprites/index.ts` — every sprite is a pixel map in code; no image assets in the game itself.
- `src/components/PixelSprite.tsx` — renders pixel maps as merged horizontal runs of `View`s.
- `src/screens/GameScreen.tsx` — 60 fps `requestAnimationFrame` loop, drag input, HUD, pause.
