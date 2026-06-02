'use strict'

function selectedRosterCount() {
  return chosen.filter(Boolean).length
}
function emptyRosterChoices() {
  return Array(ROSTER_SIZE).fill(null)
}
function randomDraftOptions() {
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
function padCell(v, w = 2) {
  return String(v).padStart(w, ' ')
}
function growthCompareHTML(b) {
  const s = b.stats,
    g = b.growths
  const power = statLabel(b, 'str')
  const baseLine = `Bases   HP ${padCell(s.hp)}   ${power} ${padCell(s.str)}   Skl ${padCell(s.skl)}   Spd ${padCell(s.spd)}   Lck ${padCell(s.lck)}   Def ${padCell(s.def)}   Res ${padCell(s.res)}`
  const growLine = `Growths HP ${padCell(g.hp)}%  ${power} ${padCell(g.str)}%  Skl ${padCell(g.skl)}%  Spd ${padCell(g.spd)}%  Lck ${padCell(g.lck)}%  Def ${padCell(g.def)}%  Res ${padCell(g.res)}%`
  return `<div class="statCompare">${baseLine}
${growLine}</div>`
}
function renderDraft() {
  renderBiomeMap()
  const selectedCount = selectedRosterCount()
  $('rosterCount').textContent = selectedCount
  $('draftHint').textContent =
    selectedCount === ROSTER_SIZE
      ? 'Roster locked: ' + chosen.join(', ') + '.'
      : `Choose ${ROSTER_SIZE - selectedCount} more unit${ROSTER_SIZE - selectedCount === 1 ? '' : 's'}.`
  $('startBtn').disabled = selectedCount !== ROSTER_SIZE
  const list = $('draftList')
  list.innerHTML = ''
  draftOptions.forEach((slot, slotIndex) => {
    const slotEl = document.createElement('section')
    slotEl.className = 'draftSlot'
    const isLeaderSlot = slotIndex === 0
    const slotTitle = isLeaderSlot ? `Slot ${slotIndex + 1}: Leader (+${LEADER_BONUS_LEVELS} levels)` : `Slot ${slotIndex + 1}`
    slotEl.innerHTML = `<div class="row space"><h3>${slotTitle}</h3><span class="badge">${isLeaderSlot ? `+${LEADER_BONUS_LEVELS} levels` : 'Normal start'}</span></div><div class="draftChoices"></div>`
    const choices = slotEl.querySelector('.draftChoices')
    slot
      .map((n) => BASES.find((b) => b.name === n))
      .forEach((b) => {
        const c = CLASSES[b.cls]
        const el = document.createElement('button')
        el.type = 'button'
        el.className = `draftChoice unitCard ${chosen[slotIndex] === b.name ? 'selected' : ''}`
        const personalNote = b.startOffset ? ` · starts with +${b.startOffset} levels` : ''
        el.innerHTML = `${portraitImgForBase(b, c)}<div><div class="row space"><div><div class="name">${b.name}</div><div class="class">${b.cls} · ${b.weaponType}${personalNote}</div></div><span class="pill">${startingWeapon(b.weaponType).name}</span></div>${growthCompareHTML(b)}</div>`
        el.onclick = () => {
          chosen[slotIndex] = b.name
          renderDraft()
        }
        choices.appendChild(el)
      })
    list.appendChild(slotEl)
  })
}
function weaponStatHTML(w) {
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
function statHTML(u, showGrowths = false) {
  return ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res', 'con']
    .map((k) => {
      const growth = u.growths[k] == null ? '--' : u.growths[k]
      return `<span><b>${statLabel(u, k)}</b> ${showGrowths ? growth : u.stats[k]}</span>`
    })
    .join('')
}
function growthSummaryHTML(u) {
  const g = u.growths
  return `<span class="muted">(${['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res'].map((k) => `${statLabel(u, k)} ${g[k]}%`).join(', ')})</span>`
}
function heldItemFromRef(ref) {
  if (!ref) return null
  if (typeof ref === 'string') return HELD_ITEMS.find((item) => item.id === ref) || null
  return ref
}
function skillFromRef(ref) {
  if (!ref) return null
  if (typeof ref === 'string') return TEACHABLE_SKILLS.find((skill) => skill.id === ref) || null
  return ref
}
function rarityClass(rarity) {
  return rarity ? ` reward-${rarity}` : ''
}
function detailEntryHTML(title, value, desc = '', rarity = '') {
  const descHTML = desc ? `<div class="small">${desc}</div>` : ''
  return `<div class="unitDetailEntry${rarityClass(rarity)}"><div class="row space"><b>${title}</b><span>${value}</span></div>${descHTML}</div>`
}
function unitDetailsHTML(u) {
  const held = heldItemFromRef(u.heldItem || u.heldItemId || u.item)
  const skillRefs = Array.isArray(u.skills) ? u.skills : Array.isArray(u.skillIds) ? u.skillIds : []
  const skills = skillRefs.map(skillFromRef).filter(Boolean)
  const heldHTML = held
    ? detailEntryHTML('Held item', held.name, held.desc, held.tier)
    : detailEntryHTML('Held item', 'None')
  const skillsHTML = skills.length
    ? skills.map((skill) => detailEntryHTML('Skill', skill.name, skill.desc, skill.rarity)).join('')
    : detailEntryHTML('Skills', 'None')
  return `<div class="unitDetails">${heldHTML}${skillsHTML}</div>`
}
function unitCard(u) {
  const wt = u.weapon ? ` · ${u.weapon.name}` : ''
  const st = statusLabel(u)
  const status = st ? ` · ${st}` : ''
  const leader = u.isLeader ? ' · Leader' : ''
  const buffs = temporaryBuffLabel(u)
  const buffText = buffs ? ` · ${buffs}` : ''
  const portrait = portraitImgForUnit(u)
  const expanded = activeDetailActorIds.includes(u.id)
  return `<div class="card unitCard ${u.hp <= 0 ? 'dead' : ''}${expanded ? ' expanded' : ''}" data-detail-card data-unit-id="${u.id}" role="button" tabindex="0" aria-expanded="${expanded ? 'true' : 'false'}"><div class="portraitStack">${portrait}<div class="detailModeLabel">Growths + details</div></div><div><div class="row space"><div><div class="name">${u.name}</div><div class="class">${u.displayCls} ${levelLabel(u)}${leader}${wt}${status}${buffText}</div></div><span class="pill">AS ${attackSpeed(u)}</span></div><div class="hpbar"><i style="width:${(100 * u.hp) / u.maxHp}%"></i></div><div class="small">HP ${u.hp}/${u.maxHp} · Hit ${u.weapon.staff ? '--' : hitRate(u, { weapon: { type: 'none' }, stats: { lck: 0, spd: 0, con: 99 } })} · Avo ${avoid(u)} · Crit ${u.weapon.staff ? '--' : floor((u.weapon.crit || 0) + u.stats.skl / 2)}</div>${weaponStatHTML(u.weapon)}<div class="stats">${statHTML(u, expanded)}</div>${expanded ? unitDetailsHTML(u) : ''}</div></div>`
}

function renderConsumables() {
  const panel = $('consumablePanel')
  if (!panel) return
  const actor = activeConsumableActor?.hp > 0 ? activeConsumableActor : null
  const filled = consumables.filter(Boolean).length
  const slots = Array.from({ length: CONSUMABLE_SLOTS }, (_, i) => consumables[i] || null)
  const slotHtml = slots
    .map((item, i) => {
      if (!item) return `<div class="consumableSlot empty"><div class="small">Slot ${i + 1}</div><div>Empty</div></div>`
      const targets = actor ? consumableTargets(item) : []
      const canUse = !!(actor && pendingConsumableAction && targets.length)
      const title = canUse ? `Use ${item.name}` : actor ? 'No valid target right now' : 'Usable on player turns'
      return `<div class="consumableSlot"><div class="small">${weaponTierLabel(item.tier)}</div><div class="name">${item.name}</div><div class="small">${consumableSummary(item)}</div><button data-use-consumable="${i}" title="${htmlAttr(title)}"${canUse ? '' : ' disabled'}>Use</button></div>`
    })
    .join('')
  const defaultButton = pendingDefaultAction ? `<button class="turnAction" data-default-action>${pendingDefaultLabel}</button>` : ''
  const activeNote = actor ? `<div class="small">Active: ${actor.name}</div>` : ''
  panel.innerHTML = `<div class="row space"><h3>Consumables</h3><span class="badge">${filled}/${CONSUMABLE_SLOTS}</span></div>${activeNote}<div class="consumableSlots">${slotHtml}</div>${defaultButton}`
  panel.querySelectorAll('[data-use-consumable]').forEach((btn) => (btn.onclick = () => pendingConsumableAction?.(+btn.dataset.useConsumable)))
  const defaultBtn = panel.querySelector('[data-default-action]')
  if (defaultBtn) defaultBtn.onclick = () => pendingDefaultAction?.()
}
function renderSideCards() {
  renderConsumables()
  $('playerTeam').innerHTML = player.map(unitCard).join('')
  $('enemyTeam').innerHTML = enemy.map(unitCard).join('')
  bindDetailCards()
}
function updateCombatLogTitle() {
  const title = $('combatLogTitle')
  if (!title) return
  title.textContent = combatTurn > 0 ? `Combat log - Turn ${combatTurn}` : 'Combat log'
}
function bindDetailCards() {
  document.querySelectorAll('[data-detail-card]').forEach((card) => {
    const toggle = () => {
      const unitId = card.dataset.unitId
      activeDetailActorIds = activeDetailActorIds.includes(unitId) ? activeDetailActorIds.filter((id) => id !== unitId) : [...activeDetailActorIds, unitId]
      renderSideCards()
    }
    card.onclick = toggle
    card.onkeydown = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      toggle()
    }
  })
}
function updateNextEnemyMarker(startIndex = 0) {
  const idx = nextLivingIndex(enemy, startIndex)
  nextEnemyMarkerId = idx >= 0 ? enemy[idx].id : null
}
function renderTeams() {
  $('battleNo').textContent = battle
  $('rosterCount').textContent = player.length || selectedRosterCount()
  updateGoldUI()
  renderBiomeMap()
  updateMainModeTitle()
  updateCombatLogTitle()
  renderSideCards()
  $('blueSprites').innerHTML = player.map((u) => combatantSpriteSlot(u, false)).join('')
  $('redSprites').innerHTML = enemy.map((u) => combatantSpriteSlot(u, true)).join('')
  updateAutoFightButton()
}
function combatantSpriteSlot(u, isEnemy = false) {
  const preview = isEnemy ? combatPreviewHTML(activePreviewActor, u) : ''
  const previewClass = preview ? 'combatPreview' : 'combatPreview empty'
  const boss = u.bossTier === BOSS_TIER_BIOME ? ' <div class="bossTag">ARENA BOSS</div>' : u.bossTier === BOSS_TIER_REGULAR ? ' <div class="bossTag">BOSS</div>' : ''
  const st = statusLabel(u)
  const status = st ? ` ${st}` : ''
  const next =
    isEnemy && u.id === nextEnemyMarkerId && u.hp > 0
      ? '<span class="nextMarker" title="Moves next" aria-label="Moves next"><svg viewBox="0 0 24 24" role="img" focusable="false"><path d="M12 20 L4 8 H20 Z"/></svg></span>'
      : ''
  const hpLine = `${levelLabel(u)} - ${u.hp}/${u.maxHp}`
  return `<div class="combatSlot"><div class="combatant ${u.hp <= 0 ? 'dead' : ''}" data-id="${u.id}">${next}${battleImgForUnit(u)}<div class="small">${u.name}${boss}${status}</div><div class="hpbar"><i style="width:${(100 * u.hp) / u.maxHp}%"></i></div><div class="hpText">${hpLine}</div></div><div class="${previewClass}">${preview || '&nbsp;'}</div></div>`
}
function logLine(logEl, msg, cls = '') {
  const p = document.createElement('p')
  p.className = cls
  p.textContent = msg
  ;(logEl || $('log')).prepend(p)
}

function selectionChoiceHTML(title, desc, buttonAttr, buttonLabel, extraClass = '', buttonClass = 'good', shellClass = 'choice', descClass = '') {
  const descClassAttr = descClass ? ` class="${descClass}"` : ''
  return `<div class="${shellClass}${extraClass}"><div><h4>${title}</h4><div${descClassAttr}>${desc}</div></div><button ${buttonAttr} class="${buttonClass}">${buttonLabel}</button></div>`
}
function weaponSummary(w, forForge = false) {
  const fx = staffEffect(w)
  const effects = weaponEffectLabels(w)
  const effectText = effects.length ? `, ${effects.join(', ')}` : ''
  if (fx === 'heal') return `Staff, Rank ${w.rank}, Heal ${w.mt}+Mag${effectText}`
  if (fx === 'fortify') return `Staff, Rank ${w.rank}, heals all allies by Mag${effectText}`
  if (fx === 'sleep' || fx === 'berserk') return `Staff, Rank ${w.rank}, ${statusName(fx)}, Hit ${w.hit}${effectText}`
  if (forForge) return `Mt ${w.mt}, Hit ${w.hit}`
  return `Mt ${w.mt}, Hit ${w.hit}, Wt ${w.wt}, Crit ${w.crit}, Rank ${w.rank}${effectText}`
}
function weaponSpeedImpact(unit, item) {
  const speedImpact = Math.min(0, unit.stats.con - item.wt + (item.speedBonus || 0))
  const symbol = speedImpact < 0 ? '-' : speedImpact === 0 ? '±' : '+'
  return `${symbol}${Math.abs(speedImpact)}`
}
function weaponReplacementText(unit) {
  return unit.weapon ? `${unit.weapon.name} (${weaponSummary(unit.weapon)})` : 'nothing'
}
function weaponOfferTitle(item, unit = null) {
  if (!unit) return item.name
  return `${item.name} to ${unit.name} (Con: ${unit.stats.con}, Speed ${weaponSpeedImpact(unit, item)})`
}
function weaponOfferDescription(item, unit = null, opts = {}) {
  const action = opts.action || 'Equip'
  const includeTier = opts.includeTier !== false
  const lead = unit ? `${action} ${unit.name} with ${item.name}` : `${action} ${item.name}`
  const meta = []
  if (includeTier) meta.push(weaponTierLabel(item.tier))
  if (unit) meta.push(`Replaces ${weaponReplacementText(unit)}`)
  return `${lead} (${weaponSummary(item)}).${meta.length ? `<div class="small rewardMeta">${meta.join(' · ')}</div>` : ''}`
}
