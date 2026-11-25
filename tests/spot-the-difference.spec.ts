import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { pictureFiles, pictures } from '../src/games/spot-the-difference/catalog'
import { answerAt, contains, display, parseData, regionBounds, touch, type Point, type Region, type Side } from '../src/games/spot-the-difference/model'

const picture = pictures[0]
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
    await expect.poll(() => page.locator('.spot-card img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(384)
    expect(requests.map(url => url.split('/').at(-1))).toEqual(['D01-thumbnail.webp'])
    await expect(page.locator('.spot-pending[aria-disabled=true]')).toHaveCount(9)
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
  await expect.poll(() => page.locator('.spot-card img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(384)
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
