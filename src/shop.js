'use strict'

function shopWeaponPrice(w) {
  const rank = String(w.rank || 'E').toUpperCase()
  return SHOP_WEAPON_PRICES[rank] || SHOP_WEAPON_PRICES.E
}
function shopConsumablePrice(item) {
  return SHOP_CONSUMABLE_PRICES[item.tier || 'normal'] || SHOP_CONSUMABLE_PRICES.normal
}
function shopBoostPrice(r) {
  return SHOP_BOOST_PRICES[r.stat] || 800
}
function uniqueShopOffers(count, makeOffer, keyFn) {
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
function shopWeaponPool() {
  return WEAPONS.filter((w) => player.some((u) => canEquipAsNewWeapon(u, w)))
}
function eligibleWeaponUsers(w) {
  return player.filter((u) => canEquipAsNewWeapon(u, w))
}
function shopWeaponOffer() {
  const pool = shopWeaponPool()
  if (!pool.length) return null
  const item = cloneWeapon(pickRewardWeapon(pool, false))
  return {
    type: 'item',
    shopKind: 'weapon',
    title: item.name,
    desc: weaponOfferDescription(item, null, { action: 'Buy' }),
    item,
    price: shopWeaponPrice(item),
  }
}
function shopConsumableOffer() {
  const item = pickRewardConsumable(false)
  return {
    type: 'consumable',
    shopKind: 'consumable',
    title: item.name,
    desc: consumableSummary(item),
    item,
    price: shopConsumablePrice(item),
  }
}
function shopBoostOffer() {
  const boost = boostReward(false)
  boost.shopKind = 'boost'
  boost.price = shopBoostPrice(boost)
  return boost
}
function shopForgeOffer() {
  return {
    type: 'forge',
    shopKind: 'forge',
    title: 'Weapon Forge',
    desc: 'Upgrade one equipped weapon: Mt +2, Hit +5.',
    price: SHOP_FORGE_PRICE,
  }
}
function makeShopOffers() {
  return [
    ...uniqueShopOffers(5, shopWeaponOffer, (offer) => offer.item.name),
    ...uniqueShopOffers(3, shopConsumableOffer, (offer) => offer.item.id),
    ...uniqueShopOffers(3, shopBoostOffer, (offer) => offer.title),
    shopForgeOffer(),
  ]
}
function shopOfferClass(offer) {
  if (offer.type === 'gold') return ' reward-gold'
  return offer.item?.tier ? ` reward-${offer.item.tier}` : ''
}
function shopOfferHTML(offer, i) {
  const sold = !!offer.sold
  const affordable = gold >= offer.price
  const unavailable = offer.type === 'forge' && !forgeTargets().length
  const action = offer.type === 'forge' ? 'Forge' : 'Buy'
  const buttonLabel = sold ? 'Sold' : `${action} ${goldHTML(offer.price)}`
  const disabled = sold || !affordable || unavailable ? ' disabled' : ''
  const meta = `<div class="small rewardMeta">${goldHTML(offer.price)}</div>`
  return selectionChoiceHTML(offer.title, `${offer.desc}${meta}`, `data-shop-buy="${i}"${disabled}`, buttonLabel, shopOfferClass(offer), 'good', 'shopItem', 'small')
}
function renderShop(message = '') {
  const groups = {
    weapon: shopOffers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'weapon'),
    consumable: shopOffers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'consumable'),
    boost: shopOffers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'boost'),
    forge: shopOffers.map((offer, i) => ({ offer, i })).filter(({ offer }) => offer.shopKind === 'forge'),
  }
  let html = `<div class="shopHeader"><div><h3>Welcome to the shop. What do you need? (Gold: ${goldHTML(gold)})</h3></div></div>`
  if (message) html += `<div class="notice">${message}</div>`

  html += `<section class="shopSection"><h3>Weapons</h3>`
  html += `<div class="small shopSectionNote">Bought weapons can be equipped to anyone eligible to wield them.</div>`

  html += `<div class="shopRow shopWeapons">${groups.weapon.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`
  html += `<div class="shopLower"><section class="shopSection"><h3>Consumables</h3><div class="shopRow">${groups.consumable.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`
  html += `<section class="shopSection"><h3>Stat Boosters</h3><div class="shopRow">${groups.boost.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section></div>`
  html += `<section class="shopSection"><h3>Forge</h3><div class="shopRow">${groups.forge.map(({ offer, i }) => shopOfferHTML(offer, i)).join('')}</div></section>`

  html += `<div class="row space shopActions"><button id="leaveShopBtn" class="primary">Leave shop</button></div>`

  setShopOpen(true)
  $('shopScreen').innerHTML = html
  $('shopScreen')
    .querySelectorAll('[data-shop-buy]')
    .forEach((btn) => (btn.onclick = () => buyShopOffer(+btn.dataset.shopBuy)))
  $('leaveShopBtn').onclick = leaveShop
}
function startShop() {
  awaitingReward = true
  shopOffers = makeShopOffers()
  renderTeams()
  renderShop("You browse the store's fine selection...")
}
function leaveShop() {
  closeModal()
  awaitingReward = false
  shopOffers = []
  setShopOpen(false)
  logLine(null, `Left the shop with ${formatGold(gold)}.`, 'goldLog')
  renderTeams()
  beginNextBattle()
}
function buyShopOffer(i) {
  const offer = shopOffers[i]
  if (!offer || offer.sold) return
  if (gold < offer.price) {
    renderShop(`Not enough gold for ${offer.title}.`)
    return
  }
  if (offer.type === 'item') {
    chooseShopWeaponTarget(i)
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
    spendGold(offer.price)
    storeConsumable(offer.item)
    offer.sold = true
    renderShop(`Stored ${offer.item.name}.`)
    return
  }
  if (offer.type === 'boost') {
    chooseShopBoostTarget(i)
  }
}
function forgeTargets() {
  return player.filter((u) => u.weapon && !u.weapon.staff)
}
function forgePreview(w) {
  const preview = cloneWeapon(w)
  forgeWeapon(preview)
  return preview
}
function chooseShopForgeTarget(i) {
  const offer = shopOffers[i]
  const eligible = forgeTargets()
  if (!eligible.length) {
    renderShop('No eligible equipped weapon to forge.')
    return
  }
  let html = `<h2>Weapon Forge: choose weapon</h2><div class="small">Cost ${goldHTML(offer.price)}. Upgrades Mt +2 and Hit +5.</div>`
  eligible.forEach((u, idx) => {
    const preview = forgePreview(u.weapon)
    html += `<div class="choice"><div><h4>${u.name}: ${u.weapon.name} -> ${preview.name}</h4><div>${weaponSummary(u.weapon)} -> ${weaponSummary(preview)}</div></div><button data-shop-forge-target="${idx}" class="good">Forge</button></div>`
  })
  html += '<button id="cancelShopForgeBtn">Cancel</button>'
  showModal(html)
  document.querySelectorAll('[data-shop-forge-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = eligible[+btn.dataset.shopForgeTarget]
        if (!u?.weapon || u.weapon.staff) {
          closeModal()
          renderShop('That weapon cannot be forged.')
          return
        }
        if (!spendGold(offer.price)) {
          closeModal()
          renderShop('Not enough gold for the weapon forge.')
          return
        }
        const oldName = u.weapon.name
        forgeWeapon(u.weapon)
        offer.sold = true
        closeModal()
        renderTeams()
        renderShop(`${u.name}'s ${oldName} was forged into ${u.weapon.name}.`)
      })
  )
  $('cancelShopForgeBtn').onclick = closeModal
}
function chooseShopWeaponTarget(i) {
  const offer = shopOffers[i],
    eligible = eligibleWeaponUsers(offer.item)
  if (!eligible.length) {
    renderShop(`No eligible wielder for ${offer.item.name}.`)
    return
  }
  let html = `<h2>${offer.item.name}: choose wielder</h2><div class="small">Cost ${goldHTML(offer.price)}. ${weaponOfferDescription(offer.item, null, { action: 'Buy', includeTier: false })}</div>`
  eligible.forEach((u, idx) => {
    html += selectionChoiceHTML(weaponOfferTitle(offer.item, u), weaponOfferDescription(offer.item, u, { includeTier: false }), `data-shop-weapon-target="${idx}"`, 'Equip')
  })
  html += '<button id="cancelShopWeaponBtn">Cancel</button>'
  showModal(html)
  document.querySelectorAll('[data-shop-weapon-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = eligible[+btn.dataset.shopWeaponTarget]
        if (!spendGold(offer.price)) {
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
function chooseShopConsumableReplacement(i) {
  const offer = shopOffers[i]
  let html = `<h2>${offer.item.name}: choose slot</h2><div class="small">Cost ${goldHTML(offer.price)}. ${consumableSummary(offer.item)}</div>`
  consumables.forEach((item, slot) => {
    html += `<div class="choice"><div><h4>Slot ${slot + 1}: ${item.name}</h4><div>${consumableSummary(item)}</div></div><button data-shop-replace-consumable="${slot}" class="good">Replace</button></div>`
  })
  html += '<button id="backToShopBtn">Back</button>'
  showModal(html)
  document.querySelectorAll('[data-shop-replace-consumable]').forEach(
    (btn) =>
      (btn.onclick = () => {
        if (!spendGold(offer.price)) {
          closeModal()
          renderShop(`Not enough gold for ${offer.item.name}.`)
          return
        }
        storeConsumable(offer.item, +btn.dataset.shopReplaceConsumable)
        offer.sold = true
        closeModal()
        renderShop(`Stored ${offer.item.name}.`)
      })
  )
  $('backToShopBtn').onclick = closeModal
}
function chooseShopBoostTarget(i) {
  const offer = shopOffers[i]
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
  document.querySelectorAll('[data-shop-boost-target]').forEach(
    (btn) =>
      (btn.onclick = () => {
        const u = player[+btn.dataset.shopBoostTarget]
        if (!canApplyBoost(offer, u)) {
          closeModal()
          renderShop(`${u.name} cannot use ${boosterName(offer.stat)}.`)
          return
        }
        if (!spendGold(offer.price)) {
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
function storeConsumable(item, slot = firstEmptyConsumableSlot()) {
  const targetSlot = slot >= 0 ? slot : 0
  consumables[targetSlot] = cloneConsumable(item)
  renderTeams()
  return targetSlot
}
function chooseConsumableReplacement(r, backToRewards = null) {
  let html = `<h2>${r.item.name}: choose slot</h2><div class="small">${consumableSummary(r.item)}</div>`
  consumables.forEach((item, i) => {
    html += `<div class="choice"><div><h4>Slot ${i + 1}: ${item.name}</h4><div>${consumableSummary(item)}</div></div><button data-replace-consumable="${i}" class="good">Replace</button></div>`
  })
  if (backToRewards) html += '<button id="backToRewardBtn">Back</button>'
  showModal(html)
  document.querySelectorAll('[data-replace-consumable]').forEach(
    (btn) =>
      (btn.onclick = () => {
        storeConsumable(r.item, +btn.dataset.replaceConsumable)
        closeModal()
        afterReward(`Stored ${r.item.name}.`)
      })
  )
  if (backToRewards) {
    const backBtn = $('backToRewardBtn')
    if (backBtn) backBtn.onclick = backToRewards
  }
}
function applyReward(r, backToRewards = null) {
  if (r.type === 'item') {
    r.unit.weapon = r.item
    closeModal()
    afterReward(`${r.unit.name} equipped ${r.item.name}.`)
  }
  if (r.type === 'consumable') {
    if (consumableInventoryFull()) {
      chooseConsumableReplacement(r, backToRewards)
      return
    }
    storeConsumable(r.item)
    closeModal()
    afterReward(`Stored ${r.item.name}.`)
  }
  if (r.type === 'gold') {
    addGold(r.gold)
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
      closeModal()
      afterReward(msg)
      return
    }
    chooseBoostTarget(r, backToRewards)
  }
}
