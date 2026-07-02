# Claude Invader 🕷️

An offline, infinite arcade shooter for iOS and Android, built with React Native (Expo). You pilot the Claude Code spider against endless waves of bugs, errors, and warnings — Chicken Invaders style. Survive as long as you can.

## How to play

- **Drag anywhere** to move the spider (it follows your finger's movement, so your finger never covers it).
- The spider **auto-fires** — just dodge and aim.
- Waves are **infinite** and get harder forever: more enemies, faster dives, denser fire, tougher hulls.
- **Every 10th wave is a boss** with a health bar and a creep escort. Three archetypes cycle so no two bosses in a row play alike — the **Spreader** (aimed fan volleys), the **Rain** (fast sweeps dropping bullet curtains with one safe gap), and the **Charger** (telegraphs, then dive-bombs you and fires a ring). Every boss **enrages at half health**. Each tier is harder than the last.
- **Formations vary every wave** (grid, vee, diamond, columns, arc), and every 7th wave is a **SWARM** — a stream of weaving divers with no formation at all.
- **Difficulty ramps Subway-style**: the first waves are genuinely easy (no shooters, no dive attacks), and pressure builds slowly and smoothly forever.
- Enemies:
  - 🟢 **Bugs** — basic swarmers.
  - 🔴 **Errors (✕)** — tougher, and they dive-bomb you.
  - 🟡 **Warnings (⚠)** — shoot back from the top row.
- Power-up drops: **double shot**, **rapid fire**, **shield** (5s+ of full immunity), **extra life**.
- You have 3 lives. Enemies breaking through the bottom cost a life too.
- Everything (wallet, upgrades, settings, high score) is saved on-device — fully offline, no network, ever.

## Gems & revives

- **Every new install starts with 50 free gems.**
- When you die, you can **revive on the spot** (Subway-Surfers style): the 1st revive of a run costs **1 gem**, the 2nd **2**, the 3rd **3**, and so on. Reviving restores your lives, clears every bullet, and blasts a safety bubble around you.
- Gems are rare: every boss pays some out, and there's a tiny chance any kill drops one. Spend them wisely.

## Coins & boosters

- Enemies drop **coins**; clearing waves and killing bosses pays out more. Coins bank to your wallet when the run ends (quitting keeps them too).
- The **Shop** sells two boosters, upgradeable to level 10:
  - **Rapid Start** — rapid fire at the start of the run.
  - **X2 Score** — doubled score at the start of the run.
  - Level 1 lasts 10s; each level adds duration up to 60s at level 10.
- Boosters are **consumable**: arm them on the menu before a run and pay their arm cost in coins each time.
- The **Shield** upgrade needs no unlock — shield pickups always work (5s), and shop levels stretch them up to 10s.

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
