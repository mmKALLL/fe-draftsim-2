import { BIOME_CYCLES_PER_RUN, BIOME_CYCLE_LENGTH, BOSS_TIER_BIOME, BOSS_TIER_REGULAR, REWARD_OPTIONS_PER_SCREEN, REWARD_RARE_LOCKED_UNTIL_BATTLE, REWARD_RARITY_WEIGHTS, REWARD_SKIP_GOLD, REWARD_TYPE_WEIGHTS } from '../constants'
import { CONSUMABLES, HELD_ITEMS, WEAPONS, weaponTierLabel } from '../data'
import { consumableSummary, statLabel } from './combat'
import { bossTierForBattle } from './game'
import { growthSummaryHTML, heldItemOfferDescription, heldItemOfferTitle, selectionChoiceHTML, weaponOfferDescription, weaponOfferTitle } from './render'
import { applyReward } from './shop'
import { formatGold, goldHTML } from './state'
import { levelLabel, showModal } from './ui'
import { canEquipAsNewWeapon, cloneConsumable, cloneWeapon, levelUp } from './units'
import { $, capStat, pick, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Rarity, RewardType, StatKey } from '../types'


export function showRewards(opening = false) {
  state.ui.awaitingReward = true
  const bossTier = opening ? null : bossTierForBattle(state.battle)
  const rewards = makeRewards(bossTier, opening)
  const title = opening ? 'Choose an opening reward' : 'Choose a reward'
  renderRewardSelection(title, rewards)
}
export function renderRewardSelection(title: string, rewards: any) {
  const skipReward = rewards.find((r: any) => r.type === 'gold')
  const choiceRewards = rewards.filter((r: any) => r.type !== 'gold')
  let html = `<h2>${title}</h2><div class="rewardGrid">`
  choiceRewards.forEach((r: any, i: number) => {
    const rewardClass = r.item?.tier ? ` reward-${r.item.tier || 'normal'}` : ''
    html += selectionChoiceHTML(r.title, r.desc, `data-i="${i}"`, 'Choose', rewardClass)
  })
  html += '</div>'
  if (skipReward) html += `<div class="rewardSkipWrap"><button data-skip-reward class="rewardSkip">Skip reward: gain ${goldHTML(skipReward.gold)}</button></div>`
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-i]').forEach((btn) => (btn.onclick = () => applyReward(choiceRewards[+btn.dataset.i!], () => renderRewardSelection(title, rewards))))
  const skipBtn = document.querySelector<HTMLElement>('[data-skip-reward]')
  if (skipBtn) skipBtn.onclick = () => applyReward(skipReward)
}

