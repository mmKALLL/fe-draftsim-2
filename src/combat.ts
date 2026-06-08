import { BIOME_AVOID_DELTA, BIOME_SPEED_MULTIPLIER, BIOME_STAT_DELTA, STAFF_EXHAUST_ROUND_LIMIT } from '../constants'
import { BOSS_NAMES_BY_CLASS, CLASSES, CLASS_TAGS } from '../data'
import { activeBiomeEffects, hasBiomeEffect } from './biomes'
import { logLine, renderConsumables, renderSideCards, renderTeams } from './render'
import { closeModal, showModal } from './ui'
import { $, capStat, clamp, floor, pick, rint, rnd } from './utils'
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
export function attackPower(a: Unit, d: Unit) {
  const t = triangle(a.weapon.type, d.weapon.type, a.weapon, d.weapon).atk
  const stat = combatStat(a, 'str')
  return stat + effectiveMt(a, d) + t + biomePhysicalPowerDelta(a.weapon)
}
export function defenseAgainst(d: Unit, weapon: Weapon) {
  return weapon.magic ? combatResistance(d) : combatDefense(d)
}
export function rawDamage(a: Unit, d: Unit) {
  if (a.weapon.halveHp) return Math.max(1, Math.ceil(d.hp / 2))
  let def = a.weapon.pierceRes ? 0 : defenseAgainst(d, a.weapon)
  if (a.weapon.halfDef) def = floor(def / 2)
  return Math.max(1, attackPower(a, d) - def)
}
export function hitRate(a: Unit, d: Unit) {
  const t = triangle(a.weapon.type, d.weapon.type, a.weapon, d.weapon).hit
  return floor(a.weapon.hit + 2 * combatStat(a, 'skl') + combatStat(a, 'lck') / 2 + t + (a.heldItem?.hit || 0) + (a.skill?.hit || 0))
}
export function avoid(d: Unit) {
  return floor(2 * attackSpeed(d) + combatStat(d, 'lck') + biomeAvoidDelta() + (d.heldItem?.avoid || 0) + (d.skill?.avoid || 0))
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
  return clamp(floor((a.weapon.crit || 0) + combatStat(a, 'skl') / 2 + combatStat(a, 'lck') / 2 + bonus - combatStat(d, 'lck') + (a.heldItem?.crit || 0) + (a.skill?.crit || 0)), 0, 100)
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
    return living.filter((u) => u.stats[item.stat] < capStat(u, item.stat))
  }
  return []
}
export function hasUsableConsumable(actor: Unit) {
  return !!actor && state.consumables.some((item) => item && consumableTargets(item).length)
}
export function applyStatBuff(u: Unit, stat: StatKey, amount: number, bucketName = 'tempBuffs') {
  u[bucketName] = u[bucketName] || {}
  const current = u[bucketName][stat] || 0
  const room = Math.max(0, capStat(u, stat) - u.stats[stat])
  const gained = Math.min(amount, room)
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

export function strikeResult(a: Unit, d: Unit, suffix = '') {
  const dh = displayedHit(a, d),
    cr = critRate(a, d),
    dmg = rawDamage(a, d)
  if (!trueHitRoll(dh)) return { hit: false, crit: false, damage: 0, dh, cr, suffix }
  const crit = rint(100) + 1 <= cr,
    finalDmg = crit ? dmg * 3 : dmg
  const before = d.hp
  d.hp = Math.max(0, d.hp - finalDmg)
  return { hit: true, crit, damage: before - d.hp, dh, cr, suffix }
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
  setTimeout(() => n.remove(), cls.includes('statusText') ? 1250 : cls.includes('damage') ? 950 : 650)
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
        if (target.hp <= 0) logLine(null, `${target.name} falls.`, 'death')
      }
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
    }
  }
}
