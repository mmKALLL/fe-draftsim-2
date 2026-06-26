import { ALL_STAT_KEYS, ARENA_CYCLES_PER_RUN, ARENA_CYCLE_LENGTH, BOSS_TIER_ARENA, BOSS_TIER_REGULAR, DEBUG_SKILLS, ENEMY_BONUS_COUNTS, ENEMY_BONUS_RARITY, REWARD_OPTIONS_PER_SCREEN, REWARD_RARE_LOCKED_UNTIL_BATTLE, REWARD_RARITY_WEIGHTS, REWARD_SKIP_GOLD, REWARD_TYPE_UNIT_COOLDOWN, REWARD_TYPE_WEIGHTS, UNIVERSAL_SKILL_WEIGHT } from '../constants'
import { CONSUMABLES, HELD_ITEMS, TEACHABLE_SKILLS, WEAPONS, weaponRarityLabel } from '../data'
import { attackSpeed, computeMaxHp, consumableSummary, refreshMaxHp, statLabel, unitTags, weaponResultingAS } from './combat'
import { bossTierForBattle } from './game'
import { growthSummaryHTML, heldItemOfferDescription, heldItemOfferTitle, selectionChoiceHTML, skillOfferDescription, skillOfferTitle, SPD_ARROW, weaponOfferDescription, weaponOfferTitle } from './render'
import { applyReward } from './shop'
import { formatGold, goldHTML } from './state'
import { levelLabel, showModal } from './ui'
import { canEquipAsNewWeapon, cloneConsumable, cloneWeapon, isBasicWeapon, levelUp, pickWeightedRarity } from './units'
import { $, capStat, pick, rnd } from './utils'
import { sim } from './sim'
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
  // Headless sim: don't render/await the modal. Resolve immediately per sim.rewardPolicy, then let
  // the normal afterReward -> beginNextBattle chain advance the run (state.ui.awaitingReward stays
  // owned by applyReward/afterReward as in normal play). 'first' applies the first non-gold choice
  // (mirrors clicking [data-i="0"]); 'skip' takes the gold (the existing skip path). The same
  // renderRewardSelection callback is passed as backToRewards so a sim 'first' choice that can't
  // apply (e.g. an ineligible boost target) falls back cleanly.
  if (sim.active) {
    if (sim.rewardPolicy === 'first' && choiceRewards.length) applyReward(choiceRewards[0], () => renderRewardSelection(title, rewards))
    else applyReward(skipReward ?? goldReward())
    return
  }
  let html = `<h2>${title}</h2><div class="rewardGrid">`
  choiceRewards.forEach((r: any, i: number) => {
    const rarity = r.item?.rarity ?? r.item?.rarity
    const rewardClass = rarity ? ` reward-${rarity}` : ''
    html += selectionChoiceHTML(r.title, r.desc, `data-i="${i}"`, 'Choose', rewardClass)
  })
  html += '</div>'
  if (skipReward) html += `<div class="rewardSkipWrap"><button data-skip-reward class="rewardSkip">Skip reward: gain ${goldHTML(skipReward.gold)}</button></div>`
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-i]').forEach((btn) => (btn.onclick = () => applyReward(choiceRewards[+btn.dataset.i!], () => renderRewardSelection(title, rewards))))
  const skipBtn = document.querySelector<HTMLElement>('[data-skip-reward]')
  if (skipBtn) skipBtn.onclick = () => applyReward(skipReward)
  // Arm the 1-5 hotkeys only after 0.5s so a held/carried-over keypress can't instantly pick a
  // reward; mouse clicks stay immediate (no visual change).
  state.ui.rewardArmAt = performance.now() + 500
}

