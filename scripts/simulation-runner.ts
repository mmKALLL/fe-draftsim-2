// Headless simulation / balance-test batch runner for FireRogue.
//
// Runs the real game loop N times with no browser, no rendering, instant sleeps and auto-fight,
// then prints an aggregate balance summary (and optionally dumps per-run RunStats as JSON).
//
// Options: --runs=N (default 100) | --reward=skip|first (default skip) | --seed=N (reproducible batch)
//          | --roster=random | --roster=Name1,Name2,Name3,Name4,Name5 (default random) | --json=<path>
// Examples:
//   npm run simulate -- --runs=100                                  # 100 random runs, skip all rewards
//   npm run simulate -- --runs=200 --reward=first                   # take the first reward each screen
//   npm run simulate -- --runs=50 --roster=Lyn,Hector,Eliwood,Florina,Dorcas --json=out.json
//   npm run simulate -- --runs=500 --reward=first --roster=random --seed=42 --json=results/batch.json
//                                                                    # ^ every option; --seed => reproducible
//
// Run under Deno (`npm run simulate`), which executes TypeScript natively and resolves the
// project's extensionless relative imports via `--unstable-sloppy-imports`.
//
// The game's `src/` modules touch the DOM / localStorage at module-load time, and ESM hoists +
// evaluates imports in source order before this file's body runs. So `./dom-stub` (which installs
// `document` / `window` / `localStorage` on `globalThis` as a side effect) MUST be imported FIRST,
// ahead of every `src/` import, so those globals exist when the game modules evaluate.
import './dom-stub'

import { sim } from '../src/sim'
import { state } from '../src/state'
import { startRun } from '../src/game'
import { resetRun } from '../src/ui'
import { randomDraftOptions } from '../src/render'
import { makeArenaPlan } from '../src/arenas'
import { applySimSeed, pick } from '../src/utils'
import { BASES } from '../data'
import { ROSTER_SIZE } from '../config'
import type { RunStat } from '../src/stats'

/* -------------------------------------------------------------- CLI parsing */

type RosterSpec = { mode: 'random'; names: null } | { mode: 'fixed'; names: string[] }
type Options = {
  runs: number
  reward: 'skip' | 'first'
  roster: RosterSpec
  seed: number | null
  json: string | null
}

// process.argv is provided by Deno at runtime (Deno 2). tsc never sees this file (scripts/ is
// outside tsconfig include), so referencing `process` here is safe.
function parseArgs(argv: string[]): Options {
  const map = new Map<string, string>()
  for (const arg of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(arg)
    if (m) map.set(m[1], m[2])
    else if (arg.startsWith('--')) map.set(arg.slice(2), '')
  }

  const runsRaw = map.get('runs')
  const runs = runsRaw != null ? Number(runsRaw) : 100
  if (!Number.isFinite(runs) || runs < 1) fail(`--runs must be a positive integer (got "${runsRaw}")`)

  const reward = (map.get('reward') ?? 'skip') as 'skip' | 'first'
  if (reward !== 'skip' && reward !== 'first') fail(`--reward must be "skip" or "first" (got "${reward}")`)

  const seedRaw = map.get('seed')
  const seed = seedRaw != null ? Number(seedRaw) : null
  if (seed != null && !Number.isFinite(seed)) fail(`--seed must be a number (got "${seedRaw}")`)

  const rosterRaw = map.get('roster') ?? 'random'
  let roster: RosterSpec
  if (rosterRaw === 'random' || rosterRaw === '') {
    roster = { mode: 'random', names: null }
  } else {
    const names = rosterRaw.split(',').map((s) => s.trim()).filter(Boolean)
    if (names.length !== ROSTER_SIZE) fail(`--roster must list exactly ${ROSTER_SIZE} unit names (got ${names.length}: ${names.join(', ')})`)
    const unknown = names.filter((n) => !BASES.some((b) => b.name === n))
    if (unknown.length) fail(`--roster has unknown unit name(s): ${unknown.join(', ')}. Names must match data.ts BASES exactly (case-sensitive).`)
    roster = { mode: 'fixed', names }
  }

  return { runs: Math.floor(runs), reward, roster, seed, json: map.get('json') ?? null }
}

