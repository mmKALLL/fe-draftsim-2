export type StatKey = 'hp' | 'str' | 'skl' | 'spd' | 'lck' | 'def' | 'res' | 'con'
export type GrowthStatKey = Exclude<StatKey, 'con'>
export type WeaponRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type WeaponType = 'sword' | 'dagger' | 'lance' | 'axe' | 'bow' | 'anima' | 'light' | 'dark' | 'staff'
export type Rarity = 'normal' | 'uncommon' | 'rare'
export type PaletteKey = 'blue' | 'red' | 'green' | 'purple' | 'gold'

export type StatBlock = Record<StatKey, number>
export type BaseStatBlock = StatBlock & { bTotal: number }
export type GrowthBlock = Record<GrowthStatKey, number> & { gTotal: number }
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
  tier?: Rarity
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
  tier: Rarity
  effect: string
  desc: string
  amount?: number
  stat?: StatKey
}

export type CandidateItemData = {
  id: string
  name: string
  tier: Rarity
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
}

export type BiomeFocus = {
  cls: string
  weaponType?: WeaponType
  label?: string
}

export type BiomeData = {
  id: string
  name: string
  tile: string
  effects: string[]
  focus: BiomeFocus[]
}
