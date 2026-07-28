// All cross-run statistics logic lives here. Other modules call the thin entry points only:
//   - noteConsumablesGained()  (consumable acquisition sites)
//   - recordRunStat()          (win / loss / abandon)
//   - statisticsHTML()         (stats screen)
// One-way data flow: gameplay seeds/notes into state.run, then recordRunStat() snapshots it into a
// localStorage-backed run-history array. The full raw history is kept (every run, including cheated
// and abandoned) so stats can be recomputed or filtered later; display-time filtering decides what
// counts — cheated runs are excluded entirely, abandoned runs are excluded from averages but counted.
// Roster strength is stored as raw distributions (prepromote count + base-stat / growth brackets)
// rather than a single hardcoded "strong" threshold, so finer-grained stats stay computable.
import { BASES } from '../data'
import { state } from './state'
import { APP_VERSION, SETTINGS, type SettingValue } from '../config'
import { getSetting } from './settings'
import type { UnitBase } from '../types'

const STATS_KEY = 'firerogue.stats.v5'
const MAX_STORED = 500

// Roster-composition brackets. Contiguous so every unit lands in exactly one bracket of each kind.
type Bracket = { label: string; min: number; max: number }
const BASE_STAT_BRACKETS: Bracket[] = [
  { label: '0-29', min: 0, max: 29 },
  { label: '30-39', min: 30, max: 39 },
  { label: '40-69', min: 40, max: 69 },
]
const GROWTH_BRACKETS: Bracket[] = [
  { label: '200-260', min: 200, max: 260 },
  { label: '261-299', min: 261, max: 299 },
  { label: '300-319', min: 300, max: 319 },
  { label: '320-399', min: 320, max: 399 },
]

export type RunOutcome = 'win' | 'loss' | 'abandoned'

