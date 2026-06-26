import { APP_VERSION } from '../constants'
import { makeArenaPlan, renderArenaMap } from './arenas'
import { statLabel } from './combat'
import { beginNextBattle, startRun } from './game'
import { emptyRosterChoices, growthSummaryHTML, logLine, randomDraftOptions, renderDraft, renderTeams, selectedRosterCount, SPD_ARROW } from './render'
import { applyBoostToUnit, boostDetailHTML, boostTargetOptions, boosterName, canApplyBoost, recordRewardCooldown } from './rewards'
import { shopConsumablePrice, startShop } from './shop'
import { clearRunStats, loadRunStats, noteRewardChoice, recordRunStat, statisticsDetailHTML, statisticsHTML } from './stats'
import { goldHTML, updateGoldUI } from './state'
import { $, MUSIC_URL, capStat, pick } from './utils'
import { sim } from './sim'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, ArenaFocus, ArenaEntry, ShopOffer } from '../types'

export function levelLabel(u: Unit) {
  return `L${u.lvl}`
}
export function chooseBoostTarget(r: any, backToRewards: (() => void) | null = null) {
  const targets = boostTargetOptions(r)
  if (!targets.length) {
    if (backToRewards) {
      backToRewards()
      return
    }
    showModal(`<h2>${boosterName(r.stat)}: choose target</h2><p>No eligible targets.</p>`)
    return
  }
  let html = `<h2>${boosterName(r.stat)}: choose target</h2>`
  targets.forEach(({ unit: u, index: i }) => {
    const before = r.stat === 'level' ? levelLabel(u) : u.stats[r.stat]
    const after = r.stat === 'level' ? (canApplyBoost(r, u) ? `L${u.lvl + 1}` : levelLabel(u)) : Math.min(capStat(u, r.stat), u.stats[r.stat] + r.amt)
    const label = r.stat === 'level' ? 'Level' : statLabel(u, r.stat)
    const growths = r.stat === 'level' ? ` ${growthSummaryHTML(u)}` : ''
    const details = boostDetailHTML(r, u)
    html += `<div class="choice"><div>${u.name}: ${label} ${before} ${SPD_ARROW} ${after}${growths}${details}</div><button data-t="${i}">Use</button></div>`
  })
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-t]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = state.player[+btn.dataset.t!]
        if (!canApplyBoost(r, u)) {
          closeModal()
          if (backToRewards) backToRewards()
          return
        }
        const msg = applyBoostToUnit(r, u)
        recordRewardCooldown(u.id, 'boost')
        noteRewardChoice(r)
        closeModal()
        afterReward(msg)
      })
  )
}
export function afterReward(msg: string, cls = 'heal') {
  state.ui.awaitingReward = false
  logLine(null, msg, cls)
  renderTeams()
  if (state.ui.pendingShopAfterReward) {
    state.ui.pendingShopAfterReward = false
    startShop()
    return
  }
  beginNextBattle()
}
export function winCount(currentBattleWon = false) {
  // state.battle is the current/last-started battle (0 before any battle, 1 while fighting battle 1, ...).
  // While fighting (or after losing) battle N, wins == battle - 1, floored at 0 so a brand-new game
  // shows 0 wins. After winning the current battle (e.g. the final 20th), that battle counts too.
  return Math.max(0, state.battle - (currentBattleWon ? 0 : 1))
}
// Leftover consumables held at run end (or right now mid-run) are worth 50% of their
// shop buy-price each, rounded down. Reflects that unused consumables still have value.
export function leftoverConsumableValue() {
  return state.consumables.reduce((sum, item) => (item ? sum + Math.floor(0.5 * shopConsumablePrice(item)) : sum), 0)
}
export function currentScore(currentBattleWon = false) {
  return winCount(currentBattleWon) * 1000 + state.gold + leftoverConsumableValue()
}
export function scoreHTML(finalScore = false) {
  // finalScore is only shown on the victory screen, where the current (20th) battle was just won.
  const consumableValue = leftoverConsumableValue()
  const consumablePart = consumableValue > 0 ? ` + ${consumableValue} consumable value` : ''
  return `<p>${finalScore ? 'Final s' : 'S'}core: <b>${currentScore(finalScore)}</b> (${winCount(finalScore)} wins × 1000 + ${goldHTML(state.gold)}${consumablePart})</p>`
}
export function showWin() {
  const stat = recordRunStat('win')
  // Headless sim: signal run-end with the recorded stat instead of showing the results modal.
  if (sim.active) return sim.onRunEnd?.(stat)
  showResultsModal(
    `<h2>Victory!!!</h2><p>Congratulations, you have survived 20 battles and overcome the toughest arenas in Elibe! Please feel free to share the game with your friends!</p>${scoreHTML(true)}<button data-reset class="good">New run</button>`
  )
}
export function showGameOver() {
  const stat = recordRunStat('loss')
  if (sim.active) return sim.onRunEnd?.(stat)
  showResultsModal(`<h2>Game over</h2><p>Your roster was wiped out.</p>${scoreHTML()}<button data-reset class="good">Try again</button>`)
}
// Shows a victory/game-over results modal with an extra "Show team" button. Pressing it
// hides the modal (revealing the final board for a screenshot) and exposes a fixed-position
// floating "Show results" button that reopens the very same modal.
export function showResultsModal(html: any) {
  showModal(`${html}<button id="showTeamBtn" type="button" style="margin-left: 16px">Show team</button>`)
  hideShowResultsFloater()
  const showTeam = $('showTeamBtn')
  if (showTeam)
    showTeam.onclick = () => {
      closeModal()
      showShowResultsFloater(html)
    }
}
function showShowResultsFloater(html: any) {
  let btn = document.getElementById('showResultsFloater') as HTMLButtonElement | null
  if (!btn) {
    btn = document.createElement('button')
    btn.id = 'showResultsFloater'
    btn.type = 'button'
    btn.className = 'good'
    btn.textContent = 'Show results'
    document.body.appendChild(btn)
  }
  btn.onclick = () => {
    hideShowResultsFloater()
    showResultsModal(html)
  }
  btn.classList.remove('hidden')
}
function hideShowResultsFloater() {
  document.getElementById('showResultsFloater')?.classList.add('hidden')
}
// Reset to a fresh run in-place (no page reload, so the game stays playable offline).
export function resetRun() {
  // A started-but-unrecorded run (player pressed New Run / reset mid-run) is logged as abandoned.
  if (!state.run.recorded && state.player.length > 0) recordRunStat('abandoned')
  state.runToken++
  if (state.combat.pendingTargetCancel) state.combat.pendingTargetCancel()
  state.player = []
  state.enemy = []
  state.consumables = []
  state.gold = 0
  state.battle = 0
  state.arenaPlan = makeArenaPlan()
  state.rewardCooldowns = {}
  state.draft.options = randomDraftOptions()
  state.draft.chosen = emptyRosterChoices()
  Object.assign(state.combat, {
    running: false,
    turn: 0,
    autoFight: false,
    nextEnemyMarkerId: null,
    pendingTargetCancel: null,
    pendingConsumableAction: null,
    pendingAutoFightAction: null,
    pendingDefaultAction: null,
    pendingDefaultLabel: '',
  })
  Object.assign(state.shop, { open: false, offers: [] })
  Object.assign(state.run, { mode: 'draft', consumablesAcquired: 0, cheated: false, recorded: false, rewardsByRarity: {}, rewardsByType: {}, goldByType: {} })
  Object.assign(state.ui, { awaitingReward: false, pendingShopAfterReward: false, activePreviewActor: null, activeConsumableActor: null })
  closeModal()
  hideShowResultsFloater()
  showMenu()
}
export function showModal(html: any) {
  $('modalBody').innerHTML = html
  $('modal').classList.remove('hidden')
}
export function closeModal() {
  $('modal').classList.add('hidden')
  $('modalBody').innerHTML = ''
}
export function openMusic() {
  window.open(MUSIC_URL, '_blank', 'noopener,noreferrer')
}
export function showHelpRules() {
  showModal(
    `<h2>Help and rules</h2>
    <p>FireRogue is a roguelike game heavily inspired by Fire Emblem: Blazing Sword.</p>
    <p>Your goal is to survive four arenas with 5 battles each. Battles #3 and #5 in each arena are bosses.</p>
    <p>Your party fully heals after each battle. Improve your equipment, manage consumables, and build a well-balanced team capable of overcoming any obstacle.</p>
    <p>After each arena, you gain 2000 gold and have an opportunity to buy various items from a shop. Unspent gold carries over, and managing it well is crucial for any good strategy.</p>
    <p>Main differences to vanilla FE7: all units only have one weapon slot, weapons with extended range provide a defense bonus, and consumables don't end the unit's turn.</p>
    <p>Score is calculated as wins × 1000 + remaining gold.</p>
    <button data-close class="good">Back</button>`
  )
}
export function showStatistics() {
  showModal(
    `<h2>Statistics</h2>${statisticsHTML()}` +
      `<div id="statsDetail" class="hidden">${statisticsDetailHTML()}<textarea id="statsDump" class="statsDump" readonly rows="5" spellcheck="false"></textarea></div>` +
      `<div class="row" style="justify-content: space-between; margin-top: 16px">` +
      `<button data-close class="good">Back</button>` +
      `<div class="row">` +
      `<button id="statsClearBtn" class="danger hidden" type="button">Clear all data</button>` +
      `<button id="statsDumpBtn" type="button">Show full data</button>` +
      `</div></div>`
  )
  const dumpBtn = $('statsDumpBtn') as HTMLButtonElement | null
  const clearBtn = $('statsClearBtn') as HTMLButtonElement | null
  const detail = $('statsDetail')
  const dump = $('statsDump') as HTMLTextAreaElement | null
  let clearArmed = false
  const disarmClear = () => {
    clearArmed = false
    if (clearBtn) clearBtn.textContent = 'Clear all data'
  }
  if (dumpBtn && detail && dump) {
    dumpBtn.onclick = () => {
      const showing = !detail.classList.contains('hidden')
      disarmClear() // either toggle action resets the clear-arm
      if (showing) {
        detail.classList.add('hidden')
        clearBtn?.classList.add('hidden')
        dumpBtn.textContent = 'Show full data'
      } else {
        detail.classList.remove('hidden')
        dump.value = JSON.stringify(loadRunStats(), null, 2)
        dumpBtn.textContent = 'Hide full data'
        clearBtn?.classList.remove('hidden')
      }
    }
  }
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (!clearArmed) {
        clearArmed = true
        clearBtn.textContent = 'Click again to confirm'
        return
      }
      clearRunStats()
      showStatistics() // re-render fresh/empty
    }
  }
}
// Delegated handler so modal close buttons need no global (replaces inline onclick="closeModal()")
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement | null
  if (t && t.closest('[data-reset]')) resetRun()
  else if (t && t.closest('[data-close]')) closeModal()
})
export function showMenu() {
  $('menuScreen').classList.remove('hidden')
  $('menuVersion').textContent = `Version ${APP_VERSION}`
  $('draftScreen').classList.add('hidden')
  $('gameScreen').classList.add('hidden')
  $('battleNo').textContent = String(state.battle)
  $('rosterCount').textContent = String(selectedRosterCount())
  updateGoldUI()
  renderArenaMap()
}
export function startDraftGame() {
  if (!state.draft.options.length) state.draft.options = randomDraftOptions()
  if (!state.draft.chosen.length) state.draft.chosen = emptyRosterChoices()
  $('menuScreen').classList.add('hidden')
  $('draftScreen').classList.remove('hidden')
  $('gameScreen').classList.add('hidden')
  renderDraft()
}
export function startRandomGame() {
  state.draft.options = randomDraftOptions()
  state.draft.chosen = state.draft.options.map((slot) => pick(slot))
  startRun('random')
}

state.arenaPlan = makeArenaPlan()
state.draft.options = randomDraftOptions()
state.draft.chosen = emptyRosterChoices()
