import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { pictureFiles, pictures, type Picture } from '../src/games/spot-the-difference/catalog'
import { pictureCacheName } from '../src/games/spot-the-difference/picture-loader'
import { answerAt, contains, display, parseData, regionBounds, touch, type Point, type Region, type Side } from '../src/games/spot-the-difference/model'

const picture = pictures.find(picture => picture.id === 'D01')!
const paths = pictureFiles(picture.id)
const raw = JSON.parse(readFileSync('public/' + paths.data, 'utf8'))
const data = parseData(raw, picture)
const sides = ['original', 'modified'] as const
const key = 'kids-game-playground:v1:game:spot-the-difference:r1:D01'
const evidence = 'test-results/spot-the-difference'
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const frame = (page: Page, side: Side) => page.locator(`[data-side="${side}"] .spot-view`)
const marks = (page: Page) => page.locator('.spot-mark')
const score = (page: Page) => page.locator('.spot-progress [role=status]')

function midpoint(region: Region): Point {
  const b = regionBounds(region)
  const center: Point = [(b.left + b.right) / 2, (b.top + b.bottom) / 2]
  if (contains(region, center)) return center
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) {
    const p: Point = [b.left + (b.right - b.left) * i / 20, b.top + (b.bottom - b.top) * j / 20]
    if (contains(region, p)) return p
  }
  throw Error('Region has no interior')
}

async function screen(page: Page, side: Side, point: Point) {
  const image = (await frame(page, side).locator('img').boundingBox())!
  return { x: image.x + point[0] * image.width, y: image.y + point[1] * image.height }
}
async function tap(page: Page, side: Side, point: Point) {
  const { x, y } = await screen(page, side, point)
  await page.touchscreen.tap(x, y)
}
async function start(page: Page) {
  await page.getByRole('button', { name: /동물 친구들의 놀이터/ }).tap()
  await expect(page.locator('.spot-workspace')).toHaveAttribute('aria-hidden', 'false')
}
async function gallery(page: Page) {
  await button(page, '찾아라! 다른 그림').tap()
  await expect(page.getByRole('heading', { name: '그림을 골라요' })).toBeVisible()
}
async function capture(page: Page, name: string) {
  await page.screenshot({ path: evidence + '/' + name + '.png' })
}

test('D01 uploaded binary, schema, shapes, boundaries and reusable 6–10 count', () => {
  const hashes = {
    data: '12ef6de975cf886a8497c9f9897e4c09f5011be3e4d4f3fb995daa47b48bb26b',
    original: '9b2eb27638df9f0112c56883b29c167145ffd99c43d736d5a4444c967e0d8514',
    modified: '1977777eaa4a18ab80c56b165d981fda40eb8b6b38f37d9e10877d5d8c793d31',
    thumb: 'ab8316d1ed0a4dea6eb7e0c40c20d4d0dfbcfdd4197e612d9f40b872e8c8b47c',
  }
  for (const [name, path] of Object.entries(paths)) {
    const bytes = readFileSync('public/' + path)
    expect(createHash('sha256').update(bytes).digest('hex')).toEqual(hashes[name as keyof typeof hashes])
    if (name !== 'data') expect(bytes.toString('ascii', 12, 16)).toBe('VP8L')
  }
  expect(data.answers.map(answer => answer.id)).toEqual(Array.from({ length: 7 }, (_, i) => 'D01-0' + (i + 1)))
  expect(data.answers[3].originalTouchRegion.shape).toBe('polygon')
  expect(contains(data.answers[3].originalTouchRegion, (data.answers[3].originalTouchRegion as { points: Point[] }).points[0])).toBe(true)
  expect(contains({ shape: 'circle', cx: .5, cy: .5, r: .2 }, [.7, .5])).toBe(true)
  expect(contains({ shape: 'circle', cx: .5, cy: .5, r: .2 }, [.701, .5])).toBe(false)
  expect(answerAt(data.answers, 'original', [-.01, .2])).toBeUndefined()
  const ball = data.answers.at(-1)!
  expect(touch(ball, 'original')).not.toEqual(touch(ball, 'modified'))
  expect(display(ball, 'original')).not.toEqual(display(ball, 'modified'))
  expect(answerAt(data.answers, 'original', [.5, .71])?.id).toBe(ball.id)
  expect(answerAt(data.answers, 'modified', [.5, .71])).toBeUndefined()
  for (const side of sides) {
    const regions = data.answers.map(answer => {
      const shape = touch(answer, side)
      return { shape, b: regionBounds(shape) }
    })
    let multiple = 0
    for (let y = 0; y < 1254; y++) for (let x = 0; x < 1254; x++) {
      const point: Point = [x / 1254, y / 1254]
      let hits = 0
      for (const { shape, b } of regions) {
        if (point[0] >= b.left && point[0] <= b.right && point[1] >= b.top && point[1] <= b.bottom && contains(shape, point)) hits++
      }
      if (hits > 1) multiple++
    }
    expect(multiple).toBe(0)
  }
  expect(() => parseData({ ...raw, answers: [{ ...raw.answers[0], originalTouchRegion: { shape: 'ellipse', cx: 2 } }, ...raw.answers.slice(1)] }, picture)).toThrow()
  for (const count of [6, 7, 8, 9, 10]) {
    const answers = Array.from({ length: count }, (_, i) => ({ ...raw.answers[i % 7], id: 'test-' + i }))
    expect(parseData({ ...raw, differenceCount: count, answers }, { ...picture, count }).answers).toHaveLength(count)
  }
})