function fail(msg: string): never {
  console.error(`simulation-runner: ${msg}`)
  // Deno exposes process.exit via the node compat shim; fall back to throwing if absent.
  const p = (globalThis as any).process
  if (p?.exit) p.exit(1)
  throw new Error(msg)
}

/* -------------------------------------------------------------- driver loop */

async function runOne(opts: Options, i: number): Promise<RunStat> {
  // Per-run reproducible seed: seed + i gives varied-but-deterministic runs for a fixed --seed.
  // Reset the deterministic id counter per run so each run sees an identical id sequence regardless
  // of how many runs preceded it — required for seeded reproducibility.
  if (opts.seed != null) {
    sim.seed = opts.seed + i
    sim.idCounter = 0
    applySimSeed()
    // resetRun() builds the arena plan from the *previous* run's leftover LCG state (run lengths
    // vary), so regenerate it here from the freshly-seeded RNG — otherwise the per-run arena (which
    // sets combat modifiers) isn't reproducible even though the roster is.
    state.arenaPlan = makeArenaPlan()
  }

  // Set the starting roster into state.draft.chosen so startRun() (which requires a full roster) runs.
  if (opts.roster.mode === 'random') {
    const options = randomDraftOptions() // string[][] — one offer-list per slot
    state.draft.chosen = options.map((slot) => pick(slot))
  } else {
    state.draft.chosen = opts.roster.names.slice()
  }

  // resetRun() (called after each run) clears autoFight back to false, so re-arm it every iteration.
  state.combat.autoFight = true

  const mode = opts.roster.mode === 'random' ? 'random' : 'draft'

  // The run is async + event-chained: startRun -> showRewards (auto-resolved) -> beginNextBattle ->
  // runBattle (auto-fought, instant sleeps) -> ... -> showWin/showGameOver -> sim.onRunEnd(stat).
  // With instant sleep the whole chain settles via microtasks; awaiting this promise drains them and
  // guarantees the run is fully over (onRunEnd only fires from the terminal showWin/showGameOver)
  // before we resetRun().
  return await new Promise<RunStat>((resolve) => {
    sim.onRunEnd = resolve
    startRun(mode)
  })
}

async function main() {
  const opts = parseArgs((globalThis as any).process?.argv?.slice(2) ?? [])

  sim.active = true
  sim.rewardPolicy = opts.reward
  state.combat.autoFight = true

  const rosterDesc = opts.roster.mode === 'random' ? 'random' : opts.roster.names.join(', ')
  console.log(
    `Running ${opts.runs} simulation(s) | reward=${opts.reward} | roster=${rosterDesc}` +
      (opts.seed != null ? ` | seed=${opts.seed}` : '')
  )

  const results: RunStat[] = []
  for (let i = 0; i < opts.runs; i++) {
    const stat = await runOne(opts, i)
    results.push(stat)
    resetRun()
  }

  printSummary(results)

  if (opts.json) {
    await writeJson(opts.json, results)
    console.log(`\nWrote ${results.length} run stats to ${opts.json}`)
  }
}

/* ----------------------------------------------------------- JSON dump (Deno) */