export type RunStat = {
  ts: number // Date.now() at record time
  version: string // APP_VERSION the run was played on
  start_mode: 'draft' | 'random' // how the starting roster was chosen
  outcome: RunOutcome
  battleReached: number // final battle won, lost at, or abandoned at
  prepromotes: number // starting units that begin already experienced (startOffset > 0)
  baseStatBrackets: Record<string, number> // starting units counted by base-stat total (bTotal)
  growthBrackets: Record<string, number> // starting units counted by growth total (gTotal)
  consumables: number // total consumables acquired over the run (cumulative)
  goldAtEnd: number
  roster: string[] // starting unit names
  cheated: boolean // a debug cheat (shift+W / shift+G) was used during the run
  rewardsByRarity: Record<string, number> // chosen rewards counted by rarity (normal/uncommon/rare)
  rewardsByType: Record<string, number> // chosen rewards counted by type label
  goldByType: Record<string, number> // gold spent in shop, by item-type label
  settings?: Record<string, SettingValue> // player settings snapshot at run end (14gwBLPy); absent on older runs
  endless?: boolean // run entered endless mode (1T3CRjDJ); a separate entry from the base victory
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

// Tally values into contiguous brackets; out-of-range values clamp to the nearest end bracket.
function bracketCounts(values: number[], brackets: Bracket[]): Record<string, number> {
  const counts: Record<string, number> = {}
  brackets.forEach((b) => (counts[b.label] = 0))
  values.forEach((v) => {
    const hit = brackets.find((b) => v >= b.min && v <= b.max)
    const bracket = hit ?? (v < brackets[0].min ? brackets[0] : brackets[brackets.length - 1])
    counts[bracket.label]++
  })
  return counts
}

// Raw roster-strength distributions for the starting roster, looked up from BASES (not the in-game Unit).
export function rosterComposition(names: string[]) {
  const bases = names.map((name) => BASES.find((b) => b.name === name)).filter((b): b is UnitBase => !!b)
  return {
    prepromotes: bases.filter((b) => b.startOffset > 0).length,
    baseStatBrackets: bracketCounts(
      bases.map((b) => b.stats.bTotal),
      BASE_STAT_BRACKETS
    ),
    growthBrackets: bracketCounts(
      bases.map((b) => b.growths.gTotal),
      GROWTH_BRACKETS
    ),
  }
}

// The "note" half of seed+note: call sites stay one-liners.
export function noteConsumablesGained(n = 1) {
  state.run.consumablesAcquired += n
}

const REWARD_TYPE_LABEL: Record<string, string> = { item: 'Weapon', heldItem: 'Held item', skill: 'Skill', consumable: 'Consumable', gold: 'Gold', boost: 'Booster' }
// Tally a reward the player ACTUALLY received (call exactly once at each apply site, never on mere click).
export function noteRewardChoice(r: any) {
  const rarity = r?.item?.rarity ?? r?.item?.rarity
  if (rarity === 'normal' || rarity === 'uncommon' || rarity === 'rare') state.run.rewardsByRarity[rarity] = (state.run.rewardsByRarity[rarity] || 0) + 1
  const label = REWARD_TYPE_LABEL[r?.type] || r?.type || 'Other'
  state.run.rewardsByType[label] = (state.run.rewardsByType[label] || 0) + 1
}

// Snapshot the current run into the history. Every run is stored (including cheated and abandoned)
// so the raw array stays complete; filtering at display time decides what counts.
export function recordRunStat(outcome: RunOutcome): RunStat {
  state.run.recorded = true // so a later resetRun() doesn't re-record this run as abandoned
  const roster = state.draft.chosen.slice()
  const comp = rosterComposition(roster)
  const arr = loadRunStats()
  const stat: RunStat = {
    ts: Date.now(),
    version: APP_VERSION,
    start_mode: state.run.mode,
    outcome,
    battleReached: state.battle,
    prepromotes: comp.prepromotes,
    baseStatBrackets: comp.baseStatBrackets,
    growthBrackets: comp.growthBrackets,
    consumables: state.run.consumablesAcquired,
    goldAtEnd: state.gold,
    roster,
    cheated: state.run.cheated,
    rewardsByRarity: { ...state.run.rewardsByRarity },
    rewardsByType: { ...state.run.rewardsByType },
    goldByType: { ...state.run.goldByType },
    settings: Object.fromEntries(SETTINGS.map((d) => [d.key, getSetting(d.key)])),
    endless: state.run.endlessExtensions > 0,
  }
  arr.push(stat)
  saveRunStats(arr)
  // Return the snapshot too (harmless for existing callers that ignore it); the headless sim's
  // showWin/showGameOver hooks forward it to sim.onRunEnd.
  return stat
}

const fmt1 = (n: number) => {
  const s = n.toFixed(1)
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

function longestWinStreak(runs: RunStat[]): number {
  let best = 0
  let cur = 0
  for (const r of runs) {
    if (r.outcome === 'win') {
      cur++
      if (cur > best) best = cur
    } else {
      cur = 0
    }
  }
  return best
}

// Score for a stored run (14gwBLPy), re-computed from run data with the CURRENT formula so
// past runs re-score when the formula changes: wins × 1000 + gold at end. Leftover-consumable
// value isn't stored per run, so it's excluded here (unlike the in-run currentScore). A win
// counts the final battle; a loss/abandon doesn't count the battle it ended on.
export function scoreFromStat(r: RunStat): number {
  const wins = Math.max(0, r.battleReached - (r.outcome === 'win' ? 0 : 1))
  return wins * 1000 + r.goldAtEnd
}

// Compact "Skills/Weapons" difficulty label (14gwBLPy). Runs recorded before settings were
// captured predate the difficulty setting and were effectively Hard, so they show "Hard/Hard".
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
function difficultyLabel(r: RunStat): string {
  const s = r.settings || {}
  const skills = typeof s.difficultySkills === 'string' ? s.difficultySkills : 'hard'
  const weapons = typeof s.difficultyWeapons === 'string' ? s.difficultyWeapons : 'hard'
  return `${capitalize(skills)}/${capitalize(weapons)}`
}

// Stats view filter (1T3CRjDJ): 'normal' shows non-endless runs, 'endless' shows endless runs.
// Toggled from the statistics screen; the toggle is only exposed once an endless run exists.
let statsView: 'normal' | 'endless' = 'normal'
export function getStatsView() {
  return statsView
}
export function setStatsView(v: 'normal' | 'endless') {
  statsView = v
}
export function hasEndlessRuns() {
  return loadRunStats().some((r) => r.endless && !r.cheated)
}
const scopeByView = (runs: RunStat[]) => runs.filter((r) => (statsView === 'endless' ? !!r.endless : !r.endless))

export function statisticsHTML(): string {
  const all = loadRunStats()
  if (all.length === 0) {
    return `<p class="small">No runs recorded yet — finish (or abandon) a run without using cheats to populate this.</p>`
  }

  const valid = scopeByView(all.filter((r) => !r.cheated)) // cheated excluded everywhere; scoped to the active view
  if (!valid.length) return `<p class="small">No ${statsView} runs recorded yet.</p>`
  const completed = valid.filter((r) => r.outcome !== 'abandoned') // win/loss only — drives the averages
  const abandoned = valid.filter((r) => r.outcome === 'abandoned').length

  const total = completed.length
  const wins = completed.filter((r) => r.outcome === 'win').length
  const losses = total - wins
  const winRate = total ? Math.round((wins / total) * 100) : 0

  const lossBattles = completed.filter((r) => r.outcome === 'loss').map((r) => r.battleReached)
  const avgLossBattle = lossBattles.length ? fmt1(lossBattles.reduce((a, b) => a + b, 0) / lossBattles.length) : '—'
  const furthest = completed.length ? Math.max(...completed.map((r) => r.battleReached)) : 0
  const bestStreak = longestWinStreak(completed)
  const avg = (sel: (r: RunStat) => number) => (total ? fmt1(completed.reduce((a, r) => a + sel(r), 0) / total) : '0.0')
  const avgConsumables = avg((r) => r.consumables)
  const avgGold = avg((r) => r.goldAtEnd)

  const row = (label: string, value: string | number) => `<div class="statsRow"><span>${label}</span><b>${value}</b></div>`
  const summary = `<div class="statsSummary">
    ${row('Completed runs', total)}
    ${row('Furthest battle', furthest)}
    ${row('Wins', wins)}
    ${row('Losses', losses)}
    ${row('Best win streak', bestStreak)}
    ${row('Win rate', `${winRate}%`)}
    ${row('Avg. lost battle', avgLossBattle)}
    ${row('Avg. consumables acquired', avgConsumables)}
    ${row('Avg. gold at run end', avgGold)}
    ${row('Abandoned runs', abandoned)}
  </div>`

  // Recent completed runs: last ~12, most recent first.
  const recent = completed
    .map((r, i) => ({ r, num: i + 1 }))
    .slice(-12)
    .reverse()
  const rows = recent
    .map(({ r, num }) => {
      const outcome = r.outcome === 'win' ? 'Win' : `Lost at battle ${r.battleReached}`
      const mode = (r.endless ? 'Endless ' : '') + (r.start_mode === 'random' ? 'Random' : 'Draft')
      return `<tr><td class="num">${num}</td><td>${mode}</td><td>${difficultyLabel(r)}</td><td>${outcome}</td><td class="num">${r.prepromotes}</td><td class="num">${r.consumables}</td><td class="num">${scoreFromStat(r)}</td></tr>`
    })
    .join('')
  const table = `<table class="statsTable">
    <thead><tr><th class="num">#</th><th>Mode</th><th>Difficulty</th><th>Outcome</th><th class="num">Prepromotes</th><th class="num">Consumables</th><th class="num">Score</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`

  return `${summary}<h3>Recent runs</h3>${table}`
}

// Detail (hidden by default in the stats screen): cheated count + roster composition +
// reward-choice / gold-spent breakdowns, all as average per completed run.
export function statisticsDetailHTML(): string {
  const all = loadRunStats()
  if (all.length === 0) return ''

  const valid = scopeByView(all.filter((r) => !r.cheated))
  const completed = valid.filter((r) => r.outcome !== 'abandoned') // win/loss only — drives the averages
  const cheated = all.filter((r) => r.cheated).length
  const total = completed.length

  const avg = (sel: (r: RunStat) => number) => (total ? fmt1(completed.reduce((a, r) => a + sel(r), 0) / total) : '0.0')
  const row = (label: string, value: string | number) => `<div class="statsRow"><span>${label}</span><b>${value}</b></div>`

  // Cheated runs (moved here from the default summary).
  const cheatedRow = `<div class="statsSummary">${row('Cheated runs (excluded)', cheated)}</div>`

  // Avg. roster composition per run: prepromotes + raw base-stat / growth bracket distributions.
  // Restricted to DRAFT runs only — in random mode the roster is assigned, not picked, so its
  // composition isn't a player choice and would skew these averages.
  const draftRuns = completed.filter((r) => r.start_mode === 'draft')
  const draftAvg = (sel: (r: RunStat) => number) =>
    draftRuns.length ? fmt1(draftRuns.reduce((a, r) => a + sel(r), 0) / draftRuns.length) : '0.0'
  const composition = draftRuns.length
    ? (() => {
        const compRows = [
          row('Prepromote units', draftAvg((r) => r.prepromotes)),
          ...BASE_STAT_BRACKETS.map((b) => row(`Base total ${b.label}`, draftAvg((r) => r.baseStatBrackets?.[b.label] ?? 0))),
          ...GROWTH_BRACKETS.map((b) => row(`Growth total ${b.label}`, draftAvg((r) => r.growthBrackets?.[b.label] ?? 0))),
        ].join('')
        return `<div class="statsSummary">${compRows}</div>`
      })()
    : `<p class="small">No draft runs yet.</p>`

  // Reward choices by rarity: a row per rarity that appears across completed runs.
  const RARITY_ORDER: { key: string; label: string }[] = [
    { key: 'normal', label: 'Normal' },
    { key: 'uncommon', label: 'Uncommon' },
    { key: 'rare', label: 'Rare' },
  ]
  const rarityRows = RARITY_ORDER.filter(({ key }) => completed.some((r) => (r.rewardsByRarity?.[key] ?? 0) > 0))
    .map(({ key, label }) => row(label, avg((r) => r.rewardsByRarity?.[key] ?? 0)))
    .join('')

  // Collect the union of labels seen across completed runs so any label with data always shows.
  const unionKeys = (sel: (r: RunStat) => Record<string, number> | undefined): string[] => {
    const set = new Set<string>()
    completed.forEach((r) => Object.keys(sel(r) || {}).forEach((k) => set.add(k)))
    return [...set].sort()
  }
  const typeKeys = unionKeys((r) => r.rewardsByType)
  const typeRows = typeKeys.map((label) => row(label, avg((r) => r.rewardsByType?.[label] ?? 0))).join('')
  const goldKeys = unionKeys((r) => r.goldByType)
  const goldRows = goldKeys.map((label) => row(label, avg((r) => r.goldByType?.[label] ?? 0))).join('')

  let html = cheatedRow
  html += `<h3>Avg. roster composition (draft runs only)</h3>${composition}`
  if (rarityRows) html += `<h3>Reward choices by rarity</h3><div class="statsSummary">${rarityRows}</div>`
  if (typeRows) html += `<h3>Reward choices by type</h3><div class="statsSummary">${typeRows}</div>`
  if (goldRows) html += `<h3>Gold spent by type (avg/run)</h3><div class="statsSummary">${goldRows}</div>`
  return html
}

export function clearRunStats() {
  try {
    localStorage.removeItem(STATS_KEY)
  } catch {}
}
