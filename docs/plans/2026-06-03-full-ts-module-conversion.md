# Full ES-module TS Conversion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert all `src/*.js` files into real `.ts` ES modules with explicit `import`/`export`, replace shared global state with a single typed `state` object, and delete the `new Function(...)` eval bridge in `src/bootstrap.ts` — with zero gameplay change.

**Architecture:** Bottom-up conversion (leaves first) so each converted module imports already-typed modules. Shared mutable state moves into one exported `state` object (with nested sub-objects). The only surviving globals are two inline-`<img>`-handler functions, registered explicitly on `window` with a typed `declare global`. Entry point switches from `bootstrap.ts` to `src/main.ts`.

**Tech Stack:** TypeScript 6 (strict), Vite 8, vanilla DOM.

**Critical sequencing note:** The eval bridge requires global-scope script bodies with no `import`/`export`. Therefore the app's runtime is intentionally broken from the first conversion until the final cutover (Task 13). This is acceptable on this isolated branch. **Per-step gate is `npm run check` (tsc --noEmit, green after every task). Final gate is `npm run build` + manual playthrough.**

---

## Conventions (apply in EVERY task)

1. **Rename** `src/x.js` → `src/x.ts` via `git mv`. Remove the leading `'use strict'` line (ES modules are always strict).
2. **Exports:** add `export` to every top-level `function`/`const` that is referenced by another module (see each task's "Imported by" note; when unsure, export it — unused exports are harmless). Keep file-internal helpers unexported.
3. **Imports:** add named imports at the top of the file, grouped by source module. Import from `../constants`, `../data`, `../types` (root) and `./other` (siblings).
4. **State references:** replace every bare shared-state identifier with its `state.*` path per the table below. Import `state` from `./state` (or `../`? it's `src/state.ts`, so siblings use `./state`).
5. **`$` helper:** lives in `utils.ts` after Task 1. It returns `HTMLElement | null`. Where existing code dereferences without a guard (e.g. `$('startBtn').onclick = …`), add a non-null assertion `$('startBtn')!.onclick` — these IDs are static in `index.html`. Prefer existing guards where the code already has `if (el)`.
6. **Verify:** run `npm run check`. Expected: no errors. If tsc reports `Cannot find module './X'`, module `X` is part of a dependency cycle with the current file — convert `X` within the same task and re-run.
7. **Commit** after each green task with the message shown.
8. **No behavior changes.** This is structural only. Do not rename functions, reorder logic, or "improve" anything beyond what conversion requires.

### Canonical state-reference map

| Legacy global | New reference |
|---|---|
| `player` | `state.player` |
| `enemy` | `state.enemy` |
| `consumables` | `state.consumables` |
| `gold` | `state.gold` |
| `battle` | `state.battle` |
| `biomePlan` | `state.biomePlan` |
| `chosen` | `state.draft.chosen` |
| `draftOptions` | `state.draft.options` |
| `combatTurn` | `state.combat.turn` |
| `battleRunning` | `state.combat.running` |
| `autoFight` | `state.combat.autoFight` |
| `nextEnemyMarkerId` | `state.combat.nextEnemyMarkerId` |
| `pendingTargetCancel` | `state.combat.pendingTargetCancel` |
| `pendingConsumableAction` | `state.combat.pendingConsumableAction` |
| `pendingAutoFightAction` | `state.combat.pendingAutoFightAction` |
| `pendingDefaultAction` | `state.combat.pendingDefaultAction` |
| `pendingDefaultLabel` | `state.combat.pendingDefaultLabel` |
| `shopOffers` | `state.shop.offers` |
| `shopOpen` | `state.shop.open` |
| `awaitingReward` | `state.ui.awaitingReward` |
| `pendingShopAfterReward` | `state.ui.pendingShopAfterReward` |
| `filter` | `state.ui.filter` |
| `activePreviewActor` | `state.ui.activePreviewActor` |
| `activeDetailActorIds` | `state.ui.activeDetailActorIds` |
| `activeConsumableActor` | `state.ui.activeConsumableActor` |

---

## Task 0: Prep

**Files:** Modify `tsconfig.json`

**Step 1:** Add `"src/bootstrap.ts"` to a new `exclude` array so tsc stops resolving its now-doomed `?raw` imports during migration:
```json
"exclude": ["src/bootstrap.ts"]
```
(bootstrap.ts is deleted in Task 13; index.html keeps pointing at it until then.)

**Step 2:** Verify baseline: `npm run check` → expected: no errors (only typed `.ts` files checked).

**Step 3:** Commit:
```bash
git add tsconfig.json
git commit -m "chore: exclude bootstrap from tsc during module migration"
```

---

## Task 1: `utils.ts` (+ move `$` here)

**Files:** `git mv src/utils.js src/utils.ts`

**Imports:** `MUSIC_URL` is defined here today; keep it. No state needed.

**Changes:**
- Export: `MUSIC_URL`, `rnd`, `rint`, `pick`, `clamp`, `floor`, `capStat`. Keep `seed` module-private but export a `getSeed`/accessor only if referenced elsewhere — check: `seedLabel` in index.html is populated somewhere; grep `seed`. If `seed` is read by other modules, add `export let seed` is not allowed to be reassigned externally, so expose `export const getSeed = () => seed`. (Resolve during conversion.)
- Add the `$` helper moved out of old state.ts:
  ```ts
  export const $ = (id = ''): HTMLElement | null => document.getElementById(id)
  ```
- `capStat(unit, k)` references `data`/types — import what it needs (`CAPS`? check body) and type params (`unit: Unit, k: StatKey`).

**Verify:** `npm run check` → no errors.

**Commit:** `git commit -am "refactor: convert utils to TS module, move \$ helper here"`

---

## Task 2: `state.ts` (define the state object + economy helpers)

**Files:** Rewrite `src/state.ts`

**Changes:** Replace the `let`-soup with the single `state` object below, plus the gold/economy helpers (importing `$` from `./utils`). Add interim domain types to `types.ts` first if needed (see Task 2a).

```ts
import { $ } from './utils'
import type { Unit, Consumable, ShopOffer, BiomeEntry } from '../types'

export const state = {
  player: [] as Unit[],
  enemy: [] as Unit[],
  consumables: [] as (Consumable | null)[],
  gold: 0,
  battle: 0,
  biomePlan: [] as BiomeEntry[],
  draft:  { chosen: [] as string[], options: [] as string[][] },
  combat: {
    running: false, turn: 0, autoFight: false,
    nextEnemyMarkerId: null as string | null,
    pendingTargetCancel: null as (() => void) | null,
    pendingConsumableAction: null as ((slot: number) => void) | null,
    pendingAutoFightAction: null as (() => void) | null,
    pendingDefaultAction: null as (() => void) | null,
    pendingDefaultLabel: '',
  },
  shop: { open: false, offers: [] as ShopOffer[] },
  ui: {
    awaitingReward: false, pendingShopAfterReward: false, filter: 'all',
    activePreviewActor: null as Unit | null,
    activeDetailActorIds: [] as string[],
    activeConsumableActor: null as Unit | null,
  },
}

export const formatGold = (amount = 0) => `${amount} G`
export const goldHTML = (amount = 0) => `<span class="goldAmount">${formatGold(amount)}</span>`
export function updateGoldUI() { const el = $('goldLabel'); if (el) el.textContent = formatGold(state.gold) }
export function addGold(amount = 0) { state.gold += amount; updateGoldUI() }
export function spendGold(amount = 0) { if (state.gold < amount) return false; state.gold -= amount; updateGoldUI(); return true }
```

(Pending-handler callback signatures above are first guesses — refine to the real call sites as those modules are converted. Loosen to `((...a: any[]) => void) | null` only if a precise type is genuinely out of scope.)

**Verify:** `npm run check` (will fail to resolve `Unit` etc. until Task 2a — do 2a first or in the same commit).

### Task 2a: interim domain types in `types.ts`
Add pragmatic interfaces capturing the runtime shape produced by `freshFromBase` and used across modules: `Unit` (id, name, cls, team, palette, lvl, internal level fields, hp, maxHp, stats, growths, weapon, isLeader, bossTier, status/buff buckets, heldItem/skills refs, startOffset, etc.), `Consumable` (from `ConsumableData` + runtime), `ShopOffer` (discriminated union by offer kind: weapon/consumable/boost/forge), `BiomeEntry` (`{ biome: BiomeData; … }`). Derive exact fields from `units.js` `freshFromBase` and `shop.js` offer makers while converting; start permissive (optional fields) and tighten as later tasks surface real usage.

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: typed state object + domain types + economy helpers"`

---

## Task 3: `assets.ts` (+ explicit window globals)

**Files:** `git mv src/assets.js src/assets.ts`

**Imports:** from `../constants` (`FEMP_ASSET_ROOT`, `FEMP_IMAGE_EXTS`, `MAP_SPRITE_SCALE`, `MAP_SPRITE_SLOT_H`), `../data` (palette/class data as used), `./utils` as needed.

**Changes:**
- Export the functions used elsewhere: `portraitImgForBase`, `portraitImgForUnit`, `battleImgForUnit`, `mapSpriteForFocus`, `assetImg`, `assetSheet`, `svgDataUri`, `mugshotDataUri`, `assetSlug`, etc. (export liberally).
- Keep `assetFallback` and `assetSheetLoaded` as functions, then register them on `window` (they are called from `onerror`/`onload` in innerHTML strings):
  ```ts
  declare global {
    interface Window {
      assetFallback: (img: HTMLImageElement) => void
      assetSheetLoaded: (img: HTMLImageElement) => void
    }
  }
  window.assetFallback = assetFallback
  window.assetSheetLoaded = assetSheetLoaded
  ```

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert assets to TS module, register img handlers on window"`

---

## Task 4: `units.ts`

**Files:** `git mv src/units.js src/units.ts`

**Imports:** `../data` (BASES, CLASSES, WEAPONS, etc.), `../constants` (LEADER_BONUS_LEVELS, PROMOTION_UNLOCK_AFTER_BATTLE, WEAPON_RANKS…), `./utils`, `./state` (uses `state.battle` in `promotionUnlockedForRegularEnemies`).

**Changes:** Export all functions listed (freshFromBase, promote, levelUp, advanceTwoLevels, startingWeapon, cloneWeapon, forgeWeapon, cloneConsumable, consumableById, startingConsumables, allowedWeapons, canEquipAsNewWeapon, weaponScore, enemyWeaponFor, …). Remove the `window.promote = promote` / `window.levelUp = levelUp` debug lines (no inline HTML uses them; if you want to keep debug access, gate behind `if (import.meta.env.DEV) Object.assign(window, { promote, levelUp })`). Apply state map (`battle` → `state.battle`). Type params with `Unit`, `WeaponData`, etc.

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert units to TS module"`

---

## Task 5: `biomes.ts`

**Files:** `git mv src/biomes.js src/biomes.ts`

**Imports:** `../data` (BIOMES), `../constants` (BIOME_* constants), `./utils`, `./state`, `./render` for `renderBiomeMap`? — note `biomes.js` defines `renderBiomeMap`, `updateMainModeTitle`, `setShopOpen`, `setAutoFight`, `updateAutoFightButton`; these touch DOM and state but not other sibling logic heavily. Check for imports of render helpers; if `setAutoFight`/`renderBiomeMap` call render functions, import them (possible render dependency — if cyclic, defer those calls' deps, but more likely biomes is below render). Resolve during conversion.

**Changes:** Export the functions used elsewhere (makeBiomePlan, biomeIndexForBattle, biomeEntryForBattle, activeBiomeEntry, activeBiomeEffects, hasBiomeEffect, biomeEffectLabels, focusMatchesBase, pickBaseFromPool, enemyFocusForSlot, bossFocusForBattle, setShopOpen, setAutoFight, updateAutoFightButton, updateMainModeTitle, renderBiomeMap, …). Default params like `n = battle || 1` → `n = state.battle || 1`. Apply state map (`shopOpen` → `state.shop.open`, `autoFight` → `state.combat.autoFight`).

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert biomes to TS module"`

---

## Task 6: `render.ts` + `combat.ts` (cyclic pair — convert together)

**Why together:** `combat.ts` calls render helpers (`spriteEl`, `floatText`, `setStatus`, `clearHighlights`, `renderTeams`, `updateUnitVisual`) and `render.ts` calls combat helpers (`combatPreviewHTML`, weapon/stat math, `statusLabel`). They import each other, so tsc only resolves once both are `.ts`.

**Files:** `git mv src/render.js src/render.ts` and `git mv src/combat.js src/combat.ts`

**Imports:** both from `../data`, `../constants`, `../types`, `./utils`, `./state`, `./assets`, `./units`, `./biomes`, and from each other.

**Changes:** Export all cross-referenced functions in both files (the lists from the export survey — export liberally). Apply state map throughout (heavy here: `player`, `enemy`, `consumables`, `combatTurn`, `activePreviewActor`, `activeDetailActorIds`, `nextEnemyMarkerId`, `pending*`, `filter`, `autoFight`). `consumableTargets(item, team = player, foes = enemy)` → defaults become `team = state.player, foes = state.enemy`. Type the many `(u)`, `(a, d)` params with `Unit`, `(w)` with `WeaponData`, `(stat)` with `StatKey`.

**Verify:** `npm run check` → no errors (both files green).
**Commit:** `git commit -am "refactor: convert render+combat to TS modules"`

---

## Task 7: `rewards.ts`

**Files:** `git mv src/rewards.js src/rewards.ts`

**Imports:** `../data`, `../constants` (REWARD_*, tier weights), `../types`, `./utils`, `./state`, `./units`, `./render`, `./combat`, `./biomes` as used.

**Changes:** Export functions used by `shop.ts`/`game.ts`/`ui.ts` (showRewards, makeRewards, applyReward lives in shop.js actually — note `applyReward` is in shop.js; `rewards.js` has weaponReward/consumableReward/boostReward/goldReward/firstEmptyConsumableSlot/etc.). Export liberally. Apply state map (`awaitingReward`, `consumables`, `player`, `battle`).

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert rewards to TS module"`

---

## Task 8: `shop.ts`

**Files:** `git mv src/shop.js src/shop.ts`

**Imports:** `../data`, `../constants` (SHOP_* prices/counts), `../types`, `./utils`, `./state`, `./units`, `./render`, `./rewards`, `./combat` as used.

**Changes:** Export functions used by `game.ts`/`ui.ts`/`main.ts` and the inline button handlers (`buyShopOffer`, `leaveShop`, `startShop`, `makeShopOffers`, `applyReward`, `storeConsumable`, `chooseConsumableReplacement`, …). Replace the inline `onclick="closeModal()"` dependency: where `shop.ts` builds modal HTML with a Back/cancel button, switch those to `data-close` (handled by the delegated listener added in Task 10) OR import `closeModal` from `./ui` and keep assigning via `.onclick` (it already does `$('cancelShopForgeBtn').onclick = closeModal` — just import it). Apply state map (`shopOffers`, `shopOpen`, `awaitingReward`, `gold`, `player`, `consumables`).

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert shop to TS module"`

---

## Task 9: `ui.ts` (+ delegated closeModal)

**Files:** `git mv src/ui.js src/ui.ts`

**Imports:** `../constants` (MUSIC_URL is in utils — import from there), `./utils`, `./state`, `./render`, `./rewards`, `./shop`, `./biomes`, `./game` (showMenu/start flows call into game? `startDraftGame`/`startRandomGame` set up draft then maybe call render). Resolve cycle with `game.ts` — if `ui.ts` imports `game.ts` and vice-versa, that cycle is runtime-safe; both become `.ts` here and in Task 11, so if tsc can't resolve `./game` yet, move `game` conversion before this or convert both together. (Likely `ui` → `game` only, and `game` → `ui` for showRewards/showGameOver/showWin; treat as a cyclic pair like Task 6 if needed.)

**Changes:**
- Export: showMenu, showModal, closeModal, showWin, showGameOver, openMusic, showHelpRules, startDraftGame, startRandomGame, levelLabel, afterReward, scoreHTML, chooseBoostTarget, …
- Convert the inline `onclick="closeModal()"` in `showModal` content and the win/gameover buttons to `data-close` and add a one-time delegated listener (in `main.ts` Task 12, or here at module load):
  ```ts
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-close]')) closeModal()
  })
  ```
  Replace `<button onclick="closeModal()" …>` → `<button data-close …>`. Keep `onclick="location.reload()"` as-is (browser builtin).
- Apply state map.

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert ui to TS module, delegate closeModal via data-close"`

---

## Task 10: `game.ts`

**Files:** `git mv src/game.js src/game.ts`

**Imports:** `../constants`, `./utils`, `./state`, `./units`, `./combat`, `./render`, `./rewards`, `./shop`, `./biomes`, `./ui`.

**Changes:** Export startRun, generateEnemy, beginNextBattle, runBattle, bossTierForBattle, debugWinBattle, debugAddGeosphere. Apply state map heavily (`player`, `enemy`, `chosen`, `consumables`, `battle`, `combatTurn`, `battleRunning`, `autoFight`, `nextEnemyMarkerId`, `activeDetailActorIds`, `activePreviewActor`, `pendingTargetCancel`). Type `runBattle` locals.

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert game to TS module"`

---

## Task 11: `main.ts` (entry wiring)

**Files:** `git mv src/main.js src/main.ts`

**Imports:** everything `main` wires: from `./ui` (startRandomGame, startDraftGame, showHelpRules, openMusic, showMenu), `./game` (startRun, debugWinBattle, debugAddGeosphere), `./render` (renderDraft), `./biomes` (setAutoFight, makeBiomePlan), `./render`/`./state` for draft helpers (randomDraftOptions, emptyRosterChoices — in render.ts), `./utils` (`$`, pick), `./state`.

**Changes:** Replace bare globals per state map (`chosen`, `draftOptions`, `autoFight`, `pendingTargetCancel`). Add non-null assertions on the static-ID `$()` lookups. Ensure the file ends by initializing run state (the old `biomePlan = makeBiomePlan()`, `chosen = emptyRosterChoices()` lines that were in ui.js bottom — relocate any module-load initialization here or keep in their modules) and calls `showMenu()`.

**Verify:** `npm run check` → no errors.
**Commit:** `git commit -am "refactor: convert main entry to TS module"`

---

## Task 12: Cutover + delete the bridge

**Files:** Modify `index.html`, delete `src/bootstrap.ts` + `src/state.ts`? (state.ts stays — it's a real module now). Modify `tsconfig.json`.

**Step 1:** Point the entry at the new module:
```html
<script type="module" src="./src/main.ts"></script>
```

**Step 2:** Delete the bridge: `git rm src/bootstrap.ts`.

**Step 3:** Remove the `"exclude": ["src/bootstrap.ts"]` line from `tsconfig.json` (nothing left to exclude).

**Step 4:** Verify build: `npm run check` then `npm run build`. Expected: both succeed.

**Step 5:** Commit:
```bash
git add -A
git commit -m "refactor: switch entry to src/main.ts, delete eval bridge"
```

---

## Task 13: End-to-end verification (final gate)

**Step 1:** `npm run check` → no errors.
**Step 2:** `npm run build` → success.
**Step 3:** `npm run dev`, then manually verify in the browser (use the `verify`/`run` skill):
- Main menu renders; "New game (random team)" starts a run.
- Draft flow works (offers, reroll, pick randomly, start).
- A battle runs to completion (auto-fight + manual targeting + a consumable use).
- Reward screen appears and a reward applies.
- Shop opens after an arena boss; buy/forge/leave all work.
- Win and game-over modals show and "New run" reloads.
- Asset fallbacks still resolve (no broken sprites; `assetFallback` fires).
- `git diff --check` clean.

**Step 4:** Commit any final fixes, then this branch is ready for review/merge (use `superpowers:finishing-a-development-branch`).

---

## Notes / guardrails
- DRY: the state-reference map and conventions are the single source of truth; don't re-derive per file.
- YAGNI: do not wire held-items/skills gameplay here; that's a separate effort.
- If strict typing of `Unit` balloons, keep optional fields permissive and tighten opportunistically — do not block the migration on perfect types, but do not loosen `tsconfig`.
- Commit after every green task; never batch multiple files into one commit except the declared cyclic pairs (Task 6, possibly Task 9/10).
