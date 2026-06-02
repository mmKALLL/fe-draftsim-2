'use strict'

function startRun() {
  if (selectedRosterCount() !== ROSTER_SIZE) return
  activeDetailActorIds = []
  player = chosen.map((n, i) => {
    const u = freshFromBase(
      BASES.find((b) => b.name === n),
      false,
      1 + (i === 0 ? LEADER_BONUS_LEVELS : 0),
      false
    )
    u.isLeader = i === 0
    return u
  })
  consumables = startingConsumables()
  $('menuScreen').classList.add('hidden')
  $('draftScreen').classList.add('hidden')
  $('gameScreen').classList.remove('hidden')
  renderTeams()
  logLine(null, `${player[0].name} leads the party and starts at ${levelLabel(player[0])}.`, 'heal')
  showRewards(true)
}
function bossTierForBattle(n) {
  const cycle = ((n - 1) % BIOME_CYCLE_LENGTH) + 1
  if (cycle === BIOME_CYCLE_LENGTH) return BOSS_TIER_BIOME
  if (cycle === 3) return BOSS_TIER_REGULAR
  return null
}
function generateEnemy() {
  battle++
  const baseInternal = clamp(1 + battle * 2, 1, 40)
  const bossTier = bossTierForBattle(battle)
  enemy = []
  const pool = [...BASES]
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
    e.weapon = enemyWeaponFor(e, e.bossTier)
    e.name = enemyDisplayName(e)
    e.hp = e.maxHp
    enemy.push(e)
  }
  activePreviewActor = null
  nextEnemyMarkerId = null
  combatTurn = 0
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
  logLine(null, `Battle ${battle}: ${biomePrefix}${msg}`, bossTier ? 'crit' : 'hit')
  renderTeams()
}
function beginNextBattle() {
  if (battleRunning || awaitingReward) return
  generateEnemy()
  runBattle()
}
function debugWinBattle() {
  if (!battleRunning || !enemy.some((x) => x.hp > 0)) return
  enemy.forEach((u) => {
    u.hp = 0
    clearUnitStatus(u)
  })
  if (pendingTargetCancel) pendingTargetCancel()
  clearHighlights()
  setStatus('Debug win: enemy team defeated.')
  logLine(null, 'Debug hotkey: enemy team defeated.', 'crit')
  renderTeams()
}
function debugAddGeosphere() {
  const item = consumableById('geosphere')
  if (!item) return
  if (!player.length || consumables.length < CONSUMABLE_SLOTS) {
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
async function runBattle() {
  if (battleRunning || !enemy.length) return
  battleRunning = true
  combatTurn = 1
  let actions = 0,
    side = 'player',
    pIdx = 0,
    eIdx = 0,
    staffExhaustionLogged = false
  updateNextEnemyMarker(eIdx)
  renderTeams()
  while (player.some((x) => x.hp > 0) && enemy.some((x) => x.hp > 0) && actions < 300) {
    combatTurn = actions + 1
    const stavesExhausted = actions >= STAFF_EXHAUST_ROUND_LIMIT
    if (stavesExhausted && !staffExhaustionLogged) {
      logLine(null, `Staves run out of uses after ${STAFF_EXHAUST_ROUND_LIMIT} combat rounds.`, 'miss')
      staffExhaustionLogged = true
    }
    if (side === 'player') {
      pIdx = nextLivingIndex(player, pIdx)
      updateNextEnemyMarker(eIdx)
      renderTeams()
      if (pIdx !== -1) {
        const actor = player[pIdx]
        clearHighlights()
        const ae = spriteEl(actor)
        if (ae) ae.classList.add('active')
        if (await consumeTurnStatus(actor, player, enemy)) {
          await applyEndOfTurnStatus(actor)
          clearTurnBuffs(actor)
          pIdx = (pIdx + 1) % player.length
          actions++
          side = 'enemy'
          continue
        }
        let target = null
        if (autoFight) {
          target = autoFightTargetFor(actor, player, enemy, stavesExhausted)
        } else if (actor.weapon.staff && !stavesExhausted) {
          if (isStatusStaff(actor.weapon)) {
            const action = await selectPlayerAction(
              actor,
              enemy.filter((x) => x.hp > 0),
              `${actor.name}'s turn: choose an enemy for ${actor.weapon.name}, or use a consumable.`
            )
            if (action?.type === 'cancel') continue
            if (action?.type === 'consumable') {
              await useConsumableFromSlot(action.slot, actor)
              continue
            }
            target = action?.type === 'auto' ? autoFightTargetFor(actor, player, enemy, stavesExhausted) : action?.target || null
          } else setStatus(`${actor.name} looks for an ally to heal.`)
        } else if (actor.weapon.staff) {
          if (hasUsableConsumable(actor)) {
            const action = await selectPlayerAction(actor, [], `${actor.name}'s staff is out of uses. Use a consumable or end turn.`, 'End turn')
            if (action?.type === 'cancel') continue
            if (action?.type === 'consumable') {
              await useConsumableFromSlot(action.slot, actor)
              continue
            }
            setStatus(`${actor.name}'s staff is out of uses.`)
          } else setStatus(`${actor.name}'s staff is out of uses.`)
        } else {
          const action = await selectPlayerAction(
            actor,
            enemy.filter((x) => x.hp > 0),
            `${actor.name}'s turn: choose an enemy to attack, or use a consumable.`
          )
          if (action?.type === 'cancel') continue
          if (action?.type === 'consumable') {
            await useConsumableFromSlot(action.slot, actor)
            continue
          }
          target = action?.type === 'auto' ? autoFightTargetFor(actor, player, enemy, stavesExhausted) : action?.target || null
        }
        setStatus(autoFight ? (target ? `${actor.name} auto-targets ${target.name}.` : `${actor.name} auto-fights.`) : `${actor.name} acts.`)
        await resolveActorTurn(actor, player, enemy, target, stavesExhausted)
        await applyEndOfTurnStatus(actor)
        clearTurnBuffs(actor)
        pIdx = (pIdx + 1) % player.length
        actions++
      }
      side = 'enemy'
    } else {
      eIdx = nextLivingIndex(enemy, eIdx)
      if (eIdx !== -1) {
        const actor = enemy[eIdx]
        nextEnemyMarkerId = actor.id
        renderTeams()
        if (await consumeTurnStatus(actor, enemy, player)) {
          await applyEndOfTurnStatus(actor)
          clearTurnBuffs(actor)
          eIdx = (eIdx + 1) % enemy.length
          updateNextEnemyMarker(eIdx)
          renderTeams()
          actions++
          side = 'player'
          continue
        }
        const target = actor.weapon.staff ? (!stavesExhausted && isStatusStaff(actor.weapon) ? chooseStatusStaffTarget(actor, player) : null) : chooseEnemyTarget()
        if (target) setStatus(`${actor.name} targets ${target.name}.`)
        await resolveActorTurn(actor, enemy, player, target, stavesExhausted)
        await applyEndOfTurnStatus(actor)
        clearTurnBuffs(actor)
        eIdx = (eIdx + 1) % enemy.length
        updateNextEnemyMarker(eIdx)
        renderTeams()
        actions++
      }
      side = 'player'
    }
  }
  clearHighlights()
  setStatus('')
  nextEnemyMarkerId = null
  battleRunning = false
  combatTurn = 0
  setAutoFight(false, true)
  renderTeams()
  if (player.some((x) => x.hp > 0)) {
    logLine(null, `Victory in ${actions} actions. Team fully healed and levels twice.`, 'heal')
    clearTemporaryBuffs(player)
    advanceTwoLevels(player)
    player.forEach((u) => {
      u.hp = u.maxHp
      clearUnitStatus(u)
    })
    renderTeams()
    if (battle >= 20) {
      showWin()
    } else if (bossTierForBattle(battle) === BOSS_TIER_BIOME) {
      addGold(SHOP_BIOME_BOSS_GOLD)
      pendingShopAfterReward = true
      logLine(null, `Arena boss bounty: ${formatGold(SHOP_BIOME_BOSS_GOLD)}.`, 'goldLog')
      renderTeams()
      showRewards()
    } else showRewards()
  } else {
    logLine(null, `Defeat on battle ${battle}.`, 'death')
    showGameOver()
  }
}
