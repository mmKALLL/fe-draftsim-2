import { CONSUMABLE_SLOTS, SHOP_BOOST_OFFERS, SHOP_BOOST_PRICES, SHOP_CONSUMABLE_OFFERS, SHOP_CONSUMABLE_PRICES, SHOP_FORGE_PRICE, SHOP_HELD_ITEM_OFFERS, SHOP_SKILL_OFFERS, SHOP_SKILL_PRICES, SHOP_WEAPON_OFFERS, SHOP_WEAPON_PRICES } from '../config'
import { HELD_ITEMS, TEACHABLE_SKILLS, WEAPONS, weaponRarityLabel } from '../data'
import { setShopOpen } from './arenas'
import { consumableSummary, refreshMaxHp, statLabel, unitItems } from './combat'
import { beginNextBattle } from './game'
import { collapseForges, growthSummaryHTML, heldItemOfferDescription, heldItemOfferTitle, logLine, renderTeams, selectionChoiceHTML, skillOfferDescription, skillOfferTitle, weaponOfferDescription, weaponOfferTitle, weaponSummary } from './render'
import { applyBoostToUnit, boostDetailHTML, boostReward, boostTargetOptions, boosterName, canApplyBoost, consumableInventoryFull, firstEmptyConsumableSlot, heldItemRelevantToUnit, pickByRarity, pickRewardConsumable, pickRewardWeapon, recordRewardCooldown, rollShopRarity, skillTargets } from './rewards'
import { noteConsumablesGained, noteRewardChoice } from './stats'
import { addGold, formatGold, goldHTML, spendGold } from './state'
import { afterReward, chooseBoostTarget, closeModal, levelLabel, showModal } from './ui'
import { canEquipAsNewWeapon, cloneConsumable, cloneWeapon, forgeWeapon, isBasicWeapon } from './units'
import { $, capStat, rint } from './utils'
import { sim } from './sim'
import { slotCapacity, state } from './state'
import type { Unit, Weapon, Consumable, StatKey, ArenaFocus, ArenaEntry, ShopOffer } from '../types'

// Endless multi-slot grant (1T3CRjDJ): drop into a free skill/held-item slot, or when the unit is
// full let the player choose which existing entry to replace. onDone runs after the grant settles;
// onCancel only fires if the player backs out of the replace picker (free-slot grants never cancel).
export function grantToUnit(u: Unit, kind: 'skill' | 'heldItem', item: any, onDone: () => void, onCancel: () => void) {
  const arr: any[] = kind === 'skill' ? u.skills : u.heldItems
  const finalize = (idx: number) => {
    if (idx < 0) arr.push(item)
    else arr[idx] = item
    refreshMaxHp(u)
    onDone()
  }
  if (arr.length < slotCapacity()) return finalize(-1)
  const label = kind === 'skill' ? 'skill' : 'held item'
  let html = `<h2>${u.name}: ${label} slots full</h2><div class="small">Choose which ${label} to replace with ${item.name}.</div>`
  arr.forEach((cur, idx) => {
    html += selectionChoiceHTML(`Replace ${cur.name}`, cur.desc || '', `data-replace-slot="${idx}"`, 'Replace')
  })
  html += `<button id="cancelReplaceBtn">Cancel</button>`
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-replace-slot]').forEach((btn) => (btn.onclick = () => finalize(+btn.dataset.replaceSlot!)))
  $('cancelReplaceBtn').onclick = onCancel
}


