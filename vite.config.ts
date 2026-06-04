import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

function copyGameAssets() {
  return {
    name: 'copy-game-assets',
    closeBundle() {
      const from = resolve(__dirname, 'assets')
      const to = resolve(__dirname, 'dist/assets')
      if (!existsSync(from)) return
      mkdirSync(to, { recursive: true })
      readdirSync(from).forEach((name) => {
        const target = resolve(to, name)
        rmSync(target, { force: true, recursive: true })
        cpSync(resolve(from, name), target, { recursive: true })
      })
    },
  }
}

export default defineConfig({
  plugins: [copyGameAssets()],
})
