import { FEMP_ASSET_ROOT, FEMP_IMAGE_EXTS, MAP_SPRITE_SLOT_H } from '../config'
import { CLASSES, CUSTOM_MAP_SPRITE_STEMS, FEMP_NAME_OVERRIDES } from '../data'
import { focusLabel } from './arenas'
import { $ } from './utils'
import type { Unit, Weapon, Consumable, StatKey, ArenaFocus, ArenaEntry, ShopOffer } from '../types'


// All game images are inlined as base64 data URIs at build time (window.__IMG).
// resolveAssetUrl maps an asset path to its inlined URI so nothing is fetched at
// runtime; in dev (no manifest) it returns the path and Vite serves it.
const IMG: Record<string, string> = ((globalThis as any).__IMG as Record<string, string>) || {}
const manifestKey = (path: string) => path.replace(/^\.?\//, '') // ./assets/.. or assets/..
export function resolveAssetUrl(path: string) {
  return IMG[manifestKey(path)] || path
}

// Real default art for a missing asset (also inlined), replacing the old SVG placeholders.
const DEFAULT_PORTRAIT = 'assets/femp/enemy-portraits/generic.png'
const DEFAULT_MAP: Record<string, string> = { red: 'assets/femp/map/red/merc.png', blue: 'assets/femp/map/blue/merc.png' }
const DEFAULT_ARENA = 'assets/femp/biomes/plains.jpg'

export function assetSlug(s = '') {
  return String(s)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}
export function titleStem(stem = '') {
  return stem ? stem.charAt(0).toUpperCase() + stem.slice(1) : stem
}
export const failedAssetPaths = new Set()
export function assetPathVariants(folder: any, stem: any) {
  if (!folder || !stem) return []
  const key = String(stem)
  const stems = [key, titleStem(key), key.toUpperCase()].filter(Boolean)
  return [...new Set(stems.flatMap((st) => FEMP_IMAGE_EXTS.map((ext) => `${FEMP_ASSET_ROOT}/${folder}/${st}.${ext}`)))]
}
export function assetChain(items: unknown[]): string[] {
  const paths = [...new Set(items.filter(Boolean).map(String))].filter((path) => !failedAssetPaths.has(path))
  // With the inlined manifest, return only the first candidate that actually
  // exists, as its data URI (no network, no fallback chain needed).
  if (Object.keys(IMG).length) {
    const key = paths.map(manifestKey).find((k) => IMG[k])
    return key ? [IMG[key]] : []
  }
  return paths
}
export function htmlAttr(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
export function fallbackSource(fallback: any) {
  if (!fallback) return ''
  if (typeof fallback === 'string') return fallback
  if (fallback.type === 'portrait') return resolveAssetUrl(DEFAULT_PORTRAIT)
  if (fallback.type === 'battle') return resolveAssetUrl(fallback.team === 'red' ? DEFAULT_MAP.red : DEFAULT_MAP.blue)
  if (fallback.type === 'arena') return resolveAssetUrl(DEFAULT_ARENA)
  return ''
}
export function fallbackAttr(fallback: any) {
  return fallback ? ` data-fallback="${htmlAttr(JSON.stringify(fallback))}"` : ''
}
export function portraitFileStem(name: string) {
  return FEMP_NAME_OVERRIDES[name] || assetSlug(name)
}
export function customMapSpriteStem(u: Unit) {
  if (u.isEnemy && u.kind === 'lord') return 'lundgren'
  const label = u.baseName || u.name
  return CUSTOM_MAP_SPRITE_STEMS[label] || null
}
export function battleFileStem(kind: string) {
  const map: Record<string, string> = {
    lord: 'lord',
    merc: 'merc',
    myrm: 'myrm',
    thief: 'thief',
    cavalier: 'cavalier',
    knight: 'knight',
    pegasus: 'pega',
    wyvern: 'wyvern',
    fighter: 'fighter',
    brigand: 'brigand',
    archer: 'archer',
    mage: 'mage',
    monk: 'monk',
    cleric: 'cleric',
    shaman: 'shaman',
  }
  return map[kind] || assetSlug(kind)
}
export function genericPortraitPaths(kind: string, promoted = false) {
  const baseStem = battleFileStem(kind)
  const stems = promoted ? [`${baseStem}_promoted`, baseStem, 'generic'] : [baseStem, 'generic']
  return stems.flatMap((stem) => assetPathVariants('enemy-portraits', stem))
}
export function fallbackPortrait(name: string, kind: string, team: any, promoted: boolean) {
  return { type: 'portrait', name, kind, team, promoted }
}
export function fallbackBattle(kind: string, team: any, promoted: boolean) {
  return { type: 'battle', kind, team, promoted }
}
export function assetImg(cls: string, primary: any, fallbacks: any, fallbackData: any, alt = '') {
  const [src, ...chain] = assetChain([primary, ...fallbacks])
  const encoded = chain.map(htmlAttr).join('|')
  return `<img class="${cls}" src="${htmlAttr(src || fallbackSource(fallbackData))}" alt="${htmlAttr(alt)}" data-chain="${encoded}" data-chain-i="0"${fallbackAttr(fallbackData)} onerror="assetFallback(this)">`
}
export function assetSheet(cls: string, primary: any, fallbacks: any, fallbackData: any, alt = '', opts: any = {}) {
  const [src, ...chain] = assetChain([primary, ...fallbacks])
  const encoded = chain.map(htmlAttr).join('|')
  const spriteWidth = opts.spriteWidth || 64,
    slotHeight = opts.slotHeight || MAP_SPRITE_SLOT_H
  return `<span class="${cls}" style="--frames:1;--sprite-offset:0px;--sprite-distance:${spriteWidth}px" data-sprite-width="${spriteWidth}" data-sprite-slot-h="${slotHeight}"><img class="mapSpriteSheet" src="${htmlAttr(src || fallbackSource(fallbackData))}" alt="${htmlAttr(alt)}" data-chain="${encoded}" data-chain-i="0"${fallbackAttr(fallbackData)} onerror="assetFallback(this)" onload="assetSheetLoaded(this)"></span>`
}
export function assetFallback(img: HTMLImageElement) {
  const failed = img.getAttribute('src') || ''
  if (failed && !failed.startsWith('data:')) failedAssetPaths.add(failed)
  const chain = (img.dataset.chain || '').split('|').filter(Boolean)
  let i = Number(img.dataset.chainI || 0)
  while (i < chain.length && failedAssetPaths.has(chain[i])) i++
  if (i < chain.length) {
    img.dataset.chainI = String(i + 1)
    img.src = chain[i]
  } else {
    const fallback = img.dataset.fallback ? fallbackSource(JSON.parse(img.dataset.fallback)) : ''
    img.onerror = null
    if (fallback && img.src !== fallback) img.src = fallback
  }
}
export function assetSheetLoaded(img: HTMLImageElement) {
  const wrap = img.closest('.mapSprite') as HTMLElement | null
  if (!wrap || !img.naturalWidth || !img.naturalHeight) return
  const spriteWidth = Number(wrap.dataset.spriteWidth || 64),
    slotHeight = Number(wrap.dataset.spriteSlotH || MAP_SPRITE_SLOT_H)
  const ratio = img.naturalHeight / img.naturalWidth
  const frames = Math.max(1, ratio >= 3 ? 3 : Math.round(ratio))
  const frameH = img.naturalHeight / frames
  const scale = spriteWidth / img.naturalWidth
  const frameDisplayH = frameH * scale
  const offset = slotHeight - frameDisplayH
  wrap.style.setProperty('--frames', String(frames))
  wrap.style.setProperty('--sprite-offset', `${offset}px`)
  wrap.style.setProperty('--sprite-distance', `${frames * frameDisplayH}px`)
  img.style.width = `${img.naturalWidth * scale}px`
}
export function portraitImgForBase(b: any, c: any) {
  const stem = portraitFileStem(b.name)
  const paths = [...assetPathVariants('portraits', stem), ...genericPortraitPaths(c.kind, false)]
  return assetImg('portrait', paths[0], paths.slice(1), fallbackPortrait(b.name, c.kind, b.palette, false), b.name)
}
export function portraitImgForUnit(u: Unit) {
  if (u.isEnemy) {
    const bossStem = u.bossTier ? portraitFileStem(u.name) : null
    const paths = [...(bossStem ? assetPathVariants('boss-portraits', bossStem) : []), ...genericPortraitPaths(u.kind, u.promoted)]
    return assetImg('portrait', paths[0], paths.slice(1), fallbackPortrait(u.name, u.kind, u.team, u.promoted), u.name)
  }
  const label = u.baseName || u.name
  const stem = portraitFileStem(label)
  const paths = [...assetPathVariants('portraits', stem), ...genericPortraitPaths(u.kind, u.promoted)]
  return assetImg('portrait', paths[0], paths.slice(1), fallbackPortrait(label, u.kind, u.team, u.promoted), label)
}
export function battleImgForUnit(u: Unit) {
  const stem = battleFileStem(u.kind)
  const promotedStem = u.promoted ? `${stem}_promoted` : stem
  const teamFolder = u.team === 'red' ? 'map/red' : 'map/blue'
  const customStem = customMapSpriteStem(u)
  const enemyLord = u.isEnemy && u.kind === 'lord'
  const customPromotedStem = customStem && u.promoted && !enemyLord ? `${customStem}_promoted` : null
  const paths =
    enemyLord && customStem
      ? [...assetPathVariants(teamFolder, customStem), ...assetPathVariants('map/blue', customStem)]
      : [
          ...(customPromotedStem ? assetPathVariants(teamFolder, customPromotedStem) : []),
          ...(customStem ? assetPathVariants(teamFolder, customStem) : []),
          ...assetPathVariants(teamFolder, promotedStem),
          ...assetPathVariants(teamFolder, stem),
          ...(customPromotedStem ? assetPathVariants('map/blue', customPromotedStem) : []),
          ...(customStem ? assetPathVariants('map/blue', customStem) : []),
          ...assetPathVariants('map/blue', promotedStem),
          ...assetPathVariants('map/blue', stem),
          ...assetPathVariants('battle', promotedStem),
          ...assetPathVariants('battle', stem),
        ]
  return assetSheet('battleSprite mapSprite', paths[0], paths.slice(1), fallbackBattle(u.kind, u.team, u.promoted), u.displayCls || u.cls || u.kind)
}
export function mapSpriteForFocus(focus: ArenaFocus, team = 'red', promoted = false) {
  const kind = CLASSES[focus.cls]?.kind || 'lord'
  const stem = battleFileStem(kind)
  const promotedStem = promoted ? `${stem}_promoted` : stem
  const teamFolder = team === 'red' ? 'map/red' : 'map/blue'
  const customStem = team === 'red' && kind === 'lord' ? 'lundgren' : null
  const customPromotedStem = customStem && promoted ? `${customStem}_promoted` : null
  const paths = customStem
    ? [
        ...(customPromotedStem ? assetPathVariants(teamFolder, customPromotedStem) : []),
        ...assetPathVariants(teamFolder, customStem),
        ...(customPromotedStem ? assetPathVariants('map/blue', customPromotedStem) : []),
        ...assetPathVariants('map/blue', customStem),
      ]
    : [
        ...assetPathVariants(teamFolder, promotedStem),
        ...assetPathVariants(teamFolder, stem),
        ...assetPathVariants('map/blue', promotedStem),
        ...assetPathVariants('map/blue', stem),
        ...assetPathVariants('battle', promotedStem),
        ...assetPathVariants('battle', stem),
      ]
  return assetSheet('arenaUnitIcon mapSprite', paths[0], paths.slice(1), fallbackBattle(kind, team, promoted), focusLabel(focus), { spriteWidth: 18, slotHeight: 22 })
}

declare global {
  interface Window {
    assetFallback: (img: HTMLImageElement) => void
    assetSheetLoaded: (img: HTMLImageElement) => void
  }
  // Also declared on the global scope so `globalThis.assetFallback = ...` type-checks
  // and inline `onerror`/`onload` handlers resolve them by bare name.
  // eslint-disable-next-line no-var
  var assetFallback: (img: HTMLImageElement) => void
  // eslint-disable-next-line no-var
  var assetSheetLoaded: (img: HTMLImageElement) => void
}
// Use `globalThis` rather than `window` so this module also loads under non-browser
// runtimes (e.g. the headless Deno sim runner), where `window` is undefined. In the
// browser `globalThis === window`, so inline `onerror`/`onload` HTML handlers still
// resolve `assetFallback` / `assetSheetLoaded` from the global scope as before.
globalThis.assetFallback = assetFallback
globalThis.assetSheetLoaded = assetSheetLoaded