export function shopWeaponPrice(w: Weapon) {
  const rank = String(w.rank || 'E').toUpperCase()
  return SHOP_WEAPON_PRICES[rank as keyof typeof SHOP_WEAPON_PRICES] || SHOP_WEAPON_PRICES.E
}
export function shopConsumablePrice(item: any) {
  return SHOP_CONSUMABLE_PRICES[(item.rarity || 'normal') as keyof typeof SHOP_CONSUMABLE_PRICES] || SHOP_CONSUMABLE_PRICES.normal
}
export function shopBoostPrice(r: any) {
  return SHOP_BOOST_PRICES[r.stat as keyof typeof SHOP_BOOST_PRICES] || 800
}
export function uniqueShopOffers(count: number, makeOffer: any, keyFn: any) {
  const offers = [],
    seen = new Set()
  let guard = 0
  while (offers.length < count && guard++ < 100) {
    const offer = makeOffer()
    if (!offer) break
    const key = keyFn(offer)
    if (seen.has(key)) continue
    seen.add(key)
    offers.push(offer)
  }
  return offers
}
export function shopWeaponPool() {
  return WEAPONS.filter((w) => !isBasicWeapon(w) && state.player.some((u) => canEquipAsNewWeapon(u, w)))
}
export function eligibleWeaponUsers(w: Weapon) {
  return state.player.filter((u) => canEquipAsNewWeapon(u, w))
}
export function shopWeaponOffer() {
  const pool = shopWeaponPool()
  if (!pool.length) return null
  const item = cloneWeapon(pickRewardWeapon(pool, rollShopRarity()) as Weapon)
  return {
    type: 'item',
    shopKind: 'weapon',
    title: item.name,
    desc: weaponOfferDescription(item, null, { action: 'Buy' }),
    item,
    price: shopWeaponPrice(item),
  }
}
export function shopConsumableOffer() {
  const item = pickRewardConsumable(rollShopRarity())
  return {
    type: 'consumable',
    shopKind: 'consumable',
    title: item.name,
    desc: consumableSummary(item),
    item,
    price: shopConsumablePrice(item),
  }
}
export function shopHeldItemPrice(item: any) {
  return item.price || SHOP_CONSUMABLE_PRICES[(item.rarity || 'normal') as keyof typeof SHOP_CONSUMABLE_PRICES] || 800
}
export function shopHeldItemPool() {
  return HELD_ITEMS.filter((item) => state.player.some((u) => !unitItems(u).some((i) => i.id === item.id) && heldItemRelevantToUnit(item, u)))
}
export function shopHeldItemOffer() {
  const chosen = pickByRarity(shopHeldItemPool(), rollShopRarity())
  if (!chosen) return null
  const item = { ...chosen }
  return {
    type: 'heldItem',
    shopKind: 'heldItem',
    title: item.name,
    desc: heldItemOfferDescription(item, null, { action: 'Buy', includeRarity: false }),
    item,
    price: shopHeldItemPrice(item),
  }
}
export function shopSkillPrice(skill: any) {
  const [min, max] = SHOP_SKILL_PRICES[(skill.rarity || 'normal') as keyof typeof SHOP_SKILL_PRICES] || SHOP_SKILL_PRICES.normal
  // Uniform pick among the 100-G steps within [min, max] inclusive.
  const lo = Math.ceil(min / 100),
    hi = Math.floor(max / 100)
  return (lo + rint(hi - lo + 1)) * 100
}
// Skills offerable in the shop: any teachable skill that at least one alive unit
// can learn right now (class-eligible, doesn't already know it, off the per-unit
// 'skill' reward cooldown). Mirrors skillTargets eligibility from skill rewards.
export function shopSkillPool() {
  return TEACHABLE_SKILLS.filter((skill) => skillTargets(skill).length)
}
export function shopSkillOffer() {
  const chosen = pickByRarity(
    shopSkillPool().map((skill) => ({ ...skill, rarity: skill.rarity })),
    rollShopRarity()
  )
  if (!chosen) return null
  const item = { ...chosen }
  return {
    type: 'skill',
    shopKind: 'skill',
    title: item.name,
    desc: skillOfferDescription(item, null, { action: 'Buy' }),
    item,
    price: shopSkillPrice(item),
  }
}
export function shopBoostOffer() {
  const boost = boostReward(false)
  boost.shopKind = 'boost'
  boost.price = shopBoostPrice(boost)
  return boost
}
export function shopForgeOffer() {
  return {
    type: 'forge',
    shopKind: 'forge',
    title: 'Weapon Forge',
    desc: 'Upgrade one equipped weapon: Mt +2, Hit +5.',
    price: SHOP_FORGE_PRICE,
  }
}
export function makeShopOffers() {
  return [
    ...uniqueShopOffers(SHOP_WEAPON_OFFERS, shopWeaponOffer, (offer: ShopOffer) => offer.item.name),
    ...uniqueShopOffers(SHOP_CONSUMABLE_OFFERS, shopConsumableOffer, (offer: ShopOffer) => offer.item.id),
    ...uniqueShopOffers(SHOP_BOOST_OFFERS, shopBoostOffer, (offer: ShopOffer) => offer.title),
    ...uniqueShopOffers(SHOP_HELD_ITEM_OFFERS, shopHeldItemOffer, (offer: ShopOffer) => offer.item.id),
    ...uniqueShopOffers(SHOP_SKILL_OFFERS, shopSkillOffer, (offer: ShopOffer) => offer.item.id),
    shopForgeOffer(),
  ]
}
export function shopOfferClass(offer: ShopOffer) {
  if (offer.type === 'gold') return ' reward-gold'
  return offer.item?.rarity ? ` reward-${offer.item.rarity}` : ''
}
export function shopOfferHTML(offer: ShopOffer, i: number) {
  const sold = !!offer.sold
  const affordable = state.gold >= offer.price
  const unavailable = offer.type === 'forge' && !forgeTargets().length
  const action = offer.type === 'forge' ? 'Forge' : 'Buy'
  const buttonLabel = sold ? 'Sold' : `${action} ${goldHTML(offer.price)}`
  const disabled = sold || !affordable || unavailable ? ' disabled' : ''
  const meta = `<div class="small rewardMeta">${goldHTML(offer.price)}</div>`
  return selectionChoiceHTML(offer.title, `${offer.desc}${meta}`, `data-shop-buy="${i}"${disabled}`, buttonLabel, shopOfferClass(offer), 'good', 'shopItem', 'small')
}
export function renderShop(message = '') {
  const groups = {
    weapon: state.shop.offers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'weapon'),
    heldItem: state.shop.offers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'heldItem'),
    skill: state.shop.offers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'skill'),
    consumable: state.shop.offers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'consumable'),
    boost: state.shop.offers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'boost'),
    forge: state.shop.offers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'forge'),
  }
  let html = `<div class="shopHeader"><div><h3>Welcome to the shop. What do you need? (Gold: ${goldHTML(state.gold)})</h3></div></div>`
  if (message) html += `<div class="notice">${message}</div>`

  // Read-only display of the player's current consumables; appended at the very bottom,
  // below the Leave shop button (see end of renderShop).
  const filledConsumables = state.consumables.filter(Boolean).length
  const consumableSlotsHtml = Array.from({ length: CONSUMABLE_SLOTS }, (_, i) => state.consumables[i] || null)
    .map((item, i) =>
      item
        ? `<div class="consumableSlot"><div class="small">${weaponRarityLabel(item.rarity)}</div><div class="name">${item.name}</div><div class="small">${consumableSummary(item)}</div></div>`
        : `<div class="consumableSlot empty"><div class="small">Slot ${i + 1}</div><div>Empty</div></div>`
    )
    .join('')
  const yourConsumablesPanel = `<section class="shopSection"><div class="row space"><h3>Your Consumables</h3><span class="badge">${filledConsumables}/${CONSUMABLE_SLOTS}</span></div><div class="consumableSlots">${consumableSlotsHtml}</div></section>`

  html += `<section class="shopSection"><h3>Weapons</h3>`
  html += `<div class="small shopSectionNote">Bought weapons can be equipped to anyone eligible to wield them.</div>`

  html += `<div class="shopRow shopWeapons">${groups.weapon.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`
  html += `<div class="shopLower"><section class="shopSection"><h3>Held Items</h3><div class="small shopSectionNote">Held items go to a chosen unit — filling a free slot, or replacing one you pick when full.</div><div class="shopRow">${groups.heldItem.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`
  html += `<section class="shopSection"><h3>Skills</h3><div class="small shopSectionNote">Skills are taught to a chosen unit — filling a free slot, or replacing one you pick when full.</div><div class="shopRow">${groups.skill.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section></div>`
  html += `<div class="shopLower"><section class="shopSection"><h3>Consumables</h3><div class="shopRow">${groups.consumable.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`
  html += `<section class="shopSection"><h3>Stat Boosters</h3><div class="shopRow">${groups.boost.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section></div>`
  html += `<section class="shopSection"><h3>Forge</h3><div class="shopRow">${groups.forge.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`

  html += `<div class="row space shopActions"><button id="leaveShopBtn" class="primary">Leave shop</button></div>`
  html += yourConsumablesPanel

  setShopOpen(true)
  $('shopScreen').innerHTML = html
  $('shopScreen')
    .querySelectorAll<HTMLElement>('[data-shop-buy]')
    .forEach((btn) => (btn.onclick = () => buyShopOffer(+btn.dataset.shopBuy!)))
  $('leaveShopBtn').onclick = leaveShop
}
export function startShop() {
  state.ui.awaitingReward = true
  // Headless sim: don't render the shop, just walk straight back out. leaveShop() clears
  // awaitingReward, closes the (unopened) modal, and chains into beginNextBattle as normal.
  if (sim.active) {
    leaveShop()
    return
  }
  state.shop.offers = makeShopOffers()
  renderTeams()
  renderShop("You browse the store's fine selection...")
}
export function leaveShop() {
  closeModal()
  state.ui.awaitingReward = false
  state.shop.offers = []
  setShopOpen(false)
  logLine(null, `Left the shop with ${formatGold(state.gold)}.`, 'goldLog')
  renderTeams()
  beginNextBattle()
}
const GOLD_TYPE_LABEL: Record<string, string> = { item: 'Weapon', heldItem: 'Held item', skill: 'Skill', forge: 'Forge', consumable: 'Consumable', boost: 'Booster' }
// Single pay choke-point: deduct gold and, on success, tally the spend by item-type label for run stats.
function payForOffer(offer: ShopOffer): boolean {
  if (!spendGold(offer.price)) return false
  const label = GOLD_TYPE_LABEL[offer.type] || offer.type
  state.run.goldByType[label] = (state.run.goldByType[label] || 0) + offer.price
  return true
}
export function buyShopOffer(i: number) {
  const offer = state.shop.offers[i]
  if (!offer || offer.sold) return
  if (state.gold < offer.price) {
    renderShop(`Not enough gold for ${offer.title}.`)
    return
  }
  if (offer.type === 'item') {
    chooseShopWeaponTarget(i)
    return
  }
  if (offer.type === 'heldItem') {
    chooseShopHeldItemTarget(i)
    return
  }
  if (offer.type === 'skill') {
    chooseShopSkillTarget(i)
    return
  }
  if (offer.type === 'forge') {
    chooseShopForgeTarget(i)
    return
  }
  if (offer.type === 'consumable') {
    if (consumableInventoryFull()) {
      chooseShopConsumableReplacement(i)
      return
    }
    payForOffer(offer)
    storeConsumable(offer.item)
    offer.sold = true
    renderShop(`Stored ${offer.item.name}.`)
    return
  }
  if (offer.type === 'boost') {
    chooseShopBoostTarget(i)
  }
}
export function forgeTargets() {
  return state.player.filter((u) => u.weapon && !u.weapon.staff)
}
export function forgePreview(w: Weapon) {
  const preview = cloneWeapon(w)
  forgeWeapon(preview)
  return preview
}
export function chooseShopForgeTarget(i: number) {
  const offer = state.shop.offers[i]
  const eligible = forgeTargets()
  if (!eligible.length) {
    renderShop('No eligible equipped weapon to forge.')
    return
  }
  let html = `<h2>Weapon Forge: choose weapon</h2><div class="small">Cost ${goldHTML(offer.price)}. Upgrades Mt +2 and Hit +5.</div>`
  eligible.forEach((u, idx) => {
    const preview = forgePreview(u.weapon)
    html += `<div class="choice"><div><h4>${u.name}: ${collapseForges(u.weapon.name)} -> ${collapseForges(preview.name)}</h4><div>${weaponSummary(u.weapon)} -> ${weaponSummary(preview)}</div></div><button data-shop-forge-target="${idx}" class="good">Forge</button></div>`
  })
  html += '<button id="cancelShopForgeBtn">Cancel</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-shop-forge-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = eligible[+btn.dataset.shopForgeTarget!]
        if (!u?.weapon || u.weapon.staff) {
          closeModal()
          renderShop('That weapon cannot be forged.')
          return
        }
        if (!payForOffer(offer)) {
          closeModal()
          renderShop('Not enough gold for the weapon forge.')
          return
        }
        const oldName = collapseForges(u.weapon.name)
        forgeWeapon(u.weapon)
        offer.sold = true
        closeModal()
        renderTeams()
        renderShop(`${u.name}'s ${oldName} was forged into ${collapseForges(u.weapon.name)}.`)
      })
  )
  $('cancelShopForgeBtn').onclick = closeModal
}
export function chooseShopHeldItemTarget(i: number) {
  const offer = state.shop.offers[i]
  const eligible = state.player.filter((u) => heldItemRelevantToUnit(offer.item, u))
  if (!eligible.length) {
    renderShop(`No eligible holder for ${offer.item.name}.`)
    return
  }
  let html = `<h2>${offer.item.name}: choose holder</h2><div class="small">Cost ${goldHTML(offer.price)}. ${offer.item.desc}</div>`
  eligible.forEach((u, idx) => {
    html += selectionChoiceHTML(heldItemOfferTitle(offer.item, u), heldItemOfferDescription(offer.item, u, { includeRarity: false }), `data-shop-held-target="${idx}"`, 'Give')
  })
  html += '<button id="cancelShopHeldBtn">Cancel</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-shop-held-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = eligible[+btn.dataset.shopHeldTarget!]
        if (!payForOffer(offer)) {
          closeModal()
          renderShop(`Not enough gold for ${offer.item.name}.`)
          return
        }
        grantToUnit(
          u,
          'heldItem',
          { ...offer.item },
          () => {
            offer.sold = true
            closeModal()
            renderTeams()
            renderShop(`${u.name} received ${offer.item.name}.`)
          },
          () => {
            addGold(offer.price) // refund: they backed out of replacing a full slot
            closeModal()
            renderShop(`Kept ${u.name}'s items; refunded ${offer.item.name}.`)
          }
        )
      })
  )
  $('cancelShopHeldBtn').onclick = closeModal
}
export function chooseShopSkillTarget(i: number) {
  const offer = state.shop.offers[i]
  const eligible = skillTargets(offer.item)
  if (!eligible.length) {
    renderShop(`No eligible unit can learn ${offer.item.name}.`)
    return
  }
  let html = `<h2>${offer.item.name}: choose student</h2><div class="small">Cost ${goldHTML(offer.price)}. ${offer.item.desc}</div>`
  eligible.forEach((u, idx) => {
    html += selectionChoiceHTML(skillOfferTitle(offer.item, u), skillOfferDescription(offer.item, u), `data-shop-skill-target="${idx}"`, 'Teach')
  })
  html += '<button id="cancelShopSkillBtn">Cancel</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-shop-skill-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = eligible[+btn.dataset.shopSkillTarget!]
        if (!payForOffer(offer)) {
          closeModal()
          renderShop(`Not enough gold for ${offer.item.name}.`)
          return
        }
        grantToUnit(
          u,
          'skill',
          { ...offer.item },
          () => {
            recordRewardCooldown(u.id, 'skill')
            offer.sold = true
            closeModal()
            renderTeams()
            renderShop(`${u.name} learned ${offer.item.name}.`)
          },
          () => {
            addGold(offer.price) // refund: they backed out of replacing a full slot
            closeModal()
            renderShop(`Kept ${u.name}'s skills; refunded ${offer.item.name}.`)
          }
        )
      })
  )
  $('cancelShopSkillBtn').onclick = closeModal
}
export function chooseShopWeaponTarget(i: number) {
  const offer = state.shop.offers[i],
    eligible = eligibleWeaponUsers(offer.item)
  if (!eligible.length) {
    renderShop(`No eligible wielder for ${offer.item.name}.`)
    return
  }
  let html = `<h2>${offer.item.name}: choose wielder</h2><div class="small">Cost ${goldHTML(offer.price)}. ${weaponOfferDescription(offer.item, null, { action: 'Buy', includeRarity: false })}</div>`
  eligible.forEach((u, idx) => {
    html += selectionChoiceHTML(weaponOfferTitle(offer.item, u), weaponOfferDescription(offer.item, u, { includeRarity: false }), `data-shop-weapon-target="${idx}"`, 'Equip')
  })
  html += '<button id="cancelShopWeaponBtn">Cancel</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-shop-weapon-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = eligible[+btn.dataset.shopWeaponTarget!]
        if (!payForOffer(offer)) {
          closeModal()
          renderShop(`Not enough gold for ${offer.item.name}.`)
          return
        }
        u.weapon = cloneWeapon(offer.item)
        offer.sold = true
        closeModal()
        renderTeams()
        renderShop(`${u.name} equipped ${offer.item.name}.`)
      })
  )
  $('cancelShopWeaponBtn').onclick = closeModal
}
export function chooseShopConsumableReplacement(i: number) {
  const offer = state.shop.offers[i]
  let html = `<h2>${offer.item.name}: choose slot</h2><div class="small">Cost ${goldHTML(offer.price)}. ${consumableSummary(offer.item)}</div>`
  state.consumables.forEach((item, slot) => {
    html += `<div class="choice"><div><h4>Slot ${slot + 1}: ${item?.name ?? 'Empty'}</h4><div>${consumableSummary(item)}</div></div><button data-shop-replace-consumable="${slot}" class="good">Replace</button></div>`
  })
  html += '<button id="backToShopBtn">Back</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-shop-replace-consumable]').forEach(
    (btn) =>
      (btn.onclick = () => {
        if (!payForOffer(offer)) {
          closeModal()
          renderShop(`Not enough gold for ${offer.item.name}.`)
          return
        }
        storeConsumable(offer.item, +btn.dataset.shopReplaceConsumable!)
        offer.sold = true
        closeModal()
        renderShop(`Stored ${offer.item.name}.`)
      })
  )
  $('backToShopBtn').onclick = closeModal
}
export function chooseShopBoostTarget(i: number) {
  const offer = state.shop.offers[i]
  const targets = boostTargetOptions(offer)
  if (!targets.length) {
    closeModal()
    renderShop(`No eligible target for ${boosterName(offer.stat)}.`)
    return
  }
  let html = `<h2>${boosterName(offer.stat)}: choose target</h2><div class="small">Cost ${goldHTML(offer.price)}.</div>`
  targets.forEach(({ unit: u, index: idx }) => {
    const before = offer.stat === 'level' ? levelLabel(u) : u.stats[offer.stat]
    const after = offer.stat === 'level' ? (canApplyBoost(offer, u) ? '+1 level' : levelLabel(u)) : Math.min(capStat(u, offer.stat), u.stats[offer.stat] + offer.amt)
    const label = offer.stat === 'level' ? 'Level' : statLabel(u, offer.stat)
    const growths = offer.stat === 'level' ? ` ${growthSummaryHTML(u)}` : ''
    const details = boostDetailHTML(offer, u)
    html += `<div class="choice"><div>${u.name}: ${label} ${before} -> ${after}${growths}${details}</div><button data-shop-boost-target="${idx}">Use</button></div>`
  })
  html += '<button id="backToShopBtn">Back</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-shop-boost-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = state.player[+btn.dataset.shopBoostTarget!]
        if (!canApplyBoost(offer, u)) {
          closeModal()
          renderShop(`${u.name} cannot use ${boosterName(offer.stat)}.`)
          return
        }
        if (!payForOffer(offer)) {
          closeModal()
          renderShop(`Not enough gold for ${boosterName(offer.stat)}.`)
          return
        }
        const msg = applyBoostToUnit(offer, u)
        offer.sold = true
        closeModal()
        renderTeams()
        renderShop(msg)
      })
  )
  $('backToShopBtn').onclick = closeModal
}
export function storeConsumable(item: any, slot = firstEmptyConsumableSlot()) {
  const targetSlot = slot >= 0 ? slot : 0
  state.consumables[targetSlot] = cloneConsumable(item)
  // Every mid-run acquisition (shop buy + reward grant, empty slot or replacement) routes through here;
  // count it for run stats. The initial roster seed is assigned directly in startRun(), not via this.
  noteConsumablesGained()
  renderTeams()
  return targetSlot
}
export function chooseConsumableReplacement(r: any, backToRewards: (() => void) | null = null) {
  let html = `<h2>${r.item.name}: choose slot</h2><div class="small">${consumableSummary(r.item)}</div>`
  state.consumables.forEach((item, i) => {
    html += `<div class="choice"><div><h4>Slot ${i + 1}: ${item?.name ?? 'Empty'}</h4><div>${consumableSummary(item)}</div></div><button data-replace-consumable="${i}" class="good">Replace</button></div>`
  })
  if (backToRewards) html += '<button id="backToRewardBtn">Back</button>'
  showModal(html)
  document.querySelectorAll<HTMLElement>('[data-replace-consumable]').forEach(
    (btn) =>
      (btn.onclick = () => {
        storeConsumable(r.item, +btn.dataset.replaceConsumable!)
        noteRewardChoice(r)
        closeModal()
        afterReward(`Stored ${r.item.name}.`)
      })
  )
  if (backToRewards) {
    const backBtn = $('backToRewardBtn')
    if (backBtn) backBtn.onclick = backToRewards
  }
}
export function applyReward(r: any, backToRewards: (() => void) | null = null) {
  if (r.type === 'item') {
    r.unit.weapon = r.item
    recordRewardCooldown(r.unit.id, 'item')
    noteRewardChoice(r)
    closeModal()
    afterReward(`${r.unit.name} equipped ${r.item.name}.`)
  }
  if (r.type === 'heldItem') {
    grantToUnit(
      r.unit,
      'heldItem',
      r.item,
      () => {
        recordRewardCooldown(r.unit.id, 'heldItem')
        noteRewardChoice(r)
        closeModal()
        afterReward(`${r.unit.name} received ${r.item.name}.`)
      },
      backToRewards || closeModal
    )
  }
  if (r.type === 'skill') {
    grantToUnit(
      r.unit,
      'skill',
      r.item,
      () => {
        recordRewardCooldown(r.unit.id, 'skill')
        noteRewardChoice(r)
        closeModal()
        afterReward(`${r.unit.name} learned ${r.item.name}.`)
      },
      backToRewards || closeModal
    )
  }
  if (r.type === 'consumable') {
    if (consumableInventoryFull()) {
      // Deferred: the replacement chooser tallies at its success point (cancelling must not count).
      chooseConsumableReplacement(r, backToRewards)
      return
    }
    storeConsumable(r.item)
    noteRewardChoice(r)
    closeModal()
    afterReward(`Stored ${r.item.name}.`)
  }
  if (r.type === 'gold') {
    addGold(r.gold)
    noteRewardChoice(r)
    closeModal()
    afterReward(`Took ${formatGold(r.gold)}.`, 'goldLog')
  }
  if (r.type === 'boost') {
    if (r.unit) {
      if (!canApplyBoost(r, r.unit)) {
        if (backToRewards) backToRewards()
        return
      }
      const msg = applyBoostToUnit(r, r.unit)
      recordRewardCooldown(r.unit.id, 'boost')
      noteRewardChoice(r)
      closeModal()
      afterReward(msg)
      return
    }
    // Deferred: the boost target chooser tallies at its success point (cancelling must not count).
    chooseBoostTarget(r, backToRewards)
  }
}
