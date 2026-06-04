# Design: Full ES-module conversion (kill the eval bridge)

Date: 2026-06-03
Status: Approved
Branch: `refactor/ts-module-conversion`

## Goal & success criteria

Convert all `src/*.js` files into real `.ts` ES modules with explicit
`import`/`export`, delete the `new Function(...)` concatenation bridge in
`src/bootstrap.ts`, and have the game run identically.

**Done when:**
- `npm run check` (tsc, `strict: true`) passes with zero errors.
- `npm run build` succeeds.
- A manual playthrough (menu -> draft -> battle -> reward -> shop -> win/lose)
  behaves exactly as it does today.

**Non-goal:** No gameplay or behavior changes in this work. Pure structural
refactor. Held-items / skills gameplay wiring is explicitly deferred to a
later effort.

## Current architecture (starting point)

- `constants.ts`, `data.ts`, `types.ts`, `src/state.ts` are typed TS, but the
  rest of the runtime is legacy `.js` that assumes a single shared global
  scope (functions and `let` state visible everywhere).
- `src/bootstrap.ts` works around that by importing every `.js` file `?raw`,
  concatenating the sources, and evaluating them in one `new Function(...)`.
  It also bridges `constants`/`data` onto `globalThis` and re-exports
  `assetFallback`, `assetSheetLoaded`, `closeModal` as globals.

## 1. State model

A single exported `state` object in `src/state.ts`, with nested sub-objects for
cohesive groups and cross-cutting fields promoted to the top level.

```ts
export const state = {
  // cross-cutting (read/written across many modules)
  player: [] as Unit[],
  enemy: [] as Unit[],
  consumables: [] as (Consumable | null)[],
  gold: 0,
  battle: 0,
  biomePlan: [] as BiomeEntry[],

  draft:  { chosen: [] as string[], options: [] as string[][] },
  combat: { running: false, turn: 0, autoFight: false,
            nextEnemyMarkerId: null as string | null,
            pendingTargetCancel: null, pendingConsumableAction: null,
            pendingAutoFightAction: null, pendingDefaultAction: null,
            pendingDefaultLabel: '' },
  shop:   { open: false, offers: [] as ShopOffer[] },
  ui:     { awaitingReward: false, pendingShopAfterReward: false, filter: 'all',
            activePreviewActor: null, activeDetailActorIds: [] as string[],
            activeConsumableActor: null },
}
```

Every bare reference becomes a `state.*` access: `player` -> `state.player`,
`gold` -> `state.gold`, `battleRunning` -> `state.combat.running`, etc.
Mechanical and large-diff, but each change is trivially verifiable. Exact field
grouping is provisional and will be finalized during migration.

## 2. Module structure & order

Same files, now `.ts` with imports. Dependency layering (leaf -> top):

`utils` / `types` / `constants` / `data` -> `state` -> `assets` -> `units` ->
`biomes` -> `render` -> `combat` -> `rewards` -> `shop` -> `ui` -> `game` ->
`main`.

Natural cycles exist (combat <-> render, game <-> ui). ES modules tolerate
these as long as imported bindings are only *used* at call-time, not at
module-eval time. That holds here because everything is function declarations
invoked after load. Watch for any top-level execution-order traps during
migration.

## 3. Inline-HTML handlers (the only legitimate globals)

`assetFallback` and `assetSheetLoaded` are referenced from `onerror`/`onload`
inside innerHTML-generated `<img>` strings; those need a real global lookup.
Keep a single explicit, typed registration (`window.assetFallback = ...` with a
`declare global`) instead of the blind `Object.assign(globalThis, ...)`.

`closeModal` is converted to a delegated `click` listener on `[data-close]`,
removing it from the global surface. `location.reload()` is a browser builtin
and stays inline.

Net result: globals shrink from "the entire runtime" to two named, typed,
intentional functions.

## 4. Entry point

Delete `src/bootstrap.ts` and its `?raw` imports. `index.html` points
`<script type="module">` directly at `src/main.ts`, which imports its
dependencies and calls `showMenu()` at the end (as `main.js` does today). The
`__fireRogueConstants` / `__fireRogueData` global bridge and the
`as const scripts[]` array are removed entirely.

## 5. TypeScript strictness

`tsconfig` is already `strict: true`. Converting the loose JS under strict will
surface real errors (implicit-`any` params, nullable `$()` DOM lookups, etc.).
Strategy: get everything compiling under the existing strict config, using a
typed `$()` helper and the real types from `types.ts` wherever practical, and
narrow `any` only where a proper type is genuinely out of scope for this pass.
No loosening of `tsconfig`.

## 6. Verification

- Per-checkpoint: `npm run check` + `npm run build` after each migrated layer.
- End-to-end: one manual smoke playthrough.
- Vitest anchor tests: skipped for this pass (conversion-first priority);
  an easy follow-up once modules are in place.

## Risks

- **Big diff** - mitigated by layered checkpoints (typecheck passes after each
  layer).
- **Strict-mode error volume** - the main time sink; an expectation, not a
  blocker.
- **Module cycles / init order** - low risk given function-declaration style;
  verify at runtime.
