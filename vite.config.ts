import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const installFiles = ['icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest']

function offline(): Plugin {
  return {
    name: 'playground-offline',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const files = ['./', ...[...Object.keys(bundle), ...installFiles].map(file => './' + file)]
        const worker = readFileSync('scripts/service-worker.js', 'utf8')
        const hash = createHash('sha256').update(worker).update(JSON.stringify(files))
        for (const file of installFiles) hash.update(readFileSync('public/' + file))
        for (const item of Object.values(bundle)) hash.update(item.type === 'chunk' ? item.code : item.source)
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: `const FILES = ${JSON.stringify(files)}
const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 16))}
${worker}`,
        })
      },
    },
  }
}

export default defineConfig({
  base: process.env.BASE_PATH || '/kids-game-playground/',
  plugins: [react(), offline()],
})
