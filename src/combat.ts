import { BIOME_AVOID_DELTA, BIOME_SPEED_MULTIPLIER, BIOME_STAT_DELTA, DEBUG_SKILLS, STAFF_EXHAUST_ROUND_LIMIT } from '../constants'
import { BOSS_NAMES_BY_CLASS, CLASSES, CLASS_TAGS } from '../data'
import { activeBiomeEffects, hasBiomeEffect } from './biomes'
import { logLine, renderConsumables, renderSideCards, renderTeams } from './render'
import { closeModal, showModal } from './ui'
import { $, clamp, floor, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


export function unitTags(u: Unit) {
  return CLASS_TAGS[u.displayCls] || CLASS_TAGS[u.cls] || []
}
export function isWeaponEffective(w: Weapon, d: Unit) {
  if (!w?.effective) return false
  const tags = unitTags(d)
  return w.effective.some((e: any) => {
    if (d.heldItem?.effect === `${e}EffectiveImmune`) return false
    return e === 'swordUser' ? d.weapon?.type === 'sword' : tags.includes(e)
  })
}
// Flags an enemy whose equipped weapon poses an outsized threat to the player team,
// used to tint the enemy's weapon name on its sprite card. Dangerous when the weapon
// has high base crit (25%+), is S-rank, or is effective against any living player unit.
export function enemyWeaponDangerous(u: Unit) {
  const w = u.weapon
  if (!w) return false
  if ((w.crit || 0) >= 25) return true
  if (w.rank === 'S') return true
  return state.player.some((p) => p.hp > 0 && isWeaponEffective(w, p))
}
export function triangle(a: string, b: string, aw: Weapon | null = null, bw: Weapon | null = null) {
  const beats: Record<string, string> = { sword: 'axe', axe: 'lance', lance: 'sword', anima: 'light', light: 'dark', dark: 'anima' }
  if (!beats[a] || !beats[b]) return { atk: 0, hit: 0 }
  let sign = 0
  if (beats[a] === b) sign = 1
  else if (beats[b] === a) sign = -1
  const aRev = !!aw?.reaver,
    bRev = !!bw?.reaver
  if (aRev !== bRev) sign *= -1
  const mult = (aRev || bRev) && !(aRev && bRev) ? 2 : 1
  return { atk: sign * mult, hit: sign * 15 * mult }
}
export function biomeStatDelta(stat: StatKey) {
  const effects = activeBiomeEffects()
  let delta = 0
  if (stat === 'def') {
    if (effects.includes('defUp')) delta += BIOME_STAT_DELTA
    if (effects.includes('defDown')) delta -= BIOME_STAT_DELTA
  }
  if (stat === 'res') {
    if (effects.includes('resUp')) delta += BIOME_STAT_DELTA
    if (effects.includes('resDown')) delta -= BIOME_STAT_DELTA
  }
  if (stat === 'lck') {
    if (effects.includes('luckUp')) delta += BIOME_STAT_DELTA
    if (effects.includes('luckDown')) delta -= BIOME_STAT_DELTA
  }
  return delta
}
export function combatStat(u: Unit, stat: StatKey) {
  let value = (u.stats[stat] || 0) + (u.heldItem?.stats?.[stat] || 0) + (u.skill?.stats?.[stat] || 0)
  if (stat === 'spd' && hasBiomeEffect('speedDown')) value = floor(value * BIOME_SPEED_MULTIPLIER)
  return Math.max(0, value + biomeStatDelta(stat))
}
export function biomePhysicalPowerDelta(weapon: Weapon) {
  return hasBiomeEffect('strUp') && !weapon?.magic ? BIOME_STAT_DELTA : 0
}
export function biomeAvoidDelta() {
  let delta = 0
  if (hasBiomeEffect('avoidUp')) delta += BIOME_AVOID_DELTA
  if (hasBiomeEffect('avoidDown')) delta -= BIOME_AVOID_DELTA
  return delta
}
export function attackSpeed(u: Unit) {
  const penalty = Math.max(0, (u.weapon?.wt || 0) - u.stats.con) + (u.heldItem?.speedPenalty || 0)
  return Math.max(0, combatStat(u, 'spd') + (u.weapon?.speedBonus || 0) - penalty)
}
export function combatDefense(u: Unit) {
  return combatStat(u, 'def') + (u.weapon?.defBonus || 0)
}
export function combatResistance(u: Unit) {
  return combatStat(u, 'res') + (u.weapon?.resBonus || 0)
}
export function effectiveMt(a: Unit, d: Unit) {
  const coeff = isWeaponEffective(a.weapon, d) ? 2 : 1
  return (a.weapon.mt || 0) * coeff
}
// Weapon-mastery "faire" skills add flat damage when wielding the matching type
// ('tome' covers anima/light/dark).
export function skillFaireBonus(a: Unit) {
  const s = a.skill
  if (!s || s.family !== 'faire') return 0
  const wt = a.weapon?.type
  const match = s.weaponType === wt || (s.weaponType === 'tome' && (wt === 'anima' || wt === 'light' || wt === 'dark'))
  return match ? s.damageDealt || 0 : 0
}
export function attackPower(a: Unit, d: Unit) {
  const t = triangle(a.weapon.type, d.weapon.type, a.weapon, d.weapon).atk
  const stat = combatStat(a, 'str')
  // "When initiating" damage skills (e.g. Quick Draw) always apply here, since
  // the actor is always the attacker (this engine has no counterattacks).
  const initiateDamage = a.skill?.family === 'playerPhase' ? a.skill.damageDealt || 0 : 0
  return stat + effectiveMt(a, d) + t + biomePhysicalPowerDelta(a.weapon) + skillFaireBonus(a) + initiateDamage
}
// Target-independent attack power for card displays: weapon Might + the unit's
// attack stat (str doubles as Mag here) plus its non-target-dependent bonuses.
// Drops the weapon triangle and effective-weapon doubling, which depend on a foe.
// Staff users have no weapon damage, so they report 0 (callers omit the DMG label).
export function displayAttackPower(a: Unit) {
  if (a.weapon?.staff) return 0
  const stat = combatStat(a, 'str')
  const initiateDamage = a.skill?.family === 'playerPhase' ? a.skill.damageDealt || 0 : 0
  return stat + (a.weapon?.mt || 0) + biomePhysicalPowerDelta(a.weapon) + skillFaireBonus(a) + initiateDamage
}
export function defenseAgainst(d: Unit, weapon: Weapon) {
  return weapon.magic ? combatResistance(d) : combatDefense(d)
}
export function rawDamage(a: Unit, d: Unit) {
  if (a.weapon.halveHp) return Math.max(1, Math.ceil(d.hp / 2))
  let def = a.weapon.pierceRes ? 0 : defenseAgainst(d, a.weapon)
  if (a.weapon.halfDef) def = floor(def / 2)
  const minDamage = a.skill?.effect === 'minimumDamage' ? a.skill.amount || 1 : 1
  return Math.max(minDamage, attackPower(a, d) - def)
}
export function hitRate(a: Unit, d: Unit) {
  const t = triangle(a.weapon.type, d.weapon.type, a.weapon, d.weapon).hit
  return floor(a.weapon.hit + 2 * combatStat(a, 'skl') + combatStat(a, 'lck') / 2 + t + (a.heldItem?.hit || 0) + (a.skill?.hit || 0) - (a.skill?.enemyAvoid || 0))
}
export function avoid(d: Unit) {
  // playerPhase avoid ("when initiating") is inert on defense — exclude it here.
  const skillAvoid = d.skill && d.skill.family !== 'playerPhase' ? d.skill.avoid || 0 : 0
  return floor(2 * attackSpeed(d) + combatStat(d, 'lck') + biomeAvoidDelta() + (d.heldItem?.avoid || 0) + skillAvoid)
}
export function displayedHit(a: Unit, d: Unit) {
  return clamp(hitRate(a, d) - avoid(d), 0, 100)
}
export function trueHitRoll(displayed: any) {
  const rn = (rint(100) + 1 + rint(100) + 1) / 2
  return rn <= displayed
}
export function critRate(a: Unit, d: Unit) {
  if (a.weapon?.halveHp) return 0
  if (d.heldItem?.effect === 'critImmune') return 0
  let bonus = ['Swordmaster', 'Assassin', 'Berserker', 'Sniper'].includes(a.displayCls) ? 15 : 0
  return clamp(floor((a.weapon.crit || 0) + combatStat(a, 'skl') / 2 + combatStat(a, 'lck') / 2 + bonus - combatStat(d, 'lck') + (a.heldItem?.crit || 0) + (a.skill?.crit || 0) - (a.skill?.enemyCritAvoid || 0)), 0, 100)
}
export function triangleClass(a: Unit, d: Unit) {
  if (!a?.weapon || !d?.weapon) return 'hitNeu'
  const wt = triangle(a.weapon.type, d.weapon.type, a.weapon, d.weapon).hit
  return wt > 0 ? 'hitAdv' : wt < 0 ? 'hitDis' : 'hitNeu'
}
export function combatPreviewHTML(actor: Unit, target: Unit) {
  if (!actor || !target || actor.hp <= 0 || target.hp <= 0) return ''
  if (actor.weapon?.staff) {
    const fx = staffEffect(actor.weapon)
    if (!isStatusStaff(actor.weapon)) return ''
    return `<div><span class="${triangleClass(actor, target)}">${displayedHit(actor, target)}%</span></div><div>${statusName(fx)}</div>`
  }
  const hit = displayedHit(actor, target),
    crit = critRate(actor, target),
    dmg = rawDamage(actor, target),
    hits = (canDouble(actor, target) ? 2 : 1) * (actor.weapon?.brave ? 2 : 1),
    dmgClass = isWeaponEffective(actor.weapon, target) ? 'effectiveDamage' : '',
    hitCountClass = hits >= 4 ? 'attackCount attackCountQuad' : hits >= 2 ? 'attackCount attackCountMulti' : 'attackCount'
  return `<div><span class="${triangleClass(actor, target)}">${hit}%</span> <span class="critLine">- ${crit}% crit</span></div><div><span class="${dmgClass}">${dmg} dmg</span> <span class="${hitCountClass}">(x${hits})</span></div>`
}
export function classAbbrev(cls: string) {
  const map: Record<string, string> = {
    Lord: 'Lord',
    'Blade Lord': 'Blade Lord',
    Mercenary: 'Mercenary',
    Hero: 'Hero',
    Myrmidon: 'Myrmidon',
    Swordmaster: 'Swordmastr',
    Thief: 'Thief',
    Assassin: 'Assassin',
    Knight: 'Knight',
    General: 'General',
    Cavalier: 'Cavalier',
    Paladin: 'Paladin',
    Pegasus: 'Pegasus',
    'Falcon Knight': 'Falcon',
    Fighter: 'Fighter',
    Warrior: 'Warrior',
    Archer: 'Archer',
    Sniper: 'Sniper',
    Mage: 'Mage',
    Monk: 'Monk',
    Sage: 'Sage',
    Cleric: 'Cleric',
    Bishop: 'Bishop',
    Shaman: 'Shaman',
    Druid: 'Druid',
    Wyvern: 'Wyvern',
    'Wyvern Lord': 'Wyv Lord',
  }
  return map[cls] || String(cls).slice(0, 7)
}
export function statLabel(entity: any, stat: StatKey) {
  if (stat === 'str') return CLASSES[entity?.cls]?.strLabel || 'STR'
  return stat.toUpperCase()
}
export function bossNameFor(u: Unit) {
  const list = BOSS_NAMES_BY_CLASS[u.displayCls] || BOSS_NAMES_BY_CLASS[u.cls]
  return list ? list[rint(list.length)] : null
}
export function enemyDisplayName(u: Unit) {
  const bossName = u.bossTier ? bossNameFor(u) : null
  if (bossName) return bossName
  return classAbbrev(u.displayCls)
}
export function canDouble(a: Unit, d: Unit) {
  return attackSpeed(a) - attackSpeed(d) >= 4
}
export function healAmount(a: Unit) {
  return Math.max(1, (a.weapon.mt || 0) + combatStat(a, 'str'))
}
export function fortifyAmount(a: Unit) {
  return Math.max(1, combatStat(a, 'str'))
}
export function staffEffect(w: Weapon) {
  return w?.staff ? w.effect || 'heal' : null
}
export function isStatusStaff(w: Weapon) {
  const fx = staffEffect(w)
  return fx === 'sleep' || fx === 'berserk'
}
export function statusName(fx: any) {
  return ({ sleep: 'Sleep', berserk: 'Berserk' } as Record<string, string>)[fx] || ''
}
export function statusLabel(u: Unit) {
  return [statusName(u.status), u.poisoned ? 'Poison' : ''].filter(Boolean).join(' ')
}
export function weaponEffectLabels(w: Weapon) {
  const labels = []
  if (w.speedBonus) labels.push(`Spd +${w.speedBonus}`)
  if (w.defBonus) labels.push(`Def +${w.defBonus}`)
  if (w.resBonus) labels.push(`Res +${w.resBonus}`)
  if (w.reaver) labels.push('Reaver')
  if (w.brave) labels.push('Brave')
  if (w.magic && ['sword', 'lance', 'axe', 'bow', 'dagger'].includes(w.type)) labels.push('Targets Res')
  if (w.halfDef) labels.push('Ignores half Def')
  if (w.poison) labels.push('Poison')
  if (w.halveHp) labels.push('Halves HP')
  if (w.effective?.length) {
    const names = w.effective.map((e: any) => ({ armored: 'armor', mounted: 'mount', flying: 'flying', swordUser: 'swords' } as Record<string, string>)[e] || e)
    labels.push(`Eff: ${names.join(' / ')}`)
  }
  if (w.pierceRes) labels.push('Ignores Res')
  if (w.drain) labels.push('Drain')
  return labels
}
export function temporaryBuffLabel(u: Unit) {
  const battleBuffs = (Object.entries(u.tempBuffs || {}) as [string, number][])
    .filter(([, amt]) => amt > 0)
    .map(([stat, amt]) => `${statLabel(u, stat as StatKey)}+${amt}`)
  const turnBuffs = (Object.entries(u.turnBuffs || {}) as [string, number][])
    .filter(([, amt]) => amt > 0)
    .map(([stat, amt]) => `${statLabel(u, stat as StatKey)}+${amt} turn`)
  const buffs = [...battleBuffs, ...turnBuffs]
  if (!buffs.length) return ''
  return buffs.join(', ')
}
export function clearBuffBucket(u: Unit, bucketName: any) {
  for (const [stat, amt] of (Object.entries(u[bucketName] || {}) as [string, number][])) {
    u.stats[stat] = Math.max(0, u.stats[stat] - amt)
    if (stat === 'hp') {
      u.maxHp = u.stats.hp
      u.hp = Math.min(u.hp, u.maxHp)
    }
  }
  u[bucketName] = {}
}
export function clearTemporaryBuffs(units: Unit[]) {
  units.forEach((u: Unit) => {
    clearBuffBucket(u, 'turnBuffs')
    clearBuffBucket(u, 'tempBuffs')
    u.maxHp = u.stats.hp
    u.hp = Math.min(u.hp, u.maxHp)
  })
}
export function clearTurnBuffs(u: Unit) {
  clearBuffBucket(u, 'turnBuffs')
}
export function consumableSummary(item: any) {
  if (!item) return ''
  return item.desc || ''
}
export function consumableTargets(item: any, team = state.player, foes = state.enemy) {
  if (!item) return []
  const living = team.filter((u) => u.hp > 0)
  if (item.effect === 'heal' || item.effect === 'fullHeal') return living.filter((u) => u.hp < u.maxHp)
  if (item.effect === 'restore' || item.effect === 'fullHeal') return living.filter((u) => !!u.status)
  if (item.effect === 'revive') return team.filter((u) => u.hp <= 0)
  if (item.effect === 'aoeDamage') return foes.filter((u) => u.hp > 0)
  if (item.effect === 'buff' || item.effect === 'turnBuff') {
    // Tonics/buffs can push stats beyond the normal cap, so every living unit is
    // a valid target (no longer gated on having room below the cap).
    return living
  }
  return []
}
export function hasUsableConsumable(actor: Unit) {
  return !!actor && state.consumables.some((item) => item && consumableTargets(item).length)
}
export function applyStatBuff(u: Unit, stat: StatKey, amount: number, bucketName = 'tempBuffs') {
  u[bucketName] = u[bucketName] || {}
  const current = u[bucketName][stat] || 0
  // Consumables/tonics are allowed to push stats beyond their normal cap, so we
  // apply the full amount here instead of clamping to the remaining cap room.
  const gained = Math.max(0, amount)
  if (gained <= 0) return 0
  u.stats[stat] += gained
  u[bucketName][stat] = current + gained
  if (stat === 'hp') {
    u.maxHp = u.stats.hp
    u.hp = Math.min(u.maxHp, u.hp + gained)
  }
  return gained
}
export function applyStatus(u: Unit, fx: any) {
  if (u.heldItem?.effect === `${fx}Immune`) return
  u.status = fx
}
export function applyPoison(u: Unit) {
  if (u.poisoned) return false
  if (u.heldItem?.effect === 'poisonImmune') return false
  u.poisoned = true
  return true
}
// Held items with a battle-start trigger (e.g. Geosphere Shard) fire once at the
// start of each battle; holders damage the opposing team.
export function applyBattleStartHeldItems() {
  const sides: [Unit[], Unit[]][] = [
    [state.player, state.enemy],
    [state.enemy, state.player],
  ]
  for (const [team, foes] of sides) {
    for (const holder of team) {
      if (holder.hp <= 0) continue
      const item = holder.heldItem
      if (item?.trigger === 'battleStart' && item?.effect === 'enemyAoeDamage') {
        const amount = item.amount || 0
        foes.forEach((f) => {
          if (f.hp > 0) f.hp = Math.max(0, f.hp - amount)
        })
        logLine(null, `${holder.name}'s ${item.name} hits all foes for ${amount}.`, 'hit')
      }
    }
  }
  renderTeams()
}
export function clearUnitStatus(u: Unit) {
  u.status = null
  delete u.poisoned
}

// Rally skills (family 'rally', trigger 'battleStart') fire once at the start of a
// battle: each living player unit with a rally skill grants every living ally — the
// caster included — a one-turn buff for each stat in skill.stats. The buff lives in
// the 'turnBuffs' bucket, so it reuses the tonic/turnBuff lifecycle and is cleared
// after each unit finishes its first action (see clearTurnBuffs in game.ts). Multiple
// rally casters stack, since each call adds to the bucket.
export function applyBattleStartRallies() {
  const living = state.player.filter((u) => u.hp > 0)
  let applied = false
  for (const caster of living) {
    const s = caster.skill
    if (!s || s.family !== 'rally' || s.trigger !== 'battleStart' || !s.stats) continue
    const entries = (Object.entries(s.stats) as [StatKey, number][]).filter(([, amt]) => amt > 0)
    if (!entries.length) continue
    for (const ally of living) {
      for (const [stat, amt] of entries) applyStatBuff(ally, stat, amt, 'turnBuffs')
    }
    const label = entries.map(([stat]) => statLabel(caster, stat)).join(', ')
    logLine(null, `${caster.name} uses ${s.name}; allies gain ${label} on their first turn.`, 'heal')
    applied = true
  }
  if (applied) renderTeams()
}

// Skl-based activation chance for an attack proc skill (Aether, Sol, Luna, ...).
export function attackProcChance(a: Unit) {
  const s = a.skill
  if (!s || s.family !== 'proc' || s.trigger !== 'attack') return 0
  const skl = combatStat(a, 'skl')
  const byStat: Record<string, number> = { skl, sklHalf: floor(skl / 2), sklQuarter: floor(skl / 4), sklTimesTwo: skl * 2 }
  return clamp(byStat[s.chanceStat] ?? 0, 0, 100)
}
export function rollAttackProc(a: Unit) {
  const isProc = a.skill?.family === 'proc' && a.skill?.trigger === 'attack'
  if (!isProc) return null
  const chance = DEBUG_SKILLS ? 100 : attackProcChance(a)
  return rint(100) + 1 <= chance ? a.skill : null
}
export function strikeResult(a: Unit, d: Unit, suffix = '') {
  const dh = displayedHit(a, d),
    cr = critRate(a, d)
  if (!trueHitRoll(dh)) return { hit: false, crit: false, damage: 0, dh, cr, suffix, proc: null as any, procHeal: 0, lethal: false }
  const proc = rollAttackProc(a)
  // Lethality: instant defeat, bypassing damage.
  if (proc?.effect === 'lethalChance') {
    const before = d.hp
    d.hp = 0
    return { hit: true, crit: false, damage: before, dh, cr, suffix, proc, procHeal: 0, lethal: true }
  }
  let dmg = rawDamage(a, d)
  if (proc) {
    if (proc.effect === 'damageMultiplierChance') dmg = floor(dmg * (proc.multiplier || 1)) // Dragon Fang
    else if (proc.effect === 'halveDefenseChance' || proc.effect === 'aetherChance') {
      // Luna / Aether: ignore half of the target's defense.
      const def = a.weapon.pierceRes ? 0 : defenseAgainst(d, a.weapon)
      dmg = Math.max(1, attackPower(a, d) - floor(def / 2))
    } else if (proc.effect === 'addDefenseToDamageChance') dmg += floor(combatDefense(a) / 2) // Ignis
    else if (proc.effect === 'addMissingHpChance') dmg += floor(((a.maxHp - a.hp) * (proc.amountPercent || 50)) / 100) // Vengeance
  }
  const crit = rint(100) + 1 <= cr,
    finalDmg = crit ? dmg * 3 : dmg
  const before = d.hp
  d.hp = Math.max(0, d.hp - finalDmg)
  const damage = before - d.hp
  // Sol heals half of damage dealt; Aether heals all of it.
  const procHeal = proc?.effect === 'drainChance' ? floor((damage * (proc.healPercent || 50)) / 100) : proc?.effect === 'aetherChance' ? damage : 0
  return { hit: true, crit, damage, dh, cr, suffix, proc, procHeal, lethal: false }
}
export function performStrike(a: Unit, d: Unit, log: any, suffix = '') {
  const r = strikeResult(a, d, suffix)
  if (!r.hit) {
    logLine(log, `${a.name}${suffix} attacks ${d.name}: miss (${r.dh}% displayed).`, 'miss')
    return r
  }
  logLine(log, `${a.name}${suffix}${r.crit ? ' CRITICAL' : ''} hits ${d.name} for ${r.damage}. ${d.name} HP ${d.hp}/${d.maxHp}.`, r.crit ? 'crit' : 'hit')
  if (d.hp <= 0) logLine(log, `${d.name} falls.`, 'death')
  return r
}
export function expectedDamage(a: Unit, d: Unit) {
  if (!a || !d || a.hp <= 0 || d.hp <= 0 || a.weapon.staff) return 0
  const hit = displayedHit(a, d) / 100,
    crit = critRate(a, d) / 100,
    dmg = rawDamage(a, d)
  const strikes = canDouble(a, d) ? 2 : 1
  return hit * dmg * (1 + 2 * crit) * strikes
}
export function avgExpectedDamage(a: Unit, foes: Unit[]) {
  const live = foes.filter((x: any) => x.hp > 0)
  if (!live.length) return 0
  return live.reduce((sum: any, d: Unit) => sum + expectedDamage(a, d), 0) / live.length
}
export function chooseAITarget(targets: Unit[], opposingTeam: any) {
  const live = targets.filter((x: any) => x.hp > 0)
  if (!live.length) return null
  const roll = rnd()
  if (roll < 0.4) return [...live].sort((a, b) => a.hp - b.hp || a.maxHp - b.maxHp)[0]
  if (roll < 0.8) return [...live].sort((a, b) => avgExpectedDamage(b, opposingTeam) - avgExpectedDamage(a, opposingTeam))[0]
  return pick(live)
}
export function chooseEnemyTarget() {
  return chooseAITarget(state.player, state.enemy)
}
export function autoFightTargetFor(actor: Unit, allies: Unit[], foes: Unit[], stavesExhausted = false) {
  if (actor.weapon.staff) {
    if (stavesExhausted) return null
    return isStatusStaff(actor.weapon) ? chooseStatusStaffTarget(actor, foes) : null
  }
  return chooseAITarget(foes, allies)
}
export function chooseStatusStaffTarget(actor: Unit, foes: Unit[]) {
  const live = foes.filter((x: any) => x.hp > 0)
  const unstated = live.filter((x: any) => !x.status)
  const targets = unstated.length ? unstated : live
  if (!targets.length) return null
  if (rnd() < 0.65) return [...targets].sort((a, b) => displayedHit(actor, b) - displayedHit(actor, a))[0]
  return pick(targets)
}
export function lowestInjured(allies: Unit[]) {
  const injured = allies.filter((x: any) => x.hp > 0 && x.hp < x.maxHp)
  return injured.sort((a: Unit, b: any) => a.hp - b.hp)[0] || null
}
export function sleep(ms: any) {
  return new Promise((res) => setTimeout(res, ms))
}
export function spriteEl(u: Unit) {
  return document.querySelector<HTMLElement>(`.combatant[data-id="${u.id}"]`)
}
export function clearHighlights() {
  document.querySelectorAll<HTMLElement>('.combatant').forEach((el) => el.classList.remove('active', 'target', 'selectable', 'striking'))
}
export function setStatus(msg: string) {
  const el = $('combatStatus')
  el.textContent = msg
  el.classList.toggle('hidden', !msg)
}
export function updateUnitVisual(u: Unit) {
  const el = spriteEl(u)
  if (!el) return
  const pct = Math.max(0, (100 * u.hp) / u.maxHp)
  const bar = el.querySelector<HTMLElement>('.hpbar>i'),
    hp = el.querySelector<HTMLElement>('.hpText')
  if (bar) bar.style.width = pct + '%'
  if (hp) hp.textContent = `${u.hp}/${u.maxHp}`
  el.classList.toggle('dead', u.hp <= 0)
}
export function floatText(u: Unit, text: any, cls: string) {
  const el = spriteEl(u)
  if (!el) return
  const n = document.createElement('div')
  n.className = 'floatText ' + cls
  n.textContent = text
  el.appendChild(n)
  setTimeout(() => n.remove(), cls.includes('statusText') ? 1250 : cls.includes('procText') ? 1150 : cls.includes('damage') ? 950 : 650)
}
// Per-skill flash color (themed), used by the proc activation animation.
const SKILL_FLASH_COLORS: Record<string, string> = {
  aether: '#a5f3fc',
  sol: '#fde047',
  luna: '#c4b5fd',
  dragon_fang: '#fb923c',
  ignis: '#f87171',
  vengeance: '#ef4444',
  lethality: '#e879f9',
  astra: '#fca5a5',
  pavise: '#93c5fd',
  aegis: '#93c5fd',
}
export function skillFlashColor(skill: any) {
  return SKILL_FLASH_COLORS[skill?.id] || '#fde68a'
}
// A single clear ~420ms beat: flash the combatant in the skill's color and float
// its name, just before the strike resolves.
export async function animateSkillProc(u: Unit, skill: any) {
  const el = spriteEl(u)
  if (el) {
    el.style.setProperty('--procColor', skillFlashColor(skill))
    el.classList.add('procFlash')
  }
  floatText(u, skill.name, 'procText')
  await sleep(590)
  if (el) el.classList.remove('procFlash')
}
export function selectTarget(actor: Unit, targets: Unit[], prompt: string, cancelLabel = '') {
  state.ui.activePreviewActor = actor
  if (cancelLabel) state.ui.activeConsumableActor = actor
  renderTeams()
  setStatus(prompt || `${actor.name}'s turn: choose a target.`)
  const ae = spriteEl(actor)
  if (ae) ae.classList.add('active')
  return new Promise<Unit | null>((resolve) => {
    let settled = false
    const finish = (target: Unit | null) => {
      if (settled) return
      settled = true
      document.querySelectorAll<HTMLElement>('.combatant').forEach((ex) => {
        ex.classList.remove('selectable')
        ex.onclick = null
      })
      state.combat.pendingTargetCancel = null
      state.combat.pendingDefaultAction = null
      state.combat.pendingDefaultLabel = ''
      state.ui.activePreviewActor = null
      if (cancelLabel) state.ui.activeConsumableActor = null
      renderTeams()
      resolve(target)
    }
    state.combat.pendingTargetCancel = () => finish(null)
    if (cancelLabel) {
      state.combat.pendingDefaultLabel = cancelLabel
      state.combat.pendingDefaultAction = () => finish(null)
      renderConsumables()
    }
    targets.forEach((t: any) => {
      const el = spriteEl(t)
      if (!el) return
      el.classList.add('selectable')
      el.onclick = () => finish(t)
    })
  })
}
export function selectPlayerAction(actor: Unit, targets: Unit[], prompt: string, defaultLabel = '') {
  state.ui.activePreviewActor = actor
  state.ui.activeConsumableActor = actor
  renderTeams()
  setStatus(prompt || `${actor.name}'s turn: choose an action.`)
  const ae = spriteEl(actor)
  if (ae) ae.classList.add('active')
  return new Promise((resolve) => {
    let settled = false
    const finish = (action: any) => {
      if (settled) return
      settled = true
      document.querySelectorAll<HTMLElement>('.combatant').forEach((ex) => {
        ex.classList.remove('selectable')
        ex.onclick = null
      })
      state.combat.pendingTargetCancel = null
      state.combat.pendingConsumableAction = null
      state.combat.pendingAutoFightAction = null
      state.combat.pendingDefaultAction = null
      state.combat.pendingDefaultLabel = ''
      state.ui.activePreviewActor = null
      state.ui.activeConsumableActor = null
      renderTeams()
      resolve(action)
    }
    state.combat.pendingTargetCancel = () => finish({ type: 'cancel' })
    state.combat.pendingConsumableAction = (slot) => finish({ type: 'consumable', slot })
    state.combat.pendingAutoFightAction = () => finish({ type: 'auto' })
    if (defaultLabel) {
      state.combat.pendingDefaultLabel = defaultLabel
      state.combat.pendingDefaultAction = () => finish({ type: 'default' })
    }
    targets.forEach((t: any) => {
      const el = spriteEl(t)
      if (!el) return
      el.classList.add('selectable')
      el.onclick = () => finish({ type: 'target', target: t })
    })
    renderConsumables()
    if (state.combat.autoFight) setTimeout(() => state.combat.pendingAutoFightAction?.(), 0)
  })
}
export function nextLivingIndex(team: any, start: any) {
  for (let offset = 0; offset < team.length; offset++) {
    const idx = (start + offset) % team.length
    if (team[idx]?.hp > 0) return idx
  }
  return -1
}
export async function animateStrike(actor: Unit, target: Unit, result: any) {
  clearHighlights()
  const ae = spriteEl(actor),
    te = spriteEl(target)
  if (ae) ae.classList.add('active')
  if (te) te.classList.add('target')
  await sleep(300)
  if (ae) ae.classList.add('striking')
  if (result.hit) {
    floatText(target, `-${result.damage}${result.crit ? '!' : ''}`, 'damage')
  } else {
    floatText(target, 'MISS', 'missText')
  }
  updateUnitVisual(target)
  renderSideCards()
  await sleep(300)
  if (ae) ae.classList.remove('striking')
  if (target.hp <= 0) updateUnitVisual(target)
}
export async function animateHeal(actor: Unit, target: Unit, amt: number) {
  clearHighlights()
  const ae = spriteEl(actor),
    te = spriteEl(target)
  if (ae) ae.classList.add('active')
  if (te) te.classList.add('target')
  await sleep(300)
  target.hp = Math.min(target.maxHp, target.hp + amt)
  floatText(target, `+${amt}`, 'healing')
  updateUnitVisual(target)
  renderSideCards()
  logLine(null, `${actor.name} heals ${target.name} for ${amt}.`, 'heal')
  await sleep(300)
}
export async function animateFortify(actor: Unit, targets: Unit[], amt: number) {
  clearHighlights()
  const ae = spriteEl(actor)
  if (ae) ae.classList.add('active')
  await sleep(300)
  let total = 0
  targets.forEach((t: any) => {
    const healed = Math.min(t.maxHp - t.hp, amt)
    if (healed <= 0) return
    t.hp += healed
    total += healed
    floatText(t, `+${healed}`, 'healing')
    updateUnitVisual(t)
  })
  renderSideCards()
  logLine(null, `${actor.name} uses Fortify; allies recover ${total} total HP.`, 'heal')
  await sleep(450)
}
export async function animateAoeConsumable(actor: Unit, targets: Unit[], item: any) {
  clearHighlights()
  const ae = spriteEl(actor)
  if (ae) ae.classList.add('active')
  targets.forEach((t: any) => spriteEl(t)?.classList.add('target'))
  await sleep(300)
  let total = 0
  const fallen: string[] = []
  targets.forEach((t: any) => {
    const damage = Math.min(t.hp, item.amount)
    t.hp = Math.max(0, t.hp - item.amount)
    total += damage
    floatText(t, `-${damage}`, 'damage')
    updateUnitVisual(t)
    if (t.hp <= 0) fallen.push(t.name)
  })
  renderSideCards()
  logLine(null, `${actor.name} uses ${item.name}; enemies take ${total} total damage.`, 'hit')
  fallen.forEach((name) => logLine(null, `${name} falls.`, 'death'))
  await sleep(450)
}
export async function animateConsumable(actor: Unit, target: Unit, item: any) {
  clearHighlights()
  const ae = spriteEl(actor),
    te = spriteEl(target)
  if (ae) ae.classList.add('active')
  if (te) te.classList.add('target')
  await sleep(300)
  if (item.effect === 'heal' || item.effect === 'fullHeal') {
    const amount = item.effect === 'fullHeal' ? target.maxHp - target.hp : Math.min(target.maxHp - target.hp, item.amount)
    target.hp = Math.min(target.maxHp, target.hp + amount)
    floatText(target, `+${amount}`, 'healing')
    updateUnitVisual(target)
    logLine(null, `${actor.name} uses ${item.name} on ${target.name}; ${target.name} recovers ${amount} HP.`, 'heal')
  } else if (item.effect === 'buff' || item.effect === 'turnBuff') {
    const bucketName = item.effect === 'turnBuff' ? 'turnBuffs' : 'tempBuffs'
    const gained = applyStatBuff(target, item.stat, item.amount, bucketName)
    const duration = item.effect === 'turnBuff' ? 'until its next action ends' : 'for this battle'
    const label = statLabel(target, item.stat)
    floatText(target, `${label}+${gained}`, 'healing')
    logLine(null, `${actor.name} uses ${item.name} on ${target.name}; ${target.name} gains ${label} +${gained} ${duration}.`, 'heal')
  } else if (item.effect === 'restore') {
    const status = statusName(target.status)
    target.status = null
    floatText(target, 'RESTORE', 'healing')
    logLine(null, `${actor.name} uses ${item.name} on ${target.name}; ${status || 'status'} cleared.`, 'heal')
  } else if (item.effect === 'revive') {
    const amount = Math.max(1, Math.ceil(target.maxHp / 2))
    target.hp = amount
    clearUnitStatus(target)
    floatText(target, `+${amount}`, 'healing')
    updateUnitVisual(target)
    logLine(null, `${actor.name} uses ${item.name} on ${target.name}; ${target.name} returns with ${amount} HP.`, 'heal')
  }
  renderSideCards()
  await sleep(350)
}
export function confirmConsumableUse(actor: Unit, item: any, details: any) {
  return new Promise((resolve) => {
    showModal(
      `<h2>Use ${item.name}?</h2><p>${details || consumableSummary(item)}</p><div class="row"><button id="confirmConsumableBtn" class="good">Use</button><button id="cancelConsumableBtn">Cancel</button></div>`
    )
    $('confirmConsumableBtn').onclick = () => {
      closeModal()
      resolve(true)
    }
    $('cancelConsumableBtn').onclick = () => {
      closeModal()
      resolve(false)
    }
  })
}
export async function useConsumableFromSlot(slot: any, actor: Unit) {
  const item = state.consumables[slot]
  if (!item) {
    setStatus('That consumable slot is empty.')
    return false
  }
  const targets = consumableTargets(item)
  if (!targets.length) {
    setStatus(`${item.name} has no valid target right now.`)
    return false
  }
  if (item.effect === 'aoeDamage') {
    const confirmed = await confirmConsumableUse(
      actor,
      item,
      `${item.name} will affect ${targets.length} enem${targets.length === 1 ? 'y' : 'ies'}. ${consumableSummary(item)}`
    )
    if (!confirmed) {
      setStatus(`${actor.name} holds onto ${item.name}.`)
      return false
    }
    await animateAoeConsumable(actor, targets, item)
    state.consumables[slot] = null
    renderTeams()
    return true
  }
  const target = await selectTarget(actor, targets, `${actor.name} uses ${item.name}: choose an ally.`, 'Cancel use')
  if (!target) {
    setStatus(`${actor.name} holds onto ${item.name}.`)
    return false
  }
  await animateConsumable(actor, target, item)
  state.consumables[slot] = null
  renderTeams()
  return true
}
export function staffStatusResult(a: Unit, d: Unit) {
  const dh = displayedHit(a, d)
  return { hit: trueHitRoll(dh), dh, effect: staffEffect(a.weapon) }
}
export async function animateStatusStaff(actor: Unit, target: Unit, result: any) {
  clearHighlights()
  const ae = spriteEl(actor),
    te = spriteEl(target)
  if (ae) ae.classList.add('active')
  if (te) te.classList.add('target')
  await sleep(300)
  if (result.hit) floatText(target, statusName(result.effect).toUpperCase(), 'statusText')
  else floatText(target, 'MISS', 'missText')
  updateUnitVisual(target)
  renderSideCards()
  await sleep(result.hit ? 800 : 350)
}
export async function animateWait(actor: Unit, msg: string, cls = 'miss') {
  clearHighlights()
  const ae = spriteEl(actor)
  if (ae) ae.classList.add('active')
  setStatus(msg)
  logLine(null, msg, cls)
  floatText(actor, 'WAIT', 'missText')
  await sleep(600)
}
export async function applyEndOfTurnStatus(actor: Unit) {
  if (!actor?.poisoned || actor.hp <= 0) return
  const damage = Math.max(1, floor(actor.maxHp * 0.2))
  actor.hp = Math.max(0, actor.hp - damage)
  floatText(actor, `-${damage}`, 'damage')
  updateUnitVisual(actor)
  renderSideCards()
  logLine(null, `${actor.name} takes ${damage} poison damage. ${actor.name} HP ${actor.hp}/${actor.maxHp}.`, 'death')
  if (actor.hp <= 0) logLine(null, `${actor.name} falls to poison.`, 'death')
  await sleep(350)
}
export async function resolveStaffTurn(actor: Unit, allies: Unit[], foes: Unit[], forcedTarget: Unit | null = null) {
  const fx = staffEffect(actor.weapon)
  if (fx === 'fortify') {
    const targets = allies.filter((x: any) => x.hp > 0 && x.hp < x.maxHp)
    if (targets.length) {
      await animateFortify(actor, targets, fortifyAmount(actor))
      return
    }
    await animateWait(actor, `${actor.name} waits; no ally needs Fortify.`)
    return
  }
  if (fx === 'sleep' || fx === 'berserk') {
    const t = forcedTarget || chooseStatusStaffTarget(actor, foes)
    if (!t) {
      await animateWait(actor, `${actor.name} waits; no status target is available.`)
      return
    }
    const r = staffStatusResult(actor, t)
    if (r.hit) {
      applyStatus(t, fx)
      logLine(null, `${actor.name} uses ${actor.weapon.name} on ${t.name}: ${statusName(fx)} lands (${r.dh}% chance).`, 'hit')
    } else logLine(null, `${actor.name} uses ${actor.weapon.name} on ${t.name}: miss (${r.dh}% chance).`, 'miss')
    await animateStatusStaff(actor, t, r)
    return
  }
  const t = forcedTarget || lowestInjured(allies)
  if (t) {
    await animateHeal(actor, t, Math.min(t.maxHp - t.hp, healAmount(actor)))
    return
  }
  await animateWait(actor, `${actor.name} waits; no ally to heal.`)
}
export async function consumeTurnStatus(actor: Unit, allies: Unit[], foes: Unit[]) {
  if (!actor.status) return false
  const fx = actor.status
  actor.status = null
  renderTeams()
  if (fx === 'sleep') {
    await animateWait(actor, `${actor.name} is asleep and waits.`)
    return true
  }
  if (fx === 'berserk') {
    const targets = [...allies, ...foes].filter((x) => x.hp > 0 && x !== actor)
    if (actor.weapon.staff || !targets.length) {
      await animateWait(actor, `${actor.name} is berserk, but cannot attack.`)
      return true
    }
    const target = pick(targets)
    setStatus(`${actor.name} is berserk and attacks ${target.name}!`)
    logLine(null, `${actor.name} is berserk and attacks ${target.name}!`, 'crit')
    await resolveActorTurn(actor, allies, foes, target)
    return true
  }
  return false
}
export async function resolveActorTurn(actor: Unit, allies: Unit[], foes: Unit[], forcedTarget: Unit | null = null, stavesExhausted = false) {
  if (!actor || actor.hp <= 0) return
  if (actor.weapon.staff) {
    if (stavesExhausted) {
      await animateWait(actor, `${actor.name}'s staff is out of uses after ${STAFF_EXHAUST_ROUND_LIMIT} combat rounds.`)
      return
    }
    await resolveStaffTurn(actor, allies, foes, forcedTarget)
    return
  }
  const targets = foes.filter((x: any) => x.hp > 0)
  if (!targets.length) return
  const target = forcedTarget || pick(targets)
  const rounds = canDouble(actor, target) ? 2 : 1
  const braveStrikes = actor.weapon?.brave ? 2 : 1
  for (let round = 0; round < rounds && target.hp > 0; round++) {
    for (let b = 0; b < braveStrikes && target.hp > 0; b++) {
      const suffix = round > 0 ? ' follows up' : b > 0 ? ' strikes again' : ''
      let r = strikeResult(actor, target, suffix)
      if (!r.hit) logLine(null, `${actor.name}${suffix} attacks ${target.name}: miss (${r.dh}% displayed).`, 'miss')
      else {
        logLine(
          null,
          `${actor.name}${suffix}${r.crit ? ' CRITICAL' : ''} hits ${target.name} for ${r.damage}. ${target.name} HP ${target.hp}/${target.maxHp}.`,
          r.crit ? 'crit' : 'hit'
        )
        if (r.proc) logLine(null, `${actor.name}'s ${r.proc.name} activates${r.lethal ? ' — instant defeat' : ''}!`, 'crit')
        if (target.hp <= 0) logLine(null, `${target.name} falls.`, 'death')
      }
      if (r.proc) await animateSkillProc(actor, r.proc)
      await animateStrike(actor, target, r)
      if (actor.weapon?.poison && r.hit && target.hp > 0 && applyPoison(target)) {
        logLine(null, `${target.name} is poisoned.`, 'crit')
        floatText(target, 'POISON', 'statusText')
        renderSideCards()
        await sleep(650)
      }
      if (actor.weapon?.drain && r.hit && r.damage > 0) {
        const before = actor.hp
        actor.hp = Math.min(actor.maxHp, actor.hp + r.damage)
        const healed = actor.hp - before
        if (healed > 0) {
          floatText(actor, `+${healed}`, 'healing')
          updateUnitVisual(actor)
          renderSideCards()
        }
      }
      if (r.procHeal > 0) {
        const before = actor.hp
        actor.hp = Math.min(actor.maxHp, actor.hp + r.procHeal)
        const healed = actor.hp - before
        if (healed > 0) {
          floatText(actor, `+${healed}`, 'healing')
          updateUnitVisual(actor)
          renderSideCards()
        }
      }
    }
  }
}