// Deno needs `--allow-write` to write the file; the `simulate` npm script grants it, so `--json`
// works out of the box. (If run without it, Deno throws a clear NotCapable permission error.)
// Robust against the two ways a target path fails: a missing parent directory (Deno.writeTextFile
// does not mkdir -p -> ENOENT) and a pre-existing read-only file (-> EACCES). We create the parent
// dir up front, and if the write is blocked by an existing file we remove it and retry once so
// --json can always overwrite its target; anything still failing surfaces as a clean message.
async function writeJson(path: string, results: RunStat[]) {
  const text = JSON.stringify(results, null, 2)
  const D = (globalThis as any).Deno
  if (!D?.writeTextFile) fail('--json requires Deno (Deno.writeTextFile is unavailable in this runtime)')
  const dir = path.replace(/[/\\][^/\\]*$/, '')
  if (dir && dir !== path) {
    try {
      await D.mkdir(dir, { recursive: true })
    } catch {
      /* already exists (or not a dir — the write below will report it) */
    }
  }
  try {
    await D.writeTextFile(path, text)
  } catch (e: any) {
    try {
      await D.remove(path)
      await D.writeTextFile(path, text)
    } catch {
      fail(`could not write --json to "${path}": ${e?.message ?? e}`)
    }
  }
}

/* ----------------------------------------------------------------- summary */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0)
function median(xs: number[]) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}
const f1 = (n: number) => n.toFixed(1)
const f2 = (n: number) => n.toFixed(2)

// Print a label/value row with the label left-padded into a fixed column.
function row(label: string, value: string | number, w = 30) {
  console.log(`  ${label.padEnd(w)} ${value}`)
}

function printSummary(results: RunStat[]) {
  const n = results.length
  const wins = results.filter((r) => r.outcome === 'win')
  const losses = results.filter((r) => r.outcome === 'loss')
  const winRate = n ? (wins.length / n) * 100 : 0
  const reached = results.map((r) => r.battleReached)

  console.log('\n' + '='.repeat(52))
  console.log(' BALANCE SUMMARY')
  console.log('='.repeat(52))

  row('Total runs', n)
  row('Wins', `${wins.length}  (${f1(winRate)}%)`)
  row('Losses', losses.length)
  row('Avg. battle reached', f2(avg(reached)))
  row('Median battle reached', median(reached))
  row('Furthest battle reached', reached.length ? Math.max(...reached) : 0)
  row('Avg. consumables acquired', f2(avg(results.map((r) => r.consumables))))
  row('Avg. gold at end', f2(avg(results.map((r) => r.goldAtEnd))))

  // Loss-distribution histogram: how many losses ended at each battle number.
  console.log('\n Loss distribution (by battle reached):')
  if (losses.length === 0) {
    console.log('  (no losses)')
  } else {
    const byBattle = new Map<number, number>()
    for (const r of losses) byBattle.set(r.battleReached, (byBattle.get(r.battleReached) ?? 0) + 1)
    const maxCount = Math.max(...byBattle.values())
    const battles = [...byBattle.keys()].sort((a, b) => a - b)
    for (const b of battles) {
      const c = byBattle.get(b)!
      const bar = '#'.repeat(Math.round((c / maxCount) * 24))
      console.log(`  battle ${String(b).padStart(2)}  ${String(c).padStart(3)}  ${bar}`)
    }
  }

  // Avg. roster composition: prepromotes + per-bracket averages from the recorded distributions.
  console.log('\n Avg. roster composition (per run):')
  row('Prepromotes', f2(avg(results.map((r) => r.prepromotes))), 28)
  printBracketAverages('Base-stat brackets', results.map((r) => r.baseStatBrackets))
  printBracketAverages('Growth brackets', results.map((r) => r.growthBrackets))

  console.log('='.repeat(52))
}

// Average each bracket label across all runs. Keys are discovered from the data so this stays in
// sync with stats.ts's bracket definitions without re-declaring them here.
function printBracketAverages(heading: string, dists: Array<Record<string, number>>) {
  const keys = new Set<string>()
  for (const d of dists) for (const k of Object.keys(d ?? {})) keys.add(k)
  console.log(`  ${heading}:`)
  for (const k of [...keys]) {
    row(`  ${k}`, f2(avg(dists.map((d) => d?.[k] ?? 0))), 26)
  }
}

main().catch((err) => {
  console.error('simulation-runner failed:', err)
  const p = (globalThis as any).process
  if (p?.exit) p.exit(1)
})
