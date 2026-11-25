import { test, expect } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

const builds = process.env.PLAYGROUND_UPGRADE_BUILDS
const jigsawBaseline = process.env.PLAYGROUND_JIGSAW_BASELINE
const preSpotBaseline = process.env.PLAYGROUND_PRE_SPOT_BASELINE
const hasJigsaw = Boolean(preSpotBaseline || jigsawBaseline)
const cardCount = preSpotBaseline ? 4 : jigsawBaseline ? 3 : 5
const playground = '/kids-game-playground/'
const coloring = '/kids-coloring-studio/'
const cooking = '/kids-cooking-studio/'
const contentTypes: Record<string, string> = {
  '.json': 'application/json; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
}

test('an installed playground upgrades offline without touching independent apps', async ({ context }, info) => {
  test.skip(!builds, 'Supply the baseline and both independent production builds via PLAYGROUND_UPGRADE_BUILDS.')
  test.setTimeout(90_000)
  let upgraded = false
  const server = createServer(async (request, response) => {
    const path = new URL(request.url!, 'http://localhost').pathname
    const prefix = [playground, coloring, cooking].find(prefix => path.startsWith(prefix))
    if (!prefix) { response.writeHead(404).end(); return }
    const relative = path.slice(prefix.length)
    const root = prefix === playground ? upgraded ? resolve('dist') : resolve(preSpotBaseline || jigsawBaseline || resolve(builds!, 'baseline')) :
      resolve(builds!, prefix.slice(1, -1))
    const file = resolve(root, relative.endsWith('/') || !relative ? relative + 'index.html' : relative)
    if (!file.startsWith(root + '/')) { response.writeHead(404).end(); return }
    try {
      const bytes = await readFile(file)
      response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(bytes)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  try {
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing test server address')
    const origin = 'http://127.0.0.1:' + address.port
    const [old, art, food] = await Promise.all([context.newPage(), context.newPage(), context.newPage()])
    await old.goto(origin + playground)
    await expect(old.locator('.card')).toHaveCount(cardCount)
    await old.screenshot({ path: 'test-results/review/home-before.png', fullPage: true })
    const protectedValues = await old.evaluate(async includePuzzle => {
      const data: Record<string, string> = {}
      const prefix = 'kids-game-playground:v1:game:'
      for (const id of ['police-car-robot', 'fire-robot', 'baby-dinosaur', 'garden-butterfly'])
        data[prefix + 'coloring:' + id + ':r4'] = JSON.stringify({ version: 1, updatedAt: '2026-11-17T00:00:00Z', history: id === 'police-car-robot' ? ['v4-cell-006'] : [] })
      for (const id of ['pizza:prototype:r1', 'pizza:full:r1', 'burger:prototype:r1', 'cupcake:prototype:r1', 'cupcake:three:r2'])
        data[prefix + 'cooking-v2:' + id] = 'protected cooking fixture'
      data['kids-cooking-v2-icecream-v1'] = JSON.stringify({
        version: 1, container: 'cup', scoops: ['vanilla'], step: 2, completed: false, sound: false, toppings: [],
      })
      data[prefix + 'dressup:spring:r1'] = 'protected legacy fixture'
      if (includePuzzle) data[prefix + 'jigsaw-puzzle:L04-01:r2'] = JSON.stringify({
        version: 1, geometry: 2, imageId: 'L04-01', level: 4,
        rows: 4, columns: 5, pieceCount: 20, placed: [0],
        remaining: Array.from({ length: 19 }, (_, index) => index + 1), complete: false,
      })
      for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value)
      await navigator.serviceWorker.ready
      return data
    }, hasJigsaw)
    await old.waitForFunction(() => navigator.serviceWorker.controller)
    await art.goto(origin + coloring)
    await food.goto(origin + cooking)
    await expect(art.getByRole('heading', { name: '알록달록 색칠놀이터' })).toBeVisible()
    await expect(food.getByRole('heading', { name: /달콤한 요리놀이터/ })).toBeVisible()
    for (const page of [art, food]) await page.waitForFunction(() => navigator.serviceWorker.controller)

    const cacheInventory = () => art.evaluate(async (): Promise<Record<string, string[]>> => {
      const names = (await caches.keys()).sort()
      return Object.fromEntries(await Promise.all(names.map(async name => [
        name, (await (await caches.open(name)).keys()).map(request => request.url).sort(),
      ])))
    })
    const before = await cacheInventory()
    const oldCache = Object.keys(before).find(name => name.startsWith('kids-playground-' + origin + playground + '-'))!
    expect(before[oldCache].some(url => url.includes(hasJigsaw ? 'assets/puzzle' : 'cooking-v2'))).toBe(true)
    for (const root of ['kids-coloring-studio:', 'kids-cooking-studio:'])
      expect(Object.keys(before).some(name => name.startsWith(root))).toBe(true)

    upgraded = true
    await old.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update())
    await old.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.waiting)
    expect(await cacheInventory()).toHaveProperty([oldCache])
    await context.setOffline(true)
    await old.reload()
    await expect(old.locator('.card')).toHaveCount(cardCount)
    await old.getByRole('button', { name: '벽돌깨기', exact: true }).click()
    await expect(old.locator('.brick-game')).toBeVisible()
    await old.goto('about:blank')
    await old.close()

    // Poll names without opening a cache that activation may just have deleted.
    await expect.poll(() => art.evaluate(() => caches.keys()), { timeout: 20_000 }).not.toContain(oldCache)
    const next = await context.newPage()
    await next.goto(origin + playground)
    await expect(next.locator('.card')).toHaveCount(5)
    for (const [title, selector] of [['벽돌깨기', '.brick-game'], ['반짝반짝 짝꿍 카드', '.memory-game']]) {
      await next.getByRole('button', { name: title, exact: true }).click()
      await expect(next.locator(selector)).toBeVisible()
      if (!preSpotBaseline) await next.screenshot({ path: 'test-results/review/offline-' + selector.slice(1) + '.png', fullPage: true })
      await next.getByRole('button', { name: '홈으로 이동' }).click()
    }
    if (hasJigsaw) {
      await next.getByRole('button', { name: '그림 퍼즐 맞추기', exact: true }).click()
      await next.getByRole('button', { name: /^4단계/ }).click()
      await next.getByRole('button', { name: '이어하기' }).click()
      await expect(next.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 20')
      await expect(next.locator('[data-piece]')).toHaveCount(19)
      await expect.poll(() => next.evaluate(() => JSON.parse(
        localStorage.getItem('kids-game-playground:v1:game:jigsaw-puzzle:L04-01:r3') ?? '{}',
      ).geometry)).toBe(3)
      await next.getByRole('button', { name: '홈으로 이동' }).click()
    }
    await next.getByRole('button', { name: '출동! 소방차 미로', exact: true }).click()
    await next.getByRole('button', { name: '출동하기' }).click()
    await expect(next.locator('.maze-board')).toBeVisible()
    await next.getByRole('button', { name: '홈으로', exact: true }).click()
    await next.getByRole('button', { name: '찾아라! 다른 그림', exact: true }).click()
    await next.getByRole('button', { name: /동물 친구들의 놀이터/ }).click()
    await expect(next.locator('.spot-workspace')).toHaveAttribute('aria-hidden', 'false')
    await next.getByRole('button', { name: '홈으로', exact: true }).click()
    await next.screenshot({ path: "test-results/review/home-after.png", fullPage: true })
    const after = await cacheInventory()
    for (const [name, urls] of Object.entries(before)) {
      if (name !== oldCache) expect(after[name]).toEqual(urls)
    }
    const newCache = Object.keys(after).find(name => name.startsWith('kids-playground-' + origin + playground + '-'))!
    expect(after[newCache].every(url => !/cooking-v2|coloring-v4/.test(url))).toBe(true)
    const readProtected = () => next.evaluate(keys =>
      Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(protectedValues))
    expect(await readProtected()).toEqual(protectedValues)

    await art.reload()
    await art.getByRole('button', { name: /멋진 경찰차, .*색, 이어서 색칠하기/ }).click()
    await expect(art.locator('.coloring[data-drawing="police-car-robot"]')).toBeVisible()
    await expect(art.locator('[data-painted=true]')).toHaveAttribute('data-region', 'v4-cell-006')
    await food.goto(origin + cooking + 'prototypes/cooking-v2/icecream/')
    await expect(food.getByRole('heading', { name: /달콤한 아이스크림 가게/ })).toBeVisible()
    await expect(food.getByRole('button', { name: '바닐라' })).toBeEnabled({ timeout: 20_000 })
    await expect(food.locator('img[src*="scoop-vanilla"]').first()).toBeVisible()
    expect(await readProtected()).toEqual(protectedValues)
    const evidence = info.outputPath('upgrade-and-storage.json')
    await writeFile(evidence, JSON.stringify({
      previousPlaygroundCacheRemoved: !Object.hasOwn(after, oldCache),
      playgroundUrls: after[newCache].map(url => new URL(url).pathname),
      independentCaches: Object.entries(after)
        .filter(([name]) => !name.startsWith('kids-playground-'))
        .map(([name, urls]) => ({ name: name.split(':')[0], urls: urls.length })),
      protectedKeys: Object.keys(protectedValues),
      valuesUnchanged: true,
    }, null, 2) + '\n')
    await info.attach('upgrade-and-storage', { contentType: 'application/json', path: evidence })
  } finally {
    server.closeAllConnections()
    await new Promise<void>(done => server.close(() => done()))
  }
})
