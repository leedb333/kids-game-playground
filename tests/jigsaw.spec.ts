import { test, expect, type Page } from '@playwright/test'
import { levels } from '../src/games/jigsaw-puzzle/catalog'
import { fits, makePieces } from '../src/games/jigsaw-puzzle/geometry'
import { fresh, place, restore, saveKey, undo } from '../src/games/jigsaw-puzzle/progress'

const title = '그림 퍼즐 맞추기'
const storage = 'kids-game-playground:v1:'
const review = 'test-results/review/jigsaw/'

const reverse = <T,>(curves: T[][]) => [...curves].reverse().map(curve => [...curve].reverse())

for (const [index, level] of levels.entries()) {
  test(`level ${level.id} geometry, placement bounds and save validation`, () => {
    const { rows, columns } = level
    const pieces = makePieces(rows, columns)
    expect(pieces).toHaveLength([9, 12, 16, 24, 32][index])
    for (const { id, x, y, width, height, edges } of pieces) {
      const row = Math.floor(id / columns), col = id % columns
      if (col < columns - 1) expect(edges[1]).toEqual(reverse(pieces[id + 1].edges[3]))
      if (row < rows - 1) expect(edges[2]).toEqual(reverse(pieces[id + columns].edges[0]))
      if (col === 0) expect(edges[3].flat().every(point => point[0] === 0)).toBe(true)
      if (row === 0) expect(edges[0].flat().every(point => point[1] === 0)).toBe(true)
      if (col === columns - 1) expect(edges[1].flat().every(point => point[0] === 1000)).toBe(true)
      if (row === rows - 1) expect(edges[2].flat().every(point => point[1] === 1000)).toBe(true)
      expect(fits(pieces[id], x + width / 2, y + height / 2)).toBe(true)
      expect(fits(pieces[id], x + width, y + height / 2)).toBe(false)
    }
    const picture = level.pictures[0]
    const initial = fresh(level, picture)
    const solved = initial.remaining.reduce(place, initial)
    expect(restore(solved, level, picture)).toEqual(solved)
    expect(solved.complete).toBe(true)
    expect(undo(solved).complete).toBe(false)
    expect(restore({ ...initial, placed: [initial.remaining[0]] }, level, picture)).toBeNull()
    expect(restore({ ...initial, remaining: initial.remaining.map(() => 0) }, level, picture)).toBeNull()
    expect(restore({ ...initial, geometry: 2 }, level, picture)).toBeNull()
  })
}

async function open(page: Page, level: number, action = '퍼즐 시작') {
  await page.goto('./')
  await page.getByRole('button', { name: title, exact: true }).tap()
  await page.getByRole('button', { name: new RegExp(`^${level}단계`) }).tap()
  await page.locator('.jigsaw-picture').first().getByRole('button', { name: action, exact: true }).tap()
  await expect(page.getByRole('group', { name: '퍼즐판' })).toBeVisible()
}

const pieceButton = (page: Page, id: number) => page.getByRole('button', { name: `조각 ${id + 1}`, exact: true })
const boardBox = async (page: Page) => (await page.getByRole('group', { name: '퍼즐판' }).boundingBox())!

test('all 20 source images decode and every level opens with the exact piece count', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: title, exact: true }).tap()
  await expect(page.locator('.jigsaw-levels button')).toHaveCount(5)
  await page.screenshot({ path: review + 'levels.png' })
  for (const level of levels) {
    await page.getByRole('button', { name: new RegExp(`^${level.id}단계`) }).tap()
    const cards = page.locator('.jigsaw-picture')
    await expect(cards).toHaveCount(4)
    for (const [index, picture] of level.pictures.entries()) {
      const img = cards.nth(index).getByRole('img', { name: picture.title })
      await expect(img).toHaveAttribute('src', '/kids-game-playground/' + picture.path)
      expect(await img.evaluate(async (element: HTMLImageElement) => {
        await element.decode()
        return [element.naturalWidth, element.naturalHeight]
      })).toEqual([1254, 1254])
    }
    if (level.id === 1) await page.screenshot({ path: review + 'gallery.png' })
    await cards.first().getByRole('button', { name: '퍼즐 시작' }).tap()
    await expect(page.locator('[data-piece]')).toHaveCount(level.rows * level.columns)
    await page.getByRole('button', { name: '← 그림 선택' }).tap()
    await page.getByRole('button', { name: '← 난이도' }).tap()
  }
})