test('gallery requests thumbnail only, gates input on both decodes, and safely retries loading', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true, serviceWorkers: 'block' })
  try {
    const page = await context.newPage()
    const requests: string[] = []
    page.on('request', request => { if (request.url().includes('/assets/spot-the-difference/')) requests.push(request.url()) })
    await page.goto('./')
    await gallery(page)
    await expect.poll(() => page.locator('.spot-card img[src$="D01-thumbnail.webp"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(384)
    await expect.poll(() => requests.map(url => url.split('/').at(-1)).sort()).toEqual(
      pictures.map(picture => picture.id + '-thumbnail.webp').sort(),
    )
    await expect(page.locator('.spot-card-main')).toHaveCount(10)
    await page.route('**/D01-modified.webp', route => route.abort())
    await page.getByRole('button', { name: /동물 친구들의 놀이터/ }).tap()
    await expect(page.getByRole('alert')).toHaveText('그림을 열지 못했어요.')
    await expect(page.locator('.spot-workspace')).toHaveAttribute('aria-hidden', 'true')
    await page.unroute('**/D01-modified.webp')
    await button(page, '다시 불러오기').tap()
    await expect(page.locator('.spot-workspace')).toHaveAttribute('aria-hidden', 'false')
    expect(await page.locator('.spot-layer img').evaluateAll(images => images.map(image => [(image as HTMLImageElement).naturalWidth, (image as HTMLImageElement).naturalHeight])))
      .toEqual([[1254, 1254], [1254, 1254]])
    expect(requests.some(url => url.endsWith('/D01.json'))).toBe(true)
  } finally { await context.close() }
})

for (const side of sides) {
  test('all seven answers, overlays and completion from ' + side, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('./')
    if (side === 'original') await capture(page, '01-home')
    await gallery(page)
    if (side === 'original') await capture(page, '02-gallery-and-pending')
    await start(page)
    if (side === 'original') await capture(page, '04-first-play')
    await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
    await tap(page, side, [.48, .93])
    await expect(page.locator('.spot-miss')).toHaveCount(1)
    await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
    await expect(page.locator('.spot-miss')).toHaveCount(0)
    await button(page, '힌트').tap()
    await expect(page.locator('.spot-hint')).toHaveCount(2)
    if (side === 'original') await capture(page, '07-hint')
    await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
    await expect(page.locator('.spot-hint')).toHaveCount(0)
    for (const [i, answer] of data.answers.entries()) {
      await tap(page, side, midpoint(touch(answer, side)))
      await expect(score(page)).toHaveText(`${i + 1} / 7개 찾았어요!`)
      await expect(marks(page)).toHaveCount((i + 1) * 2)
      for (const image of sides) {
        const shape = page.locator(`[data-side="${image}"] [data-answer="${answer.id}"]`)
        const region = display(answer, image)
        expect(await shape.evaluate(node => node.tagName)).toBe(region.shape)
        if (region.shape === 'ellipse') await expect(shape).toHaveAttribute('rx', String(region.rx))
        if (region.shape === 'polygon') await expect(shape).toHaveAttribute('points', region.points.map(p => p.join(',')).join(' '))
      }
      if (i === 0) {
        await tap(page, side === 'original' ? 'modified' : 'original', midpoint(touch(answer, side)))
        await expect(score(page)).toHaveText('1 / 7개 찾았어요!')
        if (side === 'original') await capture(page, '05-one-found')
      }
      if (i === 3 && side === 'original') await capture(page, '06-several-found')
    }
    if (side === 'original') await capture(page, '11-all-found')
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
    expect(saved).toMatchObject({ found: data.answers.map(a => a.id), completedEver: true })
    await expect(page.getByRole('heading', { name: '모두 찾았어요!' })).toBeVisible()
    if (side === 'original') await capture(page, '12-complete')
    await button(page, '다시 하기').tap()
    await expect(page.getByRole('button', { name: /다시 도전/ })).toBeVisible()
    if (side === 'original') await capture(page, '13-back-and-15-replay')
    await start(page)
    await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).completedEver, key)).toBe(true)
    await button(page, '홈으로').tap()
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  })
}

