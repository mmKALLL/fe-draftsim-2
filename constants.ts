import type { Rarity, RewardType, StatKey, WeaponRank } from './types'

type RewardPoolKind = 'normal' | 'good'
type TierWeight = [Rarity, number]
type BoostPriceKey = StatKey | 'level'

export const FEMP_ASSET_ROOT = './assets/femp'
export const FEMP_IMAGE_EXTS = ['png', 'gif', 'webp']
export const MAP_SPRITE_SCALE = 4
export const MAP_SPRITE_SLOT_H = 20 * MAP_SPRITE_SCALE

export const STAFF_EXHAUST_ROUND_LIMIT = 40

export const WEAPON_RANKS: WeaponRank[] = ['E', 'D', 'C', 'B', 'A', 'S']
export const WEAPON_TIER_WEIGHTS: Record<RewardPoolKind, TierWeight[]> = {
  normal: [
    ['normal', 60],
    ['uncommon', 30],
    ['rare', 10],
  ],
  good: [
    ['uncommon', 70],
    ['rare', 30],
  ],
}

export const CONSUMABLE_TIER_WEIGHTS: Record<RewardPoolKind, TierWeight[]> = {
  normal: [
    ['normal', 60],
    ['uncommon', 30],
    ['rare', 10],
  ],
  good: [
    ['uncommon', 70],
    ['rare', 30],
  ],
}

export const ROSTER_SIZE = 5,
  DRAFT_CHOICES_PER_SLOT = 3,
  LEADER_BONUS_LEVELS = 4,
  CONSUMABLE_SLOTS = 3,
  CONSUMABLE_REWARD_CHANCE = 0.1,
  HELD_ITEM_REWARD_CHANCE = 0.1,
  SKILL_REWARD_CHANCE = 0.1,
  REWARD_RARE_LOCKED_UNTIL_BATTLE = 3,
  REWARD_SKIP_GOLD = 200,
  SHOP_BIOME_BOSS_GOLD = 2000,
  SHOP_WEAPON_OFFERS = 5,
  SHOP_CONSUMABLE_OFFERS = 3,
  SHOP_BOOST_OFFERS = 3,
  SHOP_HELD_ITEM_OFFERS = 3,
  SHOP_SKILL_OFFERS = 3,
  BOSS_TIER_REGULAR = 'regular',
  BOSS_TIER_BIOME = 'biome',
  BIOME_CYCLE_LENGTH = 5,
  PROMOTION_UNLOCK_AFTER_BATTLE = BIOME_CYCLE_LENGTH * 2,
  BIOME_CYCLES_PER_RUN = 4,
  BIOME_FOCUS_CHANCE = 0.3,
  BIOME_AVOID_DELTA = 15,
  BIOME_STAT_DELTA = 4,
  BIOME_SPEED_MULTIPLIER = 0.6

export const SHOP_WEAPON_PRICES: Record<WeaponRank, number> = {
  E: 400,
  D: 600,
  C: 900,
  B: 1100,
  A: 1500,
  S: 2200,
}
export const SHOP_CONSUMABLE_PRICES: Record<Rarity, number> = {
  normal: 100,
  uncommon: 300,
  rare: 600,
}
export const SHOP_SKILL_PRICES: Record<Rarity, number> = {
  normal: 700,
  uncommon: 1200,
  rare: 2000,
}
export const SHOP_FORGE_PRICE = 1200
export const SHOP_BOOST_PRICES: Record<BoostPriceKey, number> = {
  hp: 1000,
  str: 1100,
  skl: 900,
  spd: 1200,
  lck: 800,
  def: 1100,
  res: 1000,
  con: 800,
  level: 1400,
}

// Per-arena tuning (index 0 = arena 1). A run has BIOME_CYCLES_PER_RUN arenas of
// BIOME_CYCLE_LENGTH battles each; tune each arena's reward mix independently.
// Relative ratio of reward types per arena. Tune freely; <= 0 disables a type.
// Only the always-on self-passive skills are wired (see TEACHABLE_SKILLS);
// support is reserved until implemented.
export const REWARD_TYPE_WEIGHTS: Record<RewardType, number>[] = [
  { weapon: 5, consumable: 1, boost: 2, heldItem: 1.5, skill: 3, support: 0 }, // Arena 1
  { weapon: 5, consumable: 1, boost: 2, heldItem: 1.5, skill: 2.5, support: 0 }, // Arena 2
  { weapon: 5, consumable: 2, boost: 2, heldItem: 1.5, skill: 2, support: 0 }, // Arena 3
  { weapon: 4, consumable: 2, boost: 1, heldItem: 2, skill: 1.5, support: 0 }, // Arena 4
]
export const REWARD_OPTIONS_PER_SCREEN = 3
// After a unit is given a reward of a type (weapon/heldItem/boost/skill), it
// won't be offered that type again until this many battles have passed.
export const REWARD_TYPE_UNIT_COOLDOWN = 4

// Enemies are slightly "unlucky": a flat Luck penalty (floored at 1) and reduced
// Luck growth. Raises player Hit (enemy Avoid uses Luck) and player Crit (Crit
// subtracts target Luck), without changing the FE7 combat formulas.
export const ENEMY_LUCK_PENALTY = 3
export const ENEMY_LUCK_GROWTH_PENALTY = 20

// Rarity spread (weights) per arena, split by boss type: 'standard' (normal
// battle), 'regular' boss, 'biome'/arena boss. rewardRarityProfile() reads the
// active arena + boss type. Tune any cell; <= 0 drops a rarity from that pool.
export const REWARD_RARITY_WEIGHTS: Record<'standard' | 'regular' | 'biome', Record<Rarity, number>>[] = [
  // Arena 1
  { standard: { normal: 80, uncommon: 20, rare: 0 }, regular: { normal: 50, uncommon: 45, rare: 5 }, biome: { normal: 20, uncommon: 60, rare: 20 } },
  // Arena 2
  { standard: { normal: 55, uncommon: 40, rare: 5 }, regular: { normal: 30, uncommon: 45, rare: 15 }, biome: { normal: 0, uncommon: 60, rare: 40 } },
  // Arena 3
  { standard: { normal: 40, uncommon: 50, rare: 10 }, regular: { normal: 20, uncommon: 45, rare: 35 }, biome: { normal: 0, uncommon: 30, rare: 70 } },
  // Arena 4
  { standard: { normal: 25, uncommon: 60, rare: 15 }, regular: { normal: 10, uncommon: 40, rare: 50 }, biome: { normal: 0, uncommon: 10, rare: 90 } },
]

// Gentle early ramp: enemies in the first EARLY_ENEMY_NERF_BATTLES fights are
// this many levels lower (final enemy level is still floored at 1).
export const EARLY_ENEMY_NERF_BATTLES = 3
export const EARLY_ENEMY_LEVEL_PENALTY = 2

// Debug: skills appear ~10x more often as rewards and attack procs always fire.
export const DEBUG_SKILLS = false
