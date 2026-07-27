import type {
  BaseStatBlock,
  ArenaData,
  CandidateItemData,
  ClassData,
  ConsumableData,
  GrowthBlock,
  PaletteKey,
  Rarity,
  SkillData,
  SkillGroupMap,
  UnitBase,
  WeaponData,
  WeaponRank,
  WeaponType,
} from './types'

const DATA_WEAPON_RANKS: WeaponRank[] = ['E', 'D', 'C', 'B', 'A', 'S']

export const FEMP_NAME_OVERRIDES: Record<string, string> = {
  "L'Arachel": 'larachel',
  Pent: 'pent',
  Lucius: 'lucius',
  Canas: 'canas',
  Niime: 'niime',
  Athos: 'athos',
}
export const CUSTOM_MAP_SPRITE_STEMS: Record<string, string> = {
  Lyn: 'lyn',
  Eliwood: 'eliwood',
  Hector: 'hector',
  Lundgren: 'lundgren',
}

// prettier-ignore
export const CLASSES: Record<string, ClassData> = {
  Lord: {
    promotesTo: 'Blade Lord',
    kind: 'lord',
    promotionWeaponTypes: ['sword'],
    caps: { hp: 60, str: 27, skl: 29, spd: 30, lck: 30, def: 22, res: 22, con: 20 },
    promo: { hp: 4, str: 2, skl: 2, spd: 1, def: 3, res: 3, con: 1 },
  },
  Mercenary: {
    promotesTo: 'Hero',
    kind: 'merc',
    promotionWeaponTypes: ['sword', 'axe'],
    caps: { hp: 60, str: 25, skl: 30, spd: 26, lck: 30, def: 25, res: 22, con: 20 },
    promo: { hp: 4, str: 2, skl: 1, spd: 1, def: 2, res: 2, con: 1 },
  },
  Myrmidon: {
    promotesTo: 'Swordmaster',
    kind: 'myrm',
    promotionWeaponTypes: ['sword'],
    caps: { hp: 60, str: 24, skl: 29, spd: 30, lck: 30, def: 22, res: 23, con: 20 },
    promo: { hp: 4, str: 2, skl: 2, spd: 1, def: 2, res: 2, con: 1 },
  },
  Thief: {
    promotesTo: 'Assassin',
    kind: 'thief',
    promotionWeaponTypes: ['sword', 'dagger'],
    caps: { hp: 60, str: 20, skl: 30, spd: 30, lck: 30, def: 20, res: 20, con: 20 },
    promo: { hp: 3, str: 1, skl: 2, spd: 1, def: 2, res: 2, con: 1 },
  },
  Knight: {
    promotesTo: 'General',
    kind: 'knight',
    promotionWeaponTypes: ['lance', 'axe'],
    caps: { hp: 60, str: 27, skl: 25, spd: 24, lck: 30, def: 30, res: 25, con: 20 },
    promo: { hp: 4, str: 2, skl: 2, spd: 2, def: 4, res: 3, con: 2 },
  },
  Cavalier: {
    promotesTo: 'Paladin',
    kind: 'cavalier',
    promotionWeaponTypes: ['sword', 'lance', 'axe'],
    caps: { hp: 60, str: 25, skl: 26, spd: 24, lck: 30, def: 25, res: 25, con: 20 },
    promo: { hp: 3, str: 2, skl: 1, spd: 1, def: 2, res: 3, con: 1 },
  },
  Pegasus: {
    promotesTo: 'Falcon Knight',
    kind: 'pegasus',
    promotionWeaponTypes: ['sword', 'lance'],
    caps: { hp: 60, str: 23, skl: 25, spd: 28, lck: 30, def: 22, res: 26, con: 20 },
    promo: { hp: 4, str: 2, skl: 2, spd: 2, def: 2, res: 2, con: 1 },
  },
  Fighter: {
    promotesTo: 'Warrior',
    kind: 'fighter',
    promotionWeaponTypes: ['axe', 'bow'],
    caps: { hp: 60, str: 30, skl: 28, spd: 26, lck: 30, def: 26, res: 22, con: 20 },
    promo: { hp: 3, str: 1, skl: 2, spd: 2, def: 3, res: 3, con: 1 },
  },
  Archer: {
    promotesTo: 'Sniper',
    kind: 'archer',
    promotionWeaponTypes: ['bow'],
    caps: { hp: 60, str: 25, skl: 30, spd: 28, lck: 30, def: 25, res: 23, con: 20 },
    promo: { hp: 3, str: 1, skl: 2, spd: 2, def: 2, res: 2, con: 1 },
  },
  Mage: {
    promotesTo: 'Sage',
    kind: 'mage',
    strLabel: 'MAG',
    promotionWeaponTypes: ['anima', 'staff'],
    caps: { hp: 60, str: 28, skl: 30, spd: 26, lck: 30, def: 21, res: 25, con: 20 },
    promo: { hp: 3, str: 1, skl: 1, spd: 1, def: 3, res: 3, con: 1 },
  },
  Monk: {
    promotesTo: 'Bishop',
    kind: 'monk',
    strLabel: 'MAG',
    promotionWeaponTypes: ['light', 'staff'],
    caps: { hp: 60, str: 25, skl: 26, spd: 24, lck: 30, def: 22, res: 30, con: 20 },
    promo: { hp: 3, str: 2, skl: 1, spd: 1, def: 2, res: 3, con: 1 },
  },
  Cleric: {
    promotesTo: 'Bishop',
    kind: 'cleric',
    strLabel: 'MAG',
    promotionWeaponTypes: ['light', 'staff'],
    caps: { hp: 60, str: 25, skl: 25, spd: 26, lck: 30, def: 21, res: 30, con: 20 },
    promo: { hp: 3, str: 2, skl: 1, spd: 1, def: 2, res: 3, con: 1 },
  },
  Shaman: {
    promotesTo: 'Druid',
    kind: 'shaman',
    strLabel: 'MAG',
    promotionWeaponTypes: ['dark', 'staff'],
    caps: { hp: 60, str: 29, skl: 26, spd: 26, lck: 30, def: 21, res: 28, con: 20 },
    promo: { hp: 4, str: 1, skl: 1, spd: 2, def: 2, res: 2, con: 1 },
  },
  Wyvern: {
    promotesTo: 'Wyvern Lord',
    kind: 'wyvern',
    promotionWeaponTypes: ['lance', 'axe'],
    caps: { hp: 60, str: 27, skl: 25, spd: 23, lck: 30, def: 28, res: 22, con: 20 },
    promo: { hp: 3, str: 2, skl: 2, spd: 2, def: 3, res: 1, con: 1 },
  },
} satisfies Record<string, ClassData>
// prettier-ignore
export const CLASS_TAGS: Record<string, string[]> = {
  Lord: [],
  'Blade Lord': [],
  Mercenary: [],
  Hero: [],
  Myrmidon: [],
  Swordmaster: [],
  Thief: [],
  Assassin: [],
  Knight: ['armored'],
  General: ['armored'],
  Cavalier: ['mounted'],
  Paladin: ['mounted'],
  Pegasus: ['flying'],
  'Falcon Knight': ['flying'],
  Wyvern: ['flying', 'dragon'],
  'Wyvern Lord': ['flying', 'dragon'],
  Fighter: [],
  Warrior: [],
  Archer: [],
  Sniper: [],
  Mage: [],
  Monk: [],
  Sage: [],
  Cleric: [],
  Bishop: [],
  Shaman: [],
  Druid: [],
}

// prettier-ignore
export const BOSS_NAMES_BY_CLASS: Record<string, string[]> = {
  Lord: ['Lundgren', 'Uther'],
  'Blade Lord': ['Elbert', 'Karla'],
  Mercenary: ['Saar', 'Carjiga'],
  Hero: ['Linus', 'Caellach', 'Aias'],
  Myrmidon: ['Glass', 'Lloyd', 'Carlyle'],
  Swordmaster: ['Lloyd', 'Carlyle'],
  Thief: ['Leila', 'Jan', 'Legault'],
  Assassin: ['Jaffar', 'Jerme'],
  Knight: ['Wire', 'Boies', 'Breguet'],
  General: ['Darin', 'Tirado', 'Vigarde', 'Bauker'],
  Cavalier: ['Murray', 'Cameron'],
  Paladin: ['Eagler', 'Pascal', 'Orson'],
  Pegasus: ['Ursula', 'Farina'],
  'Falcon Knight': ['Ursula', 'Farina'],
  Wyvern: ['Heath', 'Vaida', 'Glen', 'Valter'],
  'Wyvern Lord': ['Vaida', 'Glen', 'Valter'],
  Fighter: ['Batta', 'Zugu', 'Bazba', 'O’Neill', 'Bone'],
  Warrior: ['Oleg', 'Brendan'],
  Archer: ['Uhai'],
  Sniper: ['Uhai', 'Denning'],
  Mage: ['Aion', 'Pablo', 'Selena'],
  Monk: ['Kenneth', 'Riev'],
  Sage: ['Sonia', 'Limstella', 'Pablo'],
  Cleric: ['Kenneth', 'Riev'],
  Bishop: ['Kenneth', 'Riev'],
  // 'Evil Faratras' (FE:MS) is a boss-only cameo: boss names carry no stat block of
  // their own, so she borrows the rolled shaman spread (portrait: boss-portraits/evilfaratras.png).
  Shaman: ['Novala', 'Lyon', 'Teodor', 'Evil Faratras'],
  Druid: ['Nergal', 'Teodor', 'Evil Faratras'],
}

