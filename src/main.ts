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
  // Number keys 1-5: quick-select the Nth reward/boost choice, combat target, or draft option.
  if (/^[1-5]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    const n = +e.key
    // 1) An open modal with numbered choices (reward selection / boost-target chooser).
    const modal = $('modal')
    if (modal && !modal.classList.contains('hidden')) {
      const choices = modal.querySelectorAll<HTMLElement>('[data-i], [data-t]')
      if (choices[n - 1]) {
        e.preventDefault()
        choices[n - 1].click()
      }
      return
    }
    // 2) Combat target selection: click the Nth highlighted (selectable) target.
    const selectable = document.querySelectorAll<HTMLElement>('.combatant.selectable')
    if (selectable.length) {
      if (selectable[n - 1]) {
        e.preventDefault()
        selectable[n - 1].click()
      }
      return
    }
    // 3) Draft: fill the first unfilled slot with its Nth offered unit.
    const draftScreen = $('draftScreen')
    if (draftScreen && !draftScreen.classList.contains('hidden')) {
      const slot = state.draft.chosen.findIndex((c) => !c)
      const option = slot !== -1 ? state.draft.options[slot]?.[n - 1] : undefined
      if (option) {
        e.preventDefault()
        state.draft.chosen[slot] = option
        renderDraft()
      }
    }
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
