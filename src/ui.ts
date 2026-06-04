import { makeBiomePlan, renderBiomeMap } from './biomes'
import { statLabel } from './combat'
import { beginNextBattle, startRun } from './game'
import { emptyRosterChoices, growthSummaryHTML, logLine, randomDraftOptions, renderDraft, renderTeams, selectedRosterCount } from './render'
import { applyBoostToUnit, boostDetailHTML, boostTargetOptions, boosterName, canApplyBoost } from './rewards'
import { startShop } from './shop'
import { goldHTML, updateGoldUI } from './state'
import { $, MUSIC_URL, capStat, pick } from './utils'
import { state } from './state'


export function levelLabel(u) {
  return `L${u.lvl}`
}
export function chooseBoostTarget(r, backToRewards = null) {
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
    html += `<div class="choice"><div>${u.name}: ${label} ${before} -> ${after}${growths}${details}</div><button data-t="${i}">Use</button></div>`
  })
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-t]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = state.player[+btn.dataset.t]
        if (!canApplyBoost(r, u)) {
          closeModal()
          if (backToRewards) backToRewards()
          return
        }
        const msg = applyBoostToUnit(r, u)
        closeModal()
        afterReward(msg)
      })
  )
}
export function afterReward(msg, cls = 'heal') {
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
export function currentScore() {
  return (state.battle - 1) * 1000 + state.gold
}
export function scoreHTML(finalScore = false) {
  return `<p>${finalScore ? 'Final s' : 'S'}core: <b>${currentScore()}</b> (${state.battle - 1} wins × 1000 + ${goldHTML(state.gold)})</p>`
}
export function showWin() {
  showModal(
    `<h2>Victory!!!</h2><p>Congratulations, you have overcome the toughest arena in Elibe and survived 20 battles!</p>${scoreHTML(true)}<button onclick="location.reload()" class="good">New run</button>`
  )
}
export function showGameOver() {
  showModal(`<h2>Game over</h2><p>Your roster was wiped out.</p>${scoreHTML()}<button onclick="location.reload()" class="good">Try again</button>`)
}
export function showModal(html) {
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
    <button data-close class="primary">Back</button>`
  )
}
// Delegated handler so modal close buttons need no global (replaces inline onclick="closeModal()")
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement | null
  if (t && t.closest('[data-close]')) closeModal()
})
export function showMenu() {
  $('menuScreen').classList.remove('hidden')
  $('draftScreen').classList.add('hidden')
  $('gameScreen').classList.add('hidden')
  $('battleNo').textContent = String(state.battle)
  $('rosterCount').textContent = String(selectedRosterCount())
  updateGoldUI()
  renderBiomeMap()
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
  startRun()
}

state.biomePlan = makeBiomePlan()
state.draft.options = randomDraftOptions()
state.draft.chosen = emptyRosterChoices()
