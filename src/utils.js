'use strict'

const MUSIC_URL = 'https://www.youtube.com/watch?v=yIDBhuYldSk&t=19m58s'
let seed = Math.floor(Math.random() * 999999)
document.getElementById('seedLabel').textContent = seed
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}
function rint(n) {
  return Math.floor(rnd() * n)
}
function pick(a) {
  return a[rint(a.length)]
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}
function floor(v) {
  return Math.floor(v)
}
function capStat(unit, k) {
  return unit.caps?.[k] ?? (k === 'hp' ? 60 : 30)
}
