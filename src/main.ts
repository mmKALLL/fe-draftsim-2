'use strict'

$('menuRandomBtn').onclick = startRandomGame
$('menuDraftBtn').onclick = startDraftGame
$('menuHelpBtn').onclick = showHelpRules
$('menuMusicBtn').onclick = openMusic
$('randomPickBtn').onclick = () => {
  chosen = draftOptions.map((slot) => pick(slot))
  renderDraft()
}
$('rerollBtn').onclick = () => {
  draftOptions = randomDraftOptions()
  chosen = emptyRosterChoices()
  renderDraft()
}
$('autoFightBtn').onclick = () => setAutoFight(!autoFight)
$('startBtn').onclick = startRun
$('resetBtn').onclick = () => location.reload()
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pendingTargetCancel) {
    e.preventDefault()
    pendingTargetCancel()
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
