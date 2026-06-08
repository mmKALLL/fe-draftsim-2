import { BOSS_TIER_BIOME, BOSS_TIER_REGULAR, PROMOTION_UNLOCK_AFTER_BATTLE } from '../constants'
import { CLASSES, CONSUMABLES, WEAPONS } from '../data'
import { sleep, statLabel } from './combat'
import { logLine } from './render'
import { levelLabel } from './ui'
import { $, capStat, clamp, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


export function promote(u: Unit, showLog = true) {
  if (u.promoted) return
  const c = CLASSES[u.cls],
    promo = c.promo || {}
  for (const k of ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res', 'con'] as StatKey[]) {
    u.stats[k] = Math.min(capStat(u, k), u.stats[k] + (promo[k] || 0))
  }
  u.promoted = true
  u.displayCls = c.promotesTo
  u.lvl = 1
  u.internalLevel = Math.max(u.internalLevel || 20, 21)
  syncDisplayLevel(u)
  u.maxHp = u.stats.hp
  u.hp = Math.min(u.hp, u.maxHp)
  if (showLog) logLine(null, `${u.name} promotes to ${u.displayCls}!`, 'heal')
}
export function promotionUnlockedForRegularEnemies() {
  return state.battle > PROMOTION_UNLOCK_AFTER_BATTLE
}
export function currentInternalLevel(u: Unit) {
  return u.internalLevel || (u.promoted ? 20 + u.lvl : u.lvl)
}
export function syncDisplayLevel(u: Unit) {
  const internal = currentInternalLevel(u)
  u.lvl = u.promoted ? clamp(internal - 20, 1, 20) : clamp(internal, 1, 20)
}
export function applyGrowthLevel(u: Unit) {
  const before = { ...u.stats }
  for (const k of ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res'] as StatKey[]) {
    const skillGrowth = (u.skill?.growths?.[k] || 0) + (u.skill?.effect === 'growthBonusAll' ? u.skill.amount || 0 : 0)
    const growth = (u.growths[k] || 0) + (u.heldItem?.growths?.[k] || 0) + skillGrowth
    if (rint(100) + 1 <= growth) u.stats[k] = Math.min(capStat(u, k), u.stats[k] + 1)
  }
  u.maxHp = u.stats.hp
  u.hp = Math.min(u.hp, u.maxHp)
  return ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res'].filter((k) => u.stats[k] > before[k])
}
export function advanceInternalLevel(u: Unit, allowPromotion: any, showLog = true) {
  if (u.promoted && u.lvl >= 20) return false
  if (!u.promoted && u.lvl >= 20 && allowPromotion) {
    promote(u, showLog)
    return true
  }
  const gains = applyGrowthLevel(u)
  u.internalLevel = Math.min(40, currentInternalLevel(u) + 1)
  syncDisplayLevel(u)
  if (showLog) {
    const gainsText = gains.map((k) => statLabel(u, k as StatKey)).join(', ') || 'no stats'
    logLine(null, `${u.name} reached ${levelLabel(u)}: ${gainsText}.`, 'heal')
  }
  return true
}
export function levelUp(u: Unit, showLog = true) {
  if (u.promoted && u.lvl >= 20) return false
  return advanceInternalLevel(u, true, showLog)
}
export function advanceTwoLevels(units: Unit[]) {
  units.forEach((u: Unit) => {
    for (let i = 0; i < 2; i++) levelUp(u, true)
    u.hp = u.maxHp
  })
}
export function freshFromBase(base: any, enemy = false, targetLevel = 1, promoted = false) {
  const c = CLASSES[base.cls],
    u: any = {
      id: Math.random().toString(36).slice(2),
      name: base.name,
      baseName: base.name,
      cls: base.cls,
      displayCls: base.cls,
      weaponType: base.weaponType,
      palette: enemy ? 'red' : base.palette,
      kind: c.kind,
      lvl: 1,
      internalLevel: 1,
      promoted: false,
      stats: { ...base.stats },
      growths: { ...base.growths },
      caps: { ...c.caps },
      team: enemy ? 'red' : 'blue',
      isEnemy: enemy,
      startOffset: base.startOffset || 0,
      status: null,
      heldItem: null,
      skill: null,
    }
  u.weapon = startingWeapon(u.weaponType)
  u.maxHp = u.stats.hp
  u.hp = u.maxHp
  const requestedInternalLevel = (promoted ? 20 + targetLevel : targetLevel) + (base.startOffset || 0)
  const internalLevel = clamp(requestedInternalLevel, 1, 40)
  while (currentInternalLevel(u) < internalLevel) advanceInternalLevel(u, promoted, false)
  u.hp = u.maxHp
  return u
}
export function startingWeapon(type: any) {
  const map: Record<string, string> = { sword: 'Iron Sword', lance: 'Iron Lance', axe: 'Iron Axe', bow: 'Iron Bow', anima: 'Fire', light: 'Lightning', dark: 'Flux', staff: 'Heal Staff' }
  return cloneWeapon(WEAPONS.find((w) => w.name === map[type])!)
}
export function cloneWeapon(w: Weapon) {
  return { ...w }
}
export function forgeWeapon(w: Weapon) {
  if (!w || w.staff) return false
  w.name += '+'
  w.mt = (w.mt || 0) + 2
  w.hit = (w.hit || 0) + 5
  return true
}
export function cloneConsumable(item: any) {
  return item ? { ...item } : null
}
export function consumableById(id: any) {
  return CONSUMABLES.find((item) => item.id === id)
}
export function startingConsumables() {
  return [cloneConsumable(consumableById('vulnerary')), cloneConsumable(consumableById('speed_tonic')), null]
}
export function allowedWeapons(u: Unit) {
  const c = CLASSES[u.cls] || {}
  const base = [u.weaponType]
  if (u.cls === 'Thief') base.push('dagger')
  if (u.promoted) base.push(...(c.promotionWeaponTypes || []))
  return [...new Set(base)]
}
export function weaponBaseName(name = '') {
  return String(name).replace(/\++$/, '')
}
export function isCurrentWeapon(u: Unit, w: Weapon) {
  return !!u?.weapon && !!w && weaponBaseName(u.weapon.name) === weaponBaseName(w.name)
}
export function canEquipAsNewWeapon(u: Unit, w: Weapon) {
  return u?.hp > 0 && !!w && allowedWeapons(u).includes(w.type) && !isCurrentWeapon(u, w)
}
export function weaponScore(w: Weapon) {
  const staffFx = ({ sleep: 18, berserk: 24, fortify: 70 } as Record<string, number>)[w.effect || ''] || 0
  return (
    (w.mt || 0) * 3 +
    (w.hit || 0) / 10 +
    (w.crit || 0) / 2 -
    (w.wt || 0) / 3 +
    (w.pierceRes ? 12 : 0) +
    (w.halfDef ? 10 : 0) +
    (w.halveHp ? 18 : 0) +
    (w.brave ? 18 : 0) +
    (w.reaver ? 5 : 0) +
    (w.effective ? 8 : 0) +
    (w.drain ? 10 : 0) +
    (w.staff ? 4 : 0) +
    (w.speedBonus || 0) * 4 +
    (w.defBonus || 0) * 4 +
    (w.resBonus || 0) * 4 +
    (w.poison ? 10 : 0) +
    staffFx
  )
}
export function bossWeaponRanks(tier: any) {
  const lateBoss = state.battle > 10
  if (tier === BOSS_TIER_BIOME) return lateBoss ? ['A', 'S'] : ['B', 'A']
  if (tier === BOSS_TIER_REGULAR) return lateBoss ? ['B', 'A'] : ['C', 'B']
  return []
}
export function bossWeaponPool(opts: any, tier: any) {
  const ranks = bossWeaponRanks(tier)
  if (!ranks.length) return opts
  const ranked = opts.filter((w: Weapon) => ranks.includes(w.rank))
  return ranked.length ? ranked : opts
}
export function enemyWeaponFor(u: Unit, tier: any) {
  const opts = WEAPONS.filter((w) => allowedWeapons(u).includes(w.type))
  if (!opts.length) return u.weapon
  if (tier === BOSS_TIER_BIOME) {
    const chosen = cloneWeapon(pick(bossWeaponPool(opts, tier)))
    forgeWeapon(chosen)
    return chosen
  }
  if (tier === BOSS_TIER_REGULAR) {
    const bossOpts = bossWeaponPool(opts, tier)
    return cloneWeapon(bossOpts.sort((a: Weapon, b: Weapon) => weaponScore(b) - weaponScore(a))[0])
  }
  if (state.battle > 10) {
    const good = opts.filter((w) => !w.name.startsWith('Iron') && w.name !== 'Heal Staff')
    if (good.length && rnd() < 0.85) return cloneWeapon(pick(good))
  }
  if (state.battle > 4) {
    const good = opts.filter((w) => !w.name.startsWith('Iron') && w.name !== 'Heal Staff')
    if (good.length && rnd() < 0.55) return cloneWeapon(pick(good))
  }
  return cloneWeapon(u.weapon)
}
