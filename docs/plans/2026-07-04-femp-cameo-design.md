# Design: Path of the Midnight Sun cameo (card 9ku2CTPE)

**Date:** 2026-07-04
**Status:** Approved — ready to implement

Add cameo units, a boss, and signature skills inspired by the fan game
*Fire Emblem: The Midnight Sun / Path of the Midnight Sun* (Alfred Kamon), an AU
of *The Sacred Stones*. Scope was chosen with the user; items were deferred.

## Cameo units — 3 draftable + 1 boss

Added to `BASES` via the existing `U(name, class, weapon, base, growths, palette, startOffset)`
helper (standard tier, `startOffset` 0). Stats tuned against comparable roster
members; treat as initial values, tunable later via the sim runner.

| Unit | Source role | Class / weapon | Notes |
| --- | --- | --- | --- |
| **Ornieres** | Suzaku Ornieres — amnesiac Captain of the Holy Swords of Pylum | **Lord / sword** | Sturdy, defensive lord (Eliwood-ish base, higher Def) |
| **Shiori** | Blind priestess who senses others' "Malice" | **Monk / light** | Frail, high Skl/Lck/Res scaling support caster |
| **Faratras** | Princess of Hoikaide; black-magic vessel of the Demon King | **Shaman / dark** | Offensive dark mage; pairs with Vassal's Seal |

```ts
U('Ornieres','Lord','sword',    {bTotal:29,hp:19,str:6,skl:7,spd:6,lck:4,def:6,res:0,con:9},  {hp:80,str:45,skl:50,spd:40,lck:35,def:45,res:20,gTotal:315},'gold'),
U('Shiori','Monk','light',      {bTotal:33,hp:17,str:4,skl:8,spd:7,lck:7,def:1,res:6,con:5},  {hp:55,str:40,skl:55,spd:50,lck:55,def:10,res:60,gTotal:325},'blue'),
U('Faratras','Shaman','dark',   {bTotal:35,hp:18,str:8,skl:6,spd:6,lck:5,def:3,res:7,con:4},  {hp:65,str:60,skl:40,spd:40,lck:30,def:15,res:55,gTotal:305},'purple'),
```

**Boss — Memnus** (a minor antagonist, deliberately not the main villain to avoid
plot spoilers). A Wyvern Lord; added by name to `BOSS_NAMES_BY_CLASS` (stats come
from the class-generic base + boss scaling, no stat block needed):

```ts
Wyvern:        [..., 'Memnus'],
'Wyvern Lord': [..., 'Memnus'],
```

## Signature skills (`TEACHABLE_SKILLS`)

Items were deferred. Rarities and mechanics per user review:

```ts
{ rarity: 'uncommon', id: 'malice_sense', name: 'Malice Sense', desc: 'Grants passive Avoid +20.', source: 'Midnight Sun Shiori', classes: SKILL_CLASS_GROUPS.holy, family: 'stat', avoid: 20 },
{ rarity: 'uncommon', id: 'vassals_seal', name: "Vassal's Seal", desc: 'While below 50% HP, deals +5 damage and Crit +10.', source: 'Midnight Sun Faratras', classes: SKILL_CLASS_GROUPS.shaman, family: 'combat', trigger: 'hpBelowHalf', damageDealt: 5, crit: 10 },
{ rarity: 'rare', id: 'oath_of_pylum', name: 'Oath of Pylum', desc: 'Allies take -3 damage while the user is alive.', source: 'Midnight Sun Ornieres', classes: SKILL_CLASS_GROUPS.lord, family: 'aura', teamAura: { damageTakenFlat: -3 } },
```

- **Malice Sense** — pure data. `skill.avoid` is already read in `avoid()` for
  `family: 'stat'` skills (combat.ts:271), same path as `Avoid +10`.
- **Oath of Pylum** — pure data. `teamAura.damageTakenFlat` is already summed into
  damage (combat.ts:172/235), same path as Inspiration. Restricted to lords.
- **Vassal's Seal** — needs a small engine change (below).

## Engine change — generalize the `hpBelowHalf` trigger to skills

Today `heldItemConditionMet` (combat.ts:76) gates the `hpBelowHalf` trigger for
**held items only**. A skill's `damageDealt` (combat.ts:207) and `crit`
(combat.ts:308) apply unconditionally. Add a mirror helper and gate those two
reads so a skill's `trigger: 'hpBelowHalf'` is honored:

```ts
export function skillConditionMet(u: Unit) {
  return u.skill?.trigger !== 'hpBelowHalf' || u.hp * 2 < u.maxHp
}
```

- `skillAttackDamage` (combat.ts:207): wrap the `a.skill.damageDealt` term in `skillConditionMet(a)`.
- `critRate` (combat.ts:308): change `(a.skill?.crit || 0)` to `(skillConditionMet(a) ? a.skill?.crit || 0 : 0)`.

Safe: no existing skill sets `trigger: 'hpBelowHalf'`, so `skillConditionMet`
returns `true` for all current skills — behavior is unchanged except for
Vassal's Seal.

## Art / assets

No portraits or map sprites exist for any of the four in the repo. All cameos are
fully **functional** without art — draftables fall back to generic class
portraits, the boss to the generic wyvern-boss portrait, map sprites to
class+palette generics. Real FE:MS portraits can be dropped into
`assets/femp/portraits/<slug>.png` later (see `assets/femp/README.md` for the
96×80 crop recipe), exactly as Gerik was handled.

## Verification

`npm run check` (tsc) green; `npm run simulate -- --roster=Ornieres,Shiori,Faratras,<2 more>`
runs a headless batch to confirm the units load, fight, and record stats without error.
