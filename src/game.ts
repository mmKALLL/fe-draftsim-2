import { ARENA_BOSS_HP_MULT, ARENA_BOSS_HP_MULT_LATE, ARENA_CYCLE_LENGTH, ARENA_CYCLES_PER_RUN, ARENA_ENEMY_FORGE_RANGE, ARENA_ENEMY_LEVEL_BONUS, BOSS_TIER_ARENA, BOSS_TIER_REGULAR, CONSUMABLE_SLOTS, EARLY_ENEMY_LEVEL_PENALTY, EARLY_ENEMY_NERF_BATTLES, ENEMY_ARENA_BANS, ENDLESS_BONUS_EVERY, ENDLESS_BONUS_EVERY_LATE, ENDLESS_BONUS_STEP_ARENA, ENEMY_GOOD_MINION_COUNT, LATE_LEVEL_VARIANCE_AFTER_ARENA, LATE_LEVEL_VARIANCE_PCT, LEADER_BONUS_LEVELS, MAX_ENDLESS_ARENAS, MID_BOSS_HP_MULT, ROSTER_SIZE, GOLD_ARENA_BOSS_BONUS, GOLD_METHOD, GOLD_PER_BATTLE_SURVIVOR, PROTECT_ENABLED, SHOP_ARENA_BOSS_GOLD, SHOW_VICTORY_LOG, STAFF_EXHAUST_ROUND_LIMIT } from '../config'
import { BASES } from '../data'
import { activeArenaEntry, arenaEffectLabels, arenaEffectMultiplier, enemyFocusForSlot, extendArenaPlan, pickBaseFromPool, setAutoFight } from './arenas'
import { applyBattleStartHeldItems, applyBattleStartRallies, applyEndOfTurnStatus, applyProtectRedirect, applyTurnStartRegen, autoFightTargetFor, chooseEnemyTarget, chooseStatusStaffTarget, clearAllProtect, clearHighlights, clearProtect, clearTemporaryBuffs, clearTurnBuffs, clearUnitStatus, computeMaxHp, consumeTurnStatus, enemyDisplayName, flashProtect, hasUsableConsumable, isStatusStaff, nextLivingIndex, resolveActorTurn, selectPlayerAction, setProtect, setStatus, spriteEl, useConsumableFromSlot } from './combat'
import { logLine, renderTeams, selectedRosterCount, updateNextEnemyMarker } from './render'
import { assignEnemyBonuses, firstEmptyConsumableSlot, showRewards } from './rewards'
import { storeConsumable } from './shop'
import { addGold, formatGold } from './state'
import { closeModal, levelLabel, showGameOver, showWin } from './ui'
import { advanceTwoLevels, clericStatusOrHealStaff, consumableById, enemyWeaponFor, forgeWeapon, freshFromBase, internalLevelCap, promotionUnlockedForRegularEnemies, startingConsumables } from './units'
import { $, clamp, floor, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, ArenaFocus, ArenaEntry, ShopOffer } from '../types'


