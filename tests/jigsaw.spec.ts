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
    expect([rows, columns]).toEqual([[3, 3], [3, 4], [4, 4], [4, 5], [5, 5]][index])
    const pieces = makePieces(rows, columns, level.id >= 3 ? level.pictures[0].id : undefined)
    expect(pieces).toHaveLength([9, 12, 16, 20, 25][index])
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
    expect(restore({ ...initial, geometry: initial.geometry === 1 ? 3 : 1 }, level, picture)).toBeNull()
    expect(restore({ ...initial, rows: rows + 1 }, level, picture)).toBeNull()
    expect(restore({ ...initial, pieceCount: pieces.length - 1 }, level, picture)).toBeNull()
    const legacy = { ...initial, geometry: 1, rows: undefined, columns: undefined, pieceCount: undefined }
    if (index < 2) expect(restore(legacy, level, picture)).toEqual(initial)
    else expect(restore(legacy, level, picture)).toBeNull()
  })
}

async function open(page: Page, level: number, action = '퍼즐 시작') {
  await page.goto('./')
  await page.getByRole('button', { name: title, exact: true }).tap()
  await page.getByRole('button', { name: new RegExp(`^${level}단계`) }).tap()
  await page.locator('.jigsaw-picture').first().getByRole('button', { name: action === '퍼즐 시작' ? /퍼즐 시작$/ : action, exact: action !== '퍼즐 시작' }).tap()
  await expect(page.getByRole('group', { name: '퍼즐판' })).toBeVisible()
}

const pieceButton = (page: Page, id: number) => page.getByRole('button', { name: `조각 ${id + 1}`, exact: true })
const boardBox = async (page: Page) => (await page.getByRole('group', { name: '퍼즐판' }).boundingBox())!

