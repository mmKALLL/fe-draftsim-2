import { ARENA_AVOID_DELTA, ARENA_CYCLES_PER_RUN, ARENA_CYCLE_LENGTH, ARENA_FOCUS_CHANCE, ARENA_SPEED_MULTIPLIER, ARENA_STAT_DELTA } from '../config'
import { ARENAS } from '../data'
import { assetImg, htmlAttr, mapSpriteForFocus } from './assets'
import { setStatus } from './combat'
import { sim } from './sim'
import { $, clamp, floor, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, ArenaFocus, ArenaEntry, ShopOffer } from '../types'


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
export function makeArenaPlan() {
  const pool = shuffledCopy(ARENAS)
  return Array.from({ length: ARENA_CYCLES_PER_RUN }, (_, i) => {
    const arena = pool[i % pool.length]
    return { arena, bossFocus: shuffledCopy(arena.focus) }
  })
}
export function arenaIndexForBattle(n = state.battle || 1) {
  return clamp(Math.floor((Math.max(1, n) - 1) / ARENA_CYCLE_LENGTH), 0, Math.max(0, state.arenaPlan.length - 1))
}
// Arenas 3 and 4 (the run's last two, plan index >= 2) double the magnitude of their
// stat and avoid bonuses/penalties, making the late game swingier. The speed penalty,
// being a multiplier rather than a flat delta, is left unchanged.
export function arenaEffectMultiplier(n = state.battle || 1) {
  return arenaIndexForBattle(n) >= 2 ? 2 : 1
}
export function arenaEntryForBattle(n = state.battle || 1) {
  return state.arenaPlan[arenaIndexForBattle(n)] || null
}
export function activeArenaEntry() {
  return arenaEntryForBattle(state.battle || 1)
}
export function activeArenaEffects() {
  return activeArenaEntry()?.arena.effects || []
}
export function hasArenaEffect(effect: string) {
  return activeArenaEffects().includes(effect)
}
export function arenaEffectLabel(effect: string, mult = 1) {
  const stat = ARENA_STAT_DELTA * mult
  const avoid = ARENA_AVOID_DELTA * mult
  const labels: Record<string, string> = {
    avoidUp: `Avo +${avoid}`,
    avoidDown: `Avo -${avoid}`,
    defUp: `Def +${stat}`,
    defDown: `Def -${stat}`,
    resUp: `Res +${stat}`,
    resDown: `Res -${stat}`,
    luckUp: `Lck +${stat}`,
    luckDown: `Lck -${stat}`,
    strUp: `Str +${stat}`,
    speedDown: `Spd x${ARENA_SPEED_MULTIPLIER}`,
  }
  return labels[effect] || effect
}
export function arenaEffectLabels(arena: any, mult = 1) {
  return arena.effects.length ? arena.effects.map((e: string) => arenaEffectLabel(e, mult)) : ['Neutral']
}
export function focusLabel(focus: ArenaFocus) {
  return focus.label || focus.cls
}
export function focusMatchesBase(focus: ArenaFocus, base: any) {
  return base.cls === focus.cls && (!focus.weaponType || base.weaponType === focus.weaponType)
}
export function pickBaseFromPool(pool: any, focusList: ArenaFocus[] | null = null) {
  const candidates = focusList?.length
    ? pool.map((b: any, idx: number) => ({ b, idx })).filter(({ b }: any) => focusList.some((focus: ArenaFocus) => focusMatchesBase(focus, b)))
    : pool.map((b: any, idx: number) => ({ b, idx }))
  const picked: any = pick(candidates.length ? candidates : pool.map((b: any, idx: number) => ({ b, idx })))
  return pool.splice(picked.idx, 1)[0]
}
export function enemyFocusForSlot(isBossSlot: any, bossTier: any) {
  if (isBossSlot) {
    const bossFocus = bossFocusForBattle(state.battle)
    return bossFocus ? [bossFocus] : null
  }
  const arenaFocus = activeArenaEntry()?.arena.focus || []
  return arenaFocus.length && rnd() < ARENA_FOCUS_CHANCE ? arenaFocus : null
}
export function bossFocusForBattle(n = state.battle) {
  const entry = arenaEntryForBattle(n)
  if (!entry) return null
  const cycle = ((n - 1) % ARENA_CYCLE_LENGTH) + 1
  if (cycle === 3) return entry.bossFocus[0]
  if (cycle === ARENA_CYCLE_LENGTH) return entry.bossFocus[1]
  return null
}
export function arenaUnitIconHTML(focus: ArenaFocus, bossIndex: any, promoted = false) {
  const label = `${bossIndex === 0 ? 'Boss' : 'Arena boss'}: ${focusLabel(focus)}`
  return `<span title="${htmlAttr(label)}">${mapSpriteForFocus(focus, 'red', promoted)}</span>`
}
export function renderArenaMap() {
  const el = $('arenaMap')
  if (!el) return
  if (!state.arenaPlan.length) {
    el.innerHTML = ''
    return
  }
  const activeIndex = arenaIndexForBattle(state.battle || 1)
  el.innerHTML = state.arenaPlan
    .map((entry, i) => {
      const arena = entry.arena,
        classes = i < activeIndex ? 'arenaNode done' : i === activeIndex ? 'arenaNode active' : 'arenaNode',
        effects = arenaEffectLabels(arena, i >= 2 ? 2 : 1),
        title = `${arena.name}: ${effects.join(', ')}. Bosses: ${entry.bossFocus.map(focusLabel).join(' / ')}`
      return `<div class="${classes}" title="${htmlAttr(title)}">${assetImg('arenaTile', `assets/femp/biomes/${arena.id}.jpg`, [], { type: 'arena' }, '')}<div class="arenaUnits">${entry.bossFocus.map((focus: ArenaFocus, bossIndex: any) => arenaUnitIconHTML(focus, bossIndex, i >= 2)).join('')}</div><div class="arenaInfo"><div class="arenaName">${arena.name}</div><div class="arenaEffects">${effects.map((effect: string) => `<span class="arenaEffect">${effect}</span>`).join('')}</div></div></div>`
    })
    .join('')
}
export function arenaTitleHTML() {
  const arena = activeArenaEntry()?.arena
  if (!arena) return '<span class="arenaTitleName">Arena</span>'
  const effects = arenaEffectLabels(arena, arenaEffectMultiplier()).join(', ')
  const arenaBattle = ((Math.max(1, state.battle || 1) - 1) % ARENA_CYCLE_LENGTH) + 1
  return `<span class="arenaTitleName">${arena.name} Arena ${arenaBattle}</span>${effects ? ` <span class="arenaTitleEffects">(${effects})</span>` : ''}`
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
  // Headless sim drives every battle on auto: keep auto-fight latched on for the whole batch so the
  // end-of-battle setAutoFight(false) (runBattle) can't leave battle 2+ waiting on a manual click.
  if (sim.active && !enabled) return
  if (!state.combat.running && enabled) return
  state.combat.autoFight = enabled
  updateAutoFightButton()
  if (!silent) setStatus(state.combat.autoFight ? 'Auto-fight enabled.' : 'Auto-fight disabled.')
  if (state.combat.autoFight) state.combat.pendingAutoFightAction?.()
}
