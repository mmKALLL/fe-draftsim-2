'use strict'

function showRewards(opening = false) {
  awaitingReward = true
  const bossTier = opening ? null : bossTierForBattle(battle)
  const rewards = makeRewards(bossTier, opening)
  const title = opening ? 'Choose an opening reward' : 'Choose a reward'
  renderRewardSelection(title, rewards)
}
function renderRewardSelection(title, rewards) {
  const skipReward = rewards.find((r) => r.type === 'gold')
  const choiceRewards = rewards.filter((r) => r.type !== 'gold')
  let html = `<h2>${title}</h2><div class="rewardGrid">`
  choiceRewards.forEach((r, i) => {
    const rewardClass = r.item?.tier ? ` reward-${r.item.tier || 'normal'}` : ''
    html += selectionChoiceHTML(r.title, r.desc, `data-i="${i}"`, 'Choose', rewardClass)
  })
  html += '</div>'
  if (skipReward) html += `<div class="rewardSkipWrap"><button data-skip-reward class="rewardSkip">Skip reward: gain ${goldHTML(skipReward.gold)}</button></div>`
  showModal(html)
  document.querySelectorAll('[data-i]').forEach((btn) => (btn.onclick = () => applyReward(choiceRewards[+btn.dataset.i], () => renderRewardSelection(title, rewards))))
  const skipBtn = document.querySelector('[data-skip-reward]')
  if (skipBtn) skipBtn.onclick = () => applyReward(skipReward)
}