test('all 20 source images decode and every level opens with the exact piece count', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: title, exact: true }).tap()
  await expect(page.locator('.jigsaw-levels button')).toHaveCount(5)
  expect(await page.locator('.jigsaw-levels img').evaluateAll(async images =>
    Promise.all(images.map(async image => {
      await (image as HTMLImageElement).decode()
      return image.getAttribute('src')?.split('/').at(-1)
    })),
  )).toEqual(['L01-01.webp', 'L02-02.webp', 'L03-03.webp', 'L04-03.webp', 'L05-04.webp'])
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
    for (const [index, picture] of level.pictures.entries()) {
      await cards.nth(index).getByRole('button', { name: /퍼즐 시작$/ }).tap()
      const tiles = page.locator('[data-piece]')
      await expect(tiles).toHaveCount(level.rows * level.columns)
      for (const image of await tiles.locator('image').all())
        await expect(image).toHaveAttribute('href', '/kids-game-playground/' + picture.path)
      if (index === 0) {
        const tray = page.getByRole('group', { name: '조각 보관함' })
        await expect(tray).toHaveAttribute('data-columns', String(level.trayColumns))
        if (level.id <= 2) expect(await tray.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1)
        if (level.id >= 3) expect(await tray.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
        expect(await tiles.locator('path[stroke]').evaluateAll(paths => paths.every(element => {
          const p = element as SVGPathElement
          const b = p.getBBox(), v = p.ownerSVGElement!.viewBox.baseVal
          return b.x >= v.x && b.y >= v.y && b.x + b.width <= v.x + v.width && b.y + b.height <= v.y + v.height
        }))).toBe(true)
        await page.screenshot({ path: review + 'play-level-' + level.id + '.png' })
      }
      await page.getByRole('button', { name: '← 그림 선택' }).tap()
    }
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
  const tile = (await pieceButton(page, 0).locator('.jigsaw-piece-grab').boundingBox())!
  async function drag(x: number, y: number) {
    await page.mouse.move(tile.x + tile.width / 2, tile.y + tile.height / 2)
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

test('native touch lane scrolling, direct piece drag, cancellation and dense layout across viewports', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await open(page, 4)
  const tray = page.getByRole('group', { name: '조각 보관함' })
  const cdp = await context.newCDPSession(page)
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', ...touchPoints: { x: number; y: number }[]) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints })
  const box = (await tray.boundingBox())!
  const scrollX = box.x + box.width - 23, scrollY = box.y + 160
  await touch('touchStart', { x: scrollX, y: scrollY })
  for (let dy = 8; dy <= 56; dy += 8) await touch('touchMove', { x: scrollX, y: scrollY - dy })
  await touch('touchEnd')
  await expect.poll(() => tray.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await expect(page.locator('.jigsaw-ghost')).toHaveCount(0)

  const lowerTile = tray.locator('[data-piece]').nth(6)
  const id = Number(await lowerTile.getAttribute('data-piece'))
  const piece = lowerTile.locator('.jigsaw-piece-grab')
  await piece.scrollIntoViewIfNeeded()
  await expect(page.locator('.jigsaw-grip')).toHaveCount(0)
  const beforeDrop = await tray.evaluate(el => el.scrollTop)
  expect(beforeDrop).toBeGreaterThan(0)
  const g = (await piece.boundingBox())!, board = await boardBox(page)
  const from = { x: g.x + g.width / 2, y: g.y + g.height / 2 }
  const target = { x: board.x + (id % 5 + .5) * board.width / 5, y: board.y + (Math.floor(id / 5) + .5) * board.height / 4 + 24 }
  await touch('touchStart', from)
  await touch('touchMove', target)
  await expect(page.locator('.jigsaw-ghost')).toBeVisible()
  await touch('touchCancel')
  await expect(page.locator('.jigsaw-ghost')).toHaveCount(0)
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('0 / 20')
  await touch('touchStart', from)
  await touch('touchMove', target)
  await touch('touchEnd')
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('1 / 20')
  expect(await tray.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await page.screenshot({ path: review + 'tablet-1280x720.png' })

  await open(page, 5)
  await expect(tray).toHaveAttribute('data-columns', '2')
  await pieceButton(page, 0).tap()
  await page.getByRole('button', { name: '1행 1열에 놓기' }).tap()
  await page.setViewportSize({ width: 800, height: 360 })
  await tray.evaluate(el => { el.scrollTop = 0 })
  const phonePiece = tray.locator('[data-piece]').first()
  const phoneId = Number(await phonePiece.getAttribute('data-piece'))
  const phoneRect = (await phonePiece.locator('.jigsaw-piece-grab').boundingBox())!
  const phoneBoard = await boardBox(page)
  await touch('touchStart', { x: phoneRect.x + phoneRect.width / 2, y: phoneRect.y + phoneRect.height / 2 })
  await touch('touchMove', {
    x: phoneBoard.x + (phoneId % 5 + .5) * phoneBoard.width / 5,
    y: phoneBoard.y + (Math.floor(phoneId / 5) + .5) * phoneBoard.height / 5 + 24,
  })
  await expect(page.locator('.jigsaw-ghost')).toBeVisible()
  await touch('touchEnd')
  for (const [name, width, height] of [['phone-landscape', 800, 360], ['phone-portrait', 360, 800]] as const) {
    await page.setViewportSize({ width, height })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const bounds = await boardBox(page)
    expect(Math.abs(bounds.width - bounds.height)).toBeLessThan(1)
    expect(await tray.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2)
    expect(await tray.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
    await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('2 / 25')
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
  await expect(page.locator('[data-piece]')).toHaveCount(25)
  const cachedImages = await page.evaluate(async () => {
    const names = await caches.keys()
    const key = names.find(name => name.startsWith('kids-playground-'))!
    const scope = (await navigator.serviceWorker.getRegistration())!.scope
    return (await (await caches.open(key)).keys())
      .map(request => request.url.slice(scope.length))
      .filter(path => path.startsWith('assets/puzzle/') && path.endsWith('.webp'))
      .sort()
  })
  expect(cachedImages).toHaveLength(20)
  expect(cachedImages).toEqual(levels.flatMap(level => level.pictures.map(picture => picture.path)).sort())
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
    await page.locator('.jigsaw-picture').first().getByRole('button', { name: /퍼즐 시작$/ }).tap()
    await expect(page.getByRole('alert')).toContainText('그림을 불러오지 못했어요')
    await page.unroute('**/L01-01.webp')
    await page.getByRole('button', { name: '다시 불러오기' }).tap()
    await expect(page.locator('[data-piece]')).toHaveCount(9)
  })
})

test('old 9–16 progress continues and old 24/32 records stay isolated', async ({ page }) => {
  const keys = ['L01-01', 'L02-01', 'L03-01', 'L04-01', 'L05-01'].map(id => storage + saveKey(id))
  const originals = [9, 12, 16, 24, 32].map((count, index) => {
    const all = Array.from({ length: count }, (_, id) => id)
    return JSON.stringify({
      version: 1, geometry: 1, imageId: `L0${index + 1}-01`, level: index + 1,
      placed: index === 4 ? all : [0], remaining: index === 4 ? [] : all.slice(1), complete: index === 4,
    })
  })
  await page.goto('./')
  await page.evaluate(({ keys, originals }) => keys.forEach((key, i) => localStorage.setItem(key, originals[i])), { keys, originals })
  for (const [index, count] of [9, 12, 16].entries()) {
    await open(page, index + 1, '이어하기')
    await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText(`1 / ${count}`)
    await expect(pieceButton(page, 0)).toHaveCount(0)
  }
  await open(page, 4)
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('0 / 20')
  await open(page, 5)
  await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText('0 / 25')
  await page.getByRole('button', { name: '← 그림 선택' }).tap()
  await expect(page.locator('.jigsaw-picture').first()).toContainText('이전 퍼즐 완성')
  expect(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys.slice(3))).toEqual(originals.slice(3))
  const records = await page.evaluate(keys => keys.map(key => JSON.parse(localStorage.getItem(key)!)),
    ['L04-01', 'L05-01'].map(id => storage + saveKey(id, 3)))
  expect(records.map(value => [value.geometry, value.rows, value.columns, value.pieceCount])).toEqual([[3, 4, 5, 20], [3, 5, 5, 25]])
})

test('same-grid progress and completion migrate into r3 without rewriting the source', async ({ page }) => {
  const source = levels.slice(2).map(level => {
    const picture = level.pictures[0], complete = level.id === 5
    const ids = Array.from({ length: level.rows * level.columns }, (_, id) => id).reverse()
    return {
      key: storage + saveKey(picture.id, level.id === 3 ? 1 : 2),
      nextKey: storage + saveKey(picture.id, 3),
      value: {
        version: 1, geometry: level.id === 3 ? 1 : 2, imageId: picture.id, level: level.id,
        rows: level.rows, columns: level.columns, pieceCount: ids.length,
        complete, placed: complete ? ids : ids.slice(0, 2), remaining: complete ? [] : ids.slice(2),
      },
    }
  })
  await page.goto('./')
  await page.evaluate(records => records.forEach(({ key, value }) => localStorage.setItem(key, JSON.stringify(value))), source)
  for (const [index, record] of source.entries()) {
    const { value, key, nextKey } = record
    await open(page, index + 3, value.complete ? '완성 그림 보기' : '이어하기')
    await expect(page.getByRole('status', { name: '진행 수량' })).toHaveText(`${value.placed.length} / ${value.pieceCount}`)
    expect(await page.locator('[data-piece]').evaluateAll(items => items.map(item => Number((item as HTMLElement).dataset.piece))))
      .toEqual(value.remaining)
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(JSON.stringify(value))
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), nextKey)).toEqual({ ...value, geometry: 3 })
    if (index === 1) {
      const badKey = storage + saveKey('L04-02', 2)
      const malformed = JSON.stringify({ ...value, imageId: 'L04-02', rows: 5, columns: 4 })
      await page.evaluate(({ badKey, malformed }) => localStorage.setItem(badKey, malformed), { badKey, malformed })
      await page.getByRole('button', { name: '← 그림 선택' }).tap()
      const card = page.locator('.jigsaw-picture').nth(1)
      await expect(card.getByRole('progressbar')).toHaveCount(0)
      await expect(card.getByRole('button', { name: /퍼즐 시작$/ })).toBeVisible()
      expect(await page.evaluate(key => localStorage.getItem(key), badKey)).toBe(malformed)
    }
    if (value.complete) {
      await expect(page.getByText('퍼즐 완성!').first()).toBeVisible()
      await page.screenshot({ path: review + 'varied-complete.png' })
    }
  }
})

