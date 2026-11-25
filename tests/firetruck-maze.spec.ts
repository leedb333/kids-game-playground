import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { flamePoint } from '../src/games/firetruck-maze/Art'
import { mazes, type Point } from '../src/games/firetruck-maze/maps'
import { decode, depart, nextMaze, saveKey, type Run } from '../src/games/firetruck-maze/progress'
import { connect, distance, hintRoute, parked, position, remember, shortest, stepTo, travel, validateMaze } from '../src/games/firetruck-maze/roads'

const [maze] = mazes
const graph = connect(maze)
const key = 'kids-game-playground:v1:' + saveKey
const title = '출동! 소방차 미로'
const board = (page: Page) => page.locator('.maze-board')
const truck = (page: Page) => page.locator('[data-truck]')
const water = (page: Page) => page.getByRole('button', { name: '불끄기' })
async function intro(page: Page) {
  await page.getByRole('button', { name: title, exact: true }).tap()
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
}
const go = (page: Page) => page.getByRole('button', { name: '출동하기' }).tap()
const saved = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)
const review = 'test-results/firetruck-maze-review'
async function capture(page: Page, name: string) {
  await page.screenshot({ path: review + '/' + name + '.png' })
}

async function screen(page: Page, value: string | Point) {
  const point = typeof value === 'string' ? maze.nodes[value] : value
  return board(page).evaluate((svg: SVGSVGElement, { x, y }) => {
    const point = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!)
    return { x: Math.round(point.x), y: Math.round(point.y) }
  }, point)
}

async function tapRoute(page: Page, from: string, goal: string) {
  for (const next of shortest(graph, from, goal).path.slice(1)) {
    const { x, y } = await screen(page, next)
    await page.touchscreen.tap(x, y)
    await expect(truck(page)).toHaveAttribute('data-node', next)
  }
}

test('M05 road geometry, ordered routes and clipped hint are valid', () => {
  expect(mazes.map(m => [m.id, m.version, m.difficulty, m.theme])).toEqual([['M05', 1, 7, '아파트 단지']])
  const review = validateMaze(maze)
  expect([review.deadEnds, review.junctions]).toEqual([6, 21])
  expect(review.routes.map(route => route.length)).toEqual([1104, 956, 812, 736])
  expect(Object.keys(maze.nodes)).toHaveLength(66)
  expect(maze.roads).toHaveLength(74)
  expect(() => validateMaze({ ...maze, roads: [...maze.roads, ['1,1', '3,1']] })).toThrow()
  for (const { path } of review.routes) {
    const hint = hintRoute(graph, parked(path[0]), path.at(-1)!)
    expect(hint).toEqual(path.slice(0, hint.length).map(id => maze.nodes[id]))
    expect(hint.length).toBeLessThan(path.length)
    expect(hint.slice(1).filter(point => path.some(id => maze.nodes[id] === point && graph.links.get(id)!.length >= 3)).length).toBeLessThanOrEqual(2)
  }
  const from = '1,7', near = '1,6', goal = '10,1'
  const half = travel(graph, parked(from), { x: maze.nodes[from].x, y: maze.nodes[from].y - 30 }, goal).pose
  expect(half).toMatchObject({ from, to: near, offset: 30, heading: 270 })
  expect(hintRoute(graph, half, '0,6').slice(0, 3)).toEqual([position(graph, half), maze.nodes[near], maze.nodes['0,6']])
  expect(stepTo(graph, half, '0,6')).toBe(half)
  expect(travel(graph, parked(near), { x: -1000, y: maze.nodes[near].y }, goal)).toEqual({
    pose: parked('0,6', 180), visited: ['0,6'],
  })
  expect(travel(graph, parked('0,6'), { x: -500, y: -500 }, goal).visited).toEqual([])
  expect(travel(graph, parked('0,6'), maze.nodes[near], goal).pose).toEqual(parked(near))
  expect(remember([from, near, '0,6'], [near])).toEqual([from, near])
  for (const lot of [...maze.buildings, ...maze.parks, ...maze.fires, maze.station]) {
    for (const [a, b] of maze.roads) {
      const p = maze.nodes[a], q = maze.nodes[b]
      const x = Math.max(Math.min(p.x, q.x) - lot.x, lot.x - Math.max(p.x, q.x), 0)
      const y = Math.max(Math.min(p.y, q.y) - lot.y, lot.y - Math.max(p.y, q.y), 0)
      expect(distance({ x: Math.max(0, x - lot.width / 2), y: Math.max(0, y - lot.height / 2) }, { x: 0, y: 0 }))
        .toBeGreaterThanOrEqual(maze.roadWidth / 2)
    }
  }
})

