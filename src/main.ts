import { $, pick } from './utils'
import { state } from './state'
import { startRandomGame, startDraftGame, showHelpRules, showStatistics, openMusic, showMenu, resetRun } from './ui'
import { renderDraft, randomDraftOptions, emptyRosterChoices } from './render'
import { setAutoFight } from './biomes'
import { startRun, debugWinBattle, debugAddGeosphere } from './game'
import { goldReward } from './rewards'
import { applyReward, leaveShop } from './shop'

$('menuRandomBtn').onclick = startRandomGame
$('menuDraftBtn').onclick = startDraftGame
$('menuHelpBtn').onclick = showHelpRules
$('menuStatsBtn').onclick = showStatistics
$('menuMusicBtn').onclick = openMusic
$('randomPickBtn').onclick = () => {
  state.draft.chosen = state.draft.options.map((slot) => pick(slot))
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
