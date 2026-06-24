import { $, pick } from './utils'
import { state } from './state'
import { startRandomGame, startDraftGame, showHelpRules, showStatistics, openMusic, showMenu, resetRun } from './ui'
import { renderDraft, randomDraftOptions, emptyRosterChoices } from './render'
import { setAutoFight } from './arenas'
import { startRun, debugWinBattle, debugAddGeosphere } from './game'
import { goldReward } from './rewards'
import { applyReward, leaveShop } from './shop'

$('menuRandomBtn').onclick = startRandomGame
$('menuDraftBtn').onclick = startDraftGame
$('menuHelpBtn').onclick = showHelpRules
$('menuStatsBtn').onclick = showStatistics
$('menuMusicBtn').onclick = openMusic
$('randomPickBtn').onclick = () => {
  // Fill only the unselected slots at random, keeping existing picks; but if every
  // slot is already filled, re-pick all of them.
  const allFilled = state.draft.chosen.every(Boolean)
  state.draft.chosen = state.draft.options.map((slot, i) => (allFilled || !state.draft.chosen[i] ? pick(slot) : state.draft.chosen[i]))
  renderDraft()
}
$('rerollBtn').onclick = () => {
  state.draft.options = randomDraftOptions()
  state.draft.chosen = emptyRosterChoices()
  renderDraft()
}
$('autoFightBtn').onclick = () => setAutoFight(!state.combat.autoFight)
$('startBtn').onclick = () => startRun('draft')
$('resetBtn').onclick = resetRun
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.combat.pendingTargetCancel) {
    e.preventDefault()
    state.combat.pendingTargetCancel()
    return
  }
  if (e.shiftKey && e.key.toLowerCase() === 'w') {
    e.preventDefault()
    state.run.cheated = true // exclude this run from statistics
    if (state.combat.running) {
      debugWinBattle()
    } else if (state.shop.open) {
      leaveShop()
    } else if (state.ui.awaitingReward) {
      applyReward(goldReward())
    }
  }
  if (e.shiftKey && e.key.toLowerCase() === 'g') {
    e.preventDefault()
    state.run.cheated = true // exclude this run from statistics
    debugAddGeosphere()
  }
})
showMenu()
