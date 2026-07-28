export type StatKey = 'hp' | 'str' | 'skl' | 'spd' | 'lck' | 'def' | 'res' | 'con'
export type GrowthStatKey = Exclude<StatKey, 'con'>
export type WeaponRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type WeaponType = 'sword' | 'dagger' | 'lance' | 'axe' | 'bow' | 'anima' | 'light' | 'dark' | 'staff'
export type Rarity = 'normal' | 'uncommon' | 'rare'
export type RewardType = 'weapon' | 'consumable' | 'boost' | 'heldItem' | 'skill' | 'support'
export type PaletteKey = 'blue' | 'red' | 'green' | 'purple' | 'gold'

// Numeric string index: stat blocks are iterated dynamically by stat key
// throughout the game; named keys still provide autocomplete.
export type StatBlock = Record<StatKey, number> & { [key: string]: number }
export type BaseStatBlock = StatBlock & { bTotal: number }
export type GrowthBlock = Record<GrowthStatKey, number> & { gTotal: number; [key: string]: number }
export type PartialStatBlock = Partial<Record<StatKey, number>>

export type ClassData = {
  promotesTo: string
  kind: string
  strLabel?: string
  promotionWeaponTypes: WeaponType[]
  caps: StatBlock
  promo: PartialStatBlock
}

export type WeaponData = {
  name: string
  type: WeaponType
  rank: WeaponRank
  rarity?: Rarity
  mt: number
  hit: number
  wt: number
  crit: number
  magic: boolean
  staff?: boolean
  effect?: string
  speedBonus?: number
  defBonus?: number
  resBonus?: number
  reaver?: boolean
  brave?: boolean
  halfDef?: boolean
  poison?: boolean
  halveHp?: boolean
  pierceRes?: boolean
  drain?: boolean
  effective?: string[]
}

export type ConsumableData = {
  id: string
  name: string
  rarity: Rarity
  effect: string
  desc: string
  amount?: number
  stat?: StatKey
}

export type CandidateItemData = {
  id: string
  name: string
  rarity: Rarity
  price: number
  family: string
  desc: string
  [key: string]: unknown
}

export type SkillGroupMap = Record<string, string[]>

export type SkillData = {
  rarity: Rarity
  id: string
  name: string
  desc: string
  source: string
  classes: string[]
  family: string
  // Debug: force this skill to be the only one offered as a reward (see skillReward).
  debugAlways?: boolean
  [key: string]: unknown
}

export type UnitBase = {
  name: string
  cls: string
  weaponType: WeaponType
  stats: BaseStatBlock
  growths: GrowthBlock
  palette: PaletteKey
  startOffset: number
  origin?: string // origin game (FE6/FE7/FE8/FEMS); tagged when composing ALL_BASES
}

export type ArenaFocus = {
  cls: string
  weaponType?: WeaponType
  label?: string
}

export type ArenaData = {
  id: string
  name: string
  tile: string
  effects: string[]
  focus: ArenaFocus[]
}

// --- Runtime domain types (interim: well-known fields typed, permissive index
// signature for the many dynamically-attached fields; tighten opportunistically) ---

export type Weapon = WeaponData

export type Consumable = ConsumableData

export type Team = 'blue' | 'red'

export type Unit = {
  id: string
  name: string
  baseName: string
  cls: string
  displayCls: string
  weaponType: WeaponType
  palette: PaletteKey
  kind: string
  lvl: number
  internalLevel: number
  promoted: boolean
  stats: StatBlock
  growths: GrowthBlock
  caps: StatBlock
  team: Team
  isEnemy: boolean
  startOffset: number
  status: string | null
  weapon: Weapon
  maxHp: number
  hp: number
  isLeader?: boolean
  bossTier?: string | null
  // Endless mode (1T3CRjDJ) allows multiple slots; normally each holds 0-1 entries.
  heldItems: any[]
  skills: any[]
  [key: string]: any
}

export type ShopOffer = {
  kind: string
  price: number
  [key: string]: any
}

export type ArenaEntry = {
  arena: ArenaData
  [key: string]: any
}