test('versioned saves validate partial travel, ordered targets, completion and rotation', () => {
  const first = depart()
  const partial = { ...first, pose: { from: '1,7', to: '1,6', offset: 30, heading: 270 } }
  expect(decode(partial)).toEqual(partial)
  for (const invalid of [null, 1, {}, { ...first, mazeVersion: 0 }, { ...first, mazeId: 'M10' },
    { ...first, target: '3' }, { ...first, extinguished: ['2'] }, { ...first, complete: true },
    { ...first, trail: ['1,7', '7,7'] }, { ...first, rotation: { last: 'M05', remaining: ['M05'] } },
    { ...partial, pose: { ...partial.pose, offset: 999 } }, { ...partial, pose: { ...partial.pose, to: '10,1' } },
  ]) expect(decode(invalid)).toBeNull()
  expect(depart(first)).toEqual(first)
  const ids = ['A', 'B', 'C', 'D']
  let rotation: ReturnType<typeof nextMaze> | undefined
  const seen = Array.from({ length: 12 }, () => {
    rotation = nextMaze(ids, rotation, () => 0.36)
    return rotation.last
  })
  for (let i = 0; i < seen.length; i += ids.length) expect([...seen.slice(i, i + ids.length)].sort()).toEqual(ids)
  expect(seen.every((id, i) => i === 0 || seen[i - 1] !== id)).toBe(true)
})

test('mouse and native touch stay connected, backtrack, cancel safely and restore position', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')
  await intro(page)
  await go(page)
  const start = await screen(page, maze.start)
  const junction = await screen(page, '1,6')
  const spur = await screen(page, '0,6')
  const half = await screen(page, { x: maze.nodes[maze.start].x, y: maze.nodes[maze.start].y - 31 })
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(half.x, half.y)
  await page.mouse.up()
  await expect(truck(page)).not.toHaveAttribute('data-node', maze.start)
  const partial = await saved(page) as Run
  expect(partial.pose).toMatchObject({ from: maze.start, to: '1,6', heading: 270 })
  expect(partial.pose.offset).toBeCloseTo(31, -1)
  await page.reload()
  await intro(page)
  await page.getByRole('button', { name: '이어하기' }).tap()
  await expect(truck(page)).toHaveAttribute('data-heading', '270')
  await expect(truck(page)).toHaveAttribute('data-y', String(position(graph, partial.pose).y))
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...half, id: 1 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...junction, id: 1 }] })
  await expect(truck(page)).toHaveAttribute('data-node', '1,6')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...junction, id: 1 }, { x: 600, y: 300, id: 2 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...junction, id: 1 }, { x: 720, y: 280, id: 2 }] })
  await expect(truck(page)).toHaveAttribute('data-node', '1,6')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 0, y: spur.y, id: 1 }, { x: 720, y: 280, id: 2 }] })
  await expect(truck(page)).toHaveAttribute('data-node', '0,6')
  await expect(truck(page)).toHaveAttribute('data-heading', '180')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  expect((await saved(page)).trail).toEqual([maze.start, '1,6', '0,6'])
  await page.touchscreen.tap(junction.x, junction.y)
  await expect(truck(page)).toHaveAttribute('data-heading', '0')
  expect((await saved(page)).trail).toEqual([maze.start, '1,6'])
  await board(page).focus()
  await page.keyboard.press('ArrowDown')
  await expect(truck(page)).toHaveAttribute('data-node', maze.start)
  await expect(page.locator('[data-trail]')).toHaveCount(0)
  const far = await screen(page, maze.fires[0].stop)
  await page.touchscreen.tap(far.x, far.y)
  await expect(truck(page)).toHaveAttribute('data-node', maze.start)
})

