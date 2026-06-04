import type { StatKey } from '../types'

export const MUSIC_URL = 'https://www.youtube.com/watch?v=yIDBhuYldSk&t=19m58s'

export const $ = (id = ''): HTMLElement | null => document.getElementById(id)

let seed = Math.floor(Math.random() * 999999)
const seedLabel = $('seedLabel')
if (seedLabel) seedLabel.textContent = String(seed)

export function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}
export function rint(n: number) {
  return Math.floor(rnd() * n)
}
export function pick<T>(a: readonly T[]): T {
  return a[rint(a.length)]
}
export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
export function floor(v: number) {
  return Math.floor(v)
}
export function capStat(unit: { caps?: Partial<Record<StatKey, number>> }, k: StatKey) {
  return unit.caps?.[k] ?? (k === 'hp' ? 60 : 30)
}
