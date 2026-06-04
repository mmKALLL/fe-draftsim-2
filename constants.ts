import type { Rarity, StatKey, WeaponRank } from './types'

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
  CONSUMABLE_REWARD_CHANCE = 0.10,
  HELD_ITEM_REWARD_CHANCE = 0.10,
  SKILL_REWARD_CHANCE = 0.10,
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
