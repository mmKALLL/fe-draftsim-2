import { FEMP_ASSET_ROOT, FEMP_IMAGE_EXTS, MAP_SPRITE_SLOT_H } from '../constants'
import { CLASSES, CUSTOM_MAP_SPRITE_STEMS, FEMP_NAME_OVERRIDES, palettes } from '../data'
import { focusLabel } from './biomes'
import { $ } from './utils'
import type { Unit, Weapon, Consumable, StatKey, BiomeFocus, BiomeEntry, ShopOffer } from '../types'


export function svgDataUri(kind = 'lord', team = 'blue', promoted = false) {
  const p = palettes[team] || palettes.blue,
    [dark, main, light, white, hair, skin, black] = p
  const cape = kind === 'mage' || kind === 'monk' || kind === 'cleric' || kind === 'shaman'
  const armor = kind === 'knight' || kind === 'cavalier' || kind === 'wyvern'
  const bow = kind === 'archer'
  const axe = kind === 'fighter' || kind === 'brigand'
  const lance = kind === 'pegasus' || kind === 'cavalier' || kind === 'knight' || kind === 'wyvern'
  const sword = kind === 'lord' || kind === 'merc' || kind === 'myrm' || kind === 'thief'
  const staff = kind === 'cleric'
  const scale = 4
  function rect(x: number, y: number, w: number, h: number, c: string) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
  }
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" shape-rendering="crispEdges">`
  s += rect(0, 0, 64, 64, 'transparent')
  // shadow
  s += rect(14, 56, 36, 4, 'rgba(0,0,0,.35)')
  // weapon behind
  if (sword) {
    s += rect(45, 10, 4, 36, white) + rect(47, 8, 2, 4, light) + rect(43, 42, 10, 3, dark)
  }
  if (lance) {
    s += rect(49, 5, 3, 46, white) + rect(47, 3, 7, 6, light)
  }
  if (axe) {
    s += rect(48, 16, 4, 34, hair) + rect(44, 12, 12, 9, white) + rect(52, 15, 7, 8, light)
  }
  if (bow) {
    s += `<path d="M48 12 L57 23 L57 42 L48 53 L51 42 L51 23 Z" fill="none" stroke="${hair}" stroke-width="3"/>` + rect(53, 17, 1, 31, white)
  }
  if (staff) {
    s += rect(49, 9, 3, 42, white) + rect(46, 7, 9, 8, light) + rect(48, 5, 5, 4, white)
  }
  // cape/wings/mount hints
  if (cape) s += rect(14, 25, 36, 30, dark) + rect(18, 29, 28, 25, main)
  if (kind === 'pegasus') s += rect(6, 33, 19, 8, white) + rect(5, 29, 15, 5, light) + rect(40, 33, 19, 8, white) + rect(44, 29, 15, 5, light)
  if (kind === 'wyvern') s += rect(5, 31, 19, 8, dark) + rect(4, 27, 15, 5, main) + rect(40, 31, 20, 8, dark) + rect(45, 27, 14, 5, main)
  if (kind === 'cavalier') s += rect(11, 42, 42, 13, hair) + rect(12, 51, 8, 9, black) + rect(43, 51, 8, 9, black)
  // legs/body/head
  s += rect(24, 44, 6, 13, dark) + rect(35, 44, 6, 13, dark) + rect(22, 27, 22, 19, armor ? light : main) + rect(20, 30, 6, 14, dark) + rect(42, 30, 6, 14, dark)
  if (armor) {
    s += rect(25, 29, 16, 13, white) + rect(27, 32, 12, 10, light) + rect(22, 27, 22, 3, dark)
  }
  s +=
    rect(25, 14, 15, 13, skin) + rect(23, 11, 19, 8, hair) + rect(25, 8, 14, 5, hair) + rect(29, 20, 3, 3, black) + rect(36, 20, 3, 3, black) + rect(31, 25, 7, 2, '#9f1239')
  // class details
  if (kind === 'myrm') s += rect(19, 26, 27, 4, light) + rect(17, 25, 6, 6, white)
  if (kind === 'thief') s += rect(24, 13, 18, 4, dark) + rect(42, 16, 5, 4, dark)
  if (kind === 'mage' || kind === 'shaman') s += rect(20, 12, 24, 5, dark) + rect(24, 8, 16, 5, main) + rect(28, 4, 8, 5, light)
  if (kind === 'cleric') s += rect(24, 7, 16, 6, white) + rect(30, 4, 4, 13, light)
  if (promoted) {
    s += rect(16, 23, 6, 6, '#fde68a') + rect(42, 23, 6, 6, '#fde68a') + rect(30, 2, 5, 5, '#fde68a')
  }
  s += `</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(s)
}

export function mugshotDataUri(name = '', kind = 'lord', team = 'blue', promoted = false) {
  const p = palettes[team] || palettes.blue
  const [dark, main, light, white, hairBase, skin, black] = p
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const hairColors = ['#1f2937', '#3f2a1d', '#713f12', '#78350f', '#451a03', '#4c1d95', '#7f1d1d', '#92400e']
  const hair = hairColors[h % hairColors.length]
  const skinTones = ['#f2c9a0', '#e8b88e', '#d69b73', '#c1845f', '#f7d6b8']
  const face = skinTones[(h >> 3) % skinTones.length]
  const eye = h % 3 === 0 ? '#0f172a' : h % 3 === 1 ? '#1e3a8a' : '#14532d'
  const mouth = h % 2 ? '#9f1239' : '#7f1d1d'
  const bangs = (h >> 4) % 4,
    jaw = (h >> 6) % 3
  const hat = ['mage', 'monk', 'shaman', 'cleric'].includes(kind)
  const helm = ['knight', 'wyvern', 'cavalier'].includes(kind)
  function r(x: number, y: number, w: number, h: number, c: string) {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`
  }
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">`
  s += r(0, 0, 64, 64, '#0f172a') + r(2, 2, 60, 60, '#1e293b') + r(4, 4, 56, 56, '#334155')
  s += r(8, 44, 48, 16, dark) + r(13, 38, 38, 19, main) + r(18, 38, 28, 6, light)
  if (helm) {
    s += r(16, 10, 32, 12, dark) + r(14, 18, 36, 16, main) + r(20, 13, 24, 7, light)
  } else if (hat) {
    s += r(15, 8, 34, 8, dark) + r(19, 4, 26, 7, main) + r(24, 1, 16, 5, light)
  } else {
    s += r(17, 10, 30, 8, hair) + r(14, 16, 36, 10, hair)
    if (bangs === 0) s += r(20, 24, 7, 6, hair) + r(34, 23, 8, 6, hair)
    if (bangs === 1) s += r(16, 24, 12, 5, hair) + r(28, 22, 7, 7, hair)
    if (bangs === 2) s += r(36, 23, 11, 7, hair)
    if (bangs === 3) s += r(21, 22, 20, 4, hair)
  }
  s += r(18, 20, 28, 26, face)
  if (jaw === 0) s += r(21, 46, 22, 4, face)
  else if (jaw === 1) s += r(24, 46, 16, 5, face)
  else s += r(19, 44, 26, 3, face)
  s += r(15, 25, 4, 13, hair) + r(45, 25, 4, 13, hair)
  s += r(23, 29, 4, 4, eye) + r(38, 29, 4, 4, eye) + r(27, 27, 7, 2, hair) + r(36, 27, 7, 2, hair)
  s += r(31, 32, 3, 7, '#b7795b') + r(28, 40, 10, 2, mouth)
  if (kind === 'myrm' || kind === 'thief') s += r(13, 19, 38, 3, dark) + r(48, 22, 5, 7, dark)
  if (kind === 'pegasus') s += r(8, 36, 9, 7, white) + r(47, 36, 9, 7, white)
  if (kind === 'fighter') s += r(9, 41, 9, 9, hair) + r(46, 41, 9, 9, hair)
  if (promoted) s += r(29, 6, 6, 4, '#fde68a') + r(12, 42, 5, 5, '#fde68a') + r(47, 42, 5, 5, '#fde68a')
  s += `</svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(s)
}

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
  return [...new Set(items.filter(Boolean).map(String))].filter((path) => !failedAssetPaths.has(path as string))
}
export function htmlAttr(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
export function fallbackSource(fallback: any) {
  if (!fallback) return ''
  if (typeof fallback === 'string') return fallback
  if (fallback.type === 'portrait') return mugshotDataUri(fallback.name, fallback.kind, fallback.team, fallback.promoted)
  if (fallback.type === 'battle') return svgDataUri(fallback.kind, fallback.team, fallback.promoted)
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
  const map = {
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
  const wrap = img.closest('.mapSprite')
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
export function mapSpriteForFocus(focus: BiomeFocus, team = 'red', promoted = false) {
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
  return assetSheet('biomeUnitIcon mapSprite', paths[0], paths.slice(1), fallbackBattle(kind, team, promoted), focusLabel(focus), { spriteWidth: 18, slotHeight: 22 })
}

declare global {
  interface Window {
    assetFallback: (img: HTMLImageElement) => void
    assetSheetLoaded: (img: HTMLImageElement) => void
  }
}
window.assetFallback = assetFallback
window.assetSheetLoaded = assetSheetLoaded
