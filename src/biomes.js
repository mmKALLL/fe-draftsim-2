'use strict'

function shuffledCopy(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rint(i + 1)
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}
function makeBiomePlan() {
  const pool = shuffledCopy(BIOMES)
  return Array.from({ length: BIOME_CYCLES_PER_RUN }, (_, i) => {
    const biome = pool[i % pool.length]
    return { biome, bossFocus: shuffledCopy(biome.focus) }
  })
}
function biomeIndexForBattle(n = battle || 1) {
  return clamp(Math.floor((Math.max(1, n) - 1) / BIOME_CYCLE_LENGTH), 0, Math.max(0, biomePlan.length - 1))
}
function biomeEntryForBattle(n = battle || 1) {
  return biomePlan[biomeIndexForBattle(n)] || null
}
function activeBiomeEntry() {
  return biomeEntryForBattle(battle || 1)
}
function activeBiomeEffects() {
  return activeBiomeEntry()?.biome.effects || []
}
function hasBiomeEffect(effect) {
  return activeBiomeEffects().includes(effect)
}
function biomeEffectLabel(effect) {
  const labels = {
    avoidUp: `Avo +${BIOME_AVOID_DELTA}`,
    avoidDown: `Avo -${BIOME_AVOID_DELTA}`,
    defUp: `Def +${BIOME_STAT_DELTA}`,
    defDown: `Def -${BIOME_STAT_DELTA}`,
    resUp: `Res +${BIOME_STAT_DELTA}`,
    resDown: `Res -${BIOME_STAT_DELTA}`,
    luckUp: `Lck +${BIOME_STAT_DELTA}`,
    luckDown: `Lck -${BIOME_STAT_DELTA}`,
    strUp: `Str +${BIOME_STAT_DELTA}`,
    speedDown: `Spd x${BIOME_SPEED_MULTIPLIER}`,
  }
  return labels[effect] || effect
}
function biomeEffectLabels(biome) {
  return biome.effects.length ? biome.effects.map(biomeEffectLabel) : ['Neutral']
}
function focusLabel(focus) {
  return focus.label || focus.cls
}
function focusMatchesBase(focus, base) {
  return base.cls === focus.cls && (!focus.weaponType || base.weaponType === focus.weaponType)
}
function pickBaseFromPool(pool, focusList = null) {
  const candidates = focusList?.length
    ? pool.map((b, idx) => ({ b, idx })).filter(({ b }) => focusList.some((focus) => focusMatchesBase(focus, b)))
    : pool.map((b, idx) => ({ b, idx }))
  const picked = pick(candidates.length ? candidates : pool.map((b, idx) => ({ b, idx })))
  return pool.splice(picked.idx, 1)[0]
}
function enemyFocusForSlot(isBossSlot, bossTier) {
  if (isBossSlot) {
    const bossFocus = bossFocusForBattle(battle)
    return bossFocus ? [bossFocus] : null
  }
  const biomeFocus = activeBiomeEntry()?.biome.focus || []
  return biomeFocus.length && rnd() < BIOME_FOCUS_CHANCE ? biomeFocus : null
}
function bossFocusForBattle(n = battle) {
  const entry = biomeEntryForBattle(n)
  if (!entry) return null
  const cycle = ((n - 1) % BIOME_CYCLE_LENGTH) + 1
  if (cycle === 3) return entry.bossFocus[0]
  if (cycle === BIOME_CYCLE_LENGTH) return entry.bossFocus[1]
  return null
}
function biomeUnitIconHTML(focus, bossIndex, promoted = false) {
  const label = `${bossIndex === 0 ? 'Boss' : 'Arena boss'}: ${focusLabel(focus)}`
  return `<span title="${htmlAttr(label)}">${mapSpriteForFocus(focus, 'red', promoted)}</span>`
}
function renderBiomeMap() {
  const el = $('biomeMap')
  if (!el) return
  if (!biomePlan.length) {
    el.innerHTML = ''
    return
  }
  const activeIndex = biomeIndexForBattle(battle || 1)
  el.innerHTML = biomePlan
    .map((entry, i) => {
      const biome = entry.biome,
        classes = i < activeIndex ? 'biomeNode done' : i === activeIndex ? 'biomeNode active' : 'biomeNode',
        effects = biomeEffectLabels(biome),
        title = `${biome.name}: ${effects.join(', ')}. Bosses: ${entry.bossFocus.map(focusLabel).join(' / ')}`
      return `<div class="${classes}" title="${htmlAttr(title)}"><img class="biomeTile" src="assets/femp/biomes/${htmlAttr(biome.id)}.jpg" alt="" aria-hidden="true"><div class="biomeUnits">${entry.bossFocus.map((focus, bossIndex) => biomeUnitIconHTML(focus, bossIndex, i >= 2)).join('')}</div><div class="biomeInfo"><div class="biomeName">${biome.name}</div><div class="biomeEffects">${effects.map((effect) => `<span class="biomeEffect">${effect}</span>`).join('')}</div></div></div>`
    })
    .join('')
}
function arenaTitleHTML() {
  const biome = activeBiomeEntry()?.biome
  if (!biome) return '<span class="arenaTitleName">Arena</span>'
  const effects = biomeEffectLabels(biome).join(', ')
  return `<span class="arenaTitleName">${biome.name} Arena</span>${effects ? ` <span class="arenaTitleEffects">(${effects})</span>` : ''}`
}
function updateMainModeTitle() {
  const title = $('mainModeTitle')
  if (!title) return
  title.innerHTML = shopOpen ? 'Shop' : arenaTitleHTML()
}
function setShopOpen(open) {
  shopOpen = open
  const battleView = $('battleView'),
    shopScreen = $('shopScreen'),
    autoBtn = $('autoFightBtn')
  if (battleView) battleView.classList.toggle('hidden', open)
  if (shopScreen) shopScreen.classList.toggle('hidden', !open)
  if (autoBtn) autoBtn.classList.toggle('hidden', open)
  updateMainModeTitle()
  updateAutoFightButton()
}
function updateAutoFightButton() {
  const btn = $('autoFightBtn')
  if (!btn) return
  const canAuto = !shopOpen && battleRunning && !awaitingReward && player.some((x) => x.hp > 0) && enemy.some((x) => x.hp > 0)
  btn.disabled = !canAuto
  btn.classList.toggle('active', autoFight)
  btn.setAttribute('aria-pressed', autoFight ? 'true' : 'false')
  btn.textContent = autoFight ? 'Auto-fight: On' : 'Auto-fight: Off'
}
function setAutoFight(enabled, silent = false) {
  if (!battleRunning && enabled) return
  autoFight = enabled
  updateAutoFightButton()
  if (!silent) setStatus(autoFight ? 'Auto-fight enabled.' : 'Auto-fight disabled.')
  if (autoFight) pendingAutoFightAction?.()
}
