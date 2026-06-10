import { BIOME_AVOID_DELTA, BIOME_CYCLES_PER_RUN, BIOME_CYCLE_LENGTH, BIOME_FOCUS_CHANCE, BIOME_SPEED_MULTIPLIER, BIOME_STAT_DELTA } from '../constants'
import { BIOMES } from '../data'
import { assetImg, htmlAttr, mapSpriteForFocus } from './assets'
import { setStatus } from './combat'
import { $, clamp, floor, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


export function shuffledCopy(items: any) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = rint(i + 1)
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}
export function makeBiomePlan() {
  const pool = shuffledCopy(BIOMES)
  return Array.from({ length: BIOME_CYCLES_PER_RUN }, (_, i) => {
    const biome = pool[i % pool.length]
    return { biome, bossFocus: shuffledCopy(biome.focus) }
  })
}
export function biomeIndexForBattle(n = state.battle || 1) {
  return clamp(Math.floor((Math.max(1, n) - 1) / BIOME_CYCLE_LENGTH), 0, Math.max(0, state.biomePlan.length - 1))
}
export function biomeEntryForBattle(n = state.battle || 1) {
  return state.biomePlan[biomeIndexForBattle(n)] || null
}
export function activeBiomeEntry() {
  return biomeEntryForBattle(state.battle || 1)
}
export function activeBiomeEffects() {
  return activeBiomeEntry()?.biome.effects || []
}
export function hasBiomeEffect(effect: string) {
  return activeBiomeEffects().includes(effect)
}
export function biomeEffectLabel(effect: string) {
  const labels: Record<string, string> = {
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
export function biomeEffectLabels(biome: any) {
  return biome.effects.length ? biome.effects.map(biomeEffectLabel) : ['Neutral']
}
export function focusLabel(focus: BiomeFocus) {
  return focus.label || focus.cls
}
export function focusMatchesBase(focus: BiomeFocus, base: any) {
  return base.cls === focus.cls && (!focus.weaponType || base.weaponType === focus.weaponType)
}
export function pickBaseFromPool(pool: any, focusList: BiomeFocus[] | null = null) {
  const candidates = focusList?.length
    ? pool.map((b: any, idx: number) => ({ b, idx })).filter(({ b }: any) => focusList.some((focus: BiomeFocus) => focusMatchesBase(focus, b)))
    : pool.map((b: any, idx: number) => ({ b, idx }))
  const picked: any = pick(candidates.length ? candidates : pool.map((b: any, idx: number) => ({ b, idx })))
  return pool.splice(picked.idx, 1)[0]
}
export function enemyFocusForSlot(isBossSlot: any, bossTier: any) {
  if (isBossSlot) {
    const bossFocus = bossFocusForBattle(state.battle)
    return bossFocus ? [bossFocus] : null
  }
  const biomeFocus = activeBiomeEntry()?.biome.focus || []
  return biomeFocus.length && rnd() < BIOME_FOCUS_CHANCE ? biomeFocus : null
}
export function bossFocusForBattle(n = state.battle) {
  const entry = biomeEntryForBattle(n)
  if (!entry) return null
  const cycle = ((n - 1) % BIOME_CYCLE_LENGTH) + 1
  if (cycle === 3) return entry.bossFocus[0]
  if (cycle === BIOME_CYCLE_LENGTH) return entry.bossFocus[1]
  return null
}
export function biomeUnitIconHTML(focus: BiomeFocus, bossIndex: any, promoted = false) {
  const label = `${bossIndex === 0 ? 'Boss' : 'Arena boss'}: ${focusLabel(focus)}`
  return `<span title="${htmlAttr(label)}">${mapSpriteForFocus(focus, 'red', promoted)}</span>`
}
export function renderBiomeMap() {
  const el = $('biomeMap')
  if (!el) return
  if (!state.biomePlan.length) {
    el.innerHTML = ''
    return
  }
  const activeIndex = biomeIndexForBattle(state.battle || 1)
  el.innerHTML = state.biomePlan
    .map((entry, i) => {
      const biome = entry.biome,
        classes = i < activeIndex ? 'biomeNode done' : i === activeIndex ? 'biomeNode active' : 'biomeNode',
        effects = biomeEffectLabels(biome),
        title = `${biome.name}: ${effects.join(', ')}. Bosses: ${entry.bossFocus.map(focusLabel).join(' / ')}`
      return `<div class="${classes}" title="${htmlAttr(title)}">${assetImg('biomeTile', `assets/femp/biomes/${biome.id}.jpg`, [], { type: 'biome' }, '')}<div class="biomeUnits">${entry.bossFocus.map((focus: BiomeFocus, bossIndex: any) => biomeUnitIconHTML(focus, bossIndex, i >= 2)).join('')}</div><div class="biomeInfo"><div class="biomeName">${biome.name}</div><div class="biomeEffects">${effects.map((effect: string) => `<span class="biomeEffect">${effect}</span>`).join('')}</div></div></div>`
    })
    .join('')
}
export function arenaTitleHTML() {
  const biome = activeBiomeEntry()?.biome
  if (!biome) return '<span class="arenaTitleName">Arena</span>'
  const effects = biomeEffectLabels(biome).join(', ')
  return `<span class="arenaTitleName">${biome.name} Arena</span>${effects ? ` <span class="arenaTitleEffects">(${effects})</span>` : ''}`
}
export function updateMainModeTitle() {
  const title = $('mainModeTitle')
  if (!title) return
  title.innerHTML = state.shop.open ? 'Shop' : arenaTitleHTML()
}
export function setShopOpen(open: any) {
  state.shop.open = open
  const battleView = $('battleView'),
    shopScreen = $('shopScreen'),
    autoBtn = $('autoFightBtn')
  if (battleView) battleView.classList.toggle('hidden', open)
  if (shopScreen) shopScreen.classList.toggle('hidden', !open)
  if (autoBtn) autoBtn.classList.toggle('hidden', open)
  updateMainModeTitle()
  updateAutoFightButton()
}
export function updateAutoFightButton() {
  const btn = $('autoFightBtn') as HTMLButtonElement
  if (!btn) return
  const canAuto = !state.shop.open && state.combat.running && !state.ui.awaitingReward && state.player.some((x) => x.hp > 0) && state.enemy.some((x) => x.hp > 0)
  btn.disabled = !canAuto
  btn.classList.toggle('active', state.combat.autoFight)
  btn.setAttribute('aria-pressed', state.combat.autoFight ? 'true' : 'false')
  btn.textContent = state.combat.autoFight ? 'Auto-fight: On' : 'Auto-fight: Off'
}
export function setAutoFight(enabled: any, silent = false) {
  if (!state.combat.running && enabled) return
  state.combat.autoFight = enabled
  updateAutoFightButton()
  if (!silent) setStatus(state.combat.autoFight ? 'Auto-fight enabled.' : 'Auto-fight disabled.')
  if (state.combat.autoFight) state.combat.pendingAutoFightAction?.()
}
