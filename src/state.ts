import { $ } from './utils'
import type { Unit, Consumable, ShopOffer, ArenaEntry } from '../types'

export const state = {
  // cross-cutting (read/written across many modules)
  player: [] as Unit[],
  enemy: [] as Unit[],
  consumables: [] as (Consumable | null)[],
  gold: 0,
  battle: 0,
  arenaPlan: [] as ArenaEntry[],
  // bumped on reset; an in-flight runBattle aborts when its captured token is stale
  runToken: 0,
  // `${unitId}|${rewardType}` -> battle number the unit last received that type
  rewardCooldowns: {} as Record<string, number>,

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
  // Per-run statistics tracking (see src/stats.ts). Reset on each new run.
  run: {
    mode: 'draft' as 'draft' | 'random',
    // Endless mode (1T3CRjDJ): 0 = normal run. Each +4-arena extension increments it, which
    // raises the skill/held-item slot capacity and enemy level scaling, and lifts all caps.
    endlessExtensions: 0,
    consumablesAcquired: 0,
    cheated: false,
    recorded: false,
    rewardsByRarity: {} as Record<string, number>, // chosen rewards counted by rarity (normal/uncommon/rare)
    rewardsByType: {} as Record<string, number>, // chosen rewards counted by type label
    goldByType: {} as Record<string, number>, // gold SPENT in shop, by item-type label
  },
  ui: {
    awaitingReward: false,
    pendingShopAfterReward: false,
    filter: 'all',
    activePreviewActor: null as Unit | null,
    activeConsumableActor: null as Unit | null,
    rewardArmAt: 0, // timestamp before which reward 1-5 hotkeys are ignored (mouse stays immediate)
  },
}

// Endless-mode derived values (1T3CRjDJ). endlessExtensions: 0 -> normal run.
export const endlessActive = () => state.run.endlessExtensions > 0
// Skill / held-item slots per unit: 1 normally, +1 per endless extension (2, 3, ...).
export const slotCapacity = () => 1 + state.run.endlessExtensions
// Enemy internal levels gained per battle: 2 in a normal run, a flat 3 in endless (the slot
// capacity still grows per extension, but the level rate stays constant).
export const enemyLevelPerBattle = () => (endlessActive() ? 3 : 2)

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
