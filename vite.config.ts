import { defineConfig, Plugin } from 'vite'
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, rmSync, cpSync } from 'fs'
import { resolve, extname } from 'path'

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

// Inline every game image as a base64 data URI under window.__IMG, so the built
// page works fully offline (and from file://) with zero network image requests.
// assets/femp-backup is not walked, so it stays excluded.
function inlineImageManifest(): Plugin {
  const MIME: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }
  const walk = (dir: string, baseDir: string, out: Record<string, string>): Record<string, string> => {
    if (!existsSync(dir)) return out
    readdirSync(dir).forEach((file) => {
      const filePath = resolve(dir, file)
      if (statSync(filePath).isDirectory()) {
        walk(filePath, baseDir, out)
      } else {
        const mime = MIME[extname(file).toLowerCase()]
        if (mime) {
          const key = filePath.replace(baseDir + '/', '') // e.g. assets/femp/portraits/lyn.png
          out[key] = `data:${mime};base64,${readFileSync(filePath).toString('base64')}`
        }
      }
    })
    return out
  }
  return {
    name: 'inline-image-manifest',
    transformIndexHtml(html) {
      const projectRoot = resolve(__dirname)
      const manifest = walk(resolve(projectRoot, 'assets/femp'), projectRoot, {})
      const tag = `<script>window.__IMG=${JSON.stringify(manifest)}</script>`
      return html.replace('</head>', `  ${tag}\n  </head>`)
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
  plugins: [inlineSingleFile(), inlineImageManifest(), copyGameAssets()],
})
