import { BOSS_TIER_BIOME, DEFAULT_COMMON_FORCES_FIRST_WEAPON, DEFAULT_WEAPON_MAX_CRIT, ENEMY_LUCK_GROWTH_PENALTY, ENEMY_LUCK_PENALTY, ENEMY_WEAPON_PROFILE, PROMOTION_UNLOCK_AFTER_BATTLE, WEAPON_RANK_RARITY } from '../constants'
import { CLASSES, CONSUMABLES, WEAPONS } from '../data'
import { sleep, statLabel } from './combat'
import { logLine } from './render'
import { levelLabel } from './ui'
import { $, capStat, clamp, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer, Rarity } from '../types'


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
  // Enemies are "unlucky": lower Luck growth (applied before leveling) makes them
  // easier to hit and easier to crit, without touching the FE7 formulas.
  if (enemy) u.growths.lck = Math.max(0, (u.growths.lck || 0) - ENEMY_LUCK_GROWTH_PENALTY)
  u.maxHp = u.stats.hp
  u.hp = u.maxHp
  const requestedInternalLevel = (promoted ? 20 + targetLevel : targetLevel) + (base.startOffset || 0)
  const internalLevel = clamp(requestedInternalLevel, 1, 40)
  while (currentInternalLevel(u) < internalLevel) advanceInternalLevel(u, promoted, false)
  // Flat Luck penalty, floored at 1 so enemy Luck never reaches 0.
  if (enemy) u.stats.lck = Math.max(1, u.stats.lck - ENEMY_LUCK_PENALTY)
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
// "default" pool = predictable, plain weapons; "good" pool = everything else (the
// exceptions). Allowlist by design: a weapon is default only if it carries nothing
// beyond a known-plain set, so any new keyword (e.g. pierceDef) auto-falls into 'good'.
const PLAIN_WEAPON_KEYS = new Set(['name', 'type', 'rank', 'tier', 'mt', 'hit', 'wt', 'crit', 'magic'])
const MAGIC_WEAPON_TYPES = new Set(['anima', 'light', 'dark'])
const STATUS_STAFF_EFFECTS = new Set(['sleep', 'berserk', 'silence'])
const onlyFlying = (eff?: string[]) => Array.isArray(eff) && eff.length === 1 && eff[0] === 'flying'
export function isDefaultWeapon(w: Weapon): boolean {
  if (w.type === 'staff') return !w.effect || !STATUS_STAFF_EFFECTS.has(w.effect) // heal staves = default
  if (w.magic !== MAGIC_WEAPON_TYPES.has(w.type)) return false // off-type magic => good
  if ((w.crit || 0) >= DEFAULT_WEAPON_MAX_CRIT) return false // killer-tier crit => good
  for (const k of Object.keys(w)) {
    if (PLAIN_WEAPON_KEYS.has(k)) continue
    if (w.type === 'bow' && k === 'effective' && onlyFlying(w.effective)) continue // innate flier-eff
    if (w.type === 'dagger' && k === 'halfDef') continue // innate halve-def
    return false // any other (or future) property => good
  }
  return true
}
// Weighted pick over the three rarity groups; zero/absent weights are skipped.
function pickWeightedRarity(weights: Record<Rarity, number>): Rarity {
  const entries = (Object.entries(weights) as [Rarity, number][]).filter(([, weight]) => weight > 0)
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (!total) return 'normal'
  let roll = rnd() * total
  for (const [rarity, weight] of entries) {
    roll -= weight
    if (roll <= 0) return rarity
  }
  return entries[entries.length - 1][0]
}
// Resolve a rolled rarity GROUP against what the class actually has: prefer the rolled
// group, else step DOWN a whole group at a time, else step up as a last resort.
const RARITY_GROUPS: Rarity[] = ['normal', 'uncommon', 'rare']
function resolveRarity(pool: Weapon[], target: Rarity): Weapon[] {
  const byGroup: Record<Rarity, Weapon[]> = { normal: [], uncommon: [], rare: [] }
  for (const w of pool) byGroup[WEAPON_RANK_RARITY[w.rank]].push(w)
  const ti = RARITY_GROUPS.indexOf(target)
  const order = [ti]
  for (let i = ti - 1; i >= 0; i--) order.push(i)
  for (let i = ti + 1; i < RARITY_GROUPS.length; i++) order.push(i)
  for (const i of order) {
    const group = byGroup[RARITY_GROUPS[i]]
    if (group.length) return group
  }
  return pool
}
// The most basic weapon of each type (first listed for that type in WEAPONS) — e.g.
// Iron Sword / Fire / Heal Staff. Excluded from the 'good' pool so 'good' means
// "anything better than a type's starter weapon".
const BASIC_WEAPONS = new Set<Weapon>()
const seenWeaponTypes = new Set<string>()
for (const w of WEAPONS) {
  if (!seenWeaponTypes.has(w.type)) {
    seenWeaponTypes.add(w.type)
    BASIC_WEAPONS.add(w)
  }
}
const isBasicWeapon = (w: Weapon) => BASIC_WEAPONS.has(w)
// forceGood decided per fight by the caller (bosses always good; a bounded number of
// minions good). 'good' = anything but each type's basic weapon; 'default' = plain weapons only.
export function enemyWeaponFor(u: Unit, tier: any, forceGood: boolean) {
  const classWeapons = WEAPONS.filter((w) => allowedWeapons(u).includes(w.type))
  if (!classWeapons.length) return u.weapon
  const arena = clamp(Math.floor((state.battle - 1) / 5) + 1, 1, 4)
  const role = tier ? 'boss' : 'minion'
  const profile = ENEMY_WEAPON_PROFILE[arena - 1][role]
  let pool = classWeapons.filter((w) => (forceGood ? !isBasicWeapon(w) : isDefaultWeapon(w)))
  if (!pool.length) pool = classWeapons
  const target = pickWeightedRarity(forceGood ? profile.good : profile.default)
  let picked = pick(resolveRarity(pool, target))
  // Streamlining: default-pool commons collapse to the type's basic weapon (Iron, Fire, ...).
  if (!forceGood && DEFAULT_COMMON_FORCES_FIRST_WEAPON && WEAPON_RANK_RARITY[picked.rank] === 'normal') {
    picked = classWeapons.find((w) => isBasicWeapon(w) && w.type === picked.type) || picked
  }
  const chosen = cloneWeapon(picked)
  if (tier === BOSS_TIER_BIOME) forgeWeapon(chosen)
  return chosen
}