test('synced zoom, pan, tap, multitouch cancel and viewport measurements', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')
  await gallery(page)
  await start(page)
  const measures = []
  for (const [name, width, height] of [
    ['tablet', 1280, 800], ['tablet-short', 1280, 720], ['phone-landscape', 800, 360], ['phone-portrait', 360, 800],
  ] as const) {
    await page.setViewportSize({ width, height })
    const a = (await frame(page, 'original').boundingBox())!, b = (await frame(page, 'modified').boundingBox())!
    const tools = (await page.locator('.spot-tools').boundingBox())!
    expect(a.width).toBeCloseTo(b.width, 1)
    expect(a.height).toBeCloseTo(a.width, 1)
    expect(b.height).toBeCloseTo(b.width, 1)
    expect(b.y + b.height).toBeLessThanOrEqual(height)
    expect(tools.y + tools.height).toBeLessThanOrEqual(height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const buttons = await page.locator('.spot-tools button').evaluateAll(nodes => nodes.map(node => {
      const { width, height } = node.getBoundingClientRect()
      return [width, height]
    }))
    expect(buttons.every(([w, h]) => w >= 48 && h >= 48)).toBe(true)
    const areas = data.answers.map(answer => Object.fromEntries(sides.map(side => {
      const sizes = [touch(answer, side), display(answer, side)].map(region => {
        const bounds = regionBounds(region)
        return [(bounds.right - bounds.left) * a.width, (bounds.bottom - bounds.top) * a.height]
      })
      return [side, { touch: sizes[0], display: sizes[1] }]
    })))
    measures.push({ name, viewport: [width, height], picture: [a.width, a.height],
      layout: b.y > a.y + a.height ? 'stack' : 'row', gap: b.y > a.y + a.height ? b.y - a.y - a.height : b.x - a.x - a.width,
      panel: [tools.width, tools.height], buttons, areas })
    if (name.startsWith('phone')) await capture(page, name)
  }
  mkdirSync(evidence, { recursive: true })
  writeFileSync(evidence + '/measurements.json', JSON.stringify(measures, null, 2) + '\n')
  await page.setViewportSize({ width: 1280, height: 800 })
  const zoom = page.getByRole('button', { name: /확대·축소/ })
  await zoom.tap()
  await expect(zoom).toContainText('1.5배')
  await capture(page, '08-one-half')
  await zoom.tap()
  await expect(zoom).toContainText('2배')
  await capture(page, '09-two')
  const a = (await frame(page, 'modified').boundingBox())!
  await page.mouse.move(a.x + a.width * .48, a.y + a.height * .32)
  await page.mouse.down()
  await page.mouse.move(a.x + a.width * .48, a.y + a.height * .86, { steps: 7 })
  await page.mouse.up()
  await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
  await expect(page.locator('.spot-miss')).toHaveCount(0)
  const transforms = await page.locator('.spot-layer').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).style.transform))
  expect(transforms[0]).toEqual(transforms[1])
  expect(transforms[0]).toMatch(/, 0%\) scale\(2\)/)
  await capture(page, '10-synced-pan')
  await tap(page, 'original', midpoint(touch(data.answers[2], 'original')))
  await expect(marks(page)).toHaveCount(2)
  await capture(page, '24-zoom-mark')
  await page.setViewportSize({ width: 360, height: 800 })
  await expect(zoom).toContainText('2배')
  await expect(marks(page)).toHaveCount(2)
  await zoom.tap()
  await expect(zoom).toContainText('1배')
  expect(await page.locator('.spot-layer').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).style.transform)))
    .toEqual(['translate(0%, 0%) scale(1)', 'translate(0%, 0%) scale(1)'])
  const first = await screen(page, 'original', midpoint(touch(data.answers[1], 'original')))
  const other = await screen(page, 'modified', midpoint(touch(data.answers[4], 'modified')))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...first, id: 1 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...first, id: 1 }, { ...other, id: 2 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await expect(score(page)).toHaveText('1 / 7개 찾았어요!')
  await tap(page, 'original', midpoint(touch(data.answers[1], 'original')))
  await expect(score(page)).toHaveText('2 / 7개 찾았어요!')
})

