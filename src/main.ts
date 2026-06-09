import { $, pick } from './utils'
import { state } from './state'
import { startRandomGame, startDraftGame, showHelpRules, openMusic, showMenu, resetRun } from './ui'
import { renderDraft, randomDraftOptions, emptyRosterChoices } from './render'
import { setAutoFight } from './biomes'
import { startRun, debugWinBattle, debugAddGeosphere } from './game'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('Airplane-mode cache activated!'))
      .catch((err) => console.error('Cache registration failed:', err))
  })
}

$('menuRandomBtn').onclick = startRandomGame
$('menuDraftBtn').onclick = startDraftGame
$('menuHelpBtn').onclick = showHelpRules
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
$('startBtn').onclick = startRun
$('resetBtn').onclick = resetRun
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.combat.pendingTargetCancel) {
    e.preventDefault()
    state.combat.pendingTargetCancel()
    return
  }
  if (e.shiftKey && e.key.toLowerCase() === 'w') {
    e.preventDefault()
    debugWinBattle()
  }
  if (e.shiftKey && e.key.toLowerCase() === 'g') {
    e.preventDefault()
    debugAddGeosphere()
  }
})
showMenu()
