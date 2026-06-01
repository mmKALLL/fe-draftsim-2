'use strict'

const palettes = {
  blue: ['#1e3a8a', '#2563eb', '#93c5fd', '#f8fafc', '#7c2d12', '#f2c9a0', '#111827'],
  red: ['#7f1d1d', '#dc2626', '#fecaca', '#f8fafc', '#422006', '#f2c9a0', '#111827'],
  green: ['#14532d', '#16a34a', '#bbf7d0', '#f8fafc', '#3f2a1d', '#f2c9a0', '#111827'],
  purple: ['#581c87', '#9333ea', '#e9d5ff', '#f8fafc', '#1f2937', '#f2c9a0', '#111827'],
  gold: ['#713f12', '#d97706', '#fde68a', '#f8fafc', '#111827', '#f2c9a0', '#111827'],
}

const FEMP_NAME_OVERRIDES = {
  "L'Arachel": 'larachel',
  Pent: 'pent',
  Lucius: 'lucius',
  Canas: 'canas',
  Niime: 'niime',
  Athos: 'athos',
}
const CUSTOM_MAP_SPRITE_STEMS = {
  Lyn: 'lyn',
  Eliwood: 'eliwood',
  Hector: 'hector',
  Lundgren: 'lundgren',
}

// prettier-ignore
const CLASSES = {
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
}
// prettier-ignore
const CLASS_TAGS = {
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
const BOSS_NAMES_BY_CLASS = {
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
  Shaman: ['Novala', 'Lyon', 'Teodor'],
  Druid: ['Nergal', 'Teodor'],
}


// Weapon data
// prettier-ignore
const WEAPONS = [
  { name: 'Iron Sword', type: 'sword', rank: 'E', mt: 5, hit: 90, wt: 5, crit: 0, magic: false },
  { name: 'Slim Sword', type: 'sword', rank: 'E', mt: 3, hit: 95, wt: 2, crit: 5, magic: false, speedBonus: 4 },
  { name: 'Steel Sword', type: 'sword', rank: 'D', mt: 8, hit: 75, wt: 10, crit: 0, magic: false },
  { name: 'Iron Blade', type: 'sword', rank: 'D', mt: 9, hit: 70, wt: 12, crit: 0, magic: false },
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
  { name: 'Sol Katti', type: 'sword', rank: 'S', mt: 12, hit: 95, wt: 14, crit: 25, magic: false, resBonus: 5, effective: ['dragon'] },

  { name: 'Dagger', type: 'dagger', rank: 'D', mt: 2, hit: 95, wt: 1, crit: 0, magic: false, halfDef: true },
  { name: 'Sai', type: 'dagger', rank: 'C', mt: 2, hit: 80, wt: 2, crit: 30, magic: false, halfDef: true, poison: true },
  { name: 'Poison Dagger', type: 'dagger', rank: 'B', mt: 2, hit: 90, wt: 2, crit: 0, magic: false, halfDef: true, poison: true },
  { name: 'Silver Dagger', type: 'dagger', rank: 'A', mt: 6, hit: 100, wt: 4, crit: 0, magic: false, halfDef: true},

  { name: 'Iron Lance', type: 'lance', rank: 'E', mt: 7, hit: 80, wt: 8, crit: 0, magic: false },
  { name: 'Slim Lance', type: 'lance', rank: 'E', mt: 4, hit: 85, wt: 4, crit: 5, magic: false, speedBonus: 4 },
  { name: 'Javelin', type: 'lance', rank: 'D', mt: 6, hit: 65, wt: 11, crit: 0, magic: false, defBonus: 4 },
  { name: 'Steel Lance', type: 'lance', rank: 'D', mt: 10, hit: 70, wt: 13, crit: 0, magic: false },
  { name: 'Heavy Spear', type: 'lance', rank: 'C', mt: 9, hit: 70, wt: 14, crit: 0, magic: false, effective: ['armored'] },
  { name: 'Horseslayer', type: 'lance', rank: 'C', mt: 7, hit: 75, wt: 13, crit: 0, magic: false, effective: ['mounted'] },
  { name: 'Killer Lance', type: 'lance', rank: 'C', mt: 10, hit: 70, wt: 9, crit: 30, magic: false },
  { name: 'Axereaver', type: 'lance', rank: 'C', mt: 10, hit: 70, wt: 11, crit: 5, magic: false, reaver: true },
  { name: 'Spear', type: 'lance', rank: 'B', mt: 12, hit: 70, wt: 10, crit: 5, magic: false, defBonus: 4 },
  { name: 'Silver Lance', type: 'lance', rank: 'A', mt: 14, hit: 75, wt: 10, crit: 0, magic: false },
  { name: 'Brave Lance', type: 'lance', rank: 'S', mt: 10, hit: 70, wt: 14, crit: 0, magic: false, brave: true },

  { name: 'Iron Axe', type: 'axe', rank: 'E', mt: 8, hit: 75, wt: 10, crit: 0, magic: false },
  { name: 'Hatchet', type: 'axe', rank: 'E', mt: 5, hit: 85, wt: 6, crit: 0, magic: false, defBonus: 4 },
  { name: 'Steel Axe', type: 'axe', rank: 'D', mt: 11, hit: 65, wt: 15, crit: 0, magic: false },
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
  { name: 'Steel Bow', type: 'bow', rank: 'D', mt: 9, hit: 70, wt: 9, crit: 0, magic: false, effective: ['flying'] },
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
  { name: 'Bolting', type: 'anima', rank: 'A', mt: 12, hit: 60, wt: 20, crit: 0, magic: true, pierceRes: true },
  { name: 'Excalibur', type: 'anima', rank: 'S', mt: 18, hit: 90, wt: 13, crit: 10, magic: true, effective: ['flying'] },

  { name: 'Lightning', type: 'light', rank: 'E', mt: 4, hit: 95, wt: 6, crit: 5, magic: true },
  { name: 'Thani', type: 'light', rank: 'D', mt: 4, hit: 100, wt: 6, crit: 0, magic: true, effective: ['mounted', 'armored'] },
  { name: 'Shine', type: 'light', rank: 'D', mt: 6, hit: 90, wt: 8, crit: 8, magic: true },
  { name: 'Divine', type: 'light', rank: 'C', mt: 8, hit: 85, wt: 10, crit: 10, magic: true },
  { name: 'Purge', type: 'light', rank: 'B', mt: 10, hit: 70, wt: 20, crit: 0, magic: true, pierceRes: true },
  { name: 'Aura', type: 'light', rank: 'A', mt: 12, hit: 80, wt: 15, crit: 15, magic: true },
  { name: 'Aureola', type: 'light', rank: 'S', mt: 15, hit: 90, wt: 14, crit: 5, magic: true, resBonus: 5 },

  { name: 'Flux', type: 'dark', rank: 'E', mt: 7, hit: 80, wt: 8, crit: 0, magic: true },
  { name: 'Ruin', type: 'dark', rank: 'D', mt: 5, hit: 75, wt: 6, crit: 20, magic: true },
  { name: 'Luna', type: 'dark', rank: 'C', mt: 0, hit: 95, wt: 12, crit: 20, magic: true, pierceRes: true },
  { name: 'Nosferatu', type: 'dark', rank: 'C', mt: 10, hit: 70, wt: 14, crit: 0, magic: true, drain: true },
  { name: 'Mire', type: 'dark', rank: 'B', mt: 6, hit: 70, wt: 9, crit: 0, magic: true, poison: true },
  { name: 'Eclipse', type: 'dark', rank: 'B', mt: 0, hit: 55, wt: 12, crit: 0, magic: true, halveHp: true },
  { name: 'Fenrir', type: 'dark', rank: 'A', mt: 15, hit: 70, wt: 18, crit: 0, magic: true },
  { name: 'Ereshkigal', type: 'dark', rank: 'S', mt: 20, hit: 95, wt: 12, crit: 0, magic: true },

  { name: 'Heal Staff', type: 'staff', rank: 'E', mt: 10, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal' },
  { name: 'Bloom Festal', type: 'staff', rank: 'E', mt: 2, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal', defBonus: 4 },
  { name: 'Mend Staff', type: 'staff', rank: 'D', mt: 20, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal' },
  { name: 'Physic Staff', type: 'staff', rank: 'C', mt: 10, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal', defBonus: 4 },
  { name: 'Sleep Staff', type: 'staff', rank: 'C', mt: 0, hit: 75, wt: 0, crit: 0, staff: true, magic: true, effect: 'sleep' },
  { name: 'Berserk Staff', type: 'staff', rank: 'B', mt: 0, hit: 65, wt: 0, crit: 0, staff: true, magic: true, effect: 'berserk' },
  { name: 'Fortify Staff', type: 'staff', rank: 'A', mt: 0, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'fortify' },
  { name: 'Restore Staff', type: 'staff', rank: 'S', mt: 30, hit: 100, wt: 0, crit: 0, staff: true, magic: true, effect: 'heal' },
]

function weaponTierFromRank(rank) {
  if (rank === 'A' || rank === 'S') return 'rare'
  if (rank === 'C' || rank === 'B') return 'uncommon'
  return 'normal'
}
function weaponTierLabel(tier) {
  return tier === 'rare' ? 'Rare' : tier === 'uncommon' ? 'Uncommon' : 'Normal'
}
function prepareWeaponData() {
  WEAPONS.forEach((w) => {
    const rank = String(w.rank || 'E').toUpperCase()
    w.rank = WEAPON_RANKS.includes(rank) ? rank : 'E'
    w.tier = w.tier || weaponTierFromRank(w.rank)
  })
}
prepareWeaponData()

// Consumable data
// prettier-ignore
const CONSUMABLES = [
  { id: 'vulnerary', name: 'Vulnerary', tier: 'normal', effect: 'heal', amount: 10, desc: 'Restores 10 HP to one living ally.' },
  { id: 'concoction', name: 'Concoction', tier: 'uncommon', effect: 'heal', amount: 20, desc: 'Restores 20 HP to one living ally.' },
  { id: 'elixir', name: 'Elixir', tier: 'rare', effect: 'fullHeal', desc: 'Fully restores one living ally.' },
  { id: 'dragon_tears', name: 'Dragon Tears', tier: 'rare', effect: 'revive', desc: 'Revives one fallen ally with half HP.' },
  { id: 'geosphere', name: 'Geosphere', tier: 'rare', effect: 'aoeDamage', amount: 13, desc: 'Deals 13 damage to all enemies.' },
  { id: 'restore_potion', name: 'Restore Potion', tier: 'uncommon', effect: 'restore', desc: 'Clears Sleep or Berserk from one living ally.' },

  { id: 'hp_tonic', name: 'HP Tonic', tier: 'normal', effect: 'buff', stat: 'hp', amount: 7, desc: 'Grants max HP +7 for the current battle.' },
  { id: 'power_tonic', name: 'Power Tonic', tier: 'normal', effect: 'buff', stat: 'str', amount: 2, desc: 'Grants STR/MAG +2 for the current battle.' },
  { id: 'speed_tonic', name: 'Speed Tonic', tier: 'normal', effect: 'buff', stat: 'spd', amount: 2, desc: 'Grants Spd +2 for the current battle.' },
  { id: 'guard_tonic', name: 'Guard Tonic', tier: 'normal', effect: 'buff', stat: 'def', amount: 2, desc: 'Grants Def +2 for the current battle.' },
  { id: 'ward_tonic', name: 'Ward Tonic', tier: 'normal', effect: 'buff', stat: 'res', amount: 2, desc: 'Grants Res +2 for the current battle.' },

  { id: 'power_potion', name: 'Filla\'s Might', tier: 'uncommon', effect: 'turnBuff', stat: 'str', amount: 10, desc: 'Grants STR/MAG +10 until end of target\'s next turn.' },
  { id: 'skill_potion', name: 'Thor’s Ire', tier: 'uncommon', effect: 'turnBuff', stat: 'skl', amount: 10, desc: 'Grants Skl +10 until end of target\'s next turn.' },
  { id: 'speed_potion', name: 'Set’s Litany', tier: 'uncommon', effect: 'turnBuff', stat: 'spd', amount: 10, desc: 'Grants Spd +10 until end of target\'s next turn.' },
  { id: 'guard_potion', name: 'Ninis\'s Grace', tier: 'uncommon', effect: 'turnBuff', stat: 'def', amount: 10, desc: 'Grants Def +10 until end of target\'s next turn.' },
]

// prettier-ignore
const BASES = [
  // FE7-inspired roster pool. Stats/growths are close enough for prototype balance, not exact ROM data. Unit data.
U('Lyn','Lord','sword',         {bTotal:27,hp:16,str:4,skl:7,spd:9,lck:5,def:2,res:0,con:5},    {hp:70,str:40,skl:60,spd:60,lck:55,def:20,res:30,gTotal:335},'blue'),
U('Eliwood','Lord','sword',     {bTotal:29,hp:18,str:5,skl:5,spd:7,lck:7,def:5,res:0,con:7},    {hp:80,str:45,skl:50,spd:40,lck:45,def:30,res:35,gTotal:325},'red'),
U('Hector','Lord','axe',        {bTotal:27,hp:19,str:7,skl:4,spd:5,lck:3,def:8,res:0,con:13},   {hp:90,str:60,skl:45,spd:35,lck:30,def:50,res:25,gTotal:335},'green'),

U('Raven','Mercenary','sword',  {bTotal:40,hp:25,str:8,skl:11,spd:13,lck:2,def:5,res:1,con:8},  {hp:85,str:55,skl:40,spd:45,lck:35,def:25,res:15,gTotal:300},'purple'),
U('Harken','Mercenary','sword', {bTotal:41,hp:24,str:9,skl:9,spd:10,lck:4,def:7,res:2,con:11},  {hp:80,str:45,skl:45,spd:35,lck:35,def:30,res:25,gTotal:295},'blue'),

U('Guy','Myrmidon','sword',     {bTotal:38,hp:21,str:6,skl:11,spd:11,lck:5,def:5,res:0,con:5},  {hp:75,str:30,skl:50,spd:70,lck:45,def:15,res:25,gTotal:310},'gold'),
U('Karel','Myrmidon','sword',   {bTotal:43,hp:22,str:7,skl:12,spd:13,lck:6,def:4,res:1,con:7},  {hp:70,str:35,skl:55,spd:55,lck:30,def:15,res:20,gTotal:280},'red'),
U('Karla','Myrmidon','sword',   {bTotal:46,hp:20,str:7,skl:12,spd:12,lck:8,def:4,res:3,con:7},  {hp:60,str:25,skl:45,spd:55,lck:40,def:10,res:20,gTotal:255},'blue',2),

U('Matthew','Thief','sword',    {bTotal:26,hp:18,str:4,skl:6,spd:10,lck:3,def:3,res:0,con:7},   {hp:75,str:30,skl:40,spd:70,lck:50,def:25,res:20,gTotal:310},'green'),
U('Legault','Thief','sword',    {bTotal:37,hp:20,str:6,skl:8,spd:10,lck:6,def:5,res:2,con:9},   {hp:60,str:25,skl:45,spd:60,lck:60,def:25,res:25,gTotal:300},'purple',2),
U('Jaffar','Thief','sword',     {bTotal:46,hp:21,str:8,skl:12,spd:12,lck:5,def:6,res:3,con:8},  {hp:65,str:20,skl:45,spd:35,lck:15,def:20,res:20,gTotal:220},'red',4),

U('Oswin','Knight','lance',     {bTotal:46,hp:28,str:13,skl:9,spd:5,lck:3,def:13,res:3,con:14}, {hp:90,str:40,skl:30,spd:30,lck:35,def:55,res:30,gTotal:310},'blue'),
U('Wallace','Knight','lance',   {bTotal:41,hp:28,str:10,skl:6,spd:5,lck:6,def:12,res:2,con:13}, {hp:70,str:45,skl:35,spd:20,lck:30,def:35,res:35,gTotal:270},'blue',4),
U('Amelia','Knight','lance',    {bTotal:29,hp:18,str:5,skl:4,spd:4,lck:6,def:7,res:3,con:9},    {hp:60,str:40,skl:45,spd:40,lck:50,def:30,res:15,gTotal:280},'red'),

U('Sain','Cavalier','lance',    {bTotal:28,hp:20,str:8,skl:4,spd:6,lck:4,def:6,res:0,con:9},    {hp:80,str:60,skl:35,spd:40,lck:35,def:20,res:20,gTotal:290},'green'),
U('Kent','Cavalier','sword',    {bTotal:27,hp:20,str:6,skl:6,spd:7,lck:2,def:5,res:1,con:9},    {hp:85,str:40,skl:50,spd:45,lck:20,def:25,res:25,gTotal:290},'red'),
U('Lowen','Cavalier','lance',   {bTotal:29,hp:23,str:7,skl:5,spd:7,lck:3,def:7,res:0,con:10},   {hp:90,str:30,skl:30,spd:30,lck:50,def:40,res:30,gTotal:300},'green'),
U('Marcus','Cavalier','lance',  {bTotal:43,hp:25,str:8,skl:8,spd:7,lck:5,def:9,res:6,con:11},   {hp:65,str:30,skl:50,spd:25,lck:30,def:15,res:35,gTotal:250},'gold',4),
U('Isadora','Cavalier','sword', {bTotal:43,hp:21,str:7,skl:8,spd:10,lck:6,def:6,res:6,con:6},   {hp:75,str:30,skl:35,spd:50,lck:45,def:20,res:25,gTotal:280},'red',2),

U('Florina','Pegasus','lance',  {bTotal:36,hp:17,str:5,skl:7,spd:9,lck:7,def:4,res:4,con:4},    {hp:60,str:40,skl:50,spd:55,lck:50,def:15,res:35,gTotal:305},'blue'),
U('Fiora','Pegasus','lance',    {bTotal:40,hp:19,str:6,skl:8,spd:10,lck:6,def:5,res:5,con:5},   {hp:70,str:35,skl:60,spd:50,lck:30,def:20,res:50,gTotal:315},'purple'),
U('Farina','Pegasus','lance',   {bTotal:41,hp:18,str:7,skl:8,spd:9,lck:7,def:5,res:5,con:5},    {hp:75,str:50,skl:45,spd:45,lck:45,def:25,res:30,gTotal:315},'green'),

U('Heath','Wyvern','lance',     {bTotal:40,hp:24,str:10,skl:7,spd:7,lck:7,def:8,res:1,con:9},   {hp:80,str:50,skl:50,spd:45,lck:20,def:30,res:20,gTotal:295},'red'),
U('Vaida','Wyvern','lance',     {bTotal:43,hp:27,str:11,skl:8,spd:8,lck:4,def:10,res:2,con:12}, {hp:80,str:45,skl:35,spd:30,lck:25,def:25,res:15,gTotal:255},'purple',2),
U('Haar','Wyvern','axe',        {bTotal:42,hp:28,str:12,skl:9,spd:6,lck:3,def:10,res:2,con:13}, {hp:80,str:45,skl:45,spd:35,lck:15,def:35,res:10,gTotal:265},'gold',2),
U('Cormag','Wyvern','lance',    {bTotal:37,hp:22,str:10,skl:5,spd:6,lck:3,def:11,res:2,con:11}, {hp:85,str:55,skl:40,spd:45,lck:35,def:25,res:15,gTotal:300},'blue',2),
U('Melady','Wyvern','lance',    {bTotal:43,hp:25,str:8,skl:11,spd:7,lck:3,def:11,res:3,con:9},  {hp:75,str:50,skl:50,spd:45,lck:25,def:20,res:5,gTotal:270},'red',2),

U('Dorcas','Fighter','axe',     {bTotal:26,hp:30,str:7,skl:7,spd:6,lck:3,def:3,res:0,con:14},   {hp:80,str:60,skl:40,spd:20,lck:45,def:25,res:15,gTotal:285},'gold'),
U('Bartre','Fighter','axe',     {bTotal:25,hp:29,str:9,skl:5,spd:3,lck:4,def:4,res:0,con:13},   {hp:85,str:50,skl:35,spd:40,lck:30,def:30,res:25,gTotal:295},'red'),
U('Geitz','Fighter','axe',      {bTotal:38,hp:27,str:10,skl:8,spd:8,lck:5,def:6,res:1,con:13},  {hp:85,str:50,skl:40,spd:40,lck:40,def:20,res:20,gTotal:295},'green'),
U('Garcia','Fighter','axe',     {bTotal:29,hp:28,str:8,skl:7,spd:6,lck:3,def:5,res:0,con:13},   {hp:80,str:65,skl:40,spd:30,lck:40,def:25,res:15,gTotal:295},'gold'),
U('Ross','Fighter','axe',       {bTotal:28,hp:22,str:6,skl:4,spd:5,lck:8,def:4,res:1,con:8},    {hp:70,str:50,skl:35,spd:30,lck:40,def:25,res:20,gTotal:270},'blue'),
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
U('Ewan','Mage','anima',        {bTotal:21,hp:15,str:3,skl:4,spd:5,lck:5,def:1,res:3,con:5},    {hp:50,str:50,skl:45,spd:40,lck:50,def:10,res:40,gTotal:285},'red'),

U('Lucius','Monk','light',      {bTotal:32,hp:18,str:7,skl:6,spd:10,lck:2,def:1,res:6,con:6},   {hp:55,str:60,skl:50,spd:40,lck:20,def:10,res:60,gTotal:295},'blue'),
U('Renault','Monk','light',     {bTotal:38,hp:22,str:7,skl:8,spd:7,lck:4,def:5,res:7,con:9},    {hp:60,str:40,skl:40,spd:35,lck:30,def:25,res:45,gTotal:275},'red'),
U('Artur','Monk','light',       {bTotal:30,hp:19,str:6,skl:6,spd:8,lck:2,def:2,res:6,con:6},    {hp:55,str:50,skl:50,spd:40,lck:25,def:15,res:55,gTotal:290},'gold'),
U('Riev','Monk','light',        {bTotal:36,hp:21,str:8,skl:7,spd:6,lck:3,def:4,res:8,con:8},    {hp:65,str:45,skl:35,spd:30,lck:20,def:25,res:60,gTotal:280},'purple'),
U('Saul','Monk','light',        {bTotal:28,hp:20,str:5,skl:6,spd:7,lck:2,def:2,res:6,con:6},    {hp:60,str:40,skl:45,spd:45,lck:15,def:15,res:50,gTotal:270},'green'),

U('Canas','Shaman','dark',      {bTotal:47,hp:21,str:10,skl:9,spd:8,lck:7,def:5,res:8,con:7},   {hp:70,str:45,skl:40,spd:35,lck:25,def:25,res:45,gTotal:285},'purple'),
U('Raigh','Shaman','dark',      {bTotal:51,hp:23,str:12,skl:9,spd:9,lck:6,def:5,res:10,con:4},  {hp:55,str:45,skl:55,spd:40,lck:15,def:15,res:20,gTotal:245},'purple'),
U('Knoll','Shaman','dark',      {bTotal:28,hp:18,str:7,skl:6,spd:6,lck:0,def:2,res:7,con:7},    {hp:70,str:50,skl:40,spd:35,lck:20,def:10,res:45,gTotal:270},'blue'),
U('Sophia','Shaman','dark',     {bTotal:24,hp:15,str:6,skl:2,spd:4,lck:3,def:1,res:8,con:3},    {hp:60,str:55,skl:40,spd:30,lck:20,def:20,res:55,gTotal:280},'blue'),
U('Lyon','Shaman','dark',       {bTotal:35,hp:20,str:8,skl:7,spd:5,lck:3,def:4,res:8,con:8},    {hp:70,str:55,skl:45,spd:25,lck:25,def:25,res:55,gTotal:300},'purple'),
U('Niime','Shaman','dark',      {bTotal:42,hp:20,str:9,skl:9,spd:7,lck:3,def:4,res:10,con:6},   {hp:55,str:30,skl:45,spd:25,lck:15,def:15,res:45,gTotal:230},'purple',4),

U('Serra','Cleric','staff',     {bTotal:28,hp:17,str:2,skl:5,spd:8,lck:6,def:2,res:5,con:4},    {hp:50,str:50,skl:30,spd:40,lck:60,def:15,res:55,gTotal:300},'gold'),
U('Priscilla','Cleric','staff', {bTotal:33,hp:16,str:3,skl:6,spd:8,lck:7,def:3,res:6,con:4},    {hp:45,str:40,skl:50,spd:40,lck:65,def:15,res:50,gTotal:305},'red'),
U('Moulder','Cleric','staff',   {bTotal:27,hp:20,str:4,skl:6,spd:6,lck:2,def:4,res:5,con:9},    {hp:70,str:40,skl:50,spd:40,lck:20,def:25,res:25,gTotal:270},'blue'),
U('Natasha','Cleric','staff',   {bTotal:27,hp:18,str:2,skl:4,spd:7,lck:6,def:2,res:6,con:4},    {hp:50,str:60,skl:25,spd:40,lck:60,def:15,res:55,gTotal:305},'green'),
U('L’Arachel','Cleric','staff', {bTotal:36,hp:18,str:4,skl:5,spd:8,lck:9,def:3,res:7,con:5},    {hp:45,str:50,skl:45,spd:45,lck:65,def:15,res:50,gTotal:315},'gold'),
]
function U(name, cls, weaponType, stats, growths, palette, startOffset = 0) {
  return { name, cls, weaponType, stats, growths, palette, startOffset }
}

// Biome data. Each focus entry can target a class generally, or a class plus weaponType
// for special cases like axe wyverns. The focus list is intended to drive both enemy
// class bias and biome boss class previews.
// prettier-ignore
const BIOMES = [
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