test('per picture resume, reset confirmation, damaged storage and other games protection', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')
  const sentinels = [
    'game:bricks:r1', 'game:memory-card:r1', 'game:jigsaw-puzzle:L01-01:r3', 'game:firetruck-maze:r2',
    'game:coloring:police-car-robot:r4', 'game:cooking-v2:pizza:full:r1', 'game:spot-the-difference:r1:D02',
  ].map(key => 'kids-game-playground:v1:' + key)
  await page.evaluate(keys => keys.forEach(key => localStorage.setItem(key, 'retain')), sentinels)
  await gallery(page)
  await start(page)
  await tap(page, 'original', midpoint(touch(data.answers[0], 'original')))
  await button(page, '그림 선택').tap()
  await expect(page.getByRole('button', { name: /이어하기/ })).toBeVisible()
  await capture(page, '14-resume')
  await button(page, '새로 시작하기').tap()
  await button(page, '취소').tap()
  await button(page, '홈으로 이동').tap()
  await page.reload()
  await gallery(page)
  await start(page)
  await expect(score(page)).toHaveText('1 / 7개 찾았어요!')
  await expect(marks(page)).toHaveCount(2)
  await button(page, '그림 선택').tap()
  await button(page, '새로 시작하기').tap()
  await page.getByRole('dialog').getByRole('button', { name: '새로 시작하기' }).tap()
  await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
  expect(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), sentinels)).toEqual(sentinels.map(() => 'retain'))
  await button(page, '홈으로').tap()
  await page.evaluate(key => localStorage.setItem(key, '{"broken"'), key)
  await gallery(page)
  await start(page)
  await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
})

test('all four D01 assets precached and newly controlled session plays offline', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  const cached = await page.evaluate(async paths => {
    const scope = (await navigator.serviceWorker.getRegistration())!.scope
    return Promise.all(paths.map(async path => (await caches.match(scope + path))?.ok))
  }, Object.values(paths))
  expect(cached).toEqual([true, true, true, true])
  await context.setOffline(true)
  await page.reload()
  await gallery(page)
  await expect.poll(() => page.locator('.spot-card img[src$="D01-thumbnail.webp"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(384)
  await start(page)
  await tap(page, 'modified', midpoint(touch(data.answers[6], 'modified')))
  await expect(score(page)).toHaveText('1 / 7개 찾았어요!')
})

test('audit actual changed pixels and draw both touch and display overlays for review', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')
  await gallery(page)
  await start(page)
  const counts = await page.locator('.spot-layer img').evaluateAll((images, boxes: number[][]) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1254
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const rgba = images.map(img => {
      ctx.clearRect(0, 0, 1254, 1254)
      ctx.drawImage(img as HTMLImageElement, 0, 0)
      return ctx.getImageData(0, 0, 1254, 1254).data
    })
    let outside = 0
    const each = boxes.map(() => 0)
    for (let i = 0; i < rgba[0].length; i += 4) {
      if ([0, 1, 2, 3].every(n => rgba[0][i + n] === rgba[1][i + n])) continue
      const p = i / 4, x = p % 1254 / 1254, y = Math.floor(p / 1254) / 1254
      const box = boxes.findIndex(([l, t, r, b]) => x >= l && x <= r && y >= t && y <= b)
      if (box === -1) outside++
      else each[box]++
    }
    return { outside, each }
  }, raw.answers.map((answer: { editRegion: { boundingBox: number[] } }) => answer.editRegion.boundingBox))
  expect(counts.outside).toBe(0)
  expect(counts.each.every(pixels => pixels > 0)).toBe(true)
  mkdirSync(evidence, { recursive: true })
  writeFileSync(evidence + '/pixels.json', JSON.stringify(counts, null, 2) + '\n')
  for (const mode of ['touch', 'display'] as const) {
    await page.locator('.spot-layer svg').evaluateAll((layers, shapes) => {
      const ns = 'http://www.w3.org/2000/svg'
      layers.forEach((layer, i) => {
        layer.replaceChildren()
        shapes[i].forEach((region, id) => {
          const el = document.createElementNS(ns, region.shape)
          if (region.shape === 'polygon') el.setAttribute('points', region.points.map(p => p.join(',')).join(' '))
          else for (const [key, value] of Object.entries(region)) if (key !== 'shape') el.setAttribute(key, String(value))
          el.setAttribute('fill', '#42d4fd33')
          el.setAttribute('stroke', '#193c79')
          el.setAttribute('stroke-width', '3')
          el.setAttribute('vector-effect', 'non-scaling-stroke')
          layer.append(el)
          const b = (el as SVGGraphicsElement).getBBox()
          const label = document.createElementNS(ns, 'text')
          label.textContent = String(id + 1)
          label.setAttribute('x', String(b.x + b.width / 2))
          label.setAttribute('y', String(b.y + b.height / 2))
          label.setAttribute('font-size', '.033')
          label.setAttribute('text-anchor', 'middle')
          label.setAttribute('fill', '#142f64')
          label.setAttribute('stroke', '#fff')
          label.setAttribute('stroke-width', '.004')
          label.setAttribute('paint-order', 'stroke')
          layer.append(label)
        })
      })
    }, sides.map(side => data.answers.map(answer => mode === 'touch' ? touch(answer, side) : display(answer, side))))
    await capture(page, 'audit-' + mode)
  }
})