function isGoodRewardWeapon(w) {
  return w.tier !== 'normal'
}
function rewardsExcludeRare() {
  return battle < REWARD_RARE_LOCKED_UNTIL_BATTLE
}
function isNonRareRewardItem(item) {
  return item.tier !== 'rare'
}
function rewardWeaponPool(u, goodOnly = false) {
  const opts = WEAPONS.filter((w) => canEquipAsNewWeapon(u, w))
  if (rewardsExcludeRare()) return opts.filter(isNonRareRewardItem)
  if (!goodOnly) return opts
  const good = opts.filter(isGoodRewardWeapon)
  return good.length ? good : opts
}
function fallbackRewardWeaponPool(goodOnly = false) {
  if (rewardsExcludeRare()) return WEAPONS.filter(isNonRareRewardItem)
  if (!goodOnly) return WEAPONS
  const good = WEAPONS.filter(isGoodRewardWeapon)
  return good.length ? good : WEAPONS
}
function rewardConsumablePool(goodOnly = false) {
  if (rewardsExcludeRare()) return CONSUMABLES.filter(isNonRareRewardItem)
  if (!goodOnly) return CONSUMABLES
  const good = CONSUMABLES.filter((item) => item.tier !== 'normal')
  return good.length ? good : CONSUMABLES
}
function weightedTier(weights) {
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = rnd() * total
  for (const [tier, weight] of weights) {
    roll -= weight
    if (roll <= 0) return tier
  }
  return weights[weights.length - 1][0]
}
function completedRewardFights() {
  return Math.max(0, battle)
}
function rewardTierWeights(weightSet, goodOnly = false) {
  if (goodOnly) return rewardsExcludeRare() ? weightSet.good.filter(([tier]) => tier !== 'rare') : weightSet.good
  const fights = completedRewardFights()
  const weights = weightSet.normal.map(([tier, weight]) => {
    if (tier === 'uncommon') return [tier, weight + fights * 2]
    if (tier === 'rare') return [tier, weight + fights]
    return [tier, weight]
  })
  return rewardsExcludeRare() ? weights.filter(([tier]) => tier !== 'rare') : weights
}
function pickRewardWeapon(opts, goodOnly = false) {
  const weights = rewardTierWeights(WEAPON_TIER_WEIGHTS, goodOnly)
  for (let i = 0; i < 8; i++) {
    const tier = weightedTier(weights)
    const tierOpts = opts.filter((w) => w.tier === tier)
    if (tierOpts.length) return pick(tierOpts)
  }
  return pick(opts)
}
function pickRewardConsumable(goodOnly = false) {
  const pool = rewardConsumablePool(goodOnly)
  const weights = rewardTierWeights(CONSUMABLE_TIER_WEIGHTS, goodOnly)
  for (let i = 0; i < 8; i++) {
    const tier = weightedTier(weights)
    const tierOpts = pool.filter((item) => item.tier === tier)
    if (tierOpts.length) return cloneConsumable(pick(tierOpts))
  }
  return cloneConsumable(pick(pool.length ? pool : CONSUMABLES))
}
function weaponReward(goodOnly = false) {
  const candidates = player.filter((u) => u.hp > 0 && rewardWeaponPool(u, goodOnly).length)
  const itemUnit = pick(candidates.length ? candidates : player)
  const opts = rewardWeaponPool(itemUnit, goodOnly)
  const item = cloneWeapon(pickRewardWeapon(opts.length ? opts : fallbackRewardWeaponPool(goodOnly), goodOnly))
  return {
    type: 'item',
    title: weaponOfferTitle(item, itemUnit),
    desc: weaponOfferDescription(item, itemUnit),
    unit: itemUnit,
    item,
  }
}
function firstEmptyConsumableSlot() {
  return consumables.findIndex((item) => !item)
}
function consumableInventoryFull() {
  return firstEmptyConsumableSlot() === -1
}
function consumableReward(goodOnly = false) {
  const item = pickRewardConsumable(goodOnly)
  const slotText = consumableInventoryFull() ? 'Inventory full: choose a slot to replace.' : 'Stored in the first empty consumable slot.'
  const meta = `<div class="small rewardMeta">${weaponTierLabel(item.tier)} · ${slotText}</div>`
  return { type: 'consumable', title: `${item.name}`, desc: `Usable: ${consumableSummary(item)}${meta}`, item }
}
function goldReward(amount = REWARD_SKIP_GOLD) {
  return {
    type: 'gold',
    title: `Skip reward: gain ${formatGold(amount)}`,
    desc: '',
    gold: amount,
  }
}
function sameReward(a, b) {
  if (a.type !== b.type) return false
  if (a.type === 'item') return a.unit === b.unit && a.item.name === b.item.name
  if (a.type === 'consumable') return a.item.id === b.item.id
  return false
}
function makeRewards(bossTier = null, opening = false) {
  const weaponCount = 2
  const goodOnly = bossTier === BOSS_TIER_BIOME
  const allowConsumables = opening || !bossTier
  const weaponRewards = []
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
function boostReward(targeted = true) {
  const boostStats = ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res', 'con']
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
function targetedBoostReward(r) {
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
function boostRewardDescription(r, u) {
  if (r.stat === 'level') {
    const growths = `<div class="small rewardMeta">Growths ${growthSummaryHTML(u)}</div>`
    return `Immediately levels up ${u.name} ${levelLabel(u)} -> L${u.lvl + 1}.${growths}`
  }
  const label = statLabel(u, r.stat)
  const before = u.stats[r.stat]
  const after = Math.min(capStat(u, r.stat), before + r.amt)
  return `Permanently grants ${u.name} ${label} +${r.amt} (${before} -> ${after}).${boostDetailHTML(r, u)}`
}
function equippedWeaponWeightText(u) {
  return u.weapon ? `Equipped: ${u.weapon.name}, Wt ${u.weapon.wt || 0}` : 'Equipped: none'
}
function boostDetailHTML(r, u) {
  if (r.stat === 'con') return `<div class="small rewardMeta">${equippedWeaponWeightText(u)}</div>`
  return ''
}
function levelBoostReward() {
  return {
    type: 'boost',
    stat: 'level',
    amt: 1,
    title: 'Tome of Knowledge',
    desc: 'Immediately gives a chosen unit +1 level.',
  }
}
function boosterName(stat) {
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
function canApplyBoost(r, u) {
  if (r.stat === 'level') return !(u.promoted && u.lvl >= 20)
  return u.stats[r.stat] < capStat(u, r.stat)
}
function boostTargetOptions(r) {
  return player.map((unit, index) => ({ unit, index })).filter(({ unit }) => canApplyBoost(r, unit))
}
function applyBoostToUnit(r, u) {
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
