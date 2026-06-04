'use strict'

function levelLabel(u) {
  return `L${u.lvl}`
}
function chooseBoostTarget(r, backToRewards = null) {
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
  document.querySelectorAll('[data-t]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = player[+btn.dataset.t]
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
function afterReward(msg, cls = 'heal') {
  awaitingReward = false
  logLine(null, msg, cls)
  renderTeams()
  if (pendingShopAfterReward) {
    pendingShopAfterReward = false
    startShop()
    return
  }
  beginNextBattle()
}
function currentScore() {
  return (battle - 1) * 1000 + gold
}
function scoreHTML(finalScore = false) {
  return `<p>${finalScore ? 'Final s' : 'S'}core: <b>${currentScore()}</b> (${battle - 1} wins × 1000 + ${goldHTML(gold)})</p>`
}
function showWin() {
  showModal(
    `<h2>Victory!!!</h2><p>Congratulations, you have overcome the toughest arena in Elibe and survived 20 battles!</p>${scoreHTML(true)}<button onclick="location.reload()" class="good">New run</button>`
  )
}
function showGameOver() {
  showModal(`<h2>Game over</h2><p>Your roster was wiped out.</p>${scoreHTML()}<button onclick="location.reload()" class="good">Try again</button>`)
}
function showModal(html) {
  $('modalBody').innerHTML = html
  $('modal').classList.remove('hidden')
}
function closeModal() {
  $('modal').classList.add('hidden')
  $('modalBody').innerHTML = ''
}
function openMusic() {
  window.open(MUSIC_URL, '_blank', 'noopener,noreferrer')
}
function showHelpRules() {
  showModal(
    `<h2>Help and rules</h2>
    <p>FireRogue is a roguelike game heavily inspired by Fire Emblem: Blazing Sword.</p>
    <p>Your goal is to survive four arenas with 5 battles each. Battles #3 and #5 in each arena are bosses.</p>
    <p>Your party fully heals after each battle. Improve your equipment, manage consumables, and build a well-balanced team capable of overcoming any obstacle.</p>
    <p>After each arena, you gain 2000 gold and have an opportunity to buy various items from a shop. Unspent gold carries over, and managing it well is crucial for any good strategy.</p>
    <p>Main differences to vanilla FE7: all units only have one weapon slot, weapons with extended range provide a defense bonus, and consumables don't end the unit's turn.</p>
    <p>Score is calculated as wins × 1000 + remaining gold.</p>
    <button onclick="closeModal()" class="primary">Back</button>`
  )
}
function showMenu() {
  $('menuScreen').classList.remove('hidden')
  $('draftScreen').classList.add('hidden')
  $('gameScreen').classList.add('hidden')
  $('battleNo').textContent = battle
  $('rosterCount').textContent = selectedRosterCount()
  updateGoldUI()
  renderBiomeMap()
}
function startDraftGame() {
  if (!draftOptions.length) draftOptions = randomDraftOptions()
  if (!chosen.length) chosen = emptyRosterChoices()
  $('menuScreen').classList.add('hidden')
  $('draftScreen').classList.remove('hidden')
  $('gameScreen').classList.add('hidden')
  renderDraft()
}
function startRandomGame() {
  draftOptions = randomDraftOptions()
  chosen = draftOptions.map((slot) => pick(slot))
  startRun()
}

biomePlan = makeBiomePlan()
draftOptions = randomDraftOptions()
chosen = emptyRosterChoices()
