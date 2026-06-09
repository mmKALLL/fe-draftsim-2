import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

// Inline the entry JS and CSS into index.html so the built file works when
// opened directly via file:// (browsers block external <script type=module>
// loads from a null origin). Images under assets/ stay external.
function inlineSingleFile(): Plugin {
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return {
    name: 'inline-single-file',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'))
      if (!html || html.type !== 'asset' || typeof html.source !== 'string') return
      let out = html.source
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          const code = file.code.replace(/<\/script>/g, '<\\/script>')
          out = out.replace(new RegExp(`<script[^>]*src="[^"]*${escapeRe(file.fileName)}"[^>]*></script>`), () => `<script type="module">${code}</script>`)
          delete bundle[file.fileName]
        } else if (file.type === 'asset' && file.fileName.endsWith('.css')) {
          const css = String(file.source)
          out = out.replace(new RegExp(`<link[^>]*href="[^"]*${escapeRe(file.fileName)}"[^>]*>`), () => `<style>${css}</style>`)
          delete bundle[file.fileName]
        }
      }
      out = out.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')
      html.source = out
    },
  }
}

function copyGameAssets(): Plugin {
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
  base: './',
  plugins: [inlineSingleFile(), copyGameAssets()],
})
