import { $ } from './utils'
import type { Unit, Consumable, ShopOffer, BiomeEntry } from '../types'

export const state = {
  // cross-cutting (read/written across many modules)
  player: [] as Unit[],
  enemy: [] as Unit[],
  consumables: [] as (Consumable | null)[],
  gold: 0,
  battle: 0,
  biomePlan: [] as BiomeEntry[],

  draft: {
    chosen: [] as string[],
    options: [] as string[][],
  },
  combat: {
    running: false,
    turn: 0,
    autoFight: false,
    nextEnemyMarkerId: null as string | null,
    pendingTargetCancel: null as (() => void) | null,
    pendingConsumableAction: null as ((slot: number) => void) | null,
    pendingAutoFightAction: null as (() => void) | null,
    pendingDefaultAction: null as (() => void) | null,
    pendingDefaultLabel: '',
  },
  shop: {
    open: false,
    offers: [] as ShopOffer[],
  },
  ui: {
    awaitingReward: false,
    pendingShopAfterReward: false,
    filter: 'all',
    activePreviewActor: null as Unit | null,
    activeConsumableActor: null as Unit | null,
  },
}

export const formatGold = (amount = 0) => `${amount} G`
export const goldHTML = (amount = 0) => `<span class="goldAmount">${formatGold(amount)}</span>`
export function updateGoldUI() {
  const el = $('goldLabel')
  if (el) el.textContent = formatGold(state.gold)
}
export function addGold(amount = 0) {
  state.gold += amount
  updateGoldUI()
}
export function spendGold(amount = 0) {
  if (state.gold < amount) return false
  state.gold -= amount
  updateGoldUI()
  return true
}
