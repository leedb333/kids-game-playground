import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
const base = process.env.BASE_PATH || '/kids-game-playground/'
const html = readFileSync('dist/index.html', 'utf8')
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'))
const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1])
for (const url of urls) {
  if (!url.startsWith(base)) throw new Error(`Unexpected asset path: ${url}`)
  if (!existsSync(resolve('dist', url.slice(base.length)))) throw new Error(`Missing asset: ${url}`)
}
for (const file of ['sw.js', 'icon-192.png', 'icon-512.png']) {
  if (!existsSync(resolve('dist', file))) throw new Error(`Missing offline/install file: ${file}`)
}
if (manifest.start_url !== './' || manifest.scope !== './') throw new Error('Manifest must stay inside repository path')
console.log(`Pages files verified for ${base}`)
