// All cross-run statistics logic lives here. Other modules call the thin entry points only:
//   - noteConsumablesGained()  (consumable acquisition sites)
//   - recordRunStat()          (win/loss screens)
//   - countStrongBaseFromNames() / statisticsHTML()  (run start / stats screen)
// One-way data flow: gameplay seeds/notes into state.run, then recordRunStat() snapshots it.
import { BASES } from '../data'
import { state } from './state'
import type { UnitBase } from '../types'

const STATS_KEY = 'firerogue.stats.v1'
const MAX_STORED = 200

export type RunStat = {
  outcome: 'win' | 'loss'
  lossBattle: number | null
  strongBase: number
  consumables: number
}

export function loadRunStats(): RunStat[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) || 'null')
    return Array.isArray(parsed) ? (parsed as RunStat[]) : []
  } catch {
    return []
  }
}

export function saveRunStats(arr: RunStat[]) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(arr.slice(-MAX_STORED)))
  } catch {
    // localStorage may be unavailable (private mode / quota); stats are best-effort.
  }
}

// Pure predicate: a base is "strong" if it's a prepromote (positive start offset) or has a high base total.
export function isStrongBase(base: UnitBase): boolean {
  return base.startOffset > 0 || base.stats.bTotal >= 40
}

// Count strong bases from chosen names by looking up the BASE (not the in-game Unit).
export function countStrongBaseFromNames(names: string[]): number {
  return names.reduce((n, name) => {
    const base = BASES.find((b) => b.name === name)
    return n + (base && isStrongBase(base) ? 1 : 0)
  }, 0)
}

// The "note" half of seed+note: call sites stay one-liners.
export function noteConsumablesGained(n = 1) {
  state.run.consumablesAcquired += n
}

export function recordRunStat(outcome: 'win' | 'loss', lossBattle: number | null) {
  if (state.run.cheated) return // cheated runs are never recorded
  const arr = loadRunStats()
  arr.push({
    outcome,
    lossBattle,
    strongBase: state.run.strongBaseAtStart,
    consumables: state.run.consumablesAcquired,
  })
  saveRunStats(arr)
}

const fmt1 = (n: number) => n.toFixed(1)

export function statisticsHTML(): string {
  const runs = loadRunStats()
  if (runs.length === 0) {
    return `<p class="small">No completed runs yet — finish a run without using cheats to populate this.</p>`
  }

  const total = runs.length
  const wins = runs.filter((r) => r.outcome === 'win').length
  const losses = total - wins
  const winRate = Math.round((wins / total) * 100)

  const lossBattles = runs.filter((r) => r.outcome === 'loss' && r.lossBattle != null).map((r) => r.lossBattle as number)
  const avgLossBattle = lossBattles.length ? fmt1(lossBattles.reduce((a, b) => a + b, 0) / lossBattles.length) : '—'

  const avgStrongBase = fmt1(runs.reduce((a, r) => a + r.strongBase, 0) / total)
  const avgConsumables = fmt1(runs.reduce((a, r) => a + r.consumables, 0) / total)

  const summary = `<div class="statsSummary">
    <div class="statsRow"><span>Total runs</span><b>${total}</b></div>
    <div class="statsRow"><span>Wins</span><b>${wins}</b></div>
    <div class="statsRow"><span>Losses</span><b>${losses}</b></div>
    <div class="statsRow"><span>Win rate</span><b>${winRate}%</b></div>
    <div class="statsRow"><span>Avg. loss battle</span><b>${avgLossBattle}</b></div>
    <div class="statsRow"><span>Avg. strong-base units</span><b>${avgStrongBase}</b></div>
    <div class="statsRow"><span>Avg. consumables acquired</span><b>${avgConsumables}</b></div>
  </div>`

  // Recent runs: last ~12, most recent first. Run number is the overall 1-based index.
  const recent = runs
    .map((r, i) => ({ r, num: i + 1 }))
    .slice(-12)
    .reverse()
  const rows = recent
    .map(({ r, num }) => {
      const outcome = r.outcome === 'win' ? 'Win' : `Lost at battle ${r.lossBattle ?? '?'}`
      return `<tr><td class="num">${num}</td><td>${outcome}</td><td class="num">${r.strongBase}</td><td class="num">${r.consumables}</td></tr>`
    })
    .join('')

  const table = `<table class="statsTable">
    <thead><tr><th class="num">#</th><th>Outcome</th><th class="num">Strong-base</th><th class="num">Consumables</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`

  return `${summary}<h3>Recent runs</h3>${table}`
}
