// Headless simulation / balance-test runner entry point (Task 1: foundation + smoke test).
//
// Run under Deno (`npm run sim`), which executes TypeScript natively and resolves the
// project's extensionless relative imports via `--unstable-sloppy-imports` — so this
// needs no npm dependency and no resolver/loader file.
//
// The game's `src/` modules are written for the browser and touch the DOM / localStorage
// at module-load time. ESM hoists all `import` statements and evaluates the imported
// modules in source order *before* any code in this file runs, so the DOM stub MUST be a
// separate module imported first (a stub installed in this file's body would run too late).
// `./dom-stub` installs `document` / `window` / `localStorage` on `globalThis` as a side
// effect; importing it ahead of the `src/` modules guarantees those globals exist when the
// game modules evaluate. `src/main.ts` is the one module that is NOT import-safe (top-level
// `$('...').onclick` + `showMenu()`), so we never import it.
import './dom-stub'

import { startRun } from '../src/game'
import { state } from '../src/state'
import { BASES } from '../data'

/* ------------------------------------------------------------- smoke test */

console.log('sim modules loaded:', BASES.length, 'bases')
// Touch a couple of the imported entry points so a load-time error can't hide and
// the symbols are demonstrably usable.
console.log('sim state ready:', typeof startRun === 'function' ? 'startRun()' : 'MISSING startRun', '| player roster size:', state.player.length)