test('native touch pans both zoomed pictures and can scroll the page at 1×', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 440 })
  await page.goto('./')
  await gallery(page)
  await start(page)
  const cdp = await context.newCDPSession(page)
  const first = frame(page, 'original')
  await first.scrollIntoViewIfNeeded()
  const getTransforms = () => page.locator('.spot-layer').evaluateAll(nodes =>
    nodes.map(node => (node as HTMLElement).style.transform),
  )
  async function swipe(from: number, to: number) {
    const box = (await first.boundingBox())!
    const x = box.x + box.width * .5
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: box.y + box.height * from }] })
    for (let i = 1; i <= 8; i++) {
      const y = box.y + box.height * (from + (to - from) * i / 8)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] })
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  const scroll = () => page.evaluate(() => scrollY)
  const before = await scroll()
  await swipe(.83, .17)
  await expect.poll(scroll).toBeGreaterThan(before)
  await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
  await expect(page.locator('.spot-miss')).toHaveCount(0)

  await page.getByRole('button', { name: /확대·축소/ }).tap()
  await first.scrollIntoViewIfNeeded()
  const [centered] = await getTransforms()
  await swipe(.25, .75)
  const [original, modified] = await getTransforms()
  expect(original).not.toBe(centered)
  expect(original).toBe(modified)
  await expect(score(page)).toHaveText('0 / 7개 찾았어요!')
  await expect(page.locator('.spot-miss')).toHaveCount(0)
})

const finalEvidence = 'test-results/spot-v2'
const contents = pictures.map(entry => ({ entry, data: parseData(
  JSON.parse(readFileSync('public/' + pictureFiles(entry.id).data, 'utf8')), entry,
) }))
const playing = (page: Page) => expect(page.locator('.spot-workspace')).toHaveAttribute('aria-hidden', 'false')

function card(page: Page, entry: Picture) {
  return page.getByRole('button', { name: new RegExp(entry.title) })
}

async function review(page: Page, name: string) {
  await page.screenshot({ path: finalEvidence + '/' + name + '.png' })
}

function countText(found: number, count: number) {
  return `${found} / ${count}개 찾았어요!`
}

