import { BIOME_CYCLE_LENGTH, BOSS_TIER_BIOME, BOSS_TIER_REGULAR, CONSUMABLE_SLOTS, EARLY_ENEMY_LEVEL_PENALTY, EARLY_ENEMY_NERF_BATTLES, ENEMY_GOOD_MINION_COUNT, LEADER_BONUS_LEVELS, ROSTER_SIZE, SHOP_BIOME_BOSS_GOLD, STAFF_EXHAUST_ROUND_LIMIT } from '../constants'
import { BASES } from '../data'
import { activeBiomeEntry, biomeEffectLabels, enemyFocusForSlot, pickBaseFromPool, setAutoFight } from './biomes'
import { applyBattleStartHeldItems, applyBattleStartRallies, applyEndOfTurnStatus, applyTurnStartRegen, autoFightTargetFor, chooseEnemyTarget, chooseStatusStaffTarget, clearHighlights, clearTemporaryBuffs, clearTurnBuffs, clearUnitStatus, consumeTurnStatus, enemyDisplayName, hasUsableConsumable, isStatusStaff, nextLivingIndex, resolveActorTurn, selectPlayerAction, setStatus, spriteEl, useConsumableFromSlot } from './combat'
import { logLine, renderTeams, selectedRosterCount, updateNextEnemyMarker } from './render'
import { assignEnemyBonuses, firstEmptyConsumableSlot, showRewards } from './rewards'
import { storeConsumable } from './shop'
import { addGold, formatGold } from './state'
import { levelLabel, showGameOver, showWin } from './ui'
import { advanceTwoLevels, consumableById, enemyWeaponFor, freshFromBase, promotionUnlockedForRegularEnemies, startingConsumables } from './units'
import { $, clamp, floor, pick, rint, rnd } from './utils'
import { state } from './state'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


