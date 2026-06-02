'use strict'

let chosen = [],
  draftOptions = [],
  player = [],
  enemy = [],
  consumables = [],
  shopOffers = [],
  biomePlan = [],
  battle = 0,
  combatTurn = 0,
  gold = 0,
  awaitingReward = false,
  battleRunning = false,
  shopOpen = false,
  pendingShopAfterReward = false,
  autoFight = false,
  filter = 'all',
  activePreviewActor = null,
  activeDetailActorIds = [],
  activeConsumableActor = null,
  nextEnemyMarkerId = null,
  pendingTargetCancel = null,
  pendingConsumableAction = null,
  pendingAutoFightAction = null,
  pendingDefaultAction = null,
  pendingDefaultLabel = ''
const $ = (id = '') => document.getElementById(id)
function formatGold(amount = 0) {
  return `${amount} G`
}
function goldHTML(amount = 0) {
  return `<span class="goldAmount">${formatGold(amount)}</span>`
}
function updateGoldUI() {
  const el = $('goldLabel')
  if (el) el.textContent = formatGold(gold)
}
function addGold(amount = 0) {
  gold += amount
  updateGoldUI()
}
function spendGold(amount = 0) {
  if (gold < amount) return false
  gold -= amount
  updateGoldUI()
  return true
}