test('final inventory has all 80 answers and 160 independent normalized hit cases', () => {
  expect(pictures.map(entry => entry.id)).toEqual(['D02', 'D03', 'D01', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10'])
  expect(pictures.map(entry => entry.count)).toEqual([6, 6, 7, 7, 8, 8, 9, 9, 10, 10])
  expect(pictures.every(entry => entry.enabled)).toBe(true)
  expect(pictures.filter(entry => entry.offline).map(entry => entry.id)).toEqual(['D01'])
  const ids = contents.flatMap(({ data }) => data.answers.map(answer => answer.id))
  expect(ids).toHaveLength(80)
  expect(new Set(ids).size).toBe(80)
  let pairs = 0, hits = 0, bytes = 0
  const report = []
  for (const { entry, data } of contents) {
    const files = Object.values(pictureFiles(entry.id))
    const hashes = Object.fromEntries(files.map(path => {
      const file = readFileSync('public/' + path)
      bytes += file.length
      if (path.endsWith('.webp')) expect(file.toString('ascii', 12, 16)).toBe('VP8L')
      return [path, createHash('sha256').update(file).digest('hex')]
    }))
    for (const side of sides) {
      const regions = data.answers.map(answer => touch(answer, side))
      for (const [i, region] of regions.entries()) {
        const coordinates = midpoint(region)
        expect(answerAt(data.answers, side, coordinates)?.id).toBe(data.answers[i].id)
        hits++
        const a = regionBounds(region)
        for (const other of regions.slice(i + 1)) {
          pairs++
          const b = regionBounds(other)
          const left = Math.ceil(1254 * Math.max(a.left, b.left)), right = Math.floor(1254 * Math.min(a.right, b.right))
          const top = Math.ceil(1254 * Math.max(a.top, b.top)), bottom = Math.floor(1254 * Math.min(a.bottom, b.bottom))
          let overlap = false
          for (let x = left; x <= right && !overlap; x++) for (let y = top; y <= bottom && !overlap; y++) {
            const point: Point = [x / 1254, y / 1254]
            overlap = contains(region, point) && contains(other, point)
          }
          expect(overlap, `${entry.id} ${side} ${i}`).toBe(false)
        }
      }
    }
    report.push({ id: entry.id, title: entry.title, count: entry.count, modelHits: entry.count * 2, hashes })
  }
  expect(pairs).toBe(580)
  expect(hits).toBe(160)
  expect(bytes).toBe(55_361_562)
  mkdirSync(finalEvidence, { recursive: true })
  writeFileSync(finalEvidence + '/asset-audit.json', JSON.stringify(report, null, 2) + '\n')
})

test.describe('new content browser touches', () => {
  test.describe.configure({ mode: 'parallel' })
  test.use({ serviceWorkers: 'block' })
  for (const { entry, data } of contents.filter(item => item.entry.id !== 'D01')) for (const side of sides) {
    test(`${entry.id} ${side} recognizes and completes all ${entry.count} using real touch input`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('./')
      await gallery(page)
      await card(page, entry).tap()
      await playing(page)
      expect(await page.locator('.spot-layer img').evaluateAll(images => images.map(image => {
        const img = image as HTMLImageElement
        return [img.naturalWidth, img.naturalHeight]
      }))).toEqual([[1254, 1254], [1254, 1254]])
      await expect(score(page)).toHaveText(countText(0, entry.count))
      if (side === 'original' && ['D02', 'D05', 'D10'].includes(entry.id)) await review(page, `play-${entry.count}`)
      await button(page, '힌트').tap()
      await expect(page.locator('.spot-hint')).toHaveCount(2)
      await expect(score(page)).toHaveText(countText(0, entry.count))
      for (const [i, answer] of data.answers.entries()) {
        await expect(page.getByRole('heading', { name: '모두 찾았어요!' })).toHaveCount(0)
        await tap(page, side, midpoint(touch(answer, side)))
        await expect(score(page)).toHaveText(countText(i + 1, entry.count))
        for (const image of sides) {
          const marker = page.locator(`[data-side="${image}"] [data-answer="${answer.id}"]`)
          const expected = display(answer, image)
          expect(await marker.evaluate(node => node.tagName)).toBe(expected.shape)
          const attributes = expected.shape === 'polygon' ? { points: expected.points.map(p => p.join(',')).join(' ') } :
            expected.shape === 'ellipse' ? { cx: expected.cx, cy: expected.cy, rx: expected.rx, ry: expected.ry } :
              { cx: expected.cx, cy: expected.cy, r: expected.r }
          for (const [name, value] of Object.entries(attributes)) await expect(marker).toHaveAttribute(name, String(value))
        }
        if (i === 0) {
          const opposite = side === 'original' ? 'modified' : 'original'
          await tap(page, opposite, midpoint(touch(answer, opposite)))
          await expect(score(page)).toHaveText(countText(1, entry.count))
        }
        if (entry.id === 'D05' && side === 'original' && i === 3) await review(page, 'new-answers')
      }
      await expect(button(page, '힌트')).toBeDisabled()
      await expect(page.getByRole('heading', { name: '모두 찾았어요!' })).toBeVisible()
      if (entry.id === 'D10' && side === 'original') await review(page, 'complete')
      await button(page, '다시 하기').tap()
      await expect(card(page, entry)).toContainText('다시 도전')
      await button(page, '홈으로 이동').tap()
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    })
  }
})

test('D01 pilot storage and D02 progress survive reorder, reload and a D02-only reset', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')
  const legacy = { imageId: 'D01', dataVersion: 'D01-1.0.0', total: 7, found: ['D01-01'], completedEver: false }
  await page.evaluate(({ key, legacy }) => localStorage.setItem(key, JSON.stringify(legacy)), { key, legacy })
  await gallery(page)
  const other = contents.find(item => item.entry.id === 'D02')!
  await card(page, other.entry).tap()
  await playing(page)
  for (const answer of other.data.answers.slice(0, 2))
    await tap(page, 'modified', midpoint(touch(answer, 'modified')))
  await button(page, '그림 선택').tap()
  await expect(card(page, picture)).toContainText('1 / 7개 발견')
  await expect(card(page, other.entry)).toContainText('2 / 6개 발견')
  await review(page, 'independent-progress')
  await button(page, '홈으로 이동').tap()
  await page.reload()
  await gallery(page)
  await card(page, picture).tap()
  await playing(page)
  await expect(score(page)).toHaveText(countText(1, 7))
  await expect(marks(page)).toHaveCount(2)
  await button(page, '그림 선택').tap()
  await card(page, other.entry).tap()
  await playing(page)
  await expect(score(page)).toHaveText(countText(2, 6))
  await button(page, '그림 선택').tap()
  await page.locator('.spot-card').filter({ has: card(page, other.entry) }).getByRole('button', { name: '새로 시작하기' }).tap()
  await page.getByRole('dialog').getByRole('button', { name: '새로 시작하기' }).tap()
  await playing(page)
  await expect(score(page)).toHaveText(countText(0, 6))
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(legacy)
})

