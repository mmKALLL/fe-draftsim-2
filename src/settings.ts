// Player settings: load from localStorage, resolve against defaults, and apply
// each setting's effect into config's live bindings (see SETTINGS in config.ts).
//
// Storage is a single key holding a sparse { [key]: value } map — only settings the
// player has actually changed are stored, so anything absent falls back to the
// definition's current default. That makes adding a new setting forward-compatible
// with no migration: old storage simply lacks the key. Unknown stored keys are
// ignored (we only ever iterate the SETTINGS defs), and a stored value that no
// longer matches its definition's options is discarded in favour of the default.
import { SETTINGS, type SettingValue } from '../config'

const SETTINGS_KEY = 'firerogue.settings.v1'
let stored: Record<string, SettingValue> = {}

function defFor(key: string) {
  return SETTINGS.find((d) => d.key === key)
}

// True if `v` is a valid value for the given setting definition (guards against a
// stored value left over from a since-changed definition).
function isValid(def: { type: string; options?: { value: string }[] }, v: SettingValue): boolean {
  if (def.type === 'toggle') return typeof v === 'boolean'
  if (def.type === 'choice') return typeof v === 'string' && (!def.options || def.options.some((o) => o.value === v))
  if (def.type === 'multi') return Array.isArray(v) && (!def.options || v.every((x) => def.options!.some((o) => o.value === x)))
  return false
}

export function getSetting(key: string): SettingValue {
  const def = defFor(key)
  if (!def) return false
  const v = stored[key]
  return v !== undefined && isValid(def, v) ? v : def.default
}

// Re-apply every setting's effect. Called at startup and after any change.
export function applyAll() {
  for (const def of SETTINGS) def.apply(getSetting(def.key))
}

export function setSetting(key: string, value: SettingValue) {
  stored[key] = value
  persist()
  defFor(key)?.apply(getSetting(key))
}

export function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    stored = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    stored = {} // private mode / quota / corrupt JSON -> pure defaults
  }
}

function persist() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored))
  } catch {
    // best-effort; settings persistence is non-critical (mirrors stats.ts)
  }
}
