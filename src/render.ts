import { BOSS_TIER_BIOME, BOSS_TIER_REGULAR, CONSUMABLE_SLOTS, DRAFT_CHOICES_PER_SLOT, LEADER_BONUS_LEVELS, ROSTER_SIZE } from '../constants'
import { BASES, CLASSES, HELD_ITEMS, TEACHABLE_SKILLS, weaponTierLabel } from '../data'
import { battleImgForUnit, htmlAttr, portraitImgForBase, portraitImgForUnit } from './assets'
import { renderBiomeMap, updateAutoFightButton, updateMainModeTitle } from './biomes'
import { attackSpeed, avoid, combatPreviewHTML, consumableSummary, consumableTargets, displayAttackPower, enemyWeaponDangerous, hitRate, nextLivingIndex, sleep, staffEffect, statLabel, statusLabel, statusName, temporaryBuffLabel, weaponEffectLabels } from './combat'
import { updateGoldUI } from './state'
import { levelLabel } from './ui'
import { startingWeapon } from './units'
import { $, floor, pick, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


export function selectedRosterCount() {
  return state.draft.chosen.filter(Boolean).length
}
export function emptyRosterChoices() {
  return Array(ROSTER_SIZE).fill(null)
}
export function randomDraftOptions() {
  const pool = [...BASES],
    slots = []
  for (let slot = 0; slot < ROSTER_SIZE; slot++) {
    const offers = []
    for (let choice = 0; choice < DRAFT_CHOICES_PER_SLOT; choice++) {
      const wantStaff = choice === 0 && rnd() < 0.125
      let candidates = pool.map((b, idx) => ({ b, idx }))
      if (wantStaff) {
        const staffers = candidates.filter((x) => x.b.weaponType === 'staff')
        if (staffers.length) candidates = staffers
      }
      const picked = pick(candidates)
      offers.push(picked.b.name)
      pool.splice(picked.idx, 1)
    }
    slots.push(offers)
  }
  return slots
}
export function padCell(v: any, w = 2) {
  return String(v).padStart(w, ' ')
}
// Card weapon labels live in narrow slots; names of 12+ chars are clipped to their
// first 9 and marked with two dots (e.g. "Silver Sword" -> "Silver Sw..").
export function truncWeaponName(name = '', max = 9, truncateAt = 12) {
  return name.length >= truncateAt ? `${name.slice(0, max)}..` : name
}
export function growthCompareHTML(b: any) {
  const s = b.stats,
    g = b.growths
  const power = statLabel(b, 'str')
  const baseLine = `Bases   HP ${padCell(s.hp)}   ${power} ${padCell(s.str)}   Skl ${padCell(s.skl)}   Spd ${padCell(s.spd)}   Lck ${padCell(s.lck)}   Def ${padCell(s.def)}   Res ${padCell(s.res)}`
  const growLine = `Growths HP ${padCell(g.hp)}%  ${power} ${padCell(g.str)}%  Skl ${padCell(g.skl)}%  Spd ${padCell(g.spd)}%  Lck ${padCell(g.lck)}%  Def ${padCell(g.def)}%  Res ${padCell(g.res)}%`
  return `<div class="statCompare">${baseLine}
${growLine}</div>`
}
export function renderDraft() {
  renderBiomeMap()
  const selectedCount = selectedRosterCount()
  $('rosterCount').textContent = String(selectedCount)
  $('draftHint').textContent =
    selectedCount === ROSTER_SIZE
      ? 'Roster locked: ' + state.draft.chosen.join(', ') + '.'
      : `Choose ${ROSTER_SIZE - selectedCount} more unit${ROSTER_SIZE - selectedCount === 1 ? '' : 's'}.`
  ;($('startBtn') as HTMLButtonElement).disabled = selectedCount !== ROSTER_SIZE
  const list = $('draftList')
  list.innerHTML = ''
  state.draft.options.forEach((slot, slotIndex) => {
    const slotEl = document.createElement('section')
    slotEl.className = 'draftSlot'
    const isLeaderSlot = slotIndex === 0
    const slotTitle = isLeaderSlot ? `Slot ${slotIndex + 1}: Leader (+${LEADER_BONUS_LEVELS} levels)` : `Slot ${slotIndex + 1}`
    slotEl.innerHTML = `<div class="row space"><h3>${slotTitle}</h3></div><div class="draftChoices"></div>`
    const choices = slotEl.querySelector<HTMLElement>('.draftChoices')!
    slot
      .map((n) => BASES.find((b) => b.name === n)!)
      .forEach((b) => {
        const c = CLASSES[b.cls]
        const el = document.createElement('button')
        el.type = 'button'
        el.className = `draftChoice unitCard ${state.draft.chosen[slotIndex] === b.name ? 'selected' : ''}`
        const personalNote = b.startOffset ? ` · starts with +${b.startOffset} levels` : ''
        el.innerHTML = `${portraitImgForBase(b, c)}<div><div class="row space"><div><div class="name">${b.name}</div><div class="class">${b.cls} · ${b.weaponType}${personalNote}</div></div><span class="pill">${startingWeapon(b.weaponType).name}</span></div>${growthCompareHTML(b)}</div>`
        el.onclick = () => {
          state.draft.chosen[slotIndex] = b.name
          renderDraft()
        }
        choices.appendChild(el)
      })
    list.appendChild(slotEl)
  })
}
export function weaponStatHTML(w: Weapon) {
  if (!w) return ''
  const fx = staffEffect(w)
  const labels = w.staff
    ? fx === 'heal'
      ? [
          ['Heal', w.mt],
          ['Wt', w.wt],
        ]
      : fx === 'fortify'
        ? [
            ['Heal', 'Mag'],
            ['Wt', w.wt],
          ]
        : [
            ['Fx', statusName(fx)],
            ['Hit', w.hit],
            ['Wt', w.wt],
          ]
    : [
        ['Mt', w.mt],
        ['Hit', w.hit],
        ['Crit', w.crit || 0],
        ['Wt', w.wt],
      ]
  const eff = weaponEffectLabels(w)
  if (eff.length) labels.push([eff.join(', '), ''])
  return `<div class="weaponStats">${labels.map(([k, v]) => `<span><b>${k}</b> ${v}</span>`).join('')}</div>`
}
export function statHTML(u: Unit, showGrowths = false) {
  return (['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res', 'con'] as StatKey[])
    .map((k) => {
      const growth = u.growths[k] == null ? '--' : u.growths[k]
      // Show base/permanent stats, not temporary buffs: applyStatBuff adds rally/tonic
      // buffs into u.stats, so subtract the buff buckets here. The buff stays visible in
      // the card's buff label and in the derived dmg/AS/Hit/Avo values.
      const tempBuff = ((u.turnBuffs?.[k] as number) || 0) + ((u.tempBuffs?.[k] as number) || 0)
      return `<span><b>${statLabel(u, k)}</b> ${showGrowths ? growth : (u.stats[k] || 0) - tempBuff}</span>`
    })
    .join('')
}
export function growthSummaryHTML(u: Unit) {
  const g = u.growths
  return `<span class="muted">(${(['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res'] as StatKey[]).map((k) => `${statLabel(u, k)} ${g[k]}%`).join(', ')})</span>`
}
export function heldItemFromRef(ref: any) {
  if (!ref) return null
  if (typeof ref === 'string') return HELD_ITEMS.find((item) => item.id === ref) || null
  return ref
}
export function skillFromRef(ref: any) {
  if (!ref) return null
  if (typeof ref === 'string') return TEACHABLE_SKILLS.find((skill) => skill.id === ref) || null
  return ref
}
export function rarityClass(rarity: any) {
  return rarity ? ` reward-${rarity}` : ''
}
export function detailEntryHTML(title: string, value: any, desc = '', rarity = '') {
  const descHTML = desc ? `<div class="small">${desc}</div>` : ''
  return `<div class="unitDetailEntry${rarityClass(rarity)}"><div class="row space"><b>${title}</b><span>${value}</span></div>${descHTML}</div>`
}
export function unitCard(u: Unit) {
  const wt = u.weapon ? ` · ${u.weapon.name}` : ''
  const st = statusLabel(u)
  const status = st ? ` · ${st}` : ''
  const leader = u.isLeader ? ' · Leader' : ''
  const buffs = temporaryBuffLabel(u)
  const buffText = buffs ? ` · ${buffs}` : ''
  const portrait = portraitImgForUnit(u)
  const effectBracket = (desc: string) => (desc ? ` <span class="effectNote">[${desc}]</span>` : '')
  const held = u.heldItem ? `<div class="small heldLine" title="${htmlAttr(u.heldItem.desc || '')}">${u.heldItem.name}${effectBracket(u.heldItem.desc || '')}</div>` : ''
  const skill = u.skill ? `<div class="small heldLine" title="${htmlAttr(u.skill.desc || '')}">${u.skill.name}${effectBracket(u.skill.desc || '')}</div>` : ''
  const itemSkillList = held || skill ? `<div class="cardItemList">${held}${skill}</div>` : ''
  const dmg = displayAttackPower(u)
  const pill = u.weapon?.staff ? `${attackSpeed(u)} AS` : `${dmg} dmg / ${attackSpeed(u)} AS`
  return `<div class="card unitCard ${u.hp <= 0 ? 'dead' : ''}"><div class="portraitStack">${portrait}</div><div><div class="row space"><div><div class="name">${u.name}</div><div class="class">${u.displayCls} ${levelLabel(u)}${leader}${wt}${status}${buffText}</div></div><span class="pill">${pill}</span></div><div class="hpbar"><i style="width:${(100 * u.hp) / u.maxHp}%"></i></div><div class="small">HP ${u.hp}/${u.maxHp} · Hit ${u.weapon.staff ? '--' : hitRate(u, { weapon: { type: 'none' }, stats: { lck: 0, spd: 0, con: 99 } } as any)} · Avo ${avoid(u)} · Crit ${u.weapon.staff ? '--' : floor((u.weapon.crit || 0) + u.stats.skl / 2 + (u.heldItem?.crit || 0) + (u.skill?.crit || 0))}</div>${weaponStatHTML(u.weapon)}<div class="stats">${statHTML(u)}</div>${itemSkillList}</div></div>`
}
export function renderConsumables() {
  const panel = $('consumablePanel')
  if (!panel) return
  const actor = (state.ui.activeConsumableActor?.hp ?? 0) > 0 ? state.ui.activeConsumableActor : null
  const filled = state.consumables.filter(Boolean).length
  const slots = Array.from({ length: CONSUMABLE_SLOTS }, (_, i) => state.consumables[i] || null)
  const slotHtml = slots
    .map((item, i) => {
      if (!item) return `<div class="consumableSlot empty"><div class="small">Slot ${i + 1}</div><div>Empty</div></div>`
      const targets = actor ? consumableTargets(item) : []
      const canUse = !!(actor && state.combat.pendingConsumableAction && targets.length)
      const title = canUse ? `Use ${item.name}` : actor ? 'No valid target right now' : 'Usable on player turns'
      return `<div class="consumableSlot"><div class="small">${weaponTierLabel(item.tier)}</div><div class="name">${item.name}</div><div class="small">${consumableSummary(item)}</div><button data-use-consumable="${i}" title="${htmlAttr(title)}"${canUse ? '' : ' disabled'}>Use</button></div>`
    })
    .join('')
  const defaultButton = state.combat.pendingDefaultAction ? `<button class="turnAction" data-default-action>${state.combat.pendingDefaultLabel}</button>` : ''
  const activeNote = actor ? `<div class="small">Active: ${actor.name}</div>` : ''
  panel.innerHTML = `<div class="row space"><h3>Consumables</h3><span class="badge">${filled}/${CONSUMABLE_SLOTS}</span></div>${activeNote}<div class="consumableSlots">${slotHtml}</div>${defaultButton}`
  panel.querySelectorAll<HTMLElement>('[data-use-consumable]').forEach((btn) => (btn.onclick = () => state.combat.pendingConsumableAction?.(+btn.dataset.useConsumable!)))
  const defaultBtn = panel.querySelector<HTMLElement>('[data-default-action]')
  if (defaultBtn) defaultBtn.onclick = () => state.combat.pendingDefaultAction?.()
}
export function renderSideCards() {
  renderConsumables()
  $('playerTeam').innerHTML = state.player.map(unitCard).join('')
  $('enemyTeam').innerHTML = state.enemy.map(unitCard).join('')
}
export function updateCombatLogTitle() {
  const title = $('combatLogTitle')
  if (!title) return
  title.textContent = state.combat.turn > 0 ? `Combat log - Turn ${state.combat.turn}` : 'Combat log'
}
export function updateNextEnemyMarker(startIndex = 0) {
  const idx = nextLivingIndex(state.enemy, startIndex)
  state.combat.nextEnemyMarkerId = idx >= 0 ? state.enemy[idx].id : null
}
export function renderTeams() {
  $('battleNo').textContent = String(state.battle)
  $('rosterCount').textContent = String(state.player.length || selectedRosterCount())
  updateGoldUI()
  renderBiomeMap()
  updateMainModeTitle()
  updateCombatLogTitle()
  renderSideCards()
  $('blueSprites').innerHTML = state.player.map((u) => combatantSpriteSlot(u, false)).join('')
  $('redSprites').innerHTML = state.enemy.map((u) => combatantSpriteSlot(u, true)).join('')
  updateAutoFightButton()
}
export function combatantSpriteSlot(u: Unit, isEnemy = false) {
  const preview = isEnemy ? combatPreviewHTML(state.ui.activePreviewActor as Unit, u) : ''
  const previewClass = preview ? 'combatPreview' : 'combatPreview empty'
  const boss = u.bossTier === BOSS_TIER_BIOME ? ' <div class="bossTag">ARENA BOSS</div>' : u.bossTier === BOSS_TIER_REGULAR ? ' <div class="bossTag">BOSS</div>' : ''
  const st = statusLabel(u)
  const status = st ? ` ${st}` : ''
  const next =
    isEnemy && u.id === state.combat.nextEnemyMarkerId && u.hp > 0
      ? '<span class="nextMarker" title="Moves next" aria-label="Moves next"><svg viewBox="0 0 24 24" role="img" focusable="false"><path d="M12 20 L4 8 H20 Z"/></svg></span>'
      : ''
  const hpLine = `${levelLabel(u)} - ${u.hp}/${u.maxHp}`
  const weaponDanger = isEnemy && u.weapon && enemyWeaponDangerous(u) ? ' weaponDanger' : ''
  const weaponLine = u.weapon ? `<div class="small weaponLine${weaponDanger}" title="${htmlAttr(u.weapon.name)}">${truncWeaponName(u.weapon.name)}</div>` : ''
  return `<div class="combatSlot"><div class="combatant ${u.hp <= 0 ? 'dead' : ''}" data-id="${u.id}">${next}${battleImgForUnit(u)}<div class="small">${u.name}${boss}${status}</div><div class="hpbar"><i style="width:${(100 * u.hp) / u.maxHp}%"></i></div><div class="hpText">${hpLine}</div>${weaponLine}</div><div class="${previewClass}">${preview || '&nbsp;'}</div></div>`
}
export function logLine(logEl: any, msg: string, cls = '') {
  const p = document.createElement('p')
  p.className = cls
  p.textContent = msg
  ;(logEl || $('log')).prepend(p)
}

export function selectionChoiceHTML(title: string, desc: any, buttonAttr: any, buttonLabel: any, extraClass = '', buttonClass = 'good', shellClass = 'choice', descClass = '') {
  const descClassAttr = descClass ? ` class="${descClass}"` : ''
  return `<div class="${shellClass}${extraClass}"><div><h4>${title}</h4><div${descClassAttr}>${desc}</div></div><button ${buttonAttr} class="${buttonClass}">${buttonLabel}</button></div>`
}
export function weaponSummary(w: Weapon, forForge = false) {
  const fx = staffEffect(w)
  const effects = weaponEffectLabels(w)
  const effectText = effects.length ? `, ${effects.join(', ')}` : ''
  if (fx === 'heal') return `Staff, Rank ${w.rank}, Heal ${w.mt}+Mag${effectText}`
  if (fx === 'fortify') return `Staff, Rank ${w.rank}, heals all allies by Mag${effectText}`
  if (fx === 'sleep' || fx === 'berserk') return `Staff, Rank ${w.rank}, ${statusName(fx)}, Hit ${w.hit}${effectText}`
  if (forForge) return `Mt ${w.mt}, Hit ${w.hit}`
  return `Mt ${w.mt}, Hit ${w.hit}, Wt ${w.wt}, Crit ${w.crit}, Rank ${w.rank}${effectText}`
}
// Net per-weapon speed impact: the weapon's speed bonus minus the Con-based weight
// penalty (max(0, wt - con)). Unclamped, so a light weapon's bonus reads as a positive
// (e.g. Slim Sword: +4) and a heavy weapon reads as a negative.
export function weaponNetSpeed(unit: Unit, item: any) {
  return (item.speedBonus || 0) - Math.max(0, (item.wt || 0) - unit.stats.con)
}
function fmtSignedSpd(n: number) {
  return n > 0 ? `+${n}` : n < 0 ? `${n}` : '±0'
}
export function weaponReplacementText(unit: Unit) {
  return unit.weapon ? `${unit.weapon.name} (${weaponSummary(unit.weapon)})` : 'nothing'
}
const SPD_ARROW = '<span class="spdArrow">→</span>'
export function weaponOfferTitle(item: any, unit: Unit | null = null) {
  if (!unit) return item.name
  // Show the con-based net speed change as an arrow (current weapon → this weapon), with the
  // weapon's speed bonus folded in: e.g. "Spd -4 → -1". When equipping wouldn't change the
  // net speed (or there's no current weapon), show just the single value: e.g. "Spd +4".
  const next = weaponNetSpeed(unit, item)
  const cur = unit.weapon ? weaponNetSpeed(unit, unit.weapon) : next
  const spdText = cur === next ? `Spd ${fmtSignedSpd(next)}` : `Spd ${fmtSignedSpd(cur)} ${SPD_ARROW} ${fmtSignedSpd(next)}`
  return `${item.name} to ${unit.name} (${spdText})`
}
export function weaponOfferDescription(item: any, unit: Unit | null = null, opts: any = {}) {
  const action = opts.action || 'Equip'
  const includeTier = opts.includeTier !== false
  const lead = unit ? `${action} ${unit.name} with ${item.name}` : `${action} ${item.name}`
  const meta = []
  if (includeTier) meta.push(weaponTierLabel(item.tier))
  if (unit) meta.push(`Replaces ${weaponReplacementText(unit)}`)
  return `${lead} (${weaponSummary(item)}).${meta.length ? `<div class="small rewardMeta">${meta.join(' · ')}</div>` : ''}`
}
export function heldItemReplacementText(unit: Unit) {
  return unit.heldItem ? `Replaces ${unit.heldItem.name}` : 'Currently no item'
}
export function heldItemOfferTitle(item: any, unit: Unit | null = null) {
  return unit ? `${item.name} to ${unit.name}` : item.name
}
export function heldItemOfferDescription(item: any, unit: Unit | null = null, opts: any = {}) {
  const action = opts.action || 'Give'
  const includeTier = opts.includeTier !== false
  const lead = unit ? `${action} ${item.name} to ${unit.name}` : `${action} ${item.name}`
  const meta = []
  if (includeTier) meta.push(weaponTierLabel(item.tier))
  if (unit) meta.push(heldItemReplacementText(unit))
  return `${lead}: ${item.desc}${meta.length ? `<div class="small rewardMeta">${meta.join(' · ')}</div>` : ''}`
}
export function skillOfferTitle(skill: any, unit: Unit | null = null) {
  return unit ? `${skill.name} to ${unit.name}` : skill.name
}
// Class-eligible player units that can equip a skill, or 'All units' for a
// general ('Any'-class) skill. Mirrors skillClassMatches in rewards.ts (inlined
// here to avoid a render <-> rewards import cycle).
export function skillEligibleUnitsLabel(skill: any) {
  if (skill.classes?.includes('Any')) return 'All units'
  return state.player
    .filter((u) => skill.classes?.includes(u.cls) || skill.classes?.includes(u.displayCls))
    .map((u) => u.name)
    .join(', ')
}
export function skillOfferDescription(skill: any, unit: Unit | null = null, opts: any = {}) {
  const action = opts.action || 'Teach'
  const lead = unit ? `${action} ${skill.name} to ${unit.name}` : `${action} ${skill.name}`
  const rarity = weaponTierLabel(skill.rarity)
  // On the shop browse card (no chosen student yet) list who can equip the skill,
  // separated from the rarity by a center-dot like the unit card's stat list.
  const eligible = unit ? '' : skillEligibleUnitsLabel(skill)
  const meta = [eligible ? `${rarity} · ${eligible}` : rarity]
  if (unit) meta.push(unit.skill ? `Replaces ${unit.skill.name}` : 'No current skill')
  return `${lead}: ${skill.desc}<div class="small rewardMeta">${meta.join(' · ')}</div>`
}