test('D09 zoom and hint follow both sides across phone rotation and exact touch hit', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 360 })
  await page.goto('./')
  await gallery(page)
  const { entry, data } = contents.find(item => item.entry.id === 'D09')!
  await card(page, entry).tap()
  await playing(page)
  await review(page, 'phone-landscape')
  const zoom = page.getByRole('button', { name: /확대·축소/ })
  await zoom.tap()
  await zoom.tap()
  const view = (await frame(page, 'original').boundingBox())!
  const p = midpoint(touch(data.answers[0], 'original'))
  await page.mouse.move(view.x + view.width * .2, view.y + view.height * .2)
  await page.mouse.down()
  await page.mouse.move(view.x + view.width * .77, view.y + view.height * .77, { steps: 6 })
  await page.mouse.up()
  await button(page, '힌트').tap()
  await expect(page.locator('.spot-hint')).toHaveCount(2)
  await review(page, 'zoom-hint')
  await tap(page, 'modified', p)
  await expect(score(page)).toHaveText(countText(1, 10))
  await expect(marks(page)).toHaveCount(2)
  await page.setViewportSize({ width: 360, height: 800 })
  await expect(zoom).toContainText('2배')
  await expect(score(page)).toHaveText(countText(1, 10))
  await expect(marks(page)).toHaveCount(2)
  const transformations = await page.locator('.spot-layer').evaluateAll(nodes => nodes.map(node => (node as HTMLElement).style.transform))
  expect(transformations[0]).toEqual(transformations[1])
  await zoom.tap()
  await expect(zoom).toContainText('1배')
  await review(page, 'phone-portrait')
})

