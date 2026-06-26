// Minimal DOM / browser-environment stub for running the game's `src/` modules headlessly
// (e.g. under the Deno sim runner). It must be imported *before* any `src/` module, because
// ESM hoists imports and evaluates them in source order: several modules touch the DOM at
// load time (`src/utils.ts` calls `document.getElementById`, `src/state.ts` reads labels,
// `src/stats.ts` reaches for `localStorage`). Keeping the stub in its own module and importing
// it first guarantees these globals exist by the time those modules evaluate.
//
// The stub implements only the surface the game actually touches and no-ops everything else;
// the game's DOM calls are defensively written / null-safe, so a fake element that swallows
// reads/writes is enough.

// A single fake element that swallows every property the game reads or writes.
class FakeElement {
  classList = {
    add: () => {},
    remove: () => {},
    toggle: () => {},
    contains: () => false,
  }
  innerHTML = ''
  textContent = ''
  // `style` is a Proxy so arbitrary property sets (el.style.width = ...) and
  // method calls (el.style.setProperty(...)) both silently succeed.
  style: any = new Proxy(
    { setProperty: () => {}, removeProperty: () => {}, getPropertyValue: () => '' },
    {
      get: (target: any, prop) => (prop in target ? target[prop] : ''),
      set: () => true,
    }
  )
  onclick: any = null
  onerror: any = null
  onload: any = null
  dataset: Record<string, string> = {}
  // layout/measurement reads used by sprite sizing — return 0 so math stays finite
  naturalWidth = 0
  naturalHeight = 0
  offsetWidth = 0
  offsetHeight = 0
  src = ''
  value = ''
  checked = false

  appendChild = (child: any) => child
  prepend = () => {}
  append = () => {}
  removeChild = (child: any) => child
  insertBefore = (child: any) => child
  remove = () => {}
  replaceChildren = () => {}
  querySelector = (): null => null
  querySelectorAll = (): any[] => []
  closest = (): null => null
  click = () => {}
  focus = () => {}
  blur = () => {}
  scrollIntoView = () => {}
  getAttribute = (): null => null
  setAttribute = () => {}
  removeAttribute = () => {}
  hasAttribute = () => false
  addEventListener = () => {}
  removeEventListener = () => {}
  getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 })
}

const g = globalThis as any

if (!g.document) {
  g.document = {
    getElementById: () => new FakeElement(),
    querySelector: (): null => null,
    querySelectorAll: (): any[] => [],
    createElement: () => new FakeElement(),
    createDocumentFragment: () => new FakeElement(),
    body: new FakeElement(),
    documentElement: new FakeElement(),
    addEventListener: () => {},
    removeEventListener: () => {},
  }
}

if (!g.window) {
  g.window = {
    open: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb: (t: number) => void) => {
      cb(0)
      return 0
    },
    cancelAnimationFrame: () => {},
  }
}

// stats.ts wraps every access in try/catch, but provide a real in-memory store so
// later tasks can read back what a simulated run recorded if desired.
if (!g.localStorage) {
  const ls = new Map<string, string>()
  g.localStorage = {
    getItem: (k: string): string | null => (ls.has(k) ? ls.get(k)! : null),
    setItem: (k: string, v: string) => {
      ls.set(k, String(v))
    },
    removeItem: (k: string) => {
      ls.delete(k)
    },
    clear: () => {
      ls.clear()
    },
  }
}

export {}
