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
  CONSUMABLE_SLOTS = 3,
  CONSUMABLE_REWARD_CHANCE = 0.3,
  REWARD_SKIP_GOLD = 200,
  SHOP_SUPER_BOSS_GOLD = 1500,
  BOSS_TIER_REGULAR = 'regular',
  BOSS_TIER_SUPER = 'super'

const SHOP_WEAPON_PRICES = {
  normal: 450,
  uncommon: 850,
  rare: 1400,
}
const SHOP_CONSUMABLE_PRICES = {
  normal: 150,
  uncommon: 325,
  rare: 550,
}
const SHOP_BOOST_PRICES = {
  hp: 750,
  str: 850,
  skl: 750,
  spd: 900,
  lck: 600,
  def: 850,
  res: 850,
  level: 1200,
}
