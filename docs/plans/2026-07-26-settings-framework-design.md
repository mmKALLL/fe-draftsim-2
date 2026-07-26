# Design: player settings framework (2aUH6Skw)

**Date:** 2026-07-26
**Status:** Proposed — awaiting architecture decision (A vs B)

## Goal
A settings screen in the main menu that lets players tweak game parameters
(difficulty, gold-gain method, and more later). Values persist in localStorage,
new settings can be added without invalidating existing storage, and there's an
abstraction layer mapping a setting's value to its effect on config constants.
Setting definitions live at the end of `config.ts` (just renamed from constants.ts).

**Scope of THIS card:** the framework + one demo toggle to prove it end-to-end.
Real settings (difficulty, gold method, game-origin filter `bpcceA3c`, multi-hit
`9nK1J9Jo`) are follow-up cards that plug into this.

## The central question: how does a setting retune config?
Config values are module-level exports read by ~11 modules. Two ways to make them
player-adjustable at runtime:

### Option A — live-binding `let` (recommended)
Tunable values change from `export const X` to `export let X` in `config.ts`. A
function inside `config.ts` reassigns them. Because ESM imports are **live
bindings**, every module that did `import { X }` sees the new value — as long as
it reads `X` at call-time inside a function, which all our config reads do.

- **Pros:** zero changes to the 11 consumer modules; only the handful of values a
  setting actually touches become `let` (rest stay `const`); smallest diff.
- **Cons:** a setting's effect is an imperative closure, not a pure data map;
  a consumer that captured a config value into a *module-top-level* const would go
  stale — audited, none currently do (every read is inside a function).

### Option B — mutable `cfg` object
Replace the tunable consts with one mutable object `export const cfg = { X, Y }`;
consumers read `cfg.X`; each setting writes a declarative, string-keyed effect map
(`{ hard: { ARENA_ENEMY_LEVEL_BONUS: [0,1,2,3] } }`) into `cfg`.

- **Pros:** matches the card's "object with references to config constants" most
  literally; effects are pure serialisable data.
- **Cons:** every consumer + call site must switch to `cfg.X` — touches all 11
  modules, a large diff with real merge risk against the in-flight roster/tuning
  work.

### Recommendation: **A**
Same player-facing outcome with a fraction of the churn. The per-setting
`apply(value)` closure still co-locates "which constants this value changes" right
next to the constants, satisfying the card's intent. Option B is available if you
want the fully declarative data-map and accept the larger refactor.

## Architecture (assuming A)

### `config.ts` — definitions at the end
```ts
type SettingValue = boolean | string | string[]
type SettingDef = {
  key: string                 // stable storage id — never renamed/reused
  label: string
  description?: string
  type: 'toggle' | 'choice' | 'multi'
  default: SettingValue
  options?: { value: string; label: string }[]   // choice / multi
  apply: (value: SettingValue) => void            // writes the effect into the `let` bindings
}
export const SETTINGS: SettingDef[] = [ /* demo toggle for this card */ ]
```

### `src/settings.ts` — orchestration + persistence
- One key `firerogue.settings.v1`, value `Record<string, SettingValue>`.
- `loadSettings()` — read the stored map (try/catch, best-effort, like `stats.ts`).
- `getSetting(key)` — returns `stored[key] ?? def.default`.
- `setSetting(key, value)` — update map, persist, then `applyAll()`.
- `applyAll()` — for each def, `def.apply(getSetting(def.key))`.
- **Forward-compatible by construction:** missing key → default; unknown stored
  key → ignored. Adding a setting later never invalidates existing storage.

### `main.ts` — startup
`loadSettings(); applyAll();` before `showMenu()`, so config reflects the player's
choices before any run. If load fails, the game runs at the `let` defaults.

### `ui.ts` + `index.html` — the screen
A `menuSettingsBtn` in the menu opens `showSettings()`, built on the existing
`showModal()` (same path as Help/Statistics). Each `SettingDef` renders by type
(toggle→checkbox, choice→radio, multi→checkbox group) with its label + optional
description; each control's `onchange` calls `setSetting()` for a live apply +
persist.

### Demo toggle (this card)
A single, safe, observable boolean to prove the whole loop — proposed: **"Show
victory log line"** (default on) that flips whether the combat-win log line prints
(this also happens to prototype one of the new Random-ideas cards). Trivially
swappable; the point is exercising define → persist → apply → reload.

## How the follow-up cards plug in (not this card)
- **bpcceA3c** — a `multi` setting `enabledOrigins` (default all) whose `apply`
  sets `let ENABLED_ORIGINS: Set<string>`; the draft/enemy pool filters on it.
  Needs a per-unit origin tag (FE6/FE7/FE8/FEMS).
- **9nK1J9Jo** — move the multi-hit speed thresholds into a `config` array; a
  `toggle` reassigns it to enable the 3× tier.

## Verification
tsc green; toggling the demo setting visibly changes behavior; a reload restores
the chosen value; a hand-written unknown/missing key in storage is tolerated.

## Open decisions
1. **Architecture A vs B** (recommend A).
2. **Demo toggle** — the "Show victory log line" suggestion, or a different safe one.
