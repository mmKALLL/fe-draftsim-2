import type { Rarity, RewardType, StatKey, WeaponRank } from './types'

export const APP_VERSION = '1.7.1-keyboard-hotkeys'

type BoostPriceKey = StatKey | 'level'

export const FEMP_ASSET_ROOT = './assets/femp'
export const FEMP_IMAGE_EXTS = ['png', 'gif', 'webp']
export const MAP_SPRITE_SCALE = 4
export const MAP_SPRITE_SLOT_H = 20 * MAP_SPRITE_SCALE

export const STAFF_EXHAUST_ROUND_LIMIT = 40

// Stat keys shared across stat loops/displays. GROWTH_STAT_KEYS excludes `con`
// (which has no growth rate); ALL_STAT_KEYS adds it for full stat blocks.
export const GROWTH_STAT_KEYS: StatKey[] = ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res']
export const ALL_STAT_KEYS: StatKey[] = ['hp', 'str', 'skl', 'spd', 'lck', 'def', 'res', 'con']

export const ROSTER_SIZE = 5,
  DRAFT_CHOICES_PER_SLOT = 3,
  LEADER_BONUS_LEVELS = 4,
  CONSUMABLE_SLOTS = 3,
  REWARD_RARE_LOCKED_UNTIL_BATTLE = 3,
  REWARD_SKIP_GOLD = 200,
  SHOP_ARENA_BOSS_GOLD = 2000,
  SHOP_WEAPON_OFFERS = 5,
  SHOP_CONSUMABLE_OFFERS = 3,
  SHOP_BOOST_OFFERS = 3,
  SHOP_HELD_ITEM_OFFERS = 3,
  SHOP_SKILL_OFFERS = 3,
  BOSS_TIER_REGULAR = 'regular',
  BOSS_TIER_ARENA = 'arena',
  ARENA_CYCLE_LENGTH = 5,
  PROMOTION_UNLOCK_AFTER_BATTLE = ARENA_CYCLE_LENGTH * 2,
  ARENA_CYCLES_PER_RUN = 4,
  ARENA_FOCUS_CHANCE = 0.3,
  ARENA_AVOID_DELTA = 15,
  ARENA_STAT_DELTA = 4,
  ARENA_SPEED_MULTIPLIER = 0.6