test('full dispatch uses ordered objectives, timed spray, hints, completion and replay', async ({ page }) => {
  test.setTimeout(65_000)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('./')
  await expect(page.locator('.card')).toHaveCount(4)
  await capture(page, '01-home')
  await intro(page)
  await capture(page, '02-welcome')
  await go(page)
  await expect(page.locator('[data-fire="true"]')).toHaveCount(3)
  await expect(page.locator('[data-target="1"]')).toHaveCount(1)
  await expect(water(page)).toBeDisabled()
  await capture(page, '04-board')
  const [first, second, third] = maze.fires
  await tapRoute(page, maze.start, second.stop)
  await expect(page.getByText('먼저 1번 건물로 가요!')).toBeVisible()
  await expect(water(page)).toBeDisabled()
  await capture(page, '05-trail')
  await page.getByRole('button', { name: '힌트' }).tap()
  await expect(page.locator('[data-hint]')).toHaveCount(1)
  await capture(page, '06-hint')
  await expect(page.locator('[data-hint]')).toHaveCount(0, { timeout: 6500 })
  await page.getByRole('button', { name: '힌트' }).tap()
  await tapRoute(page, second.stop, maze.station.stop)
  await expect(page.locator('[data-hint]')).toHaveCount(0)
  await expect(page.getByText('아직 불이 난 건물이 있어요!')).toBeVisible()
  await tapRoute(page, maze.station.stop, first.stop)
  await expect(water(page)).toBeEnabled()
  await capture(page, '07-ready')
  await water(page).tap()
  await expect(water(page)).toBeDisabled()
  const jet = page.locator('.maze-water path').first()
  await expect(jet).toBeVisible()
  const { x, y } = flamePoint(first)
  await expect(jet).toHaveAttribute('d', new RegExp(' ' + x + ' ' + y + '$'))
  await expect(page.locator('.maze-water')).toHaveCSS('opacity', '1')
  await capture(page, '08a-spray-start')
  await page.waitForTimeout(650)
  await capture(page, '08b-spray-middle')
  await board(page).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(truck(page)).toHaveAttribute('data-node', first.stop)
  await water(page).evaluate((button: HTMLButtonElement) => button.click())
  expect((await saved(page)).extinguished).toEqual([])
  await expect(page.getByRole('status', { name: '진압 수량' })).toHaveText('화재 진압 1 / 3')
  await expect(page.locator('[data-building="1"] .maze-flame')).toHaveCount(0)
  await expect(page.locator('.maze-water')).toHaveCount(0)
  await expect(page.locator('[data-target="2"]')).toHaveCount(1)
  await expect(page.locator('[data-building="1"] .maze-clear-check')).toHaveCSS('opacity', '1')
  await capture(page, '09-clear')
  await page.getByRole('button', { name: '홈으로', exact: true }).tap()
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await intro(page)
  await capture(page, '03-resume')
  await page.getByRole('button', { name: '이어하기' }).tap()
  await expect(truck(page)).toHaveAttribute('data-node', first.stop)
  await expect(page.locator('[data-fire="false"]')).toHaveCount(1)
  for (const [index, from, to] of [[2, first.stop, second.stop], [3, second.stop, third.stop]] as const) {
    await tapRoute(page, from, to)
    await water(page).tap()
    await expect(page.getByRole('status', { name: '진압 수량' })).toHaveText('화재 진압 ' + index + ' / 3')
  }
  await expect(page.locator('[data-target="station"]')).toHaveCount(1)
  await expect(water(page)).toBeDisabled()
  const arrival = shortest(graph, third.stop, maze.station.stop).path.at(-2)!
  await tapRoute(page, third.stop, arrival)
  await capture(page, '10-return')
  const station = await screen(page, maze.station.stop)
  await page.touchscreen.tap(station.x, station.y)
  await expect(page.getByRole('heading', { name: '출동 완료!' })).toBeFocused()
  expect((await saved(page)).complete).toBe(true)
  await expect(page.locator('.maze-finished')).toHaveCSS('opacity', '1')
  await capture(page, '11-complete')
  await page.getByRole('button', { name: '다시 하기' }).tap()
  await expect(truck(page)).toHaveAttribute('data-node', maze.start)
  expect((await saved(page)).complete).toBe(false)
})