// Weapon data
// prettier-ignore
export const WEAPONS: WeaponData[] = [
  { name: 'Iron Sword', type: 'sword', rank: 'E', mt: 5, hit: 90, wt: 5, crit: 0, magic: false },
  { name: 'Slim Sword', type: 'sword', rank: 'E', mt: 3, hit: 95, wt: 2, crit: 5, magic: false, speedBonus: 4 },
  { name: 'Steel Sword', type: 'sword', rank: 'D', mt: 8, hit: 75, wt: 8, crit: 0, magic: false },
  { name: 'Iron Blade', type: 'sword', rank: 'D', mt: 10, hit: 70, wt: 12, crit: 0, magic: false },
  { name: 'Armourslayer', type: 'sword', rank: 'C', mt: 8, hit: 80, wt: 11, crit: 0, magic: false, effective: ['armored'] },
  { name: 'Longsword', type: 'sword', rank: 'C', mt: 6, hit: 85, wt: 11, crit: 0, magic: false, effective: ['mounted'] },
  { name: 'Killing Edge', type: 'sword', rank: 'C', mt: 9, hit: 75, wt: 7, crit: 30, magic: false },
  { name: 'Lancereaver', type: 'sword', rank: 'C', mt: 9, hit: 75, wt: 9, crit: 5, magic: false, reaver: true },
  { name: 'Swordslayer', type: 'sword', rank: 'C', mt: 11, hit: 80, wt: 13, crit: 5, magic: false, effective: ['swordUser'] },
  { name: 'Wyrmslayer', type: 'sword', rank: 'C', mt: 7, hit: 75, wt: 5, crit: 0, magic: false, effective: ['dragon'] },
  { name: 'Rune Sword', type: 'sword', rank: 'B', mt: 7, hit: 70, wt: 11, crit: 0, magic: true },
  { name: 'Silver Sword', type: 'sword', rank: 'A', mt: 13, hit: 80, wt: 8, crit: 0, magic: false },
  { name: 'Brave Sword', type: 'sword', rank: 'S', mt: 9, hit: 75, wt: 12, crit: 0, magic: false, brave: true },
  { name: 'Regal Blade', type: 'sword', rank: 'S', mt: 20, hit: 85, wt: 9, crit: 0, magic: false },
  { name: 'Sol Katti', type: 'sword', rank: 'S', mt: 12, hit: 95, wt: 7, crit: 25, magic: false, resBonus: 5, effective: ['dragon'] },

  { name: 'Dagger', type: 'dagger', rank: 'D', mt: 2, hit: 95, wt: 1, crit: 0, magic: false, halfDef: true },
  { name: 'Sai', type: 'dagger', rank: 'C', mt: 2, hit: 80, wt: 2, crit: 30, magic: false, halfDef: true },
  { name: 'Poison Dagger', type: 'dagger', rank: 'B', mt: 2, hit: 90, wt: 2, crit: 0, magic: false, halfDef: true, poison: true },
  { name: 'Silver Dagger', type: 'dagger', rank: 'A', mt: 6, hit: 100, wt: 4, crit: 0, magic: false, halfDef: true},

  { name: 'Iron Lance', type: 'lance', rank: 'E', mt: 7, hit: 80, wt: 8, crit: 0, magic: false },
  { name: 'Slim Lance', type: 'lance', rank: 'E', mt: 4, hit: 85, wt: 4, crit: 5, magic: false, speedBonus: 4 },
  { name: 'Javelin', type: 'lance', rank: 'D', mt: 6, hit: 65, wt: 11, crit: 0, magic: false, defBonus: 4 },
  { name: 'Steel Lance', type: 'lance', rank: 'D', mt: 10, hit: 70, wt: 12, crit: 0, magic: false },
  { name: 'Heavy Spear', type: 'lance', rank: 'C', mt: 9, hit: 70, wt: 14, crit: 0, magic: false, effective: ['armored'] },
  { name: 'Horseslayer', type: 'lance', rank: 'C', mt: 7, hit: 75, wt: 13, crit: 0, magic: false, effective: ['mounted'] },
  { name: 'Killer Lance', type: 'lance', rank: 'C', mt: 10, hit: 70, wt: 9, crit: 30, magic: false },
  { name: 'Axereaver', type: 'lance', rank: 'C', mt: 10, hit: 70, wt: 11, crit: 5, magic: false, reaver: true },
  { name: 'Spear', type: 'lance', rank: 'B', mt: 12, hit: 70, wt: 10, crit: 5, magic: false, defBonus: 4 },
  { name: 'Silver Lance', type: 'lance', rank: 'A', mt: 14, hit: 75, wt: 10, crit: 0, magic: false },
  { name: 'Brave Lance', type: 'lance', rank: 'S', mt: 10, hit: 70, wt: 14, crit: 0, magic: false, brave: true },

  { name: 'Iron Axe', type: 'axe', rank: 'E', mt: 8, hit: 75, wt: 10, crit: 0, magic: false },
  { name: 'Hatchet', type: 'axe', rank: 'E', mt: 5, hit: 85, wt: 6, crit: 0, magic: false, defBonus: 4 },
  { name: 'Steel Axe', type: 'axe', rank: 'D', mt: 11, hit: 65, wt: 14, crit: 0, magic: false },
  { name: 'Hand Axe', type: 'axe', rank: 'D', mt: 7, hit: 60, wt: 12, crit: 0, magic: false, defBonus: 4 },
  { name: 'Hammer', type: 'axe', rank: 'C', mt: 10, hit: 55, wt: 15, crit: 0, magic: false, effective: ['armored'] },
  { name: 'Halberd', type: 'axe', rank: 'C', mt: 10, hit: 60, wt: 15, crit: 0, magic: false, effective: ['mounted'] },
  { name: 'Longaxe', type: 'axe', rank: 'C', mt: 8, hit: 65, wt: 13, crit: 0, magic: false, effective: ['mounted'] },
  { name: 'Killer Axe', type: 'axe', rank: 'C', mt: 11, hit: 65, wt: 11, crit: 30, magic: false },
  { name: 'Swordreaver', type: 'axe', rank: 'C', mt: 11, hit: 65, wt: 13, crit: 5, magic: false, reaver: true },
  { name: 'Silver Axe', type: 'axe', rank: 'A', mt: 15, hit: 70, wt: 12, crit: 0, magic: false },
  { name: 'Tomahawk', type: 'axe', rank: 'A', mt: 13, hit: 65, wt: 14, crit: 0, magic: false, defBonus: 4 },
  { name: 'Brave Axe', type: 'axe', rank: 'S', mt: 10, hit: 65, wt: 16, crit: 0, magic: false, brave: true },

  { name: 'Iron Bow', type: 'bow', rank: 'E', mt: 6, hit: 85, wt: 5, crit: 0, magic: false, effective: ['flying'] },
  { name: 'Steel Bow', type: 'bow', rank: 'D', mt: 9, hit: 70, wt: 8, crit: 0, magic: false, effective: ['flying'] },
  { name: 'Short Bow', type: 'bow', rank: 'D', mt: 5, hit: 85, wt: 3, crit: 10, magic: false, speedBonus: 2, effective: ['flying'] },
  { name: 'Longbow', type: 'bow', rank: 'C', mt: 7, hit: 70, wt: 10, crit: 0, magic: false, defBonus: 4, effective: ['flying'] },
  { name: 'Poison Bow', type: 'bow', rank: 'C', mt: 4, hit: 80, wt: 6, crit: 0, magic: false, poison: true, effective: ['flying'] },
  { name: 'Killer Bow', type: 'bow', rank: 'B', mt: 9, hit: 75, wt: 7, crit: 30, magic: false, effective: ['flying'] },
  { name: 'Silver Bow', type: 'bow', rank: 'A', mt: 13, hit: 75, wt: 6, crit: 0, magic: false, effective: ['flying'] },
  { name: 'Brave Bow', type: 'bow', rank: 'S', mt: 10, hit: 70, wt: 12, crit: 0, magic: false, brave: true, effective: ['flying'] },

  { name: 'Fire', type: 'anima', rank: 'E', mt: 5, hit: 90, wt: 4, crit: 0, magic: true },
  { name: 'Wind', type: 'anima', rank: 'E', mt: 3, hit: 95, wt: 4, crit: 10, magic: true, effective: ['flying'] },
  { name: 'Thunder', type: 'anima', rank: 'D', mt: 8, hit: 80, wt: 6, crit: 5, magic: true },
  { name: 'Cutting Gale', type: 'anima', rank: 'C', mt: 7, hit: 100, wt: 5, crit: 20, magic: true, effective: ['flying'] },
  { name: 'Elfire', type: 'anima', rank: 'C', mt: 10, hit: 85, wt: 8, crit: 0, magic: true },
  { name: 'Fimbulvetr', type: 'anima', rank: 'B', mt: 12, hit: 80, wt: 10, crit: 0, magic: true },
  { name: 'Bolting', type: 'anima', rank: 'A', mt: 12, hit: 60, wt: 15, crit: 0, magic: true, pierceRes: true },
  { name: 'Excalibur', type: 'anima', rank: 'S', mt: 18, hit: 90, wt: 13, crit: 10, magic: true, effective: ['flying'] },

  { name: 'Lightning', type: 'light', rank: 'E', mt: 4, hit: 95, wt: 6, crit: 5, magic: true },
  { name: 'Thani', type: 'light', rank: 'D', mt: 4, hit: 100, wt: 6, crit: 0, magic: true, effective: ['mounted', 'armored'] },
  { name: 'Shine', type: 'light', rank: 'D', mt: 6, hit: 90, wt: 8, crit: 8, magic: true },
  { name: 'Divine', type: 'light', rank: 'C', mt: 8, hit: 85, wt: 10, crit: 10, magic: true },
  { name: 'Purge', type: 'light', rank: 'B', mt: 10, hit: 70, wt: 15, crit: 0, magic: true, pierceRes: true },
  { name: 'Aura', type: 'light', rank: 'A', mt: 12, hit: 80, wt: 12, crit: 15, magic: true },
  { name: 'Aureola', type: 'light', rank: 'S', mt: 15, hit: 90, wt: 14, crit: 5, magic: true, resBonus: 5 },

  { name: 'Flux', type: 'dark', rank: 'E', mt: 7, hit: 80, wt: 8, crit: 0, magic: true },
  { name: 'Ruin', type: 'dark', rank: 'D', mt: 5, hit: 75, wt: 6, crit: 20, magic: true },
  { name: 'Luna', type: 'dark', rank: 'C', mt: 0, hit: 95, wt: 10, crit: 20, magic: true, pierceRes: true },
  { name: 'Nosferatu', type: 'dark', rank: 'C', mt: 10, hit: 70, wt: 14, crit: 0, magic: true, drain: true },
  { name: 'Mire', type: 'dark', rank: 'B', mt: 6, hit: 70, wt: 9, crit: 0, magic: true, poison: true },
  { name: 'Eclipse', type: 'dark', rank: 'B', mt: 0, hit: 60, wt: 14, crit: 0, magic: true, halveHp: true },
  { name: 'Fenrir', type: 'dark', rank: 'A', mt: 15, hit: 70, wt: 10, crit: 0, magic: true },
  { name: 'Ereshkigal', type: 'dark', rank: 'S', mt: 20, hit: 95, wt: 12, crit: 0, magic: true },

  { name: 'Heal Staff', type: 'staff', rank: 'E', mt: 10, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal' },
  { name: 'Bloom Festal', type: 'staff', rank: 'E', mt: 2, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal', defBonus: 4 },
  { name: 'Mend Staff', type: 'staff', rank: 'D', mt: 20, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal' },
  { name: 'Poison Staff', type: 'staff', rank: 'D', mt: 0, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'poison' },
  { name: 'Physic Staff', type: 'staff', rank: 'C', mt: 10, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal', defBonus: 4 },
  { name: 'Sleep Staff', type: 'staff', rank: 'C', mt: 0, hit: 75, wt: 0, crit: 0, staff: true, magic: true, effect: 'sleep' },
  { name: 'Berserk Staff', type: 'staff', rank: 'B', mt: 0, hit: 65, wt: 0, crit: 0, staff: true, magic: true, effect: 'berserk' },
  { name: 'Recover Staff', type: 'staff', rank: 'A', mt: 40, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal' },
  // { name: 'Restore Staff', type: 'staff', rank: 'A', mt: 10, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'healWithStatuses' },
  { name: 'Fortify Staff', type: 'staff', rank: 'S', mt: 0, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'fortify' },
]

export function weaponRarityFromRank(rank: WeaponRank): Rarity {
  if (rank === 'A' || rank === 'S') return 'rare'
  if (rank === 'C' || rank === 'B') return 'uncommon'
  return 'normal'
}
export function weaponRarityLabel(rarity: Rarity): string {
  return rarity === 'rare' ? 'Rare' : rarity === 'uncommon' ? 'Uncommon' : 'Normal'
}
export function prepareWeaponData(): void {
  WEAPONS.forEach((w) => {
    const rank = String(w.rank || 'E').toUpperCase()
    w.rank = DATA_WEAPON_RANKS.includes(rank as WeaponRank) ? (rank as WeaponRank) : 'E'
    w.rarity = w.rarity || weaponRarityFromRank(w.rank)
  })
}
prepareWeaponData()

// Consumable data
// prettier-ignore
export const CONSUMABLES: ConsumableData[] = [
  { id: 'vulnerary', name: 'Vulnerary', rarity: 'normal', effect: 'heal', amount: 10, desc: 'Restores 10 HP to one living ally.' },
  { id: 'concoction', name: 'Concoction', rarity: 'uncommon', effect: 'heal', amount: 20, desc: 'Restores 20 HP to one living ally.' },
  { id: 'elixir', name: 'Elixir', rarity: 'rare', effect: 'fullHeal', desc: 'Fully restores one living ally.' },
  { id: 'dragon_tears', name: 'Dragon Tears', rarity: 'rare', effect: 'revive', desc: 'Revives one fallen ally with half HP.' },
  { id: 'geosphere', name: 'Geosphere', rarity: 'rare', effect: 'aoeDamage', amount: 13, desc: 'Deals 13 damage to all enemies.' },
  { id: 'restore_potion', name: 'Restore Potion', rarity: 'uncommon', effect: 'restore', desc: 'Clears Sleep or Berserk from one living ally.' },

  { id: 'hp_tonic', name: 'HP Tonic', rarity: 'normal', effect: 'buff', stat: 'hp', amount: 10, desc: 'Grants max HP +10 for the current battle.' },
  { id: 'power_tonic', name: 'Power Tonic', rarity: 'normal', effect: 'buff', stat: 'str', amount: 4, desc: 'Grants Str/Mag +4 for the current battle.' },
  { id: 'speed_tonic', name: 'Speed Tonic', rarity: 'normal', effect: 'buff', stat: 'spd', amount: 4, desc: 'Grants Spd +4 for the current battle.' },
  { id: 'guard_tonic', name: 'Guard Tonic', rarity: 'normal', effect: 'buff', stat: 'def', amount: 4, desc: 'Grants Def +4 for the current battle.' },
  { id: 'ward_tonic', name: 'Ward Tonic', rarity: 'normal', effect: 'buff', stat: 'res', amount: 4, desc: 'Grants Res +4 for the current battle.' },

  { id: 'power_potion', name: 'Filla\'s Might', rarity: 'uncommon', effect: 'turnBuff', stat: 'str', amount: 20, desc: 'Grants Str/Mag +20 until end of target\'s next turn.' },
  { id: 'skill_potion', name: 'Thor’s Ire', rarity: 'uncommon', effect: 'turnBuff', stat: 'skl', amount: 20, desc: 'Grants Skl +20 until end of target\'s next turn.' },
  { id: 'speed_potion', name: 'Set’s Litany', rarity: 'uncommon', effect: 'turnBuff', stat: 'spd', amount: 20, desc: 'Grants Spd +20 until end of target\'s next turn.' },
  { id: 'guard_potion', name: 'Battle Robe', rarity: 'uncommon', effect: 'turnBuff', stat: 'def', amount: 20, desc: 'Grants Def +20 until end of target\'s next turn.' },
  { id: 'ward_potion', name: 'Ninis\'s Grace', rarity: 'uncommon', effect: 'turnBuff', stat: 'res', amount: 20, desc: 'Grants Res +20 until end of target\'s next turn.' },
]

// Candidate held-item data. These are not wired into gameplay yet.
// Intended shape: each unit can equip one held item, usually from reward/shop pools.
// prettier-ignore
export const HELD_ITEMS: CandidateItemData[] = [
  // Auto-consumables and status protections
  { id: 'awakening_charm', name: 'Awakening Charm', rarity: 'normal', price: 400, family: 'protection', effect: 'sleepImmune', desc: 'Prevents sleep.' },
  { id: 'clarity_charm', name: 'Clarity Charm', rarity: 'uncommon', price: 600, family: 'protection', effect: 'berserkImmune', desc: 'Prevents berserk.' },
  { id: 'antitoxin_charm', name: 'Antitoxin Charm', rarity: 'normal', price: 500, family: 'protection', effect: 'poisonImmune', desc: 'Prevents poison.' },
  // { id: 'dragon_tears_charm', name: 'Dragon Tears Charm', rarity: 'rare', price: 2300, family: 'autoConsumable', trigger: 'lethalDamage', effect: 'revive', healPercent: 50, uses: 1, desc: 'Once per battle, revives holder at half HP when defeated.' },
  { id: 'geosphere_shard', name: 'Geosphere Shard', rarity: 'rare', price: 1700, family: 'autoConsumable', trigger: 'battleStart', effect: 'enemyAoeDamage', amount: 5, uses: 1, desc: 'At battle start, deals 5 damage to all enemies.' },

  // Shields and guards
  { id: 'iron_shield', name: 'Iron Shield', rarity: 'normal', price: 300, family: 'shield', stats: { def: 2 }, speedPenalty: 2, desc: 'Def +2, Spd -2.' },
  { id: 'steel_shield', name: 'Steel Shield', rarity: 'normal', price: 500, family: 'shield', stats: { def: 4 }, speedPenalty: 4, desc: 'Def +4, Spd -4.' },
  { id: 'tower_shield', name: 'Tower Shield', rarity: 'uncommon', price: 750, family: 'shield', stats: { def: 6 }, speedPenalty: 8, desc: 'Def +6, Spd -8.' },
  { id: 'silver_shield', name: 'Silver Shield', rarity: 'rare', price: 1100, family: 'shield', stats: { def: 5 }, speedPenalty: 2, desc: 'Def +5, Spd -2.' },
  { id: 'hexlock_shield', name: 'Hexlock Shield', rarity: 'uncommon', price: 800, family: 'shield', stats: { res: 4 }, speedPenalty: 2, desc: 'Res +4, Spd -2.' },
  { id: 'aegis_shield', name: 'Aegis Shield', rarity: 'rare', price: 1100, family: 'shield', stats: { def: 3, res: 3 }, speedPenalty: 3, desc: 'Def +3, Res +3, Spd -3.' },

  { id: 'iron_rune', name: 'Iron Rune', rarity: 'uncommon', price: 800, family: 'guard', effect: 'critImmune', desc: 'Nullifies incoming critical hits.' },
  { id: 'delphi_shield', name: 'Delphi Shield', rarity: 'uncommon', price: 900, family: 'guard', effect: 'flyingEffectiveImmune', desc: 'Negates bonus damage against flying units.' },
  { id: 'svalinn_shield', name: 'Svalinn Shield', rarity: 'uncommon', price: 900, family: 'guard', effect: 'armoredEffectiveImmune', desc: 'Negates bonus damage against armored units.' },
  { id: 'dragon_mail', name: 'Dragon Mail', rarity: 'uncommon', price: 900, family: 'guard', effect: 'dragonEffectiveImmune', desc: 'Negates bonus damage against dragon units.' },
  { id: 'troll_charm', name: 'Troll Charm', rarity: 'uncommon', price: 800, family: 'charm', trigger: 'turnStart', effect: 'regenPercent', amount: 10, desc: 'Restores 10% max HP each turn.' },

  // Rings and passive stat items
  { id: 'accuracy_ring', name: 'Accuracy Ring', rarity: 'normal', price: 500, family: 'charm', hit: 10, desc: 'Hit +10 while held.' },
  { id: 'evasion_ring', name: 'Evasion Ring', rarity: 'normal', price: 550, family: 'charm', avoid: 10, desc: 'Avoid +10 while held.' },
  { id: 'hunters_ring', name: 'Hunter\'s Ring', rarity: 'uncommon', price: 750, family: 'charm', crit: 10, desc: 'Crit +10 while held.' },
  { id: 'power_ring', name: 'Power Ring', rarity: 'normal', price: 1200, family: 'ring', stats: { str: 4 }, desc: 'Str/Mag +4 while held.' },
  { id: 'skill_ring', name: 'Skill Ring', rarity: 'normal', price: 900, family: 'ring', stats: { skl: 4 }, desc: 'Skl +4 while held.' },
  { id: 'speed_ring', name: 'Speed Ring', rarity: 'normal', price: 1350, family: 'ring', stats: { spd: 4 }, desc: 'Spd +4 while held.' },
  { id: 'clover', name: 'Four-leaf Clover', rarity: 'normal', price: 400, family: 'ring', stats: { lck: 4 }, desc: 'Lck +4 while held.' },
  { id: 'luck_ring', name: 'Luck Ring', rarity: 'uncommon', price: 800, family: 'ring', stats: { lck: 8 }, desc: 'Lck +8 while held.' },
  { id: 'shield_ring', name: 'Shield Ring', rarity: 'normal', price: 1200, family: 'ring', stats: { def: 4 }, desc: 'Def +4 while held.' },
  { id: 'barrier_ring', name: 'Barrier Ring', rarity: 'normal', price: 1100, family: 'ring', stats: { res: 4 }, desc: 'Res +4 while held.' },
  { id: 'body_ring_held', name: 'Body Ring', rarity: 'uncommon', price: 850, family: 'ring', stats: { con: 4 }, desc: 'Con +4 while held.' },
  { id: 'life_ring', name: 'Life Ring', rarity: 'uncommon', price: 950, family: 'ring', trigger: 'turnStart', effect: 'regenFlat', amount: 5, desc: 'Restores 5 HP at turn start.' },
  // { id: 'miracle_ring', name: 'Miracle Ring', rarity: 'rare', price: 1800, family: 'ring', trigger: 'lethalDamage', effect: 'miracle', uses: 1, desc: 'Once per battle, survives lethal damage at 1 HP.' },
  // { id: 'pursuit_ring', name: 'Pursuit Ring', rarity: 'rare', price: 2400, family: 'ring', effect: 'quadrupleStrike', desc: 'Holder can hit 4 times against enemies with 8 less speed.' },

  // Combat charms and scrolls
  { id: 'wrath_scroll', name: 'Wrath Scroll', rarity: 'uncommon', price: 1000, family: 'scroll', trigger: 'hpBelowHalf', crit: 20, desc: 'Crit +20 while below 50% HP.' },
  // don't enable { id: 'vantage_scroll', name: 'Vantage Scroll', rarity: 'uncommon', price: 1100, family: 'scroll', trigger: 'hpBelowHalf', effect: 'counterFirst', desc: 'When below 50% HP, counters before the attacker.' },
  // { id: 'adept_scroll', name: 'Adept Scroll', rarity: 'rare', price: 1800, family: 'scroll', trigger: 'afterHit', effect: 'extraStrikeChance', chance: 20, desc: '20% chance to immediately strike again after a hit.' },
  // { id: 'nihil_scroll', name: 'Nihil Scroll', rarity: 'rare', price: 1600, family: 'scroll', effect: 'negateEnemySpecials', desc: 'Negates enemy critical hits, poison, drain, and effective damage against holder.' },
  { id: 'renewal_scroll', name: 'Renewal Scroll', rarity: 'rare', price: 2100, family: 'scroll', trigger: 'turnStart', effect: 'regenPercent', amount: 15, desc: 'Restores 15% max HP at turn start.' },
  { id: 'resolve_scroll', name: 'Resolve Scroll', rarity: 'rare', price: 1900, family: 'scroll', trigger: 'hpBelowHalf', stats: { skl: 4, spd: 4 }, desc: 'Skl +4 and Spd +4 while below 50% HP.' },
  // { id: 'parity_scroll', name: 'Parity Scroll', rarity: 'uncommon', price: 1200, family: 'scroll', trigger: 'combatStart', effect: 'ignoreBothHeldItems', desc: 'During holder combat, both combatants ignore skills and held-item effects.' },
  // {  name: 'Executioner\'s Scroll', rarity: 'rare', price: 1800, desc: 'Hit +20 and Crit +20 against enemies with below 50% HP.' },
  
  // Weapon-style modifiers
  { id: 'poison_badge', name: 'Poison Badge', rarity: 'rare', price: 1600, family: 'charm', effect: 'weaponPoison', desc: 'Holder poisons enemies on weapon hit.' },
  { id: 'drain_badge', name: 'Drain Badge', rarity: 'rare', price: 1800, family: 'charm', effect: 'weaponDrainPercent', amount: 25, desc: 'Holder heals for 25% of damage dealt.' },
  { id: 'pierce_badge', name: 'Pierce Badge', rarity: 'rare', price: 1600, family: 'badge', trigger: 'attack', effect: 'defPierceChance', chance: 20, desc: '20% chance for attacks to ignore half Def or Res.' },
  // { id: 'breaker_badge', name: 'Breaker Badge', rarity: 'uncommon', price: 900, family: 'badge', trigger: 'weaponTriangleAdvantage', hit: 15, avoid: 15, desc: 'Hit +15 and Avoid +15 when holder has weapon triangle advantage.' },
  // { id: 'reaver_badge', name: 'Reaver Badge', rarity: 'uncommon', price: 950, family: 'badge', effect: 'reverseTriangle', desc: 'Reverses holder weapon triangle matchups.' },
  // { id: 'brave_badge', name: 'Brave Badge', rarity: 'rare', price: 2300, family: 'badge', trigger: 'firstAttack', effect: 'extraFirstStrike', uses: 1, desc: 'Once per battle, holder makes one extra strike on their first attack.' },
  // {  name: 'Franklin Badge', rarity: 'rare', price: 1800, desc: 'Each combat, reflects the first received magic attack with half damage. Res -5.' },

  // Economy and long-term planning
  // { id: 'silver_card', name: 'Silver Card', rarity: 'rare', price: 2200, family: 'economy', effect: 'shopDiscount', amount: 20, desc: 'Shop prices are 20% lower.' },
  // { id: 'member_card', name: 'Member Card', rarity: 'uncommon', price: 1200, family: 'economy', effect: 'weaponDiscount', amount: 50, desc: 'Weapon prices are 50% lower.' },
  // { id: 'bargain_band', name: 'Bargain Band', rarity: 'uncommon', price: 1100, family: 'economy', effect: 'forgeDiscount', amount: 25, desc: 'Forge costs are 25% lower while held.' },
  // { id: 'white_gem', name: 'White Gem', rarity: 'uncommon', price: 800, family: 'economy', trigger: 'victory', effect: 'bonusGoldFlat', amount: 100, desc: 'Gain 100 G after each battle while held.' },
  // { id: 'red_gem', name: 'Red Gem', rarity: 'rare', price: 600, family: 'economy', trigger: 'skipReward', effect: 'bonusGoldFlat', amount: 200, desc: 'Skip reward gold is increased by 200 while held.' },
  // { id: 'knowledge_gem', name: 'Knowledge Gem', rarity: 'uncommon', price: 1000, family: 'growth', trigger: 'levelUp', effect: 'extraGrowthRoll', chance: 25, desc: '25% chance to gain one extra successful growth stat on level up.' },
  // { id: 'paragon_band', name: 'Paragon Band', rarity: 'rare', price: 2200, family: 'growth', trigger: 'victoryLevelUp', effect: 'extraLevelChance', chance: 25, desc: '25% chance to gain one extra level after battle victories.' },

  // FE9-style growth bands, adapted for this roguelike
  { id: 'fighter_band', name: 'Fighter Band', rarity: 'normal', price: 800, family: 'growthBand', growths: { hp: 15, str: 5 }, desc: 'HP growth +15, Str/Mag growth +5.' },
  { id: 'knight_band', name: 'Knight Band', rarity: 'normal', price: 800, family: 'growthBand', growths: { hp: 5, def: 15 }, desc: 'HP growth +5, Def growth +15.' },
  { id: 'mage_band', name: 'Mage Band', rarity: 'normal', price: 800, family: 'growthBand', growths: { str: 15, res: 5 }, desc: 'Str/Mag growth +15, Res growth +5.' },
  { id: 'pegasus_band', name: 'Pegasus Band', rarity: 'normal', price: 800, family: 'growthBand', growths: { spd: 15, res: 5 }, desc: 'Spd growth +15, Res growth +5.' },
  { id: 'thief_band', name: 'Thief Band', rarity: 'normal', price: 800, family: 'growthBand', growths: { spd: 10, lck: 10 }, desc: 'Spd growth +10, Lck growth +10.' },
  { id: 'archer_band', name: 'Archer Band', rarity: 'normal', price: 800, family: 'growthBand', growths: { skl: 15, spd: 5 }, desc: 'Skl growth +15, Spd growth +5.' },
  { id: 'wyvern_band', name: 'Wyvern Band', rarity: 'uncommon', price: 1000, family: 'growthBand', growths: { str: 10, def: 10 }, desc: 'Str/Mag growth +10, Def growth +10.' },
  { id: 'hero_band', name: 'Hero Band', rarity: 'rare', price: 1100, family: 'growthBand', growths: { str: 7, skl: 7, spd: 7, def: 7 }, desc: 'Str, Mag, Skl, Spd, Def growth +7.' },
]

export const SKILL_CLASS_GROUPS: SkillGroupMap = {
  any: ['Any'],
  lord: ['Lord', 'Blade Lord'],
  mercenary: ['Mercenary', 'Hero'],
  myrmidon: ['Myrmidon', 'Swordmaster'],
  thief: ['Thief', 'Assassin'],
  knight: ['Knight', 'General'],
  cavalier: ['Cavalier', 'Paladin'],
  pegasus: ['Pegasus', 'Falcon Knight'],
  wyvern: ['Wyvern', 'Wyvern Lord'],
  fighter: ['Fighter', 'Warrior'],
  archer: ['Archer', 'Sniper'],
  mage: ['Mage', 'Sage'],
  holy: ['Monk', 'Cleric', 'Bishop'],
  monk: ['Monk', 'Bishop'],
  cleric: ['Cleric', 'Bishop'],
  shaman: ['Shaman', 'Druid'],
}

// `classes` describes who should be eligible to learn the skill as a reward.
// prettier-ignore
export const TEACHABLE_SKILLS: SkillData[] = [
  // Universal and tactical skills
  { rarity: 'rare', id: 'aptitude', name: 'Aptitude', desc: 'All growth rates +10.', source: 'Awakening Villager', classes: SKILL_CLASS_GROUPS.any, family: 'growth', effect: 'growthBonusAll', amount: 10 },
  // { rarity: 'uncommon', id: 'veteran', name: 'Veteran', desc: '15% chance to gain one extra level after battle victories.', source: 'Awakening Tactician', classes: SKILL_CLASS_GROUPS.any, family: 'growth', trigger: 'victoryLevelUp', effect: 'extraLevelChance', chance: 15 },
  // { rarity: 'uncommon', id: 'profiteer', name: 'Profiteer', desc: '25% chance to gain 100 G after each victory.', source: 'Fates Merchant', classes: SKILL_CLASS_GROUPS.any, family: 'economy', trigger: 'victory', effect: 'goldChance', chance: 25, amount: 100 },
  // { rarity: 'uncommon', id: 'salvage_blow', name: 'Salvage Blow', desc: '10% chance after the user defeats an enemy to add a weapon reward option.', source: 'Fates Blacksmith', classes: SKILL_CLASS_GROUPS.any, family: 'reward', trigger: 'kill', effect: 'weaponRewardChance', chance: 10 },
  // { rarity: 'normal', id: 'potent_potion', name: 'Potent Potion', desc: 'Healing consumables used by the user restore +5 HP.', source: 'Fates Apothecary', classes: SKILL_CLASS_GROUPS.any, family: 'consumable', effect: 'consumableHealBonus', amount: 5 },
  // { rarity: 'uncommon', id: 'quick_salve', name: 'Quick Salve', desc: 'User can use self-targeted consumables without ending their action.', source: 'Fates Apothecary', classes: SKILL_CLASS_GROUPS.any, family: 'consumable', effect: 'freeConsumableSelf' },
  { rarity: 'uncommon', id: 'ignis', name: 'Ignis', desc: 'Skl% chance to add Res to damage.', source: 'Awakening Grandmaster', classes: SKILL_CLASS_GROUPS.any, family: 'proc', trigger: 'attack', effect: 'addResToDamageChance', chanceStat: 'skl' },
  { rarity: 'rare', id: 'quixotic', name: 'Quixotic', desc: 'Hit +30 and Crit +15 for the user and its attackers.', source: 'Fates Basara', classes: SKILL_CLASS_GROUPS.any, family: 'combat', hit: 30, crit: 15, incomingHit: 30, incomingCrit: 15 },

  // Lord and royal-flavored skills
  { rarity: 'normal', id: 'charm', name: 'Charm', desc: 'Allies have Hit +5 and Avoid +5 while the user is alive.', source: 'Awakening Lord', classes: SKILL_CLASS_GROUPS.lord, family: 'aura', teamAura: { hit: 5, avoid: 5 } },
  { rarity: 'normal', id: 'solidarity', name: 'Solidarity', desc: 'Allies have Crit +5 and Crit Avoid +5 while the user is alive.', source: 'Awakening Tactician', classes: SKILL_CLASS_GROUPS.any, family: 'aura', teamAura: { crit: 5, critAvoid: 5 } },
  { rarity: 'normal', id: 'nobility', name: 'Nobility', desc: 'All growth rates +5.', source: 'Fates Nohr Prince/Princess', classes: SKILL_CLASS_GROUPS.lord, family: 'growth', growths: { hp: 5, str: 5, skl: 5, spd: 5, lck: 5, def: 5, res: 5 } },
  // { rarity: 'uncommon', id: 'dual_strike_plus', name: 'Dual Strike+', desc: '15% chance to add 3 assist damage when an ally attacks.', source: 'Awakening Lord', classes: SKILL_CLASS_GROUPS.lord, family: 'team', trigger: 'allyAttack', effect: 'assistDamageChance', chance: 15, amount: 3 },
  { rarity: 'uncommon', id: 'inspiration', name: 'Inspiration', desc: 'Allies deal +2 damage and take -2 damage while the user is alive.', source: 'Fates Strategist', classes: SKILL_CLASS_GROUPS.any, family: 'aura', teamAura: { damageDealt: 2, damageTakenFlat: -2 } },
  { rarity: 'uncommon', id: 'dragon_fang', name: 'Dragon Fang', desc: 'Skl% chance to deal 1.5x damage.', source: 'Fates Nohr Prince/Princess', classes: SKILL_CLASS_GROUPS.lord, family: 'proc', trigger: 'attack', effect: 'damageMultiplierChance', chanceStat: 'skl', multiplier: 1.5 },
  { rarity: 'rare', id: 'aether', name: 'Aether', desc: 'Skl% chance to ignore half of Def/Res and heal for damage dealt.', source: 'Awakening Great Lord', classes: SKILL_CLASS_GROUPS.lord, family: 'proc', trigger: 'attack', effect: 'aetherChance', chanceStat: 'skl' },
  // { rarity: 'rare', id: 'rightful_king', name: 'Rightful King', desc: 'Team\'s skill activation chances +10%.', source: 'Awakening Great Lord', classes: SKILL_CLASS_GROUPS.lord, family: 'proc', procBonus: 10 },
  // { rarity: 'rare', id: 'draconic_hex', name: 'Draconic Hex', desc: 'After user combat, target suffers -2 all stats for one turn.', source: 'Fates Nohr Noble', classes: SKILL_CLASS_GROUPS.lord, family: 'debuff', trigger: 'afterCombat', stats: { str: -2, skl: -2, spd: -2, lck: -2, def: -2, res: -2 } },
  { rarity: 'rare', id: 'rally_spectrum', name: 'Rally Spectrum', desc: 'Allies gain all stats +2 on their first turn.', source: 'Awakening Grandmaster', classes: SKILL_CLASS_GROUPS.any, family: 'rally', trigger: 'battleStart', stats: { str: 2, skl: 2, spd: 2, lck: 2, def: 2, res: 2 } },
  { rarity: 'rare', id: 'oath_of_pylum', name: 'Oath of Pylum', desc: 'Allies take -3 damage while the user is alive.', source: 'Midnight Sun Ornieres', classes: SKILL_CLASS_GROUPS.lord, family: 'aura', teamAura: { damageTakenFlat: -3 } },

  // Mercenary and hero skills
  // { rarity: 'normal', id: 'armsthrift', name: 'Armsthrift', desc: 'Forging cost -200G.', source: 'Awakening Mercenary', classes: SKILL_CLASS_GROUPS.mercenary, family: 'weapon', effect: 'forgePreserveChance', chanceStat: 'lck' },
  // { rarity: 'normal', id: 'patience', name: 'Patience', desc: 'Hit +10 and Avoid +10 while counterattacking.', source: 'Awakening Mercenary', classes: SKILL_CLASS_GROUPS.mercenary, family: 'enemyPhase', hit: 10, avoid: 10 },
  // { rarity: 'normal', id: 'strong_riposte', name: 'Strong Riposte', desc: 'Deals +3 damage while counterattacking.', source: 'Fates Mercenary', classes: SKILL_CLASS_GROUPS.mercenary, family: 'enemyPhase', damageDealt: 3 },
  { rarity: 'normal', id: 'good_fortune', name: 'Good Fortune', desc: 'Lck% chance to heal 5 HP each turn.', source: 'Fates Mercenary', classes: SKILL_CLASS_GROUPS.mercenary, family: 'survival', trigger: 'turnStart', effect: 'luckHealChance', chanceStat: 'lck', amount: 5 },
  { rarity: 'uncommon', id: 'sol', name: 'Sol', desc: 'Skl% chance to heal for half damage dealt.', source: 'Awakening/Fates Hero', classes: SKILL_CLASS_GROUPS.mercenary, family: 'proc', trigger: 'attack', effect: 'drainChance', chanceStat: 'skl', healPercent: 50 },
  { rarity: 'rare', id: 'axebreaker', name: 'Axebreaker', desc: 'Hit +25 and Avoid +25 against axe users.', source: 'Awakening/Fates Hero', classes: SKILL_CLASS_GROUPS.mercenary, family: 'breaker', breaker: 'axe', hit: 25, avoid: 25 },

  // Myrmidon and swordmaster skills
  { rarity: 'normal', id: 'avoid_plus_10', name: 'Avoid +10', desc: 'Grants passive Avoid +10.', source: 'Awakening Myrmidon', classes: SKILL_CLASS_GROUPS.myrmidon, family: 'stat', avoid: 10 },
  // Left disabled: a "when attacking" Avoid bonus is inert here — 'playerPhase' avoid would only matter while attacking, and this engine has no counterattacks, so the attacker is never the one being hit (see avoid() in combat.ts).
  // { rarity: 'normal', id: 'duelists_blow', name: "Duelist's Blow", desc: 'Avoid +20 when initiating combat.', source: 'Fates Samurai', classes: SKILL_CLASS_GROUPS.myrmidon, family: 'playerPhase', avoid: 20 },
  // { rarity: 'uncommon', id: 'vantage', name: 'Vantage', desc: 'When below 50% HP, counters before the attacker.', source: 'Awakening/Fates Myrmidon', classes: SKILL_CLASS_GROUPS.myrmidon, family: 'enemyPhase', trigger: 'hpBelowHalf', effect: 'counterFirst' },
  // { rarity: 'rare', id: 'astra', name: 'Astra', desc: 'Skl%/2 chance to strike 5 times at half damage.', source: 'Awakening/Fates Swordmaster', classes: SKILL_CLASS_GROUPS.myrmidon, family: 'proc', trigger: 'attack', effect: 'multiStrikeChance', chanceStat: 'sklHalf', strikes: 5, damageMultiplier: 0.5 },
  { rarity: 'rare', id: 'swordfaire', name: 'Swordfaire', desc: 'Deals +4 damage with swords.', source: 'Awakening/Fates Swordmaster', classes: SKILL_CLASS_GROUPS.myrmidon, family: 'faire', weaponType: 'sword', damageDealt: 4 },
  { rarity: 'uncommon', id: 'life_and_death', name: 'Life and Death', desc: '+6 damage dealt and +6 damage taken.', source: 'Fates Master of Arms', classes: SKILL_CLASS_GROUPS.myrmidon, family: 'combat', damageDealt: 6, damageTakenFlat: 6 },

  // Thief, ninja, and assassin skills
  // { rarity: 'normal', id: 'locktouch', name: 'Locktouch', desc: 'Skip reward gold +200 G.', source: 'Awakening/Fates Thief', classes: SKILL_CLASS_GROUPS.thief, family: 'reward', effect: 'extraGoldOnSkip', amount: 200 },
  { rarity: 'normal', id: 'movement_plus_1', name: 'Movement', desc: "Spd +8 during user's first turn each battle.", source: 'Awakening Thief', classes: SKILL_CLASS_GROUPS.thief, family: 'tempo', stats: { spd: 8 } },
  // { rarity: 'uncommon', id: 'pass', name: 'Pass', desc: 'User ignores enemy held-item damage reduction.', source: 'Awakening Assassin', classes: SKILL_CLASS_GROUPS.thief, family: 'combat', effect: 'ignoreGuardAuras' },
  // { rarity: 'uncommon', id: 'poison_strike', name: 'Poison Strike', desc: 'The user\'s attacks inflict poison.', source: 'Fates Ninja', classes: SKILL_CLASS_GROUPS.thief, family: 'debuff', trigger: 'afterCombat', effect: 'poisonStrike', amountPercent: 20 },
  { rarity: 'rare', id: 'lethality', name: 'Lethality', desc: 'Skl%/4 chance to instantly defeat an enemy.', source: 'Awakening/Fates Assassin', classes: SKILL_CLASS_GROUPS.thief, family: 'proc', trigger: 'attack', effect: 'lethalChance', chanceStat: 'sklQuarter' },
  { rarity: 'uncommon', id: 'lucky_seven', name: 'Lucky Seven', desc: 'Attacks deal at least 7 damage.', source: 'Awakening Trickster', classes: SKILL_CLASS_GROUPS.thief, family: 'stat', effect: 'minimumDamage', amount: 7 },

  // Knight and general skills
  { rarity: 'normal', id: 'defense_plus_2', name: 'Defense +2', desc: 'Grants passive Def +2.', source: 'Awakening/Fates Knight', classes: SKILL_CLASS_GROUPS.knight, family: 'stat', stats: { def: 2 } },
  { rarity: 'normal', id: 'natural_cover', name: 'Natural Cover', desc: 'In Forest, Fort, Castle, Mountain, or Dungeon arenas, Def +2 and Res +2.', source: 'Fates Knight', classes: SKILL_CLASS_GROUPS.knight, family: 'arena', arenas: ['forest', 'fort', 'castle', 'mountain', 'dungeon'], stats: { def: 2, res: 2 } },
  // { rarity: 'uncommon', id: 'wary_fighter', name: 'Wary Fighter', desc: 'Neither combatant can double during user combat.', source: 'Fates General', classes: SKILL_CLASS_GROUPS.knight, family: 'combat', effect: 'preventDoubles' },
  { rarity: 'rare', id: 'pavise', name: 'Pavise', desc: 'Skl% chance to halve incoming physical damage.', source: 'Awakening/Fates General', classes: SKILL_CLASS_GROUPS.knight, family: 'proc', trigger: 'physicalHitTaken', effect: 'halveDamageChance', chanceStat: 'skl' },
  // Left disabled: a "when attacking" Def bonus is inert here (no counterattacks, so the attacker never takes damage during its own combat).
  // { rarity: 'uncommon', id: 'armored_blow', name: 'Armored Blow', desc: 'Gain Def +6 for one turn when defeating an enemy.', source: 'Fates Great Knight', classes: SKILL_CLASS_GROUPS.knight, family: 'playerPhase', stats: { def: 6 } },
  { rarity: 'uncommon', id: 'rally_defense', name: 'Rally Defense', desc: 'Allies gain Def +4 on their first turn.', source: 'Awakening/Fates General', classes: SKILL_CLASS_GROUPS.knight, family: 'rally', trigger: 'battleStart', stats: { def: 4 } },

  // Cavalier and paladin skills
  // { rarity: 'normal', id: 'discipline', name: 'Discipline', desc: 'Weapons of rank C or lower cost 100 G less in shops.', source: 'Awakening Cavalier', classes: SKILL_CLASS_GROUPS.cavalier, family: 'weapon', effect: 'shopRankDiscount', upToRank: 'C', amount: 100 },
  { rarity: 'normal', id: 'outdoor_fighter', name: 'Outdoor Fighter', desc: 'Hit +10 and Avoid +10 in Road, Plains, Forest, Swamp, Mountain, River Delta, and Desert arenas.', source: 'Awakening Cavalier', classes: SKILL_CLASS_GROUPS.cavalier, family: 'arena', arenas: ['road', 'plains', 'forest', 'swamp', 'mountain', 'river_delta', 'desert'], hit: 10, avoid: 10 },
  { rarity: 'normal', id: 'elbow_room', name: 'Elbow Room', desc: 'Deals +3 damage in Road, Plains, River Delta, and Desert arenas.', source: 'Fates Cavalier', classes: SKILL_CLASS_GROUPS.cavalier, family: 'arena', arenas: ['road', 'plains', 'river_delta', 'desert'], damageDealt: 3 },
  // { rarity: 'uncommon', id: 'shelter', name: 'Shelter', desc: 'Once per battle, redirects one attack from an ally below 50% HP to the user.', source: 'Fates Cavalier', classes: SKILL_CLASS_GROUPS.cavalier, family: 'support', trigger: 'allyBelowHalf', effect: 'coverAlly', uses: 1 },
  { rarity: 'uncommon', id: 'defender', name: 'Defender', desc: 'Grants passive Def/Res +2.', source: 'Awakening/Fates Paladin', classes: SKILL_CLASS_GROUPS.cavalier, family: 'stat', stats: { def: 2, res: 2 } },
  { rarity: 'rare', id: 'aegis', name: 'Aegis', desc: 'Skl% chance to halve incoming magical damage.', source: 'Awakening/Fates Paladin', classes: SKILL_CLASS_GROUPS.cavalier, family: 'proc', trigger: 'magicHitTaken', effect: 'halveDamageChance', chanceStat: 'skl' },
  { rarity: 'rare', id: 'luna', name: 'Luna', desc: 'Skl% chance to ignore half of Def/Res.', source: 'Awakening/Fates Great Knight', classes: SKILL_CLASS_GROUPS.cavalier, family: 'proc', trigger: 'attack', effect: 'halveDefenseChance', chanceStat: 'skl' },

  // Pegasus and falcon knight skills
  { rarity: 'normal', id: 'speed_plus_2', name: 'Speed +2', desc: 'Grants passive Spd +2.', source: 'Awakening/Fates Pegasus Knight', classes: SKILL_CLASS_GROUPS.pegasus, family: 'stat', stats: { spd: 2 } },
  { rarity: 'normal', id: 'relief', name: 'Relief', desc: 'Restores 10% max HP if adjacent allies have fallen.', source: 'Awakening Pegasus Knight', classes: SKILL_CLASS_GROUPS.pegasus, family: 'survival', trigger: 'turnStart', effect: 'regenIfAdjacentAllyFallen', amount: 10 },
  { rarity: 'uncommon', id: 'darting_blow', name: 'Darting Blow', desc: 'Spd +5 when attacking.', source: 'Fates Sky Knight', classes: SKILL_CLASS_GROUPS.pegasus, family: 'playerPhase', stats: { spd: 5 } },
  { rarity: 'normal', id: 'camaraderie', name: 'Camaraderie', desc: 'Restores 5 HP each turn if at least two allies are alive.', source: 'Fates Sky Knight', classes: SKILL_CLASS_GROUPS.pegasus, family: 'survival', trigger: 'turnStart', effect: 'regenFlatIfAlliesAlive', minAllies: 2, amount: 5 },
  { rarity: 'rare', id: 'lancefaire', name: 'Lancefaire', desc: 'Deals +4 damage with lances.', source: 'Awakening Falcon Knight/Fates Spear Master', classes: SKILL_CLASS_GROUPS.pegasus, family: 'faire', weaponType: 'lance', damageDealt: 4 },
  // { rarity: 'rare', id: 'galeforce', name: 'Galeforce', desc: 'Once per battle, the user gets another action after their first kill.', source: 'Awakening Dark Flier', classes: SKILL_CLASS_GROUPS.pegasus, family: 'tempo', trigger: 'firstKill', effect: 'extraAction', uses: 1 },
  // Left disabled: a "when attacking" Res bonus is inert here (no counterattacks, so the attacker never takes damage during its own combat).
  // { rarity: 'uncommon', id: 'warding_blow', name: 'Warding Blow', desc: 'Res +8 when initiating combat.', source: 'Fates Falcon Knight', classes: SKILL_CLASS_GROUPS.pegasus, family: 'playerPhase', stats: { res: 8 } },
  { rarity: 'rare', id: 'lancebreaker', name: 'Lancebreaker', desc: 'Hit +25 and Avoid +25 against lance users.', source: 'Awakening Griffon Knight', classes: SKILL_CLASS_GROUPS.pegasus, family: 'breaker', breaker: 'lance', hit: 25, avoid: 25 },

  // Wyvern rider skills
  { rarity: 'normal', id: 'strength_plus_2', name: 'Strength +2', desc: 'Grants passive Str +2.', source: 'Awakening/Fates Wyvern Rider', classes: SKILL_CLASS_GROUPS.wyvern, family: 'stat', stats: { str: 2 } },
  { rarity: 'normal', id: 'tantivy', name: 'Tantivy', desc: 'Hit +10 and Avoid +10 if adjacent allies have fallen.', source: 'Awakening Wyvern Rider', classes: SKILL_CLASS_GROUPS.wyvern, family: 'solo', hit: 10, avoid: 10 },
  // { rarity: 'normal', id: 'lunge', name: 'Lunge', desc: 'After the user initiates combat, target Def -2 until it's next turn.', source: 'Fates Wyvern Rider', classes: SKILL_CLASS_GROUPS.wyvern, family: 'debuff', trigger: 'afterCombat', stats: { def: -2 } },
  // { rarity: 'rare', id: 'trample', name: 'Trample', desc: 'Deals +4 damage to non-mounted enemies.', source: 'Fates Malig Knight', classes: SKILL_CLASS_GROUPS.wyvern, family: 'effective', targetTagNot: 'mounted', damageDealt: 4 },
  // { rarity: 'uncommon', id: 'savage_blow', name: 'Savage Blow', desc: 'After the user initiates combat, other enemies lose 10% max HP.', source: 'Fates Malig Knight', classes: SKILL_CLASS_GROUPS.wyvern, family: 'aoe', trigger: 'afterInitiatingCombat', effect: 'enemyTeamDamage', amountPercent: 10 },
  { rarity: 'rare', id: 'swordbreaker', name: 'Swordbreaker', desc: 'Hit +25 and Avoid +25 against sword users.', source: 'Awakening Wyvern Lord/Fates Wyvern Lord', classes: SKILL_CLASS_GROUPS.wyvern, family: 'breaker', breaker: 'sword', hit: 25, avoid: 25 },
  { rarity: 'uncommon', id: 'rally_defense_wyvern', name: 'Rally Defense', desc: 'Allies gain Def +4 on their first turn.', source: 'Fates Wyvern Lord', classes: SKILL_CLASS_GROUPS.wyvern, family: 'rally', trigger: 'battleStart', stats: { def: 4 } },

  // Fighter, warrior, and axe skills
  { rarity: 'normal', id: 'hp_plus_5', name: 'HP +5', desc: 'Grants passive Max HP +5.', source: 'Awakening/Fates Fighter', classes: SKILL_CLASS_GROUPS.fighter, family: 'stat', stats: { hp: 5 } },
  { rarity: 'normal', id: 'zeal', name: 'Zeal', desc: 'Grants passive Crit +5.', source: 'Awakening Fighter', classes: SKILL_CLASS_GROUPS.fighter, family: 'stat', crit: 5 },
  { rarity: 'normal', id: 'gamble', name: 'Gamble', desc: 'Hit -10 and Crit +15.', source: 'Awakening/Fates Barbarian/Fighter', classes: SKILL_CLASS_GROUPS.fighter, family: 'combat', hit: -10, crit: 15 },
  // { rarity: 'rare', id: 'counter', name: 'Counter', desc: 'Reflects 30% of physical damage taken.', source: 'Awakening/Fates Warrior', classes: SKILL_CLASS_GROUPS.fighter, family: 'retaliation', trigger: 'physicalHitTaken', effect: 'reflectDamagePercent', amountPercent: 30 },
  { rarity: 'uncommon', id: 'death_blow', name: 'Death Blow', desc: 'Crit +20 when attacking.', source: 'Fates Berserker', classes: SKILL_CLASS_GROUPS.fighter, family: 'playerPhase', crit: 20 },
  { rarity: 'rare', id: 'axefaire', name: 'Axefaire', desc: 'Deals +4 damage with axes.', source: 'Awakening/Fates Berserker', classes: SKILL_CLASS_GROUPS.fighter, family: 'faire', weaponType: 'axe', damageDealt: 4 },
  { rarity: 'uncommon', id: 'rally_strength', name: 'Rally Strength', desc: 'Non-magic allies gain Str +4 on their first turn.', source: 'Awakening/Fates Warrior', classes: SKILL_CLASS_GROUPS.fighter, family: 'rally', trigger: 'battleStart', rallyTarget: 'physical', stats: { str: 4 } },

  // Archer and sniper skills
  { rarity: 'normal', id: 'skill_plus_2', name: 'Skill +2', desc: 'Grants passive Skl +2.', source: 'Awakening/Fates Archer', classes: SKILL_CLASS_GROUPS.archer, family: 'stat', stats: { skl: 2 } },
  // Partial: the Hit +15 applies (read in hitRate), but the Avoid +15 is currently inert — 'playerPhase' avoid is only relevant when attacking, and this engine has no counterattacks, so a unit never evades during its own combat (see avoid() in combat.ts).
  { rarity: 'normal', id: 'prescience', name: 'Prescience', desc: 'Hit +15 and Avoid +15 when attacking.', source: 'Awakening Archer', classes: SKILL_CLASS_GROUPS.archer, family: 'playerPhase', hit: 15, avoid: 15 },
  { rarity: 'uncommon', id: 'quick_draw', name: 'Quick Draw', desc: '+4 damage when attacking.', source: 'Fates Archer', classes: SKILL_CLASS_GROUPS.archer, family: 'playerPhase', damageDealt: 4 },
  { rarity: 'uncommon', id: 'certain_blow', name: 'Certain Blow', desc: 'Hit +40 when attacking.', source: 'Fates Sniper', classes: SKILL_CLASS_GROUPS.archer, family: 'playerPhase', hit: 40 },
  { rarity: 'uncommon', id: 'hit_rate_plus_20', name: 'Hit Rate +20', desc: 'Grants passive Hit +20.', source: 'Awakening Sniper', classes: SKILL_CLASS_GROUPS.archer, family: 'stat', hit: 20 },
  { rarity: 'rare', id: 'bowfaire', name: 'Bowfaire', desc: 'Deals +4 damage with bows.', source: 'Awakening/Fates Sniper', classes: SKILL_CLASS_GROUPS.archer, family: 'faire', weaponType: 'bow', damageDealt: 4 },
  { rarity: 'rare', id: 'bowbreaker', name: 'Bowbreaker', desc: 'Hit +25 and Avoid +25 against bow users.', source: 'Awakening Bow Knight/Fates Sorcerer', classes: SKILL_CLASS_GROUPS.archer, family: 'breaker', breaker: 'bow', hit: 25, avoid: 25 },

  // Mage and sage skills
  { rarity: 'normal', id: 'magic_plus_2', name: 'Magic +2', desc: 'Grants passive Mag +2.', source: 'Awakening/Fates Mage/Diviner', classes: SKILL_CLASS_GROUPS.mage, family: 'stat', stats: { str: 2 } },
  // { rarity: 'normal', id: 'focus', name: 'Focus', desc: 'Crit +10 while at least one ally is fallen.', source: 'Awakening Mage', classes: SKILL_CLASS_GROUPS.mage, family: 'solo', crit: 10 },
  // { rarity: 'normal', id: 'future_sight', name: 'Future Sight', desc: "15% chance each turn to make the user's next hit roll use the better of two rolls.", source: 'Fates Diviner', classes: SKILL_CLASS_GROUPS.mage, family: 'rng', trigger: 'turnStart', effect: 'rerollLowHit', chance: 15 },
  { rarity: 'uncommon', id: 'rally_magic', name: 'Rally Magic', desc: 'Magic allies gain Mag +4 on their first turn.', source: 'Awakening Sage/Fates Onmyoji', classes: SKILL_CLASS_GROUPS.mage, family: 'rally', trigger: 'battleStart', rallyTarget: 'magic', stats: { str: 4 } },
  { rarity: 'rare', id: 'tomefaire', name: 'Tomefaire', desc: 'Deals +4 magic damage.', source: 'Awakening Sage/Fates Onmyoji', classes: SKILL_CLASS_GROUPS.mage, family: 'faire', weaponType: 'tome', damageDealt: 4 },
  { rarity: 'rare', id: 'lifetaker', name: 'Lifetaker', desc: 'After the user defeats an enemy on its turn, heals 50% max HP.', source: 'Awakening Dark Knight/Fates Dark Knight', classes: SKILL_CLASS_GROUPS.mage, family: 'survival', trigger: 'playerPhaseKill', effect: 'healPercent', amount: 50 },

  // Monk, cleric, shrine, and staff skills
  { rarity: 'uncommon', id: 'miracle', name: 'Miracle', desc: 'Lck% chance to survive a lethal hit at 1 HP.', source: 'Awakening/Fates Cleric/Priest', classes: SKILL_CLASS_GROUPS.holy, family: 'survival', trigger: 'lethalDamage', effect: 'miracleChance', chanceStat: 'lck' },
  { rarity: 'normal', id: 'healtouch', name: 'Healtouch', desc: "The user's healing staves restore +5 HP.", source: 'Awakening Cleric/Priest', classes: SKILL_CLASS_GROUPS.cleric, family: 'staff', healBonus: 5 },
  { rarity: 'uncommon', id: 'live_to_serve', name: 'Live to Serve', desc: 'When the user heals an ally with a staff, the user recovers 50% of that amount.', source: 'Fates Troubadour', classes: SKILL_CLASS_GROUPS.cleric, family: 'staff', trigger: 'healAlly', effect: 'selfHeal', amountPercent: 50 },
  { rarity: 'rare', id: 'renewal', name: 'Renewal', desc: 'Restores 20% max HP each turn.', source: 'Awakening/Fates War Monk/Priestess', classes: SKILL_CLASS_GROUPS.holy, family: 'survival', trigger: 'turnStart', effect: 'regenPercent', amount: 20 },
  { rarity: 'normal', id: 'rally_luck', name: 'Rally Luck', desc: 'Allies gain Lck +8 on their first turn.', source: 'Fates Shrine Maiden/Monk', classes: SKILL_CLASS_GROUPS.holy, family: 'rally', trigger: 'battleStart', stats: { lck: 8 } },
  // { rarity: 'rare', id: 'countermagic', name: 'Countermagic', desc: 'Reflects 30% of magical damage taken.', source: 'Fates Priestess/Great Master', classes: SKILL_CLASS_GROUPS.holy, family: 'retaliation', trigger: 'magicHitTaken', effect: 'reflectDamagePercent', amountPercent: 30 },
  { rarity: 'rare', id: 'amaterasu', name: 'Amaterasu', desc: 'All allies recover 4 HP on user\'s turn.', source: 'Fates Basara', classes: SKILL_CLASS_GROUPS.monk, family: 'aura', trigger: 'turnStart', effect: 'allyRegenFlat', amount: 4 },
  { rarity: 'uncommon', id: 'malice_sense', name: 'Malice Sense', desc: 'Grants passive Avoid +20.', source: 'Midnight Sun Shiori', classes: SKILL_CLASS_GROUPS.holy, family: 'stat', avoid: 20 },

  // Shaman, dark mage, and druid skills
  { rarity: 'normal', id: 'hex', name: 'Hex', desc: 'Enemies have Avoid -10 against the user.', source: 'Awakening Dark Mage', classes: SKILL_CLASS_GROUPS.shaman, family: 'aura', enemyAvoid: -10 },
  { rarity: 'normal', id: 'anathema', name: 'Anathema', desc: 'Enemies have Avoid -10 and critical avoid -10 against the user.', source: 'Awakening Dark Mage', classes: SKILL_CLASS_GROUPS.shaman, family: 'aura', enemyAvoid: -10, enemyCritAvoid: -10 },
  { rarity: 'uncommon', id: 'heartseeker', name: 'Heartseeker', desc: 'Enemies have Avoid -20 against the user.', source: 'Fates Dark Mage', classes: SKILL_CLASS_GROUPS.shaman, family: 'aura', enemyAvoid: -20 },
  { rarity: 'uncommon', id: 'malefic_aura', name: 'Malefic Aura', desc: 'Allies deal +2 magic damage while the user is alive.', source: 'Fates Dark Mage', classes: SKILL_CLASS_GROUPS.shaman, family: 'aura', teamAura: { magicDamageDealt: 2 } },
  { rarity: 'rare', id: 'vengeance', name: 'Vengeance', desc: "Skl%×2 chance to add half of user's missing HP to damage.", source: 'Awakening/Fates Sorcerer', classes: SKILL_CLASS_GROUPS.shaman, family: 'proc', trigger: 'attack', effect: 'addMissingHpChance', chanceStat: 'sklTimesTwo', amountPercent: 50 },
  { rarity: 'rare', id: 'tomebreaker', name: 'Tomebreaker', desc: 'Hit +25 and Avoid +25 against tome users.', source: 'Awakening Sorcerer', classes: SKILL_CLASS_GROUPS.shaman, family: 'breaker', breaker: 'tome', hit: 25, avoid: 25 },
  { rarity: 'uncommon', id: 'vassals_seal', name: "Vassal's Seal", desc: 'While below 50% HP, deals +5 damage and Crit +10.', source: 'Midnight Sun Faratras', classes: SKILL_CLASS_GROUPS.shaman, family: 'combat', trigger: 'hpBelowHalf', damageDealt: 5, crit: 10 },
  // { rarity: 'uncommon', id: 'grisly_wound', name: 'Grisly Wound', desc: 'After user combat, target loses 10% max HP.', source: 'Fates Malig Knight', classes: SKILL_CLASS_GROUPS.shaman, family: 'debuff', trigger: 'afterCombat', effect: 'chipDamagePercent', amountPercent: 10 },
]

// Fire Emblem: The Midnight Sun (FE:MS) cameo cast, kept separate because they're a
// distinct origin game (see the game-origin filter card). Growths are the ROM values
// from assets/fems/stat-sheets; bases mirror our same-class roster peers with the
// sheet's personal modifiers layered on, since the ROM rows are class-relative.
// A few near-zero stats were redistributed so units aren't degenerate (noted inline).
// prettier-ignore
export const FEMS_BASES: UnitBase[] = [
U('Faratras','Shaman','dark',   {bTotal:41,hp:18,str:10,skl:8,spd:5,lck:8,def:7,res:3,con:6},   {hp:85,str:60,skl:50,spd:35,lck:60,def:55,res:25,gTotal:370},'purple'),
U('Shiori','Monk','light',      {bTotal:42,hp:20,str:6,skl:8,spd:9,lck:7,def:4,res:8,con:5},    {hp:70,str:40,skl:60,spd:60,lck:65,def:25,res:50,gTotal:370},'blue'),
U('Menmus','Wyvern','lance',    {bTotal:35,hp:23,str:9,skl:6,spd:6,lck:4,def:9,res:1,con:11},   {hp:85,str:55,skl:50,spd:40,lck:40,def:55,res:20,gTotal:345},'blue'),
U('Quinn','Myrmidon','sword',   {bTotal:43,hp:20,str:9,skl:8,spd:8,lck:7,def:6,res:5,con:6},    {hp:80,str:60,skl:65,spd:55,lck:40,def:35,res:20,gTotal:355},'red'),
U('Cattleya','Myrmidon','sword',{bTotal:39,hp:20,str:5,skl:8,spd:10,lck:8,def:4,res:4,con:6},   {hp:65,str:40,skl:55,spd:70,lck:45,def:30,res:40,gTotal:345},'purple'),
U('Letruffe','Thief','sword',   {bTotal:38,hp:20,str:7,skl:10,spd:8,lck:6,def:5,res:2,con:8},   {hp:75,str:40,skl:70,spd:65,lck:45,def:35,res:25,gTotal:355},'green'),
U('Brendan','Fighter','axe',    {bTotal:43,hp:27,str:9,skl:10,spd:5,lck:5,def:12,res:2,con:13}, {hp:90,str:65,skl:55,spd:30,lck:40,def:65,res:20,gTotal:365},'blue'),
U('Cristoph','Fighter','axe',   {bTotal:33,hp:24,str:7,skl:6,spd:6,lck:9,def:4,res:1,con:11},   {hp:80,str:55,skl:40,spd:55,lck:60,def:25,res:25,gTotal:340},'red'),
U('Garion','Fighter','axe',     {bTotal:29,hp:28,str:9,skl:7,spd:4,lck:3,def:4,res:2,con:13},   {hp:130,str:70,skl:50,spd:35,lck:30,def:40,res:15,gTotal:370},'red'),
U('Djambo','Fighter','axe',     {bTotal:33,hp:26,str:9,skl:6,spd:5,lck:8,def:4,res:1,con:12},   {hp:95,str:70,skl:55,spd:50,lck:60,def:45,res:25,gTotal:400},'gold'),
U('Weiss','Cavalier','sword',   {bTotal:39,hp:22,str:8,skl:8,spd:6,lck:7,def:6,res:4,con:9},    {hp:90,str:50,skl:55,spd:40,lck:40,def:55,res:30,gTotal:360},'blue'),
U('Valpurga','Cavalier','lance',{bTotal:33,hp:21,str:7,skl:5,spd:6,lck:8,def:6,res:1,con:9},    {hp:85,str:60,skl:45,spd:50,lck:45,def:60,res:25,gTotal:370},'gold'),
U('Sae’rah','Knight','lance',   {bTotal:37,hp:19,str:5,skl:6,spd:7,lck:9,def:6,res:4,con:9},    {hp:75,str:50,skl:50,spd:55,lck:60,def:50,res:30,gTotal:370},'red'),
U('Schwarz','Pegasus','sword',  {bTotal:34,hp:21,str:8,skl:5,spd:10,lck:3,def:4,res:4,con:6},   {hp:85,str:65,skl:40,spd:65,lck:30,def:30,res:50,gTotal:365},'purple'), // skl base 1 -> 5; sword-wielding flier per design
U('Rya','Archer','bow',         {bTotal:30,hp:17,str:4,skl:6,spd:7,lck:6,def:3,res:4,con:5},    {hp:70,str:50,skl:65,spd:55,lck:35,def:30,res:45,gTotal:350},'green'),
U('Diana','Mage','anima',       {bTotal:31,hp:18,str:5,skl:5,spd:7,lck:10,def:1,res:3,con:4},   {hp:65,str:55,skl:50,spd:60,lck:60,def:20,res:45,gTotal:355},'purple'), // str base 0 -> 5, growth 20 -> 30: otherwise deals no damage
U('Andre','Mage','anima',       {bTotal:25,hp:16,str:4,skl:5,spd:6,lck:6,def:1,res:3,con:5},    {hp:80,str:70,skl:60,spd:60,lck:60,def:35,res:55,gTotal:420},'green'), // trainee: the game's highest growth total
U('Ceapana','Cleric','staff',   {bTotal:39,hp:19,str:4,skl:7,spd:9,lck:11,def:3,res:5,con:5},   {hp:65,str:35,skl:45,spd:50,lck:50,def:30,res:55,gTotal:330},'green'),
U('Poledra','Monk','light',     {bTotal:28,hp:19,str:4,skl:8,spd:6,lck:2,def:1,res:7,con:5},    {hp:120,str:20,skl:65,spd:45,lck:30,def:30,res:75,gTotal:385},'blue'), // ROM name "Puledra"; str growth 5 -> 20, HP growth 145 -> 120 (still the game's highest)
// TODO(Hellios): empty block to fill in — portrait already cropped to
// assets/femp/portraits/hellios.png. Fill the stats and uncomment to enable.
// U('Hellios','','',            {bTotal:0,hp:0,str:0,skl:0,spd:0,lck:0,def:0,res:0,con:0},      {hp:0,str:0,skl:0,spd:0,lck:0,def:0,res:0,gTotal:0},'red'),
]

// prettier-ignore
export const FE_BASES: UnitBase[] = [
  // FE7-inspired roster pool. Stats/growths are close enough for prototype balance, not exact ROM data. Unit data.
U('Lyn','Lord','sword',         {bTotal:27,hp:16,str:4,skl:7,spd:9,lck:5,def:2,res:0,con:5},    {hp:70,str:40,skl:60,spd:60,lck:55,def:20,res:30,gTotal:335},'blue'),
U('Eliwood','Lord','sword',     {bTotal:29,hp:18,str:5,skl:5,spd:7,lck:7,def:5,res:0,con:7},    {hp:80,str:45,skl:50,spd:40,lck:45,def:30,res:35,gTotal:325},'red'),
U('Hector','Lord','axe',        {bTotal:27,hp:19,str:7,skl:4,spd:5,lck:3,def:8,res:0,con:13},   {hp:90,str:60,skl:45,spd:30,lck:30,def:50,res:25,gTotal:330},'green'),

U('Raven','Mercenary','sword',  {bTotal:37,hp:25,str:7,skl:10,spd:12,lck:2,def:5,res:1,con:8},  {hp:85,str:55,skl:40,spd:45,lck:35,def:25,res:15,gTotal:300},'purple'),
U('Harken','Mercenary','sword', {bTotal:39,hp:24,str:9,skl:9,spd:8,lck:4,def:7,res:2,con:11},   {hp:80,str:35,skl:40,spd:40,lck:35,def:30,res:25,gTotal:285},'blue'),
U('Gerik','Mercenary','sword',  {bTotal:37,hp:26,str:8,skl:9,spd:7,lck:4,def:8,res:1,con:10},   {hp:80,str:50,skl:45,spd:40,lck:35,def:35,res:15,gTotal:300},'green'),

U('Guy','Myrmidon','sword',     {bTotal:38,hp:21,str:6,skl:11,spd:11,lck:5,def:5,res:0,con:5},  {hp:75,str:30,skl:50,spd:70,lck:45,def:15,res:25,gTotal:310},'gold'),
U('Karel','Myrmidon','sword',   {bTotal:43,hp:22,str:7,skl:12,spd:13,lck:6,def:4,res:1,con:7},  {hp:70,str:35,skl:55,spd:55,lck:30,def:15,res:20,gTotal:280},'red'),
U('Karla','Myrmidon','sword',   {bTotal:46,hp:20,str:7,skl:12,spd:12,lck:8,def:4,res:3,con:7},  {hp:60,str:25,skl:45,spd:55,lck:40,def:10,res:20,gTotal:255},'blue',2),

U('Matthew','Thief','sword',    {bTotal:26,hp:18,str:4,skl:6,spd:10,lck:3,def:3,res:0,con:7},   {hp:75,str:35,skl:55,spd:70,lck:50,def:25,res:20,gTotal:330},'green'),
U('Legault','Thief','sword',    {bTotal:37,hp:20,str:6,skl:8,spd:10,lck:6,def:5,res:2,con:9},   {hp:60,str:25,skl:45,spd:50,lck:60,def:25,res:25,gTotal:290},'purple',2),
U('Jaffar','Thief','sword',     {bTotal:46,hp:21,str:8,skl:12,spd:12,lck:5,def:6,res:3,con:8},  {hp:65,str:20,skl:45,spd:35,lck:15,def:20,res:20,gTotal:220},'red',4),

U('Oswin','Knight','lance',     {bTotal:37,hp:24,str:11,skl:8,spd:4,lck:3,def:9,res:2,con:14},  {hp:90,str:40,skl:30,spd:30,lck:35,def:55,res:20,gTotal:300},'blue'),
U('Wallace','Knight','lance',   {bTotal:41,hp:26,str:10,skl:6,spd:5,lck:8,def:11,res:1,con:13}, {hp:70,str:45,skl:30,spd:20,lck:30,def:35,res:25,gTotal:255},'blue',4),
U('Amelia','Knight','lance',    {bTotal:24,hp:18,str:4,skl:3,spd:4,lck:6,def:4,res:3,con:9},    {hp:80,str:65,skl:60,spd:50,lck:65,def:45,res:15,gTotal:380},'red'),

U('Sain','Cavalier','lance',    {bTotal:28,hp:20,str:8,skl:4,spd:6,lck:4,def:6,res:0,con:9},    {hp:80,str:60,skl:35,spd:40,lck:35,def:20,res:20,gTotal:290},'green'),
U('Kent','Cavalier','sword',    {bTotal:27,hp:20,str:6,skl:6,spd:7,lck:2,def:5,res:1,con:9},    {hp:85,str:40,skl:50,spd:45,lck:20,def:25,res:25,gTotal:290},'red'),
U('Lowen','Cavalier','lance',   {bTotal:29,hp:23,str:7,skl:5,spd:7,lck:3,def:7,res:0,con:10},   {hp:90,str:30,skl:30,spd:30,lck:50,def:40,res:30,gTotal:300},'green'),
U('Marcus','Cavalier','lance',  {bTotal:43,hp:25,str:8,skl:8,spd:7,lck:5,def:9,res:6,con:11},   {hp:60,str:30,skl:50,spd:25,lck:30,def:15,res:35,gTotal:245},'gold',4),
U('Isadora','Cavalier','sword', {bTotal:43,hp:21,str:7,skl:8,spd:10,lck:6,def:6,res:6,con:6},   {hp:75,str:30,skl:35,spd:50,lck:45,def:20,res:25,gTotal:280},'red',2),

U('Florina','Pegasus','lance',  {bTotal:36,hp:17,str:5,skl:7,spd:9,lck:7,def:4,res:4,con:4},    {hp:60,str:40,skl:50,spd:55,lck:60,def:15,res:40,gTotal:320},'blue'),
U('Fiora','Pegasus','lance',    {bTotal:40,hp:19,str:6,skl:8,spd:10,lck:6,def:5,res:5,con:5},   {hp:70,str:35,skl:60,spd:50,lck:30,def:20,res:50,gTotal:315},'purple'),
U('Farina','Pegasus','lance',   {bTotal:41,hp:18,str:7,skl:8,spd:9,lck:7,def:5,res:5,con:5},    {hp:75,str:50,skl:45,spd:45,lck:45,def:25,res:30,gTotal:315},'green'),

U('Heath','Wyvern','lance',     {bTotal:40,hp:24,str:10,skl:7,spd:7,lck:7,def:8,res:1,con:9},   {hp:80,str:50,skl:50,spd:45,lck:20,def:30,res:20,gTotal:295},'red'),
U('Vaida','Wyvern','lance',     {bTotal:43,hp:27,str:11,skl:8,spd:8,lck:4,def:10,res:2,con:12}, {hp:80,str:45,skl:35,spd:30,lck:25,def:25,res:15,gTotal:255},'purple',2),
U('Cormag','Wyvern','lance',    {bTotal:37,hp:22,str:10,skl:5,spd:6,lck:3,def:11,res:2,con:11}, {hp:85,str:55,skl:40,spd:45,lck:35,def:25,res:15,gTotal:300},'blue',2),
U('Melady','Wyvern','lance',    {bTotal:43,hp:25,str:8,skl:11,spd:7,lck:3,def:11,res:3,con:9},  {hp:75,str:50,skl:50,spd:45,lck:25,def:20,res:5,gTotal:270},'red',2),

U('Dorcas','Fighter','axe',     {bTotal:26,hp:30,str:7,skl:7,spd:6,lck:3,def:3,res:0,con:14},   {hp:80,str:60,skl:40,spd:20,lck:45,def:25,res:15,gTotal:285},'gold'),
U('Bartre','Fighter','axe',     {bTotal:25,hp:29,str:9,skl:5,spd:3,lck:4,def:4,res:0,con:13},   {hp:85,str:50,skl:35,spd:40,lck:30,def:30,res:25,gTotal:295},'red'),
U('Geitz','Fighter','axe',      {bTotal:38,hp:27,str:10,skl:8,spd:8,lck:5,def:6,res:1,con:13},  {hp:85,str:50,skl:40,spd:40,lck:40,def:20,res:20,gTotal:295},'green'),
U('Garcia','Fighter','axe',     {bTotal:29,hp:28,str:8,skl:7,spd:6,lck:3,def:5,res:0,con:13},   {hp:80,str:65,skl:40,spd:30,lck:40,def:25,res:15,gTotal:295},'gold'),
U('Ross','Fighter','axe',       {bTotal:27,hp:22,str:5,skl:4,spd:5,lck:8,def:4,res:1,con:8},    {hp:95,str:75,skl:50,spd:40,lck:50,def:30,res:30,gTotal:370},'blue'),
U('Dart','Fighter','axe',       {bTotal:31,hp:25,str:8,skl:5,spd:8,lck:3,def:6,res:1,con:10},   {hp:70,str:65,skl:20,spd:60,lck:35,def:20,res:15,gTotal:285},'red'),
U('Hawkeye','Fighter','axe',    {bTotal:42,hp:28,str:10,skl:8,spd:6,lck:7,def:8,res:3,con:16},  {hp:50,str:40,skl:30,spd:25,lck:40,def:20,res:35,gTotal:240},'gold',4),

U('Rebecca','Archer','bow',     {bTotal:23,hp:17,str:4,skl:5,spd:6,lck:4,def:3,res:1,con:5},    {hp:60,str:40,skl:50,spd:60,lck:50,def:15,res:30,gTotal:305},'green'),
U('Wil','Archer','bow',         {bTotal:27,hp:20,str:6,skl:5,spd:5,lck:6,def:5,res:0,con:6},    {hp:75,str:50,skl:50,spd:40,lck:40,def:20,res:25,gTotal:300},'blue'),
U('Louise','Archer','bow',      {bTotal:40,hp:19,str:7,skl:9,spd:9,lck:7,def:4,res:4,con:6},    {hp:60,str:35,skl:45,spd:40,lck:55,def:20,res:30,gTotal:285},'purple'),
U('Neimi','Archer','bow',       {bTotal:27,hp:17,str:4,skl:6,spd:7,lck:5,def:3,res:2,con:5},    {hp:55,str:45,skl:50,spd:60,lck:50,def:15,res:35,gTotal:310},'red'),
U('Innes','Archer','bow',       {bTotal:42,hp:21,str:8,skl:10,spd:10,lck:6,def:5,res:3,con:7},  {hp:75,str:40,skl:45,spd:45,lck:45,def:20,res:25,gTotal:295},'gold'),
U('Rath','Archer','bow',        {bTotal:34,hp:22,str:7,skl:7,spd:8,lck:5,def:5,res:2,con:7},    {hp:80,str:50,skl:40,spd:50,lck:30,def:25,res:25,gTotal:300},'blue'),

U('Erk','Mage','anima',         {bTotal:27,hp:17,str:5,skl:6,spd:7,lck:3,def:2,res:4,con:5},    {hp:65,str:40,skl:40,spd:50,lck:30,def:20,res:40,gTotal:285},'purple'),
U('Nino','Mage','anima',        {bTotal:30,hp:15,str:3,skl:4,spd:8,lck:8,def:2,res:5,con:3},    {hp:55,str:50,skl:55,spd:60,lck:45,def:15,res:50,gTotal:330},'green'),
U('Pent','Mage','anima',        {bTotal:45,hp:22,str:8,skl:9,spd:10,lck:7,def:4,res:7,con:7},   {hp:70,str:35,skl:40,spd:40,lck:40,def:30,res:45,gTotal:300},'blue'),
U('Lute','Mage','anima',        {bTotal:35,hp:17,str:6,skl:6,spd:7,lck:8,def:3,res:5,con:3},    {hp:45,str:65,skl:30,spd:45,lck:45,def:15,res:40,gTotal:285},'purple'),
U('Saleh','Mage','anima',       {bTotal:40,hp:23,str:8,skl:8,spd:8,lck:5,def:5,res:6,con:8},    {hp:70,str:40,skl:40,spd:40,lck:30,def:25,res:45,gTotal:290},'gold'),
U('Athos','Mage','anima',       {bTotal:49,hp:24,str:10,skl:10,spd:8,lck:5,def:6,res:10,con:9}, {hp:40,str:30,skl:30,spd:20,lck:25,def:20,res:40,gTotal:205},'gold',4),
U('Ewan','Mage','anima',        {bTotal:21,hp:15,str:3,skl:4,spd:5,lck:5,def:1,res:3,con:5},    {hp:65,str:70,skl:60,spd:55,lck:65,def:15,res:60,gTotal:390},'red'),

U('Lucius','Monk','light',      {bTotal:32,hp:18,str:7,skl:6,spd:10,lck:2,def:1,res:6,con:6},   {hp:55,str:60,skl:50,spd:40,lck:20,def:10,res:60,gTotal:295},'blue'),
U('Renault','Monk','light',     {bTotal:38,hp:22,str:7,skl:8,spd:7,lck:4,def:5,res:7,con:9},    {hp:60,str:40,skl:40,spd:35,lck:30,def:25,res:45,gTotal:275},'red'),
U('Artur','Monk','light',       {bTotal:30,hp:19,str:6,skl:6,spd:8,lck:2,def:2,res:6,con:6},    {hp:55,str:50,skl:50,spd:40,lck:25,def:15,res:55,gTotal:290},'gold'),
U('Riev','Monk','light',        {bTotal:36,hp:21,str:8,skl:7,spd:6,lck:3,def:4,res:8,con:8},    {hp:65,str:45,skl:35,spd:30,lck:20,def:25,res:60,gTotal:280},'purple'),
U('Saul','Monk','light',        {bTotal:28,hp:20,str:5,skl:6,spd:7,lck:2,def:2,res:6,con:6},    {hp:60,str:40,skl:45,spd:45,lck:15,def:15,res:50,gTotal:270},'green'),

U('Canas','Shaman','dark',      {bTotal:37,hp:21,str:8,skl:7,spd:7,lck:6,def:4,res:5,con:7},    {hp:70,str:45,skl:40,spd:35,lck:25,def:25,res:45,gTotal:285},'purple'),
U('Raigh','Shaman','dark',      {bTotal:41,hp:23,str:9,skl:5,spd:7,lck:6,def:5,res:9,con:4},    {hp:55,str:45,skl:55,spd:40,lck:15,def:15,res:20,gTotal:245},'purple'),
U('Knoll','Shaman','dark',      {bTotal:29,hp:18,str:8,skl:6,spd:6,lck:0,def:2,res:7,con:7},    {hp:70,str:50,skl:40,spd:35,lck:20,def:10,res:45,gTotal:270},'blue'),
U('Sophia','Shaman','dark',     {bTotal:24,hp:15,str:6,skl:2,spd:4,lck:3,def:1,res:8,con:3},    {hp:60,str:55,skl:40,spd:30,lck:20,def:20,res:55,gTotal:280},'blue'),
U('Lyon','Shaman','dark',       {bTotal:35,hp:20,str:8,skl:7,spd:5,lck:3,def:4,res:8,con:8},    {hp:70,str:55,skl:45,spd:25,lck:25,def:25,res:55,gTotal:300},'purple'),
U('Niime','Shaman','dark',      {bTotal:42,hp:20,str:9,skl:9,spd:7,lck:3,def:4,res:10,con:6},   {hp:55,str:30,skl:45,spd:25,lck:15,def:15,res:45,gTotal:230},'purple',4),

U('Serra','Cleric','staff',     {bTotal:28,hp:17,str:2,skl:5,spd:8,lck:6,def:2,res:5,con:4},    {hp:50,str:50,skl:30,spd:40,lck:60,def:15,res:55,gTotal:300},'gold'),
U('Priscilla','Cleric','staff', {bTotal:33,hp:16,str:3,skl:6,spd:8,lck:7,def:3,res:6,con:4},    {hp:45,str:40,skl:50,spd:40,lck:65,def:15,res:50,gTotal:305},'red'),
U('Moulder','Cleric','staff',   {bTotal:27,hp:20,str:4,skl:6,spd:6,lck:2,def:4,res:5,con:9},    {hp:70,str:40,skl:50,spd:40,lck:20,def:25,res:25,gTotal:270},'blue'),
U('Natasha','Cleric','staff',   {bTotal:27,hp:18,str:2,skl:4,spd:7,lck:6,def:2,res:6,con:4},    {hp:50,str:60,skl:25,spd:40,lck:60,def:15,res:55,gTotal:305},'green'),
U('L’Arachel','Cleric','staff', {bTotal:36,hp:18,str:4,skl:5,spd:8,lck:9,def:3,res:7,con:5},    {hp:45,str:50,skl:45,spd:45,lck:65,def:15,res:50,gTotal:315},'gold'),
]

// Per-unit origin game for the FE_BASES roster; FEMS_BASES are all 'FEMS'. Drives the
// game-origin filter setting (bpcceA3c). Verified against the FE character lists.
// Karel/Marcus/Bartre debut in FE6 but are tagged FE7 to match how this FE7-themed
// game uses them (a deliberate choice over strict debut game).
// prettier-ignore
export const FE_ORIGINS: Record<string, string> = {
  // FE7 — Blazing Sword
  Lyn: 'FE7', Eliwood: 'FE7', Hector: 'FE7', Raven: 'FE7', Harken: 'FE7', Guy: 'FE7', Karel: 'FE7', Karla: 'FE7',
  Matthew: 'FE7', Legault: 'FE7', Jaffar: 'FE7', Oswin: 'FE7', Wallace: 'FE7', Sain: 'FE7', Kent: 'FE7', Lowen: 'FE7',
  Marcus: 'FE7', Isadora: 'FE7', Florina: 'FE7', Fiora: 'FE7', Farina: 'FE7', Heath: 'FE7', Vaida: 'FE7', Dorcas: 'FE7',
  Bartre: 'FE7', Geitz: 'FE7', Dart: 'FE7', Hawkeye: 'FE7', Rebecca: 'FE7', Wil: 'FE7', Louise: 'FE7', Rath: 'FE7',
  Erk: 'FE7', Nino: 'FE7', Pent: 'FE7', Lucius: 'FE7', Renault: 'FE7', Canas: 'FE7', Serra: 'FE7', Priscilla: 'FE7', Athos: 'FE7',
  // FE8 — Sacred Stones
  Gerik: 'FE8', Amelia: 'FE8', Cormag: 'FE8', Garcia: 'FE8', Ross: 'FE8', Neimi: 'FE8', Innes: 'FE8', Lute: 'FE8',
  Saleh: 'FE8', Ewan: 'FE8', Artur: 'FE8', Riev: 'FE8', Knoll: 'FE8', Lyon: 'FE8', Moulder: 'FE8', Natasha: 'FE8', 'L’Arachel': 'FE8',
  // FE6 — Binding Blade
  Melady: 'FE6', Saul: 'FE6', Raigh: 'FE6', Sophia: 'FE6', Niime: 'FE6',
}
// Full origin-tagged roster. BASES is the ENABLED subset, filtered live by the
// enabledGames setting (setEnabledGames). Consumers read BASES inside functions, so
// reassigning it below propagates everywhere via ESM live bindings.
export const ALL_BASES: UnitBase[] = [...FE_BASES.map((u) => ({ ...u, origin: FE_ORIGINS[u.name] || 'FE7' })), ...FEMS_BASES.map((u) => ({ ...u, origin: 'FEMS' }))]
export let BASES: UnitBase[] = ALL_BASES
export function setEnabledGames(games: Set<string>) {
  const filtered = ALL_BASES.filter((u) => games.has(u.origin || ''))
  BASES = filtered.length ? filtered : ALL_BASES // never leave the draft/enemy pool empty
}
// Distinct origins present, first-seen order — drives the setting's options + default.
export function gameOrigins(): string[] {
  return [...new Set(ALL_BASES.map((u) => u.origin || ''))]
}
function U(name: string, cls: string, weaponType: WeaponType, stats: BaseStatBlock, growths: GrowthBlock, palette: PaletteKey, startOffset = 0): UnitBase {
  return { name, cls, weaponType, stats, growths, palette, startOffset }
}

// Arena data. Each focus entry can target a class generally, or a class plus weaponType
// for special cases like axe wyverns. The focus list is intended to drive both enemy
// class bias and arena boss class previews.
// prettier-ignore
export const ARENAS: ArenaData[] = [
  { id: 'road', name: 'Road', tile: 'road', effects: [], focus: [{ cls: 'Lord' }, { cls: 'Cavalier' }] },
  { id: 'plains', name: 'Plains', tile: 'plains', effects: [], focus: [{ cls: 'Archer' }, { cls: 'Cavalier' }] },
  { id: 'forest', name: 'Forest', tile: 'forest', effects: ['avoidUp'], focus: [{ cls: 'Fighter' }, { cls: 'Cleric', label: 'Priest' }] },
  { id: 'swamp', name: 'Swamp', tile: 'swamp', effects: ['avoidDown'], focus: [{ cls: 'Myrmidon' }, { cls: 'Shaman' }] },
  { id: 'mountain', name: 'Mountain', tile: 'mountain', effects: ['defUp'], focus: [{ cls: 'Fighter' }, { cls: 'Wyvern' }] },
  { id: 'river_delta', name: 'River Delta', tile: 'riverDelta', effects: ['defDown'], focus: [{ cls: 'Pegasus' }, { cls: 'Mercenary' }] },
  { id: 'desert', name: 'Desert', tile: 'desert', effects: ['speedDown'], focus: [{ cls: 'Mage' }, { cls: 'Mercenary' }] },
  { id: 'fort', name: 'Fort', tile: 'fort', effects: ['defUp'], focus: [{ cls: 'Wyvern', weaponType: 'axe', label: 'Axe Wyvern' }, { cls: 'Archer' }] },
  { id: 'castle', name: 'Castle', tile: 'castle', effects: ['strUp'], focus: [{ cls: 'Knight' }, { cls: 'Lord' }] },
  { id: 'holy_temple', name: 'Holy Temple', tile: 'holyTemple', effects: ['resUp'], focus: [{ cls: 'Cleric', label: 'Priest' }, { cls: 'Pegasus' }] },
  { id: 'dark_temple', name: 'Dark Temple', tile: 'darkTemple', effects: ['resDown'], focus: [{ cls: 'Shaman' }, { cls: 'Thief' }] },
  { id: 'tower', name: 'Tower', tile: 'tower', effects: ['luckDown'], focus: [{ cls: 'Mage' }, { cls: 'Knight' }] },
  { id: 'dungeon', name: 'Dungeon', tile: 'dungeon', effects: ['luckUp'], focus: [{ cls: 'Thief' }, { cls: 'Myrmidon' }] },
]
