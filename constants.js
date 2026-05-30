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
  BOSS_TIER_REGULAR = 'regular',
  BOSS_TIER_SUPER = 'super'