export function startRun() {
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
  $('menuScreen').classList.add('hidden')
  $('draftScreen').classList.add('hidden')
  $('gameScreen').classList.remove('hidden')
  renderTeams()
  logLine(null, `${state.player[0].name} leads the party and starts at ${levelLabel(state.player[0])}.`, 'heal')
  showRewards(true)
}
export function bossTierForBattle(n: any) {
  const cycle = ((n - 1) % BIOME_CYCLE_LENGTH) + 1
  if (cycle === BIOME_CYCLE_LENGTH) return BOSS_TIER_BIOME
  if (cycle === 3) return BOSS_TIER_REGULAR
  return null
}
export function generateEnemy() {
  state.battle++
  const earlyNerf = state.battle <= EARLY_ENEMY_NERF_BATTLES ? EARLY_ENEMY_LEVEL_PENALTY : 0
  const baseInternal = clamp(1 + state.battle * 2 - earlyNerf, 1, 40)
  const bossTier = bossTierForBattle(state.battle)
  state.enemy = []
  const pool = [...BASES]
  // Decide up front which minion slots carry a 'good' weapon: a bounded count per fight
  // (by arena + battle type), placed in random slots. The boss (slot 0) is always good.
  const battleType = bossTier === BOSS_TIER_BIOME ? 'biome' : bossTier === BOSS_TIER_REGULAR ? 'regular' : 'standard'
  const arena = clamp(floor((state.battle - 1) / 5) + 1, 1, 4)
  const minionSlots = [0, 1, 2, 3, 4].filter((i) => !(i === 0 && bossTier))
  const [gMin, gMax] = ENEMY_GOOD_MINION_COUNT[arena - 1][battleType]
  let goodCount = clamp(gMin + rint(gMax - gMin + 1), 0, minionSlots.length)
  const goodMinionSlots = new Set<number>()
  const availSlots = [...minionSlots]
  while (goodCount-- > 0 && availSlots.length) goodMinionSlots.add(availSlots.splice(rint(availSlots.length), 1)[0])
  for (let i = 0; i < 5; i++) {
    const isBossSlot = i === 0 && bossTier
    const b = pickBaseFromPool(pool, enemyFocusForSlot(isBossSlot, bossTier)) || pick(BASES)
    // Bosses have extra levels; normal units have slight variance
    const internal = clamp(baseInternal + (isBossSlot ? (bossTier === BOSS_TIER_BIOME ? 6 : 4) : rnd() < 0.5 ? rint(3) - 1 : 0), 1, 40)
    const promoted = (isBossSlot || promotionUnlockedForRegularEnemies()) && internal > 20
    const lvl = promoted ? internal - 20 : internal
    const e = freshFromBase(b, true, lvl, promoted)
    e.lvl = clamp(lvl + Math.ceil(b.startOffset / 2), 1, 20)
    e.maxHp = isBossSlot ? floor(e.maxHp * 1.25) : e.maxHp
    e.bossTier = isBossSlot ? bossTier : null
    e.palette = 'red'
    e.team = 'red'
    e.weapon = enemyWeaponFor(e, e.bossTier, !!isBossSlot || goodMinionSlots.has(i))
    e.name = enemyDisplayName(e)
    assignEnemyBonuses(e, isBossSlot ? 'boss' : 'minion')
    e.hp = e.maxHp
    state.enemy.push(e)
  }
  state.ui.activePreviewActor = null
  state.combat.nextEnemyMarkerId = null
  state.combat.turn = 0
  $('log').innerHTML = ''
  setStatus('')
  const biome = activeBiomeEntry()?.biome
  const biomePrefix = biome ? `${biome.name} (${biomeEffectLabels(biome).join(', ')}): ` : ''
  const msg =
    bossTier === BOSS_TIER_BIOME
      ? 'Arena boss fight: +6 level leader with stronger weapons.'
      : bossTier === BOSS_TIER_REGULAR
        ? 'Regular boss fight: +4 level leader.'
        : 'Standard enemy team.'
  logLine(null, `Battle ${state.battle}: ${biomePrefix}${msg}`, bossTier ? 'crit' : 'hit')
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
  state.combat.turn = 1
  const token = state.runToken
  let actions = 0,
    side = 'player',
    pIdx = 0,
    eIdx = 0,
    staffExhaustionLogged = false
  updateNextEnemyMarker(eIdx)
  renderTeams()
  applyBattleStartHeldItems()
  applyBattleStartRallies()
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
        if (state.combat.autoFight) {
          target = autoFightTargetFor(actor, state.player, state.enemy, stavesExhausted)
        } else if (actor.weapon.staff && !stavesExhausted) {
          if (isStatusStaff(actor.weapon)) {
            const action: any = await selectPlayerAction(
              actor,
              state.enemy.filter((x) => x.hp > 0),
              `${actor.name}'s turn: choose an enemy for ${actor.weapon.name}, or use a consumable.`
            )
            if (action?.type === 'cancel') continue
            if (action?.type === 'consumable') {
              await useConsumableFromSlot(action.slot, actor)
              continue
            }
            target = action?.type === 'auto' ? autoFightTargetFor(actor, state.player, state.enemy, stavesExhausted) : action?.target || null
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
            state.enemy.filter((x) => x.hp > 0),
            `${actor.name}'s turn: choose an enemy to attack, or use a consumable.`
          )
          if (action?.type === 'cancel') continue
          if (action?.type === 'consumable') {
            await useConsumableFromSlot(action.slot, actor)
            continue
          }
          target = action?.type === 'auto' ? autoFightTargetFor(actor, state.player, state.enemy, stavesExhausted) : action?.target || null
        }
        setStatus(state.combat.autoFight ? (target ? `${actor.name} auto-targets ${target.name}.` : `${actor.name} auto-fights.`) : `${actor.name} acts.`)
        await resolveActorTurn(actor, state.player, state.enemy, target, stavesExhausted)
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
        const target = actor.weapon.staff ? (!stavesExhausted && isStatusStaff(actor.weapon) ? chooseStatusStaffTarget(actor, state.player) : null) : chooseEnemyTarget()
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
    logLine(null, `Victory in ${actions} actions. Team fully healed and levels twice.`, 'heal')
    clearTemporaryBuffs(state.player)
    advanceTwoLevels(state.player)
    state.player.forEach((u) => {
      u.hp = u.maxHp
      clearUnitStatus(u)
    })
    renderTeams()
    if (state.battle >= 20) {
      showWin()
    } else if (bossTierForBattle(state.battle) === BOSS_TIER_BIOME) {
      addGold(SHOP_BIOME_BOSS_GOLD)
      state.ui.pendingShopAfterReward = true
      logLine(null, `Arena boss bounty: ${formatGold(SHOP_BIOME_BOSS_GOLD)}.`, 'goldLog')
      renderTeams()
      showRewards()
    } else showRewards()
  } else {
    logLine(null, `Defeat on battle ${state.battle}.`, 'death')
    showGameOver()
  }
}
