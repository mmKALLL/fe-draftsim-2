'use strict'

const FEMP_ASSET_ROOT = './assets/femp'
const FEMP_IMAGE_EXTS = ['png', 'gif', 'webp']
const MAP_SPRITE_SCALE = 4
const MAP_SPRITE_SLOT_H = 20 * MAP_SPRITE_SCALE

const STAFF_EXHAUST_ROUND_LIMIT = 40

const WEAPON_RANKS = ['E', 'D', 'C', 'B', 'A', 'S']
const WEAPON_TIER_WEIGHTS = {
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

const CONSUMABLE_TIER_WEIGHTS = {
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

const ROSTER_SIZE = 5,
  DRAFT_CHOICES_PER_SLOT = 3,
  LEADER_BONUS_LEVELS = 4,
  LEADER_PROMOTION_LEVEL = 4,
  CONSUMABLE_SLOTS = 3,
  CONSUMABLE_REWARD_CHANCE = 0.3,
  REWARD_RARE_LOCKED_UNTIL_BATTLE = 3,
  REWARD_SKIP_GOLD = 200,
  SHOP_BIOME_BOSS_GOLD = 2000,
  BOSS_TIER_REGULAR = 'regular',
  BOSS_TIER_BIOME = 'biome',
  BIOME_CYCLE_LENGTH = 5,
  PROMOTION_UNLOCK_AFTER_BATTLE = BIOME_CYCLE_LENGTH * 2,
  BIOME_CYCLES_PER_RUN = 4,
  BIOME_FOCUS_CHANCE = 0.3,
  BIOME_AVOID_DELTA = 15,
  BIOME_STAT_DELTA = 4,
  BIOME_SPEED_MULTIPLIER = 0.6

const SHOP_WEAPON_PRICES = {
  E: 400,
  D: 600,
  C: 900,
  B: 1100,
  A: 1500,
  S: 2200,
}
const SHOP_CONSUMABLE_PRICES = {
  normal: 100,
  uncommon: 250,
  rare: 600,
}
const SHOP_BOOST_PRICES = {
  hp: 1200,
  str: 1100,
  skl: 900,
  spd: 1200,
  lck: 800,
  def: 1100,
  res: 1000,
  level: 1400,
}