test('all galleries show accurate progress and stacked, nonwrapping touch buttons', async ({ page }) => {
  const fixtures = levels.flatMap(level => level.pictures.map(picture => {
    const initial = fresh(level, picture)
    return [storage + saveKey(picture.id, initial.geometry), place(initial, initial.remaining[0])] as const
  }))
  await page.goto('./')
  await page.evaluate(records => records.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value))), fixtures)
  await page.getByRole('button', { name: title, exact: true }).tap()
  for (const level of levels) {
    await page.getByRole('button', { name: new RegExp(`^${level.id}단계`) }).tap()
    await expect(page.getByText(`${level.rows * level.columns}조각 중 1개 맞춤`)).toHaveCount(4)
    const bars = page.getByRole('progressbar')
    await expect(bars).toHaveCount(4)
    for (const bar of await bars.all()) {
      await expect(bar).toHaveAttribute('max', String(level.rows * level.columns))
      await expect(bar).toHaveAttribute('value', '1')
    }
    if (level.id === 2) {
      for (const [width, height] of [[1280, 720], [1280, 800], [800, 360], [360, 800], [320, 640]]) {
        await page.setViewportSize({ width, height })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        expect(await page.locator('.jigsaw-picture-actions').evaluateAll(groups => groups.every(group => {
          const [one, two] = [...group.querySelectorAll('button')]
          const a = one.getBoundingClientRect(), b = two.getBoundingClientRect()
          return a.bottom < b.top && a.width === b.width && a.height >= 48 && b.height >= 48 &&
            [one, two].every(button => {
              const range = document.createRange()
              range.selectNodeContents(button)
              return range.getClientRects().length === 1 && range.getBoundingClientRect().width <= button.clientWidth
            })
        }))).toBe(true)
        if (width === 1280 && height === 720) {
          await page.locator('.jigsaw-picture img').evaluateAll(images =>
            Promise.all(images.map(image => (image as HTMLImageElement).decode())))
          await page.screenshot({ path: review + 'stacked-progress.png' })
        }
      }
      await page.setViewportSize({ width: 1280, height: 720 })
    }
    await page.getByRole('button', { name: '← 난이도' }).tap()
  }
})
