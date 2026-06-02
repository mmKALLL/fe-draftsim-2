import * as gameConstants from '../constants'
import * as gameData from '../data'
import utilsSource from './utils.js?raw'
import assetsSource from './assets.js?raw'
import unitsSource from './units.js?raw'
import combatSource from './combat.js?raw'
import stateSource from './state.ts?raw'
import biomesSource from './biomes.js?raw'
import renderSource from './render.js?raw'
import gameSource from './game.js?raw'
import rewardsSource from './rewards.js?raw'
import shopSource from './shop.js?raw'
import uiSource from './ui.js?raw'
import mainSource from './main.js?raw'

const runtimeGlobal = globalThis as typeof globalThis & {
  __fireRogueConstants: typeof gameConstants
  __fireRogueData: typeof gameData
}

runtimeGlobal.__fireRogueConstants = gameConstants
runtimeGlobal.__fireRogueData = gameData

const constantBindings = Object.keys(gameConstants)
  .map((name) => `const ${name} = globalThis.__fireRogueConstants[${JSON.stringify(name)}]`)
  .join('\n')

const dataBindings = Object.keys(gameData)
  .map((name) => `const ${name} = globalThis.__fireRogueData[${JSON.stringify(name)}]`)
  .join('\n')

const scripts = [
  ['constants.ts', constantBindings],
  ['data.ts', dataBindings],
  ['src/utils.js', utilsSource],
  ['src/assets.js', assetsSource],
  ['src/units.js', unitsSource],
  ['src/combat.js', combatSource],
  ['src/state.ts', stateSource],
  ['src/biomes.js', biomesSource],
  ['src/render.js', renderSource],
  ['src/game.js', gameSource],
  ['src/rewards.js', rewardsSource],
  ['src/shop.js', shopSource],
  ['src/ui.js', uiSource],
  ['src/main.js', mainSource],
] as const

const runtimeSource = `${scripts.map(([name, source]) => `// ${name}\n${source}`).join('\n\n')}

Object.assign(globalThis, { assetFallback, assetSheetLoaded, closeModal })
//# sourceURL=fire-rogue-runtime.js`

new Function('globalThis', runtimeSource)(globalThis)