test('precache only D01 and all thumbs, retain only played sets for offline use and measure storage', async ({ page, context }) => {
  test.setTimeout(95_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  const requested: string[] = []
  page.on('request', request => {
    if (request.url().includes('/assets/spot-the-difference/')) requested.push(request.url())
  })
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  const scope = page.url()
  const runtime = pictureCacheName(scope)
  const initial = await page.evaluate(async scope => {
    const key = (await caches.keys()).find(name => name.startsWith('kids-playground-' + scope) && /[a-f0-9]{16}$/.test(name))!
    const cache = await caches.open(key)
    const urls = await cache.keys()
    const sizes = await Promise.all(urls.map(async request => [request.url.slice(scope.length), (await (await cache.match(request, { ignoreVary: true }))!.blob()).size] as const))
    return Object.fromEntries(sizes)
  }, scope)
  expect(Object.keys(initial).filter(path => path.includes('spot-the-difference')).sort()).toEqual([
    ...Object.values(paths), ...pictures.filter(entry => entry.id !== 'D01').map(entry => pictureFiles(entry.id).thumb),
  ].sort())
  const initialBytes = Object.values(initial).reduce((sum, bytes) => sum + bytes, 0)
  await gallery(page)
  await expect(page.locator('.spot-card-main strong')).toHaveText(pictures.map(entry => entry.title))
  await expect.poll(() => page.locator('.spot-card img').evaluateAll(nodes => nodes.map(img => (img as HTMLImageElement).naturalWidth))).toEqual(Array(10).fill(384))
  const cards = await page.locator('.spot-card').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }))
  expect(new Set(cards.map(c => c.y)).size).toBe(2)
  expect(new Set(cards.map(c => c.w)).size).toBe(1)
  expect(new Set(cards.map(c => c.h)).size).toBe(1)
  expect(requested.every(url => url.endsWith('-thumbnail.webp'))).toBe(true)
  await review(page, 'gallery')
  const d02 = pictures[0]
  const staleUrl = scope + pictureFiles(d02.id).data + '?v=previous'
  await page.evaluate(async ([name, url]) => {
    await (await caches.open(name)).put(url, new Response('{}'))
  }, [runtime, staleUrl])
  await context.setOffline(true)
  await card(page, d02).tap()
  await expect(page.getByRole('alert')).toHaveText('인터넷에 연결하면 이 그림을 할 수 있어요.')
  await review(page, 'offline-not-downloaded')
  await button(page, '그림 선택').tap()
  await context.setOffline(false)

  const names = () => page.evaluate(async name => (await (await caches.open(name)).keys()).map(request => request.url), runtime)
  for (const [i, entry] of pictures.filter(entry => !entry.offline).entries()) {
    const offset = requested.length
    await card(page, entry).tap()
    await playing(page)
    const paths = pictureFiles(entry.id)
    expect(requested.slice(offset).sort()).toEqual([paths.data, paths.original, paths.modified]
      .map(path => scope + path + '?v=' + entry.version).sort())
    await expect.poll(async () => (await names()).length).toBe((i + 1) * 3)
    await button(page, '그림 선택').tap()
  }
  const cached = await page.evaluate(async name => {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    const sizes = await Promise.all(keys.map(async key => (await (await cache.match(key))!.blob()).size))
    return { entries: keys.length, bytes: sizes.reduce((sum, size) => sum + size, 0) }
  }, runtime)
  expect(cached.entries).toBe(27)
  expect(await names()).not.toContain(staleUrl)
  const target = new URL(pictureFiles(d02.id).modified, scope)
  target.searchParams.set('v', d02.version)
  await page.evaluate(async ([name, url]) => (await caches.open(name)).delete(url), [runtime, target.href])
  await context.setOffline(true)
  await card(page, d02).tap()
  await expect(page.getByRole('alert')).toHaveText('인터넷에 연결하면 이 그림을 할 수 있어요.')
  await button(page, '그림 선택').tap()

  await context.setOffline(false)
  const offset = requested.length
  await card(page, d02).tap()
  await playing(page)
  expect(requested.slice(offset)).toEqual([target.href])
  await expect.poll(async () => (await names()).length).toBe(27)
  await context.setOffline(true)
  await page.reload()
  await gallery(page)
  const offsetOffline = requested.length
  await card(page, d02).tap()
  await playing(page)
  expect(requested.slice(offsetOffline)).toEqual([])
  await tap(page, 'modified', midpoint(touch(contents[0].data.answers[0], 'modified')))
  await expect(score(page)).toHaveText(countText(1, 6))
  for (const entry of pictures.filter(entry => !entry.offline && entry.id !== d02.id)) {
    await button(page, '그림 선택').tap()
    await card(page, entry).tap()
    await playing(page)
    await expect(score(page)).toHaveText(countText(0, entry.count))
  }
  expect(requested.slice(offsetOffline).every(url => url.endsWith('-thumbnail.webp'))).toBe(true)
  mkdirSync(finalEvidence, { recursive: true })
  writeFileSync(finalEvidence + '/cache.json', JSON.stringify({
    initialEntries: Object.keys(initial).length, initialBytes,
    initialSpotBytes: Object.entries(initial).filter(([path]) => path.includes('spot-the-difference')).reduce((sum, [, size]) => sum + size, 0),
    onDemandEntries: cached.entries, onDemandBytes: cached.bytes, totalBytes: initialBytes + cached.bytes,
  }, null, 2) + '\n')
})