export const SHOP_WEAPON_PRICES: Record<WeaponRank, number> = {
  E: 300,
  D: 500,
  C: 800,
  B: 1100,
  A: 1500,
  S: 2200,
}
export const SHOP_CONSUMABLE_PRICES: Record<Rarity, number> = {
  normal: 150,
  uncommon: 300,
  rare: 600,
}
export const SHOP_SKILL_PRICES: Record<Rarity, [number, number]> = {
  normal: [600, 800],
  uncommon: [1100, 1300],
  rare: [1600, 1800],
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

// Per-arena tuning (index 0 = arena 1). A run has ARENA_CYCLES_PER_RUN arenas of
// ARENA_CYCLE_LENGTH battles each; tune each arena's reward mix independently.
// Relative ratio of reward types per arena. Tune freely; <= 0 disables a type.
// Only the always-on self-passive skills are wired (see TEACHABLE_SKILLS);
// support is reserved until implemented.
export const REWARD_TYPE_WEIGHTS: Record<RewardType, number>[] = [
  { weapon: 7, consumable: 1, boost: 1, heldItem: 1.5, skill: 3, support: 0 }, // Arena 1
  { weapon: 6, consumable: 1, boost: 2, heldItem: 1.5, skill: 2.5, support: 0 }, // Arena 2
  { weapon: 5, consumable: 1.5, boost: 2, heldItem: 1.5, skill: 2.5, support: 0 }, // Arena 3
  { weapon: 4, consumable: 1.5, boost: 1, heldItem: 2, skill: 1.5, support: 0 }, // Arena 4
]
export const REWARD_OPTIONS_PER_SCREEN = 3
// After a unit is given a reward of a type (weapon/heldItem/boost/skill), it
// won't be offered that type again until this many battles have passed.
export const REWARD_TYPE_UNIT_COOLDOWN = 4

// Enemies are slightly "unlucky": a flat Luck penalty (floored at 1) and reduced
// Luck growth. Raises player Hit (enemy Avoid uses Luck) and player Crit (Crit
// subtracts target Luck), without changing the FE7 combat formulas.
export const ENEMY_LUCK_PENALTY = 3
export const ENEMY_LUCK_GROWTH_PENALTY = 10

// Rarity spread (weights) per arena, split by boss type: 'standard' (normal
// battle), 'regular' boss, 'arena'/arena boss. rewardRarityProfile() reads the
// active arena + boss type. Tune any cell; <= 0 drops a rarity from that pool.
export const REWARD_RARITY_WEIGHTS: Record<'standard' | 'regular' | 'arena', Record<Rarity, number>>[] = [
  // Arena 1
  { standard: { normal: 80, uncommon: 20, rare: 0 }, regular: { normal: 40, uncommon: 55, rare: 5 }, arena: { normal: 0, uncommon: 90, rare: 10 } },
  // Arena 2
  { standard: { normal: 40, uncommon: 50, rare: 10 }, regular: { normal: 30, uncommon: 40, rare: 20 }, arena: { normal: 0, uncommon: 60, rare: 40 } },
  // Arena 3
  { standard: { normal: 25, uncommon: 60, rare: 15 }, regular: { normal: 10, uncommon: 45, rare: 45 }, arena: { normal: 0, uncommon: 20, rare: 80 } },
  // Arena 4
  { standard: { normal: 10, uncommon: 70, rare: 20 }, regular: { normal: 0, uncommon: 30, rare: 70 }, arena: { normal: 0, uncommon: 10, rare: 90 } },
]

// Gentle early ramp: enemies in the first EARLY_ENEMY_NERF_BATTLES fights are
// this many levels lower (final enemy level is still floored at 1).
export const EARLY_ENEMY_NERF_BATTLES = 3
export const EARLY_ENEMY_LEVEL_PENALTY = 1

// Late-arena difficulty ramp (EaM4uENF). Per-arena (index 0 = arena 1), so each
// arena tunes independently; arenas 3/4 currently carry the extra difficulty.
// Extra internal levels added to every enemy in that arena.
export const ARENA_ENEMY_LEVEL_BONUS = [0, 0, 1, 2]
// Extra weapon forges (+2 Mt / +5 Hit each) applied to every enemy weapon, rolled
// uniformly in [min, max]. Staves are never forged.
export const ARENA_ENEMY_FORGE_RANGE: [number, number][] = [
  [0, 0], // Arena 1
  [0, 0], // Arena 2
  [1, 2], // Arena 3
  [2, 3], // Arena 4
]
// Boss max-HP multipliers. Mid (battle-3) bosses keep their standard multiplier;
// arena (battle-5) bosses hit harder in the last two arenas (index >= 2).
export const MID_BOSS_HP_MULT = 1.25
export const ARENA_BOSS_HP_MULT = 1.25
export const ARENA_BOSS_HP_MULT_LATE = 1.5

// Debug: skills appear ~10x more often as rewards and attack procs always fire.
export const DEBUG_SKILLS = false

// Universal (Any class) skills are eligible for every unit, so without a penalty
// they dominate the skill-reward pool. This multiplier weight adjusts their prevalence.
export const UNIVERSAL_SKILL_WEIGHT = 0.25

// --- Enemy weapon selection, tunable per arena (1-4) & role -----------------
// Weapons have no rarity field, so we map letter rank -> rarity group for selection.
// E/D = normal, C/B = uncommon, A/S = rare.
export const WEAPON_RANK_RARITY: Record<WeaponRank, Rarity> = {
  E: 'normal',
  D: 'normal',
  C: 'uncommon',
  B: 'uncommon',
  A: 'rare',
  S: 'rare',
}
// crit >= this marks a weapon as a 'good' (killer-rarity) exception; innate light-tome
// crit (5-8) stays in the 'default' pool.
export const DEFAULT_WEAPON_MAX_CRIT = 13

// When true, a DEFAULT-pool enemy that rolls a COMMON (normal-rarity) weapon always gets
// the first/basic weapon of its type (Iron Sword, Fire, Heal Staff, ...) rather than a
// random common, so enemies are predictable and the game reads cleanly. Set false to allow
// variety among commons (e.g. stat-boost weapons like slim/javelin join the default pool).
export const DEFAULT_COMMON_FORCES_FIRST_WEAPON = true

// Enemies favor their PRIMARY weapon type (the unpromoted u.weaponType); a promoted
// unit's extra promotionWeaponTypes are SECONDARY. enemyWeaponFor picks the weapon TYPE
// first, weighted by these shares (primary weight listed first). Keyed by how many types
// the class has available: 1 type is trivially primary; >3 types fall back to an even
// split. Tune to make enemies stick more (raise the primary weight) or less to their main.
export const ENEMY_WEAPON_TYPE_SPLIT: Record<number, number[]> = { 2: [0.75, 0.25], 3: [0.6, 0.2, 0.2] }

// Per arena x role: rarity weights {normal, uncommon, rare} for each weapon pool. A
// rolled rarity with no matching weapon for the unit's class steps DOWN one group (see
// resolveRarity in units.ts). Which pool an enemy uses is decided per fight: bosses are
// always 'good'; ENEMY_GOOD_MINION_COUNT sets how many minions are. 'default' = plain
// weapons only; 'good' = anything but each type's basic weapon. Minions skew low-rarity, bosses high; both rise by arena.
type EnemyWeaponRarityWeights = Record<Rarity, number>
type EnemyWeaponRole = { default: EnemyWeaponRarityWeights; good: EnemyWeaponRarityWeights }
type EnemyWeaponArena = { boss: EnemyWeaponRole; minion: EnemyWeaponRole }
export const ENEMY_WEAPON_PROFILE: EnemyWeaponArena[] = [
  // Arena 1
  {
    minion: { default: { normal: 10, uncommon: 0, rare: 0 }, good: { normal: 8, uncommon: 2, rare: 0 } },
    boss: { default: { normal: 0, uncommon: 10, rare: 0 }, good: { normal: 0, uncommon: 10, rare: 0 } },
  },
  // Arena 2
  {
    minion: { default: { normal: 6, uncommon: 3, rare: 0 }, good: { normal: 4, uncommon: 5, rare: 1 } },
    boss: { default: { normal: 0, uncommon: 6, rare: 3 }, good: { normal: 0, uncommon: 6, rare: 3 } },
  },
  // Arena 3
  {
    minion: { default: { normal: 3, uncommon: 6, rare: 0 }, good: { normal: 2, uncommon: 6, rare: 2 } },
    boss: { default: { normal: 0, uncommon: 3, rare: 6 }, good: { normal: 0, uncommon: 3, rare: 6 } },
  },
  // Arena 4
  {
    minion: { default: { normal: 1, uncommon: 4, rare: 4 }, good: { normal: 0, uncommon: 4, rare: 2 } },
    boss: { default: { normal: 0, uncommon: 2, rare: 8 }, good: { normal: 0, uncommon: 2, rare: 8 } },
  },
]

// Number of NORMAL enemies (minions) drawing from the 'good' weapon pool, rolled per
// fight as [min, max] by arena and battle type. Bosses are always 'good' (and pinned to
// slot 1); chosen good minions take random slots. Clamped to minions present (5 in a
// standard fight, 4 alongside a boss).
export const ENEMY_GOOD_MINION_COUNT: Record<'standard' | 'regular' | 'arena', [number, number]>[] = [
  { standard: [0, 1], regular: [0, 1], arena: [1, 2] }, // Arena 1
  { standard: [0, 2], regular: [1, 1], arena: [1, 2] }, // Arena 2
  { standard: [1, 3], regular: [1, 2], arena: [2, 3] }, // Arena 3
  { standard: [2, 3], regular: [1, 3], arena: [3, 4] }, // Arena 4
]

// Base names that cannot appear as enemies in a given arena (keyed by 1-based arena index).
// Used to keep high-stat prepromotes out of the early game. e.g. Wallace is a high-Def Knight
// prepromote whose appearance in Arena 1 makes early fights unfair; he stays eligible in 2-4.
export const ENEMY_ARENA_BANS: Record<number, string[]> = {
  1: ['Wallace'],
}

// Expected number of bonus skills / held items an enemy carries, by arena and role,
// read as a FRACTIONAL count: the integer part is guaranteed, the fractional part is the
// chance of one extra (0.3 = 30% of one; 1 = always one; 2.5 = two guaranteed + 50% of a
// third). NOTE: enemies currently have a single skill + single held slot, so any count >= 1
// is stored as one until multi-slot enemies are supported.
type EnemyBonusRole = { skill: number; held: number }
type EnemyBonusArena = { boss: EnemyBonusRole; minion: EnemyBonusRole }
export const ENEMY_BONUS_COUNTS: EnemyBonusArena[] = [
  { boss: { skill: 0, held: 0 }, minion: { skill: 0, held: 0 } }, // Arena 1
  { boss: { skill: 0, held: 0 }, minion: { skill: 0, held: 0 } }, // Arena 2
  { boss: { skill: 1, held: 0 }, minion: { skill: 0.1, held: 0 } }, // Arena 3
  { boss: { skill: 1, held: 1 }, minion: { skill: 0.3, held: 0 } }, // Arena 4
]
// Rarity weights {normal, uncommon, rare} for an enemy's BONUS skill / held item, by arena
// and role (same length/shape as ENEMY_WEAPON_PROFILE). assignEnemyBonuses rolls a rarity
// with pickWeightedRarity, then picks from the pool filtered to that rarity (stepping down to
// any rarity if empty). Later arenas + bosses skew rarer, mirroring REWARD_RARITY_WEIGHTS.
export const ENEMY_BONUS_RARITY: Record<'boss' | 'minion', EnemyWeaponRarityWeights>[] = [
  // Arena 1
  { boss: { normal: 60, uncommon: 35, rare: 5 }, minion: { normal: 90, uncommon: 10, rare: 0 } },
  // Arena 2
  { boss: { normal: 40, uncommon: 45, rare: 15 }, minion: { normal: 70, uncommon: 28, rare: 2 } },
  // Arena 3
  { boss: { normal: 20, uncommon: 45, rare: 35 }, minion: { normal: 50, uncommon: 40, rare: 10 } },
  // Arena 4
  { boss: { normal: 0, uncommon: 30, rare: 60 }, minion: { normal: 10, uncommon: 45, rare: 25 } },
]