test('mouse drop, invalid return, hint, save, undo, reset confirmation and solution', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await open(page, 1)
  await page.getByRole('button', { name: '그림 힌트' }).tap()
  await expect(page.getByRole('button', { name: '그림 힌트' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.jigsaw-board image[opacity]')).toHaveCount(1)
  await page.screenshot({ path: review + 'tablet-1280x800.png' })
  await page.getByRole('button', { name: '그림 힌트' }).tap()
  await page.getByRole('button', { name: /소리 ON/ }).tap()

  const bounds = await boardBox(page)
  const tile = (await pieceButton(page, 0).boundingBox())!
  async function drag(x: number, y: number) {
    await page.mouse.move(tile.x + tile.width / 2, tile.y + 25)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * x, bounds.y + bounds.height * y, { steps: 8 })
    await expect(page.locator('.jigsaw-ghost')).toBeVisible()
    await page.mouse.up()
  }
  await drag(5 / 6, 5 / 6)
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('0 / 9')
  await expect(pieceButton(page, 0)).toBeVisible()
  await drag(1 / 6, 1 / 6)
  await expect(pieceButton(page, 0)).toHaveCount(0)
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 9')
  const key = storage + saveKey('L01-01')
  const checkpoint = await page.evaluate(key => localStorage.getItem(key), key)
  await open(page, 1, '이어하기')
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(checkpoint)
  await expect(page.getByRole('button', { name: /소리 OFF/ })).toBeVisible()
  await page.getByRole('button', { name: '다시 시작', exact: true }).tap()
  await page.getByRole('button', { name: '계속 맞추기' }).tap()
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 9')
  await page.getByRole('button', { name: '되돌리기' }).tap()
  await expect(pieceButton(page, 0)).toBeVisible()
  for (let id = 0; id < 9; id++) {
    await pieceButton(page, id).tap()
    await page.getByRole('button', { name: `${Math.floor(id / 3) + 1}행 ${id % 3 + 1}열에 놓기` }).tap()
  }
  await expect(page.locator('.jigsaw-celebrate')).toContainText('퍼즐 완성!')
  await expect(page.locator('.jigsaw-board svg > image')).toHaveAttribute('width', '1000')
  await expect(page.locator('.jigsaw-board svg > path')).toHaveCount(0)
  await page.screenshot({ path: review + 'complete.png' })
  await page.getByRole('button', { name: '다음 그림 고르기' }).tap()
  await expect(page.getByRole('button', { name: '완성 그림 보기' })).toBeVisible()
  await page.getByRole('button', { name: '완성 그림 보기' }).tap()
  await page.getByRole('button', { name: '다시 시작', exact: true }).tap()
  await page.getByRole('button', { name: '처음부터 시작' }).tap()
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('0 / 9')
  await pieceButton(page, 0).press('Enter')
  const target = page.getByRole('button', { name: '1행 1열에 놓기' })
  await expect(target).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 9')
})

test('native touch scroll, drag grip, cancellation and dense layout across viewports', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await open(page, 4)
  const tray = page.getByRole('group', { name: '조각 보관함' })
  const cdp = await context.newCDPSession(page)
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', ...touchPoints: { x: number; y: number }[]) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints })
  const tile = tray.locator('[data-piece]').nth(1)
  const box = (await tile.boundingBox())!
  const scrollX = box.x + box.width / 2, scrollY = box.y + 45
  await touch('touchStart', { x: scrollX, y: scrollY })
  for (let dy = 8; dy <= 56; dy += 8) await touch('touchMove', { x: scrollX, y: scrollY - dy })
  await touch('touchEnd')
  await expect.poll(() => tray.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await expect(page.locator('.jigsaw-ghost')).toHaveCount(0)

  const lowerTile = tray.locator('[data-piece]').nth(6)
  const id = Number(await lowerTile.getAttribute('data-piece'))
  const grip = lowerTile.locator('.jigsaw-grip')
  await grip.scrollIntoViewIfNeeded()
  const beforeDrop = await tray.evaluate(el => el.scrollTop)
  expect(beforeDrop).toBeGreaterThan(0)
  const g = (await grip.boundingBox())!, board = await boardBox(page)
  const from = { x: g.x + g.width / 2, y: g.y + g.height / 2 }
  const target = { x: board.x + (id % 6 + .5) * board.width / 6, y: board.y + (Math.floor(id / 6) + .5) * board.height / 4 + 28 }
  await touch('touchStart', from)
  await touch('touchMove', target)
  await expect(page.locator('.jigsaw-ghost')).toBeVisible()
  await touch('touchCancel')
  await expect(page.locator('.jigsaw-ghost')).toHaveCount(0)
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('0 / 24')
  await touch('touchStart', from)
  await touch('touchMove', target)
  await touch('touchEnd')
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 24')
  expect(await tray.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await page.screenshot({ path: review + 'tablet-1280x720.png' })

  await open(page, 5)
  await expect(tray).toHaveAttribute('data-dense', 'true')
  await pieceButton(page, 0).tap()
  await page.getByRole('button', { name: '1행 1열에 놓기' }).tap()
  for (const [name, width, height] of [['phone-landscape', 800, 360], ['phone-portrait', 360, 800]] as const) {
    await page.setViewportSize({ width, height })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const bounds = await boardBox(page)
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(1)
    expect(await tray.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2)
    expect(await tray.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 32')
    await page.screenshot({ path: review + name + '.png', fullPage: true })
  }
})

test('offline fresh puzzle uses its precached image and protects other storage and caches', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(async () => {
    for (const suffix of ['game:bricks:r1', 'game:memory-card:r1', 'game:coloring:police-car-robot:r4', 'game:cooking-v2:pizza:full:r1'])
      localStorage.setItem('kids-game-playground:v1:' + suffix, 'protected test record')
    await caches.open('kids-coloring-studio:fixture')
    await caches.open('kids-cooking-studio:fixture')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await context.setOffline(true)
  await open(page, 5)
  await expect(page.locator('[data-piece]')).toHaveCount(32)
  const cachedImages = await page.evaluate(async () => {
    const names = await caches.keys()
    const key = names.find(name => name.startsWith('kids-playground-'))!
    return (await (await caches.open(key)).keys()).filter(request => request.url.endsWith('.webp')).length
  })
  expect(cachedImages).toBe(20)
  expect(await page.evaluate(() => caches.keys())).toEqual(expect.arrayContaining(['kids-coloring-studio:fixture', 'kids-cooking-studio:fixture']))
  for (const suffix of ['game:bricks:r1', 'game:memory-card:r1', 'game:coloring:police-car-robot:r4', 'game:cooking-v2:pizza:full:r1'])
    expect(await page.evaluate(key => localStorage.getItem(key), storage + suffix)).toBe('protected test record')
})

test.describe('image failure', () => {
  test.use({ serviceWorkers: 'block' })

  test('missing image and malformed save show recovery without deleting other records', async ({ page }) => {
    const key = storage + saveKey('L01-01')
    await page.goto('./')
    await page.evaluate(key => localStorage.setItem(key, '{invalid'), key)
    await page.route('**/L01-01.webp', route => route.abort())
    await page.getByRole('button', { name: title, exact: true }).tap()
    await page.getByRole('button', { name: /^1단계/ }).tap()
    await expect(page.locator('.jigsaw-image-error')).toBeVisible()
    await page.locator('.jigsaw-picture').first().getByRole('button', { name: '퍼즐 시작' }).tap()
    await expect(page.getByRole('alert')).toContainText('그림을 불러오지 못했어요')
    await page.unroute('**/L01-01.webp')
    await page.getByRole('button', { name: '다시 불러오기' }).tap()
    await expect(page.locator('[data-piece]')).toHaveCount(9)
  })
})