export function weightedTier(weights: any) {
  const total = weights.reduce((sum: any, [, weight]: [string, number]) => sum + weight, 0)
  let roll = rnd() * total
  for (const [tier, weight] of weights) {
    roll -= weight
    if (roll <= 0) return tier
  }
  return weights[weights.length - 1][0]
}
// Pick an item of the requested rarity, falling back to any rarity if none exist.
export function pickByRarity<T extends { tier?: Rarity }>(pool: T[], rarity: Rarity): T | null {
  if (!pool.length) return null
  const tierPool = pool.filter((x) => x.tier === rarity)
  return pick(tierPool.length ? tierPool : pool)
}
// Arena index (1..BIOME_CYCLES_PER_RUN) for a given battle number.
export function rewardArena(battle: number): number {
  return Math.min(BIOME_CYCLES_PER_RUN, Math.floor((Math.max(1, battle) - 1) / BIOME_CYCLE_LENGTH) + 1)
}
// Single source of truth for reward rarity: a weighted spread read from the
// active arena's table for the given boss type. The rare lock keeps the very
// first battles rare-free.
export function rewardRarityProfile(bossTier: string | null, battle: number): { spread: [Rarity, number][] } {
  const arenaTable = REWARD_RARITY_WEIGHTS[rewardArena(battle) - 1] || REWARD_RARITY_WEIGHTS[REWARD_RARITY_WEIGHTS.length - 1]
  const bossKind = bossTier === BOSS_TIER_BIOME ? 'biome' : bossTier === BOSS_TIER_REGULAR ? 'regular' : 'standard'
  const base = arenaTable[bossKind]
  const rareLocked = battle < REWARD_RARE_LOCKED_UNTIL_BATTLE
  const weights: Record<Rarity, number> = { normal: base.normal, uncommon: base.uncommon, rare: rareLocked ? 0 : base.rare }
  const spread = (Object.entries(weights) as [Rarity, number][]).filter(([, w]) => w > 0)
  return { spread }
}
export function rollRewardRarity(profile: { spread: [Rarity, number][] }): Rarity {
  return weightedTier(profile.spread) as Rarity
}
export function rollShopRarity(): Rarity {
  return weightedTier(rewardRarityProfile(null, state.battle).spread) as Rarity
}
export function rewardWeaponPool(u: Unit) {
  return WEAPONS.filter((w) => canEquipAsNewWeapon(u, w))
}
export function pickRewardWeapon(opts: any[], rarity: Rarity) {
  return pickByRarity(opts, rarity) || pick(opts)
}
export function weaponReward(rarity: Rarity = 'normal') {
  const candidates = state.player.filter((u) => u.hp > 0 && rewardWeaponPool(u).length)
  const itemUnit = pick(candidates.length ? candidates : state.player)
  const pool = rewardWeaponPool(itemUnit)
  const chosen = pickRewardWeapon(pool.length ? pool : WEAPONS, rarity)
  if (!chosen) return null
  const item = cloneWeapon(chosen as Weapon)
  return {
    type: 'item',
    title: weaponOfferTitle(item, itemUnit),
    desc: weaponOfferDescription(item, itemUnit),
    unit: itemUnit,
    item,
  }
}
export function pickRewardConsumable(rarity: Rarity) {
  return cloneConsumable(pickByRarity(CONSUMABLES, rarity) || pick(CONSUMABLES))
}
export function consumableReward(rarity: Rarity = 'normal') {
  const item = pickRewardConsumable(rarity)
  const slotText = consumableInventoryFull() ? 'Inventory full: choose a slot to replace.' : 'Stored in the first empty consumable slot.'
  const meta = `<div class="small rewardMeta">${weaponTierLabel(item.tier)} · ${slotText}</div>`
  return { type: 'consumable', title: `${item.name}`, desc: `Usable: ${consumableSummary(item)}${meta}`, item }
}
export function heldItemReward(rarity: Rarity = 'normal') {
  const chosen = pickByRarity(HELD_ITEMS, rarity)
  if (!chosen) return null
  const candidates = state.player.filter((u) => u.hp > 0 && u.heldItem?.id !== chosen.id)
  const unit = pick(candidates.length ? candidates : state.player)
  const item = { ...chosen }
  return { type: 'heldItem', title: heldItemOfferTitle(item, unit), desc: heldItemOfferDescription(item, unit), unit, item }
}
export function firstEmptyConsumableSlot() {
  return state.consumables.findIndex((item) => !item)
}
export function consumableInventoryFull() {
  return firstEmptyConsumableSlot() === -1
}
export function goldReward(amount = REWARD_SKIP_GOLD) {
  return {
    type: 'gold',
    title: `Skip reward: gain ${formatGold(amount)}`,
    desc: '',
    gold: amount,
  }
}
export function sameReward(a: any, b: any) {
  if (a.type !== b.type) return false
  if (a.type === 'item') return a.unit === b.unit && a.item.name === b.item.name
  if (a.type === 'consumable') return a.item.id === b.item.id
  if (a.type === 'heldItem') return a.unit === b.unit && a.item.id === b.item.id
  return false
}
// type -> generator (each takes a target rarity; boost ignores it)
const REWARD_GENERATORS: Partial<Record<RewardType, (rarity: Rarity) => any>> = {
  weapon: weaponReward,
  consumable: consumableReward,
  heldItem: heldItemReward,
  boost: () => boostReward(true),
}
export function makeRewards(bossTier: string | null = null, opening = false) {
  const profile = rewardRarityProfile(bossTier, state.battle)
  const typeWeights = REWARD_TYPE_WEIGHTS[rewardArena(state.battle) - 1] || REWARD_TYPE_WEIGHTS[REWARD_TYPE_WEIGHTS.length - 1]
  const allowConsumables = opening || !bossTier
  const eligible = (Object.entries(typeWeights) as [RewardType, number][]).filter(
    ([type, w]) => w > 0 && REWARD_GENERATORS[type] && (allowConsumables || type !== 'consumable')
  )
  const rewards: any[] = []
  for (let i = 0; i < REWARD_OPTIONS_PER_SCREEN; i++) {
    const rarity = rollRewardRarity(profile)
    let next: any = null,
      guard = 0
    do {
      const type = weightedTier(eligible) as RewardType
      next = REWARD_GENERATORS[type]!(rarity)
    } while ((!next || rewards.some((r) => sameReward(r, next))) && guard++ < 30)
    if (!next) next = boostReward(true)
    rewards.push(next)
  }
  return opening ? rewards : [...rewards, goldReward()]
}
export function boostReward(targeted = true) {
  const boostStats = ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res', 'con'] as StatKey[]
  let reward
  if (boostTargetOptions({ stat: 'level' }).length && rnd() < 0.22) reward = levelBoostReward()
  else {
    const eligibleStats = boostStats.filter((stat) => boostTargetOptions({ stat }).length)
    const stat = pick(eligibleStats.length ? eligibleStats : boostStats)
    const amt = stat === 'hp' ? 7 : stat === 'lck' ? 4 : 2
    const label = stat === 'str' ? 'Str/Mag' : stat.toUpperCase()
    reward = { type: 'boost', title: `${boosterName(stat)}`, desc: `Permanently grants ${label} +${amt} to a chosen unit.`, stat, amt }
  }
  return targeted ? targetedBoostReward(reward) : reward
}
export function targetedBoostReward(r: any) {
  const targets = boostTargetOptions(r)
  if (!targets.length) return r
  const { unit } = pick(targets)
  return {
    ...r,
    unit,
    title: r.title,
    desc: boostRewardDescription(r, unit),
  }
}
export function boostRewardDescription(r: any, u: Unit) {
  if (r.stat === 'level') {
    const growths = `<div class="small rewardMeta">Growths ${growthSummaryHTML(u)}</div>`
    return `Immediately levels up ${u.name} ${levelLabel(u)} -> L${u.lvl + 1}.${growths}`
  }
  const label = statLabel(u, r.stat)
  const before = u.stats[r.stat]
  const after = Math.min(capStat(u, r.stat), before + r.amt)
  return `Permanently grants ${u.name} ${label} +${r.amt} (${before} -> ${after}).${boostDetailHTML(r, u)}`
}
export function equippedWeaponWeightText(u: Unit) {
  return u.weapon ? `Equipped: ${u.weapon.name}, Wt ${u.weapon.wt || 0}` : 'Equipped: none'
}
export function boostDetailHTML(r: any, u: Unit) {
  if (r.stat === 'con') return `<div class="small rewardMeta">${equippedWeaponWeightText(u)}</div>`
  return ''
}
export function levelBoostReward() {
  return {
    type: 'boost',
    stat: 'level',
    amt: 1,
    title: 'Tome of Knowledge',
    desc: 'Immediately gives a chosen unit +1 level.',
  }
}
export function boosterName(stat: StatKey) {
  return {
    hp: 'Angelic Robe',
    str: 'Energy Ring',
    skl: 'Secret Book',
    spd: 'Speedwings',
    lck: 'Goddess Icon',
    def: 'Dragonshield',
    res: 'Talisman',
    con: 'Body Ring',
    level: 'Tome of Knowledge',
  }[stat]
}
export function canApplyBoost(r: any, u: Unit) {
  if (r.stat === 'level') return !(u.promoted && u.lvl >= 20)
  return u.stats[r.stat] < capStat(u, r.stat)
}
export function boostTargetOptions(r: any) {
  return state.player.map((unit, index) => ({ unit, index })).filter(({ unit }) => canApplyBoost(r, unit))
}
export function applyBoostToUnit(r: any, u: Unit) {
  if (r.stat === 'level') {
    const gained = levelUp(u, true)
    u.hp = u.maxHp
    return gained ? `${u.name} studied the Tome of Knowledge and gained a level.` : `${u.name} is already at the level cap.`
  }
  u.stats[r.stat] = Math.min(capStat(u, r.stat), u.stats[r.stat] + r.amt)
  if (r.stat === 'hp') {
    u.maxHp = u.stats.hp
    u.hp = u.maxHp
  }
  return `${u.name} used ${boosterName(r.stat)}.`
}
