import { BOSS_TIER_BIOME, CONSUMABLE_REWARD_CHANCE, CONSUMABLE_TIER_WEIGHTS, REWARD_RARE_LOCKED_UNTIL_BATTLE, REWARD_SKIP_GOLD, WEAPON_TIER_WEIGHTS } from '../constants'
import { CONSUMABLES, WEAPONS, weaponTierLabel } from '../data'
import { consumableSummary, statLabel } from './combat'
import { bossTierForBattle } from './game'
import { growthSummaryHTML, selectionChoiceHTML, weaponOfferDescription, weaponOfferTitle } from './render'
import { applyReward } from './shop'
import { formatGold, goldHTML } from './state'
import { levelLabel, showModal } from './ui'
import { canEquipAsNewWeapon, cloneConsumable, cloneWeapon, levelUp } from './units'
import { $, capStat, pick, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


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

export function isGoodRewardWeapon(w: Weapon) {
  return w.tier !== 'normal'
}
export function rewardsExcludeRare() {
  return state.battle < REWARD_RARE_LOCKED_UNTIL_BATTLE
}
export function isNonRareRewardItem(item: any) {
  return item.tier !== 'rare'
}
export function rewardWeaponPool(u: Unit, goodOnly = false) {
  const opts = WEAPONS.filter((w) => canEquipAsNewWeapon(u, w))
  if (rewardsExcludeRare()) return opts.filter(isNonRareRewardItem)
  if (!goodOnly) return opts
  const good = opts.filter(isGoodRewardWeapon)
  return good.length ? good : opts
}
export function fallbackRewardWeaponPool(goodOnly = false) {
  if (rewardsExcludeRare()) return WEAPONS.filter(isNonRareRewardItem)
  if (!goodOnly) return WEAPONS
  const good = WEAPONS.filter(isGoodRewardWeapon)
  return good.length ? good : WEAPONS
}
export function rewardConsumablePool(goodOnly = false) {
  if (rewardsExcludeRare()) return CONSUMABLES.filter(isNonRareRewardItem)
  if (!goodOnly) return CONSUMABLES
  const good = CONSUMABLES.filter((item) => item.tier !== 'normal')
  return good.length ? good : CONSUMABLES
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
export function completedRewardFights() {
  return Math.max(0, state.battle)
}
export function rewardTierWeights(weightSet: any, goodOnly = false) {
  if (goodOnly) return rewardsExcludeRare() ? weightSet.good.filter(([tier]: [string, number]) => tier !== 'rare') : weightSet.good
  const fights = completedRewardFights()
  const weights = weightSet.normal.map(([tier, weight]: [string, number]) => {
    if (tier === 'uncommon') return [tier, weight + fights * 2]
    if (tier === 'rare') return [tier, weight + fights]
    return [tier, weight]
  })
  return rewardsExcludeRare() ? weights.filter(([tier]: [string, number]) => tier !== 'rare') : weights
}
export function pickRewardWeapon(opts: any, goodOnly = false) {
  const weights = rewardTierWeights(WEAPON_TIER_WEIGHTS, goodOnly)
  for (let i = 0; i < 8; i++) {
    const tier = weightedTier(weights)
    const tierOpts = opts.filter((w: Weapon) => w.tier === tier)
    if (tierOpts.length) return pick(tierOpts)
  }
  return pick(opts)
}
export function pickRewardConsumable(goodOnly = false) {
  const pool = rewardConsumablePool(goodOnly)
  const weights = rewardTierWeights(CONSUMABLE_TIER_WEIGHTS, goodOnly)
  for (let i = 0; i < 8; i++) {
    const tier = weightedTier(weights)
    const tierOpts = pool.filter((item) => item.tier === tier)
    if (tierOpts.length) return cloneConsumable(pick(tierOpts))
  }
  return cloneConsumable(pick(pool.length ? pool : CONSUMABLES))
}
export function weaponReward(goodOnly = false) {
  const candidates = state.player.filter((u) => u.hp > 0 && rewardWeaponPool(u, goodOnly).length)
  const itemUnit = pick(candidates.length ? candidates : state.player)
  const opts = rewardWeaponPool(itemUnit, goodOnly)
  const item = cloneWeapon(pickRewardWeapon(opts.length ? opts : fallbackRewardWeaponPool(goodOnly), goodOnly) as Weapon)
  return {
    type: 'item',
    title: weaponOfferTitle(item, itemUnit),
    desc: weaponOfferDescription(item, itemUnit),
    unit: itemUnit,
    item,
  }
}
export function firstEmptyConsumableSlot() {
  return state.consumables.findIndex((item) => !item)
}
export function consumableInventoryFull() {
  return firstEmptyConsumableSlot() === -1
}
export function consumableReward(goodOnly = false) {
  const item = pickRewardConsumable(goodOnly)
  const slotText = consumableInventoryFull() ? 'Inventory full: choose a slot to replace.' : 'Stored in the first empty consumable slot.'
  const meta = `<div class="small rewardMeta">${weaponTierLabel(item.tier)} · ${slotText}</div>`
  return { type: 'consumable', title: `${item.name}`, desc: `Usable: ${consumableSummary(item)}${meta}`, item }
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
  return false
}
export function makeRewards(bossTier: string | null = null, opening = false) {
  const weaponCount = 2
  const goodOnly = bossTier === BOSS_TIER_BIOME
  const allowConsumables = opening || !bossTier
  const weaponRewards: any[] = []
  for (let i = 0; i < weaponCount; i++) {
    let next = allowConsumables && rnd() < CONSUMABLE_REWARD_CHANCE ? consumableReward(goodOnly) : weaponReward(goodOnly),
      guard = 0
    while (weaponRewards.some((r) => sameReward(r, next)) && guard++ < 20)
      next = allowConsumables && rnd() < CONSUMABLE_REWARD_CHANCE ? consumableReward(goodOnly) : weaponReward(goodOnly)
    weaponRewards.push(next)
  }
  const boost = boostReward()
  return opening ? [...weaponRewards, boost] : [...weaponRewards, boost, goldReward()]
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
