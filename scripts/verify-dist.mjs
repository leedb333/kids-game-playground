import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const base = process.env.BASE_PATH || '/kids-game-playground/'
const origin = 'https://example.invalid'
const html = readFileSync('dist/index.html', 'utf8')
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'))
for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], './', key)
const files = JSON.parse(readFileSync('dist/sw.js', 'utf8').match(/^const FILES = (.+)$/m)[1])
const cached = new Set(files)

assert.equal(cached.size, files.length)
assert.ok(cached.has('./'))
assert.ok(cached.has('./index.html'))
for (const file of files) {
  const url = new URL(file, origin + base)
  assert.equal(url.origin, origin)
  assert.ok(url.pathname.startsWith(base))
  if (file !== './') readFileSync(join('dist', url.pathname.slice(base.length)))
}
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert.ok(url.startsWith(base), url)
  assert.ok(cached.has('./' + url.slice(base.length)), url)
}
for (const icon of manifest.icons) assert.ok(cached.has('./' + icon.src), icon.src)

for (let level = 1; level <= 5; level++) {
  for (let image = 1; image <= 4; image++) {
    const path = `assets/puzzle/level-0${level}/L0${level}-0${image}.webp`
    assert.ok(cached.has('./' + path), path)
    assert.deepEqual(readFileSync(join('dist', path)), readFileSync(join('public', path)))
  }
}

const assets = readdirSync('dist/assets')
assert.ok(assets.every(file => !/^(coloring-v4|cooking-v2)$/.test(file)))
for (const file of assets.filter(file => /\.(js|css)$/.test(file))) assert.ok(cached.has('./assets/' + file))

for (const recipe of ['', 'kitchen/', 'burger/', 'cupcake/', 'icecream/']) {
  const notice = `prototypes/cooking-v2/${recipe}index.html`
  const body = readFileSync(join('dist', notice), 'utf8')
  assert.ok(body.includes('https://leedb333.github.io/kids-cooking-studio/'))
  assert.ok(!body.includes('<script') && !cached.has('./' + notice))
}
console.log(`Pages files and ${files.length} precache URLs verified for ${base}`)