export function weightedRarity(weights: any) {
  const total = weights.reduce((sum: any, [, weight]: [string, number]) => sum + weight, 0)
  let roll = rnd() * total
  for (const [rarity, weight] of weights) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return weights[weights.length - 1][0]
}
// Pick an item of the requested rarity, falling back to any rarity if none exist.
export function pickByRarity<T extends { rarity?: Rarity }>(pool: T[], rarity: Rarity): T | null {
  if (!pool.length) return null
  const rarityPool = pool.filter((x) => x.rarity === rarity)
  return pick(rarityPool.length ? rarityPool : pool)
}
// Arena index (1..ARENA_CYCLES_PER_RUN) for a given battle number.
export function rewardArena(battle: number): number {
  return Math.min(ARENA_CYCLES_PER_RUN, Math.floor((Math.max(1, battle) - 1) / ARENA_CYCLE_LENGTH) + 1)
}
// Single source of truth for reward rarity: a weighted spread read from the
// active arena's table for the given boss type. The rare lock keeps the very
// first battles rare-free.
export function rewardRarityProfile(bossTier: string | null, battle: number): { spread: [Rarity, number][] } {
  const arenaTable = REWARD_RARITY_WEIGHTS[rewardArena(battle) - 1] || REWARD_RARITY_WEIGHTS[REWARD_RARITY_WEIGHTS.length - 1]
  const bossKind = bossTier === BOSS_TIER_ARENA ? 'arena' : bossTier === BOSS_TIER_REGULAR ? 'regular' : 'standard'
  const base = arenaTable[bossKind]
  const rareLocked = battle < REWARD_RARE_LOCKED_UNTIL_BATTLE
  const weights: Record<Rarity, number> = { normal: base.normal, uncommon: base.uncommon, rare: rareLocked ? 0 : base.rare }
  const spread = (Object.entries(weights) as [Rarity, number][]).filter(([, w]) => w > 0)
  return { spread }
}
export function rollRewardRarity(profile: { spread: [Rarity, number][] }): Rarity {
  return weightedRarity(profile.spread) as Rarity
}
export function rollShopRarity(): Rarity {
  return weightedRarity(rewardRarityProfile(null, state.battle).spread) as Rarity
}
// Per-unit, per-reward-type cooldown: a unit that received a reward type can't
// be offered that type again until REWARD_TYPE_UNIT_COOLDOWN battles have passed.
export function unitOnRewardCooldown(unitId: string, type: string) {
  const last = state.rewardCooldowns[`${unitId}|${type}`]
  return last != null && state.battle - last < REWARD_TYPE_UNIT_COOLDOWN
}
export function recordRewardCooldown(unitId: string, type: string) {
  state.rewardCooldowns[`${unitId}|${type}`] = state.battle
}
// Effective-immune held items (e.g. flyingEffectiveImmune) are only useful to
// units that can actually be hit by that effective damage; gate them by class tag.
export function heldItemRelevantToUnit(item: any, unit: Unit) {
  const m = /^(.+)EffectiveImmune$/.exec(item?.effect || '')
  if (m) return unitTags(unit).includes(m[1])
  return true
}
export function rewardWeaponPool(u: Unit) {
  return WEAPONS.filter((w) => canEquipAsNewWeapon(u, w) && !isBasicWeapon(w))
}
export function pickRewardWeapon(opts: any[], rarity: Rarity) {
  return pickByRarity(opts, rarity) || pick(opts)
}
export function weaponReward(rarity: Rarity = 'normal') {
  const candidates = state.player.filter((u) => u.hp > 0 && rewardWeaponPool(u).length && !unitOnRewardCooldown(u.id, 'item'))
  if (!candidates.length) return null
  const itemUnit = pick(candidates)
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
  const meta = `<div class="small rewardMeta">${weaponRarityLabel(item.rarity)} · ${slotText}</div>`
  return { type: 'consumable', title: `${item.name}`, desc: `Usable: ${consumableSummary(item)}${meta}`, item }
}
export function heldItemReward(rarity: Rarity = 'normal') {
  const chosen = pickByRarity(HELD_ITEMS, rarity)
  if (!chosen) return null
  const candidates = state.player.filter((u) => u.heldItem?.id !== chosen.id && !unitOnRewardCooldown(u.id, 'heldItem') && heldItemRelevantToUnit(chosen, u))
  if (!candidates.length) return null
  const unit = pick(candidates)
  const item = { ...chosen }
  return { type: 'heldItem', title: heldItemOfferTitle(item, unit), desc: heldItemOfferDescription(item, unit), unit, item }
}
// A unit can learn a skill if it's universal ('Any') or lists the unit's base or
// promoted class. Only wired skills remain uncommented in TEACHABLE_SKILLS.
export function skillClassMatches(skill: any, u: Unit) {
  return skill.classes.includes('Any') || skill.classes.includes(u.cls) || skill.classes.includes(u.displayCls)
}
export function skillTargets(skill: any) {
  return state.player.filter((u) => u.hp > 0 && u.skill?.id !== skill.id && !unitOnRewardCooldown(u.id, 'skill') && skillClassMatches(skill, u))
}
export function skillReward(rarity: Rarity = 'normal') {
  const offerable = TEACHABLE_SKILLS.filter((s) => skillTargets(s).length)
  if (!offerable.length) return null
  // Debug: marking a skill with `debugAlways: true` in data.ts collapses the skill
  // pool to only the flagged skills (ignoring the rolled rarity), forcing them to
  // appear so a specific skill can be tested. Pair with DEBUG_SKILLS for frequent rolls.
  const forced = offerable.filter((s) => s.debugAlways)
  const rarityPool = forced.length ? forced : offerable.filter((s) => s.rarity === rarity)
  const pool = rarityPool.length ? rarityPool : offerable
  // Universal ('Any'-class) skills are eligible for every unit, so weight them down
  // (UNIVERSAL_SKILL_WEIGHT) relative to class-specific skills (weight 1) when choosing.
  const weighted = pool.map((s) => [s, s.classes.includes('Any') ? UNIVERSAL_SKILL_WEIGHT : 1] as [any, number])
  const skill = weightedRarity(weighted)
  const unit = pick(skillTargets(skill))
  return { type: 'skill', title: skillOfferTitle(skill, unit), desc: skillOfferDescription(skill, unit), unit, item: skill }
}
// Roll a fractional count: integer part guaranteed + fractional part = chance of one more.
function rollFractionalCount(v: number) {
  const base = Math.floor(v)
  return base + (rnd() < v - base ? 1 : 0)
}
// Give an enemy class-appropriate bonus skill / held item per ENEMY_BONUS_COUNTS
// (keyed by current arena + role). All-zero by default, so this is a no-op unless a
// "hard mode" table is swapped in. Units have one slot each, so a rolled count >= 1 fills it.
export function assignEnemyBonuses(unit: Unit, role: 'boss' | 'minion') {
  const arena = rewardArena(state.battle)
  const cfg = ENEMY_BONUS_COUNTS[arena - 1]?.[role]
  if (!cfg) return
  const rarityWeights = ENEMY_BONUS_RARITY[arena - 1]?.[role]
  if (rollFractionalCount(cfg.skill) >= 1) {
    const pool = TEACHABLE_SKILLS.filter((s) => skillClassMatches(s, unit))
    // Roll a rarity, then pick a skill of that rarity (steps down to any rarity if empty).
    const skill = rarityWeights ? pickByRarity(pool, pickWeightedRarity(rarityWeights)) : pick(pool)
    if (skill) {
      unit.skill = skill
      refreshMaxHp(unit) // a rolled HP +5 raises the enemy's maxHp before its hp is set to full
    }
  }
  if (rollFractionalCount(cfg.held) >= 1) {
    const pool = HELD_ITEMS.filter((i: any) => heldItemRelevantToUnit(i, unit))
    // Same rarity-weighted roll for held items, keyed on `.rarity` via pickByRarity.
    const item = rarityWeights ? pickByRarity(pool, pickWeightedRarity(rarityWeights)) : pick(pool)
    if (item) {
      unit.heldItem = item
      refreshMaxHp(unit) // keep maxHp in sync if a held item ever grants HP
    }
  }
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
  if (a.type === 'skill') return a.unit === b.unit && a.item.id === b.item.id
  if (a.type === 'boost') return a.stat === b.stat && a.unit === b.unit
  return false
}
// type -> generator (each takes a target rarity; boost ignores it)
const REWARD_GENERATORS: Partial<Record<RewardType, (rarity: Rarity) => any>> = {
  weapon: weaponReward,
  consumable: consumableReward,
  heldItem: heldItemReward,
  skill: skillReward,
  boost: () => boostReward(true),
}
export function makeRewards(bossTier: string | null = null, opening = false) {
  const profile = rewardRarityProfile(bossTier, state.battle)
  const typeWeights = REWARD_TYPE_WEIGHTS[rewardArena(state.battle) - 1] || REWARD_TYPE_WEIGHTS[REWARD_TYPE_WEIGHTS.length - 1]
  const allowConsumables = opening || !bossTier
  const eligible = (Object.entries(typeWeights) as [RewardType, number][])
    .filter(([type, w]) => w > 0 && REWARD_GENERATORS[type] && (allowConsumables || type !== 'consumable'))
    .map(([type, w]) => [type, DEBUG_SKILLS && type === 'skill' ? w * 10 : w] as [RewardType, number])
  const rewards: any[] = []
  for (let i = 0; i < REWARD_OPTIONS_PER_SCREEN; i++) {
    const rarity = rollRewardRarity(profile)
    let next: any = null,
      guard = 0
    do {
      const type = weightedRarity(eligible) as RewardType
      next = REWARD_GENERATORS[type]!(rarity)
    } while ((!next || rewards.some((r) => sameReward(r, next))) && guard++ < 30)
    if (next) rewards.push(next)
  }
  return [...rewards, goldReward()]
}
export function boostReward(targeted = true) {
  const boostStats = ALL_STAT_KEYS
  let reward
  if (boostTargetOptions({ stat: 'level' }).length && rnd() < 0.22) reward = levelBoostReward()
  else {
    const eligibleStats = boostStats.filter((stat) => boostTargetOptions({ stat }).length)
    const stat = pick(eligibleStats.length ? eligibleStats : boostStats)
    const amt = stat === 'hp' ? 7 : stat === 'lck' ? 4 : 2
    const label = stat === 'str' ? 'Str/Mag' : statLabel(null, stat)
    reward = { type: 'boost', title: `${boosterName(stat)}`, desc: `Permanently grants ${label} +${amt} to a chosen unit.`, stat, amt }
  }
  return targeted ? targetedBoostReward(reward) : reward
}
export function targetedBoostReward(r: any) {
  const targets = boostTargetOptions(r).filter(({ unit }) => !unitOnRewardCooldown(unit.id, 'boost'))
  if (!targets.length) return null
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
    return `Immediately levels up ${u.name} ${levelLabel(u)} ${SPD_ARROW} L${u.lvl + 1}.${growths}`
  }
  const label = statLabel(u, r.stat)
  const before = u.stats[r.stat]
  const after = Math.min(capStat(u, r.stat), before + r.amt)
  return `Permanently grants ${u.name} ${label} +${r.amt} (${before} ${SPD_ARROW} ${after}).${boostDetailHTML(r, u)}`
}
export function conBoostASText(r: any, u: Unit) {
  // A Con boost only changes attack speed by reducing a weapon's weight penalty, so this is
  // meaningless without an equipped weapon. Show the resulting AS plus the equipped weapon,
  // labelled "equipped" so it doesn't read like the weapon is being replaced.
  if (!u.weapon) return ''
  const before = attackSpeed(u)
  const after = weaponResultingAS(u, r.amt)
  const asText = before === after ? `AS ${after} (no change)` : `AS ${before} ${SPD_ARROW} ${after}`
  return `${asText}, ${u.weapon.name} (Wt ${u.weapon.wt}) equipped`
}
export function boostDetailHTML(r: any, u: Unit) {
  if (r.stat === 'con') {
    const as = conBoostASText(r, u)
    return as ? `<div class="small rewardMeta">${as}</div>` : ''
  }
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
    u.maxHp = computeMaxHp(u)
    u.hp = u.maxHp
  }
  return `${u.name} used ${boosterName(r.stat)}.`
}