export function startRun(mode: 'draft' | 'random' = 'draft') {
  if (selectedRosterCount() !== ROSTER_SIZE) return
  state.rewardCooldowns = {}
  state.player = state.draft.chosen.map((n, i) => {
    const u = freshFromBase(
      BASES.find((b) => b.name === n),
      false,
      1 + (i === 0 ? LEADER_BONUS_LEVELS : 0),
      false
    )
    u.isLeader = i === 0
    return u
  })
  state.consumables = startingConsumables()
  state.run.mode = mode
  state.run.consumablesAcquired = state.consumables.filter(Boolean).length // seed with the starting count
  state.run.cheated = false
  state.run.recorded = false
  state.run.rewardsByRarity = {}
  state.run.rewardsByType = {}
  state.run.goldByType = {}
  $('menuScreen').classList.add('hidden')
  $('draftScreen').classList.add('hidden')
  $('gameScreen').classList.remove('hidden')
  renderTeams()
  logLine(null, `${state.player[0].name} leads the party and starts at ${levelLabel(state.player[0])}.`, 'heal')
  showRewards(true)
}
export function bossTierForBattle(n: any) {
  const cycle = ((n - 1) % ARENA_CYCLE_LENGTH) + 1
  if (cycle === ARENA_CYCLE_LENGTH) return BOSS_TIER_ARENA
  if (cycle === 3) return BOSS_TIER_REGULAR
  return null
}
export function generateEnemy() {
  state.battle++
  const arena = clamp(floor((state.battle - 1) / 5) + 1, 1, 4)
  const earlyNerf = state.battle <= EARLY_ENEMY_NERF_BATTLES ? EARLY_ENEMY_LEVEL_PENALTY : 0
  // Arenas 3/4 add extra enemy levels to steepen the late-game curve (EaM4uENF).
  // Endless (1T3CRjDJ): +2 internal level/battle through the normal run, +3/battle from arena 5 on,
  // applied INCREMENTALLY (enemyBaseInternalLevel) so the level doesn't jump on entering endless; the
  // internal cap is lifted so enemies keep scaling. Arena stays clamped to 4 (bonuses pin at arena 4).
  const baseInternal = clamp(enemyBaseInternalLevel() - earlyNerf + (ARENA_ENEMY_LEVEL_BONUS[arena - 1] || 0), 1, internalLevelCap())
  const bossTier = bossTierForBattle(state.battle)
  state.enemy = []
  // Decide up front which minion slots carry a 'good' weapon: a bounded count per fight
  // (by arena + battle type), placed in random slots. The boss (slot 0) is always good.
  const battleType = bossTier === BOSS_TIER_ARENA ? 'arena' : bossTier === BOSS_TIER_REGULAR ? 'regular' : 'standard'
  // Exclude bases banned from this arena's enemy pool (e.g. high-stat prepromotes early on).
  const banned = ENEMY_ARENA_BANS[arena] || []
  const pool = BASES.filter((b) => !banned.includes(b.name))
  const minionSlots = [0, 1, 2, 3, 4].filter((i) => !(i === 0 && bossTier))
  const [gMin, gMax] = ENEMY_GOOD_MINION_COUNT[arena - 1][battleType]
  let goodCount = clamp(gMin + rint(gMax - gMin + 1), 0, minionSlots.length)
  const goodMinionSlots = new Set<number>()
  const availSlots = [...minionSlots]
  while (goodCount-- > 0 && availSlots.length) goodMinionSlots.add(availSlots.splice(rint(availSlots.length), 1)[0])
  // Arena 1 only: a fresh team can't handle multiple armored/flying tanks, so cap
  // Knight + Wyvern enemies at one per fight (boss included). After the first such
  // pick, drop the rest of that combo from the pool so no later slot can roll one.
  let arenaTankyPicked = false
  for (let i = 0; i < 5; i++) {
    const isBossSlot = i === 0 && bossTier
    const b = pickBaseFromPool(pool, enemyFocusForSlot(isBossSlot, bossTier)) || pick(BASES)
    if (arena === 1 && !arenaTankyPicked && (b.cls === 'Knight' || b.cls === 'Wyvern')) {
      arenaTankyPicked = true
      for (let j = pool.length - 1; j >= 0; j--) if (pool[j].cls === 'Knight' || pool[j].cls === 'Wyvern') pool.splice(j, 1)
    }
    // Bosses have extra levels; normal units have slight variance
    // Deep endless (past LATE_LEVEL_VARIANCE_AFTER_ARENA): jitter each enemy's level by up to
    // +-LATE_LEVEL_VARIANCE_PCT of the base level, on top of the boss/minion offsets.
    const lateVariance =
      state.battle > LATE_LEVEL_VARIANCE_AFTER_ARENA * ARENA_CYCLE_LENGTH ? Math.round(baseInternal * LATE_LEVEL_VARIANCE_PCT * (rnd() * 2 - 1)) : 0
    const internal = clamp(baseInternal + (isBossSlot ? (bossTier === BOSS_TIER_ARENA ? 6 : 4) : rnd() < 0.5 ? rint(3) - 1 : 0) + lateVariance, 1, internalLevelCap())
    const promoted = (isBossSlot || promotionUnlockedForRegularEnemies()) && internal > 20
    const lvl = promoted ? internal - 20 : internal
    const e = freshFromBase(b, true, lvl, promoted, !!isBossSlot)
    // Endless (1T3CRjDJ) keeps the continuous internal-level display set in freshFromBase (up to 99);
    // normally prepromotes show a small display bump, clamped to 20.
    if (state.run.endlessExtensions === 0) e.lvl = clamp(lvl + Math.ceil(b.startOffset / 2), 1, 20)
    // Boss HP: mid (battle-3) bosses keep 1.25x; arena (battle-5) bosses hit 1.5x in
    // the last two arenas, 1.25x earlier (EaM4uENF). Stored as hpMult and folded into
    // computeMaxHp so it survives refreshMaxHp() in assignEnemyBonuses (xcZugbQ4).
    if (isBossSlot) {
      e.hpMult = bossTier === BOSS_TIER_ARENA ? (arena >= 3 ? ARENA_BOSS_HP_MULT_LATE : ARENA_BOSS_HP_MULT) : MID_BOSS_HP_MULT
      e.maxHp = computeMaxHp(e)
    }
    e.bossTier = isBossSlot ? bossTier : null
    e.palette = 'red'
    e.team = 'red'
    // Unpromoted lord-class enemies (e.g. Hector, whose weaponType is axe) should always
    // wield a sword; force the sword type so enemyWeaponFor picks from the sword pool.
    if (e.kind === 'lord' && !e.promoted && e.weaponType !== 'sword') e.weaponType = 'sword'
    e.weapon = enemyWeaponFor(e, e.bossTier, !!isBossSlot || goodMinionSlots.has(i))
    e.name = enemyDisplayName(e)
    assignEnemyBonuses(e, isBossSlot ? 'boss' : 'minion')
    e.hp = e.maxHp
    state.enemy.push(e)
  }
  // When 2+ staff units (clerics) roll on a team, every one but the LAST gets a 75%
  // chance of a status staff (sleep/berserk/poison) and 25% chance of a heal staff;
  // the last cleric keeps its normally rolled weapon. With only 1 cleric, nothing changes.
  const staffUnits = state.enemy.filter((e) => e.weapon?.staff)
  if (staffUnits.length >= 2) {
    for (const e of staffUnits.slice(0, -1)) e.weapon = clericStatusOrHealStaff(e)
  }
  // Extra weapon forges for the arena (EaM4uENF), rolled once as a TEAM budget — not per
  // enemy — and handed to random non-staff enemies (stacking allowed). Runs after cleric
  // staff reassignment so only final, non-staff weapons are eligible.
  const [fMin, fMax] = ARENA_ENEMY_FORGE_RANGE[arena - 1] || [0, 0]
  const forgeable = state.enemy.filter((e) => e.weapon && !e.weapon.staff)
  if (forgeable.length) for (let f = fMin + rint(fMax - fMin + 1); f > 0; f--) forgeWeapon(pick(forgeable).weapon)
  state.ui.activePreviewActor = null
  state.combat.nextEnemyMarkerId = null
  state.combat.turn = 0
  $('log').innerHTML = ''
  setStatus('')
  const arenaData = activeArenaEntry()?.arena
  const arenaPrefix = arenaData ? `${arenaData.name} (${arenaEffectLabels(arenaData, arenaEffectMultiplier()).join(', ')}): ` : ''
  const msg =
    bossTier === BOSS_TIER_ARENA
      ? 'Arena boss fight: +6 level leader with stronger weapons.'
      : bossTier === BOSS_TIER_REGULAR
        ? 'Regular boss fight: +4 level leader.'
        : 'Standard enemy team.'
  logLine(null, `Battle ${state.battle}: ${arenaPrefix}${msg}`, bossTier ? 'crit' : 'hit')
  renderTeams()
}
export function beginNextBattle() {
  if (state.combat.running || state.ui.awaitingReward) return
  generateEnemy()
  runBattle()
}
export function debugWinBattle() {
  if (!state.combat.running || !state.enemy.some((x) => x.hp > 0)) return
  state.enemy.forEach((u) => {
    u.hp = 0
    clearUnitStatus(u)
  })
  if (state.combat.pendingTargetCancel) state.combat.pendingTargetCancel()
  clearHighlights()
  setStatus('Debug win: enemy team defeated.')
  logLine(null, 'Debug hotkey: enemy team defeated.', 'crit')
  renderTeams()
}
export function debugAddGeosphere() {
  const item = consumableById('geosphere')
  if (!item) return
  if (!state.player.length || state.consumables.length < CONSUMABLE_SLOTS) {
    setStatus('Debug Geosphere: start a run first.')
    return
  }
  const slot = firstEmptyConsumableSlot()
  if (slot === -1) {
    setStatus('Debug Geosphere: no empty consumable slot.')
    logLine(null, 'Debug hotkey: no empty consumable slot for Geosphere.', 'miss')
    return
  }
  storeConsumable(item, slot)
  setStatus(`Debug Geosphere: added to slot ${slot + 1}.`)
  logLine(null, `Debug hotkey: added Geosphere to slot ${slot + 1}.`, 'crit')
}
export async function runBattle() {
  if (state.combat.running || !state.enemy.length) return
  state.combat.running = true
  clearAllProtect() // no protect cover carries over between battles
  state.combat.turn = 1
  const token = state.runToken
  let actions = 0,
    side = 'player',
    pIdx = 0,
    eIdx = 0,
    staffExhaustionLogged = false
  updateNextEnemyMarker(eIdx)
  renderTeams()
  await applyBattleStartHeldItems()
  await applyBattleStartRallies()
  while (state.runToken === token && state.player.some((x) => x.hp > 0) && state.enemy.some((x) => x.hp > 0) && actions < 300) {
    state.combat.turn = actions + 1
    const stavesExhausted = actions >= STAFF_EXHAUST_ROUND_LIMIT
    if (stavesExhausted && !staffExhaustionLogged) {
      logLine(null, `Staves run out of uses after ${STAFF_EXHAUST_ROUND_LIMIT} combat rounds.`, 'miss')
      staffExhaustionLogged = true
    }
    if (side === 'player') {
      pIdx = nextLivingIndex(state.player, pIdx)
      updateNextEnemyMarker(eIdx)
      renderTeams()
      if (pIdx !== -1) {
        const actor = state.player[pIdx]
        applyTurnStartRegen(actor, state.player)
        clearProtect(actor) // a cover this unit set last round ends at its next turn
        clearHighlights()
        const ae = spriteEl(actor)
        if (ae) ae.classList.add('active')
        if (await consumeTurnStatus(actor, state.player, state.enemy)) {
          await applyEndOfTurnStatus(actor)
          clearTurnBuffs(actor)
          pIdx = (pIdx + 1) % state.player.length
          actions++
          side = 'enemy'
          continue
        }
        let target = null
        let protectedAlly: Unit | null = null
        // Allies this unit may cover instead of attacking (protect action). Empty if disabled.
        const protectAllies = PROTECT_ENABLED ? state.player.filter((u) => u.hp > 0 && u.id !== actor.id) : []
        if (state.combat.autoFight) {
          target = autoFightTargetFor(actor, state.player, state.enemy, stavesExhausted)
        } else if (actor.weapon.staff && !stavesExhausted) {
          if (isStatusStaff(actor.weapon)) {
            const action: any = await selectPlayerAction(
              actor,
              [...state.enemy.filter((x) => x.hp > 0), ...protectAllies],
              protectAllies.length
                ? `${actor.name}'s turn: tap an enemy for ${actor.weapon.name}, an ally to protect, or use a consumable.`
                : `${actor.name}'s turn: choose an enemy for ${actor.weapon.name}, or use a consumable.`
            )
            if (action?.type === 'cancel') continue
            if (action?.type === 'consumable') {
              await useConsumableFromSlot(action.slot, actor)
              continue
            }
            if (action?.type === 'target' && !action.target.isEnemy) protectedAlly = action.target
            else target = action?.type === 'auto' ? autoFightTargetFor(actor, state.player, state.enemy, stavesExhausted) : action?.target || null
          } else setStatus(`${actor.name} looks for an ally to heal.`)
        } else if (actor.weapon.staff) {
          if (hasUsableConsumable(actor)) {
            const action: any = await selectPlayerAction(actor, [], `${actor.name}'s staff is out of uses. Use a consumable or end turn.`, 'End turn')
            if (action?.type === 'cancel') continue
            if (action?.type === 'consumable') {
              await useConsumableFromSlot(action.slot, actor)
              continue
            }
            setStatus(`${actor.name}'s staff is out of uses.`)
          } else setStatus(`${actor.name}'s staff is out of uses.`)
        } else {
          const action: any = await selectPlayerAction(
            actor,
            [...state.enemy.filter((x) => x.hp > 0), ...protectAllies],
            protectAllies.length
              ? `${actor.name}'s turn: tap an enemy to attack, an ally to protect, or use a consumable.`
              : `${actor.name}'s turn: choose an enemy to attack, or use a consumable.`
          )
          if (action?.type === 'cancel') continue
          if (action?.type === 'consumable') {
            await useConsumableFromSlot(action.slot, actor)
            continue
          }
          if (action?.type === 'target' && !action.target.isEnemy) protectedAlly = action.target
          else target = action?.type === 'auto' ? autoFightTargetFor(actor, state.player, state.enemy, stavesExhausted) : action?.target || null
        }
        if (protectedAlly) {
          setProtect(actor, protectedAlly)
          setStatus(`${actor.name} braces to protect ${protectedAlly.name}.`)
          logLine(null, `${actor.name} moves to protect ${protectedAlly.name}.`, 'heal')
          await flashProtect(protectedAlly)
        } else {
          setStatus(state.combat.autoFight ? (target ? `${actor.name} auto-targets ${target.name}.` : `${actor.name} auto-fights.`) : `${actor.name} acts.`)
          await resolveActorTurn(actor, state.player, state.enemy, target, stavesExhausted)
        }
        await applyEndOfTurnStatus(actor)
        clearTurnBuffs(actor)
        pIdx = (pIdx + 1) % state.player.length
        actions++
      }
      side = 'enemy'
    } else {
      eIdx = nextLivingIndex(state.enemy, eIdx)
      if (eIdx !== -1) {
        const actor = state.enemy[eIdx]
        state.combat.nextEnemyMarkerId = actor.id
        renderTeams()
        applyTurnStartRegen(actor, state.enemy)
        if (await consumeTurnStatus(actor, state.enemy, state.player)) {
          await applyEndOfTurnStatus(actor)
          clearTurnBuffs(actor)
          eIdx = (eIdx + 1) % state.enemy.length
          updateNextEnemyMarker(eIdx)
          renderTeams()
          actions++
          side = 'player'
          continue
        }
        // Protect (2asrkT4w): redirect the attack/status-staff down the protection chain to a protector.
        const chosen = actor.weapon.staff ? (!stavesExhausted && isStatusStaff(actor.weapon) ? chooseStatusStaffTarget(actor, state.player) : null) : chooseEnemyTarget()
        const target = applyProtectRedirect(chosen)
        if (target && chosen && target !== chosen) await flashProtect(chosen) // flash the protected unit whose attack got redirected
        if (target) setStatus(`${actor.name} targets ${target.name}.`)
        await resolveActorTurn(actor, state.enemy, state.player, target, stavesExhausted)
        await applyEndOfTurnStatus(actor)
        clearTurnBuffs(actor)
        eIdx = (eIdx + 1) % state.enemy.length
        updateNextEnemyMarker(eIdx)
        renderTeams()
        actions++
      }
      side = 'player'
    }
  }
  clearHighlights()
  setStatus('')
  state.combat.nextEnemyMarkerId = null
  state.combat.running = false
  state.combat.turn = 0
  setAutoFight(false, true)
  // Aborted mid-battle by a reset/new run — skip victory/defeat handling.
  if (state.runToken !== token) return
  renderTeams()
  if (state.player.some((x) => x.hp > 0)) {
    if (SHOW_VICTORY_LOG) logLine(null, `Victory in ${actions} actions. Team fully healed and levels twice.`, 'heal')
    const survivors = state.player.filter((u) => u.hp > 0).length // count before the post-battle heal revives the fallen
    clearTemporaryBuffs(state.player)
    advanceTwoLevels(state.player)
    state.player.forEach((u) => {
      u.hp = u.maxHp
      clearUnitStatus(u)
    })
    renderTeams()
    // Gold (WpJBRyQ2). Fixed: a lump per arena boss (none on the final battle 20, which
    // ends the run). Per-battle: survivors × 100 every battle, plus 500 on arena bosses.
    const isArenaBoss = bossTierForBattle(state.battle) === BOSS_TIER_ARENA
    if (GOLD_METHOD === 'perBattle') {
      const bounty = GOLD_PER_BATTLE_SURVIVOR * survivors + (isArenaBoss ? GOLD_ARENA_BOSS_BONUS : 0)
      if (bounty > 0) {
        addGold(bounty)
        logLine(null, `Battle bounty: ${formatGold(bounty)} (${survivors} survived${isArenaBoss ? ', arena boss' : ''}).`, 'goldLog')
      }
    } else if (isArenaBoss && state.battle < finalBattleThisRun()) {
      addGold(SHOP_ARENA_BOSS_GOLD)
      logLine(null, `Arena boss bounty: ${formatGold(SHOP_ARENA_BOSS_GOLD)}.`, 'goldLog')
    }
    if (state.battle >= finalBattleThisRun()) {
      // Endless (1T3CRjDJ): mid-endless blocks auto-roll into the next 4 arenas with no prompt;
      // only the base victory (opt-in) and the final 20-arena mastery show a victory screen.
      if (state.run.endlessExtensions > 0 && canExtendEndless()) advanceEndless(false)
      else showWin()
    } else if (isArenaBoss) {
      state.ui.pendingShopAfterReward = true
      renderTeams()
      showRewards()
    } else showRewards()
  } else {
    logLine(null, `Defeat on battle ${state.battle}.`, 'death')
    showGameOver()
  }
}
// --- Endless mode run-length helpers (1T3CRjDJ) ---
// Enemy base internal level, applied INCREMENTALLY (not retroactively): a base +2/battle throughout,
// plus endless-only BONUS levels — one every ENDLESS_BONUS_EVERY fights (arenas 5..step arena), then
// one every ENDLESS_BONUS_EVERY_LATE fights afterward. Gentler than a flat +3/battle, and continuous
// across the arena-4->5 boundary. All cadence/threshold knobs live in config.ts.
export function enemyBaseInternalLevel() {
  const endlessStart = ARENA_CYCLES_PER_RUN * ARENA_CYCLE_LENGTH // battle 20 = end of the normal run
  const stepBattle = ENDLESS_BONUS_STEP_ARENA * ARENA_CYCLE_LENGTH // arena 12 -> battle 60
  const earlyFights = Math.max(0, Math.min(state.battle, stepBattle) - endlessStart)
  const lateFights = Math.max(0, state.battle - stepBattle)
  const bonus = Math.floor(earlyFights / ENDLESS_BONUS_EVERY) + Math.floor(lateFights / ENDLESS_BONUS_EVERY_LATE)
  return 1 + state.battle * 2 + bonus
}
// Arenas this run: base 4, plus 4 per endless extension (4, 8, 12, 16, 20).
export function arenasThisRun() {
  return ARENA_CYCLES_PER_RUN * (1 + state.run.endlessExtensions)
}
// Last battle of the current block; reaching it triggers the victory screen.
export function finalBattleThisRun() {
  return arenasThisRun() * ARENA_CYCLE_LENGTH
}
// Whether another +4-arena endless extension is still available (capped at MAX_ENDLESS_ARENAS).
export function canExtendEndless() {
  return arenasThisRun() < MAX_ENDLESS_ARENAS
}
// Roll into the next block of 4 endless arenas (1T3CRjDJ): +1 extension (more slots, tougher foes,
// lifted caps), append 4 arenas, then grant the just-cleared boss's reward + shop before the next
// arena (the final-battle path skips them since a normal run ends there). fromModal closes the
// base-victory screen — the one manual opt-in; mid-endless blocks advance automatically with no
// prompt. The endless run records its own stats entry when it finally ends (loss/mastery/abandon).
function advanceEndless(fromModal: boolean) {
  if (!canExtendEndless()) return
  state.run.endlessExtensions++
  extendArenaPlan()
  state.player.forEach((u) => Object.keys(u.caps).forEach((k) => (u.caps[k] = 999)))
  state.run.recorded = false
  if (fromModal) closeModal()
  state.ui.pendingShopAfterReward = true
  renderTeams()
  showRewards()
}
// The base victory's "Endless mode" button — the only manual opt-in into endless.
export function continueEndless() {
  advanceEndless(true)
}