test('interruption restores the unextinguished fire and game reset only writes its own key', async ({ page }) => {
  const first = maze.fires[0].stop
  const run: Run = { ...depart(), pose: parked(first), trail: shortest(graph, maze.start, first).path }
  const prefix = 'kids-game-playground:v1:'
  const protectedValues = Object.fromEntries([
    'game:bricks:r1', 'game:memory-card:r1', 'game:jigsaw-puzzle:L01-01:r3', 'game:jigsaw-puzzle:L01-01:r2',
    'game:coloring:police-car-robot:r4', 'game:cooking-v2:pizza:full:r1',
  ].map(id => [prefix + id, 'preserved fixture']))
  protectedValues[prefix + 'sound'] = 'false'
  await page.goto('./')
  await page.evaluate(({ key, run, protectedValues }) => {
    localStorage.setItem(key, JSON.stringify(run))
    for (const [key, value] of Object.entries(protectedValues)) localStorage.setItem(key, value)
  }, { key, run, protectedValues })
  await page.addInitScript(() => {
    let count = 0
    const Audio = window.AudioContext
    window.AudioContext = class extends Audio {
      constructor() { super(); document.documentElement.dataset.mazeAudioCreated = String(++count) }
    }
  })
  await page.reload()
  await intro(page)
  await expect(page.getByRole('button', { name: /소리 OFF/ })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: '이어하기' }).tap()
  await water(page).tap()
  await expect(page.locator('.maze-water')).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-maze-audio-created')
  await page.reload()
  await intro(page)
  await page.getByRole('button', { name: '새로 시작하기' }).tap()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: '계속하기' }).tap()
  await page.getByRole('button', { name: '이어하기' }).tap()
  await expect(page.locator('[data-fire="true"]')).toHaveCount(3)
  await expect(water(page)).toBeEnabled()
  expect(await saved(page)).toEqual(run)
  await page.getByRole('button', { name: '홈으로', exact: true }).tap()
  await intro(page)
  await page.getByRole('button', { name: '새로 시작하기' }).tap()
  await page.getByRole('button', { name: '새로 출동' }).tap()
  await expect(truck(page)).toHaveAttribute('data-node', maze.start)
  expect(await saved(page)).toEqual(depart())
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(protectedValues)))
    .toEqual(protectedValues)
  await page.getByRole('button', { name: '홈으로', exact: true }).tap()
  await page.evaluate(key => localStorage.setItem(key, '{"invalid":'), key)
  await page.reload()
  await intro(page)
  await expect(page.getByRole('button', { name: '출동하기' })).toBeVisible()
})

test('rotation keeps the board proportional and controls visible at all requested sizes', async ({ page }) => {
  await page.goto('./')
  await intro(page)
  await go(page)
  await tapRoute(page, maze.start, '1,6')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.maze-smoke').first()).toHaveCSS('animation-name', 'none')
  const measurements = []
  for (const [name, width, height] of [
    ['tablet-800', 1280, 800], ['tablet-720', 1280, 720], ['12-phone-landscape', 800, 360], ['13-phone-portrait', 360, 800],
  ] as const) {
    await page.setViewportSize({ width, height })
    await expect(truck(page)).toHaveAttribute('data-node', '1,6')
    const rect = (await board(page).boundingBox())!
    expect(rect.width / rect.height).toBeCloseTo(maze.width / maze.height, 3)
    expect(rect.x + rect.width).toBeLessThanOrEqual(width)
    expect(rect.y + rect.height).toBeLessThanOrEqual(height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    for (const button of await page.locator('.maze-controls button').all()) {
      const bounds = (await button.boundingBox())!
      expect(bounds.width).toBeGreaterThanOrEqual(48)
      expect(bounds.height).toBeGreaterThanOrEqual(48)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(height)
    }
    const hit = truck(page).locator(':scope > circle')
    await expect.poll(async () => (await hit.boundingBox())!.width).toBeGreaterThanOrEqual(43)
    const view = await truck(page).locator(':scope > g > g').evaluate((svg: SVGGElement) => {
      const { width, height } = svg.getBBox()
      return [width, height]
    })
    measurements.push({ name, viewport: [width, height], board: [rect.width, rect.height],
      roadWidth: maze.roadWidth * rect.width / maze.width,
      truck: view.map(dimension => dimension * rect.width / maze.width),
      tapDiameter: (await hit.boundingBox())!.width })
    await capture(page, name)
  }
  await mkdir(review, { recursive: true })
  await writeFile(review + '/measurements.json', JSON.stringify(measurements, null, 2))
})

test('first maze start works offline after service worker installation', async ({ page, context }) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  const assets = await page.evaluate(async () => {
    const names = await caches.keys()
    return (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))).flat()
  })
  expect(assets.some(name => /\/assets\/index-.*\.js$/.test(name))).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await intro(page)
  await go(page)
  await tapRoute(page, maze.start, '1,6')
  await expect(page.locator('[data-fire="true"]')).toHaveCount(3)
  expect((await saved(page)).mazeId).toBe('M05')
})
