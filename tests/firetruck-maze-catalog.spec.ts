import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { mazes, type Maze, type Point } from '../src/games/firetruck-maze/maps'
import { decode, depart, graphs, nextMaze, saveKey, type Run } from '../src/games/firetruck-maze/progress'
import { connect, distance, hintRoute, parked, shortest, travel, validateMaze } from '../src/games/firetruck-maze/roads'

const key = 'kids-game-playground:v1:' + saveKey
const ids = mazes.map(maze => maze.id)
const pilot = graphs.get('M05')!.maze
const review = 'test-results/firetruck-maze-final'
const board = (page: Page) => page.locator('.maze-board')
const truck = (page: Page) => page.locator('[data-truck]')
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const title = '출동! 소방차 미로'
const views = [
  ['tablet-800', 1280, 800], ['tablet-720', 1280, 720],
  ['phone-landscape', 800, 360], ['phone-portrait', 360, 800],
] as const

function initial(maze: Maze): Run {
  return {
    version: 1, mazeId: maze.id, mazeVersion: maze.version,
    rotation: { last: maze.id, remaining: ids.filter(id => id !== maze.id), catalog: ids },
    pose: parked(maze.start), trail: [maze.start], extinguished: [], target: '1', complete: false,
  }
}

const read = (page: Page): Promise<Run> => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)

async function enter(page: Page, action: string) {
  await button(page, title).tap()
  await button(page, action).tap()
}

async function saveFixture(page: Page, state: Run) {
  await page.evaluate(({ key, state }) => localStorage.setItem(key, JSON.stringify(state)), { key, state })
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: review + '/' + name + '.png' })
}

async function pointOnScreen(page: Page, point: Point) {
  return board(page).evaluate((svg: SVGSVGElement, point) => {
    const p = new DOMPoint(point.x, point.y).matrixTransform(svg.getScreenCTM()!)
    return { x: p.x, y: p.y }
  }, point)
}

const bounds = (p: Point, q: Point) => ({
  left: Math.min(p.x, q.x), right: Math.max(p.x, q.x), top: Math.min(p.y, q.y), bottom: Math.max(p.y, q.y),
})
type Bounds = ReturnType<typeof bounds>
const gap = (a: Bounds, b: Bounds) => Math.hypot(
  Math.max(a.left - b.right, b.left - a.right, 0), Math.max(a.top - b.bottom, b.top - a.bottom, 0),
)

test('all fixed cities have tree geometry, ordered cut points, and distinct documented difficulty', async () => {
  expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => 'M' + String(i + 1).padStart(2, '0')))
  expect(mazes.map(maze => [maze.difficulty, maze.fires.length])).toEqual([
    ['중', 2], ['중', 2], ['상', 2], ['중', 2], ['하', 3],
    ['상', 3], ['상', 3], ['상', 3], ['최상', 3], ['최상', 4],
  ])
  const { difficulty, ...original } = pilot
  expect(createHash('sha256').update(JSON.stringify(original)).digest('hex'))
    .toBe('6115b39d433743bfa928146a83a51cdd6a3e6cc54146cdd9c5c5751ec816b302')
  const target = {
    중: [[75, 100], [18, 25], [8, 12], [4, 6], [12, 18]],
    상: [[95, 125], [25, 35], [12, 16], [6, 9], [18, 25]],
    최상: [[120, 150], [35, 45], [15, 20], [8, 12], [25, 35]],
  }
  const pilotAudit = validateMaze(pilot)
  const metrics = []
  for (const maze of mazes) {
    const graph = graphs.get(maze.id)!
    const audit = validateMaze(maze)
    const stops = [maze.start, ...maze.fires.map(fire => fire.stop), maze.station.stop]
    expect(maze.roads).toHaveLength(Object.keys(maze.nodes).length - 1)
    expect(audit.solution.path.filter(id => stops.includes(id))).toEqual(stops)
    for (let i = 1; i < stops.length - 1; i++) {
      const cut = connect({ ...maze, roads: maze.roads.filter(edge => !edge.includes(stops[i])) })
      for (const unreachable of stops.slice(i + 1))
        expect(shortest(cut, stops[i - 1], unreachable).path).toEqual([])
    }
    const complex = audit.branches.filter(branch => branch.junctions.length).length
    const depth = Math.max(...audit.branches.map(branch => branch.depth))
    const wrongDistance = Math.max(...audit.branches.map(branch => branch.distance))
    const deadEnds = audit.branches.reduce((sum, branch) => sum + branch.deadEnds.length, 0)
    expect(deadEnds).toBe(audit.deadEnds - 2)
    if (maze.difficulty !== '하') {
      for (const [i, actual] of [Object.keys(maze.nodes).length, audit.turns, audit.branches.length, complex, deadEnds].entries()) {
        const [min, max] = target[maze.difficulty][i]
        expect(actual, maze.id + ' difficulty metric ' + i).toBeGreaterThanOrEqual(min)
        expect(actual, maze.id + ' difficulty metric ' + i).toBeLessThanOrEqual(max)
      }
      expect(depth).toBeGreaterThan(Math.max(...pilotAudit.branches.map(branch => branch.depth)))
      expect(Math.max(...audit.branches.map(branch => branch.turns))).toBeGreaterThanOrEqual(3)
      expect(Math.min(...audit.routes.map(route => route.turns))).toBeGreaterThanOrEqual(4)
    }

    for (const [i, route] of audit.routes.entries()) {
      const goal = stops[i + 1]
      const first = route.path[0]
      const hint = hintRoute(graph, parked(first), goal)
      expect(hint).toEqual(route.path.slice(0, hint.length).map(id => maze.nodes[id]))
      expect(hint.length).toBeLessThan(route.path.length)
      expect(route.path.slice(1, hint.length).filter(id => graph.links.get(id)!.length >= 3).length).toBeLessThanOrEqual(2)
      const previous = route.path.at(-2)!
      const a = maze.nodes[previous], b = maze.nodes[goal]
      const move = travel(graph, parked(previous), { x: b.x + 3 * (b.x - a.x), y: b.y + 3 * (b.y - a.y) }, goal)
      expect(move.pose).toMatchObject({ from: goal, to: null })
    }
    for (const branch of audit.branches) {
      for (const leaf of branch.deadEnds) {
        const path = shortest(graph, leaf, maze.station.stop).path
        expect(path).toContain(branch.from)
        expect(hintRoute(graph, parked(leaf), maze.station.stop)[1]).toEqual(maze.nodes[path[1]])
      }
    }

    const roads = maze.roads.map(([a, b]) => bounds(maze.nodes[a], maze.nodes[b]))
    let roadGap = Infinity
    for (const [i, edge] of maze.roads.entries()) {
      for (let j = i + 1; j < roads.length; j++) {
        if (maze.roads[j].some(node => edge.includes(node))) continue
        roadGap = Math.min(roadGap, gap(roads[i], roads[j]) - maze.roadWidth)
      }
    }
    expect(roadGap, maze.id).toBeGreaterThanOrEqual(27)
    const lots = [...maze.buildings, ...maze.parks, ...maze.fires, maze.station]
    if (maze.id !== 'M05') {
      for (const stop of [...maze.fires, maze.station])
        expect(distance(maze.nodes[stop.stop], stop), maze.id + ' objective proximity').toBeLessThan(115)
    }
    for (const lot of lots) {
      const box = bounds({ x: lot.x - lot.width / 2, y: lot.y - lot.height / 2 },
        { x: lot.x + lot.width / 2, y: lot.y + lot.height / 2 })
      expect(Math.min(...roads.map(road => gap(road, box))), maze.id).toBeGreaterThanOrEqual(maze.roadWidth / 2 + 6)
    }
    if (maze.water) {
      const { x, y, width, height, bridges = [] } = maze.water
      const water = bounds({ x, y }, { x: x + width, y: y + height })
      const crossings = roads.filter(road => gap(road, water) < maze.roadWidth / 2)
      expect([...new Set(crossings.map(road => road.top))].sort()).toEqual([...bridges].sort())
      for (const road of crossings) expect(road.top).toBe(road.bottom)
      for (const y of bridges) {
        expect(Math.min(...crossings.filter(road => road.top === y).map(road => road.left))).toBeLessThan(x)
        expect(Math.max(...crossings.filter(road => road.top === y).map(road => road.right))).toBeGreaterThan(x + width)
      }
    }
    metrics.push({ id: maze.id, theme: maze.theme, difficulty: maze.difficulty, fires: maze.fires.length,
      nodes: Object.keys(maze.nodes).length, roads: maze.roads.length, length: audit.solution.length,
      turns: audit.turns, legs: audit.routes.map(route => ({ length: route.length, turns: route.turns })),
      branches: audit.branches.length, complex, deadEnds, depth, wrongDistance, roadGap })
  }
  await mkdir(review, { recursive: true })
  await writeFile(review + '/metrics.json', JSON.stringify(metrics, null, 2))
})

test('two full rotations do not repeat, and old or damaged queues keep the active dispatch', () => {
  let rotation: ReturnType<typeof nextMaze> | undefined
  let state = 441
  const random = () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 2 ** 32)
  const draws = Array.from({ length: 20 }, () => {
    rotation = nextMaze(ids, rotation, random)
    return rotation.last
  })
  expect(draws.slice(0, 10).sort()).toEqual(ids)
  expect(draws.slice(10).sort()).toEqual(ids)
  expect(draws[9]).not.toEqual(draws[10])
  expect(draws.slice(0, 10)).not.toEqual(ids)

  const old = { ...initial(pilot), rotation: { last: 'M05', remaining: [] } }
  expect(decode(old)).toEqual(old)
  for (const damaged of [undefined, { last: 'M01', remaining: ['M03'] },
    { last: 'M05', remaining: ['M03', 'M03'] }, { last: 'M05', remaining: ['M20'] }]) {
    const recovered = decode({ ...old, rotation: damaged })
    expect(recovered).toEqual(old)
    const next = depart(recovered!, random)
    expect(next.mazeId).not.toEqual('M05')
    expect([next.mazeId, ...next.rotation.remaining].sort()).toEqual(ids.filter(id => id !== 'M05'))
  }
})

test('normal new dispatch, cancel, saved resume and reset cover all ten cities without a redraw', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('./')
  await expect(button(page, title)).toBeVisible()
  await capture(page, 'home')
  await button(page, title).tap()
  await expect(button(page, '출동하기')).toBeVisible()
  await capture(page, 'welcome')
  await button(page, '출동하기').tap()
  const draws = [(await read(page)).mazeId]
  for (let i = 0; i < 10; i++) {
    const before = await read(page)
    await button(page, '홈으로').tap()
    if (i === 0) await page.reload()
    await button(page, title).tap()
    await expect(button(page, '이어하기')).toBeVisible()
    if (i === 0) {
      await capture(page, 'resume')
      await button(page, '새로 시작하기').tap()
      await button(page, '계속하기').tap()
      await button(page, '이어하기').tap()
      expect(await read(page)).toEqual(before)
      await button(page, '홈으로').tap()
      await button(page, title).tap()
    }
    await button(page, '새로 시작하기').tap()
    await button(page, '새로 출동').tap()
    draws.push((await read(page)).mazeId)
  }
  expect([...draws.slice(0, 10)].sort()).toEqual(ids)
  expect(draws[9]).not.toEqual(draws[10])
})

for (const maze of mazes) {
  test(maze.id + ' starts and completes offline with every stop locked and every screen fitting', async ({ page, context }) => {
    test.setTimeout(55_000)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('./')
    await saveFixture(page, initial(maze))
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
    await page.waitForFunction(() => !!navigator.serviceWorker.controller)
    await context.setOffline(true)
    await page.reload()
    await enter(page, '이어하기')
    await expect(page.locator('[data-fire="true"]')).toHaveCount(maze.fires.length)
    await expect(truck(page)).toHaveAttribute('data-node', maze.start)
    await expect(board(page)).toBeVisible()
    const layout = []
    for (const [name, width, height] of views) {
      await page.setViewportSize({ width, height })
      const rect = (await board(page).boundingBox())!
      expect(rect.width / rect.height).toBeCloseTo(maze.width / maze.height, 3)
      expect(rect.y + rect.height).toBeLessThanOrEqual(height)
      expect(rect.x + rect.width).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      const panel = (await page.locator('.maze-controls').boundingBox())!
      const buttons = []
      for (const name of ['홈으로', '힌트', '불끄기']) {
        const control = button(page, name)
        const box = (await control.boundingBox())!
        expect(box.width).toBeGreaterThanOrEqual(48)
        expect(box.height).toBeGreaterThanOrEqual(48)
        expect(box.y + box.height).toBeLessThanOrEqual(height)
        expect(box.x + box.width).toBeLessThanOrEqual(width)
        const svg = (await control.locator('svg').boundingBox())!
        expect(svg.y + svg.height).toBeLessThan(box.y + box.height * .65)
        buttons.push([box.width, box.height])
      }
      const hit = truck(page).locator(':scope > circle')
      const expectedHit = Math.max(44, 56 * rect.width / maze.width)
      await expect.poll(async () => (await hit.boundingBox())!.width).toBeCloseTo(expectedHit, 1)
      layout.push({ name, viewport: [width, height], board: [rect.width, rect.height], panel: [panel.width, panel.height], buttons,
        roadWidth: maze.roadWidth * rect.width / maze.width, truck: [45, 24].map(size => size * rect.width / maze.width),
        tapDiameter: (await hit.boundingBox())!.width })
      await expect(truck(page)).toHaveAttribute('data-node', maze.start)
      if (['M02', 'M05', 'M07', 'M09', 'M10'].includes(maze.id)) await capture(page, maze.id + '-' + name)
    }
    await mkdir(review, { recursive: true })
    await writeFile(review + '/' + maze.id + '-layout.json', JSON.stringify(layout, null, 2))
    if (maze.id === 'M10') {
      const next = graphs.get(maze.id)!.links.get(maze.start)![0]
      for (const id of [next, maze.start]) {
        const spot = await pointOnScreen(page, maze.nodes[id])
        await page.touchscreen.tap(spot.x, spot.y)
        await expect(truck(page)).toHaveAttribute('data-node', id)
      }
    }
    await page.setViewportSize({ width: 1280, height: 800 })
    await capture(page, maze.id)
    await page.clock.install()
    const audit = validateMaze(maze)
    const water = button(page, '불끄기')
    const status = page.getByRole('status', { name: '진압 수량' })
    function direction(a: string, b: string) {
      const p = maze.nodes[a], q = maze.nodes[b]
      return p.x === q.x ? q.y > p.y ? 'ArrowDown' : 'ArrowUp' : q.x > p.x ? 'ArrowRight' : 'ArrowLeft'
    }
    for (const [i, route] of audit.routes.entries()) {
      const path = route.path
      const isFire = i < maze.fires.length
      await expect(water).toBeDisabled()
      await board(page).focus()
      for (let step = 1; step < path.length - (isFire ? 1 : 0); step++) {
        if (!isFire && maze.id === 'M10' && step === path.length - 1) await capture(page, 'M10-return')
        await page.keyboard.press(direction(path[step - 1], path[step]))
      }
      if (!isFire) break
      const end = path.at(-1)!, previous = path.at(-2)!
      const a = await pointOnScreen(page, maze.nodes[previous]), b = await pointOnScreen(page, maze.nodes[end])
      await page.mouse.move(a.x, a.y)
      await page.mouse.down()
      await page.mouse.move(b.x + (b.x - a.x) * .3, b.y + (b.y - a.y) * .3)
      await page.mouse.up()
      await expect(truck(page)).toHaveAttribute('data-node', end)
      await expect(water).toBeEnabled()
      const next = audit.routes[i + 1].path[1]
      await board(page).focus()
      await page.keyboard.press(direction(end, next))
      await expect(truck(page)).toHaveAttribute('data-node', end)
      if (i === 0 && ['M01', 'M06', 'M10'].includes(maze.id)) await capture(page, maze.id + '-ready')
      await water.tap()
      if (i === 0 && maze.id === 'M10') {
        await expect(page.locator('.maze-water')).toHaveCSS('opacity', '1')
        await capture(page, 'M10-spray')
      }
      await page.clock.runFor(2400)
      await expect(status).toHaveText('화재 진압 ' + (i + 1) + ' / ' + maze.fires.length)
      if (i === 0 && maze.id === 'M10') {
        await page.reload()
        await enter(page, '이어하기')
        await expect(status).toHaveText('화재 진압 1 / 4')
        await expect(truck(page)).toHaveAttribute('data-node', end)
        expect((await read(page)).rotation).toEqual(initial(maze).rotation)
        await button(page, '힌트').tap()
        await expect(page.locator('[data-hint]')).toHaveCount(1)
        await capture(page, 'M10-hint')
      }
    }
    await expect(page.getByRole('heading', { name: '출동 완료!' })).toBeVisible()
    const done = await read(page)
    expect(done.extinguished).toEqual(maze.fires.map(fire => fire.id))
    expect(done.complete).toBe(true)
    if (['M01', 'M06', 'M10'].includes(maze.id)) {
      await expect(page.locator('.maze-finished')).toHaveCSS('opacity', '1')
      await capture(page, maze.id + '-complete')
    }
    await button(page, '다시 하기').tap()
    expect((await read(page)).mazeId).toBe(done.rotation.remaining[0])
  })
}

test('legacy r2 M05 partial route and lock restore across the catalog update', async ({ page }) => {
  await page.goto('./')
  const graph = graphs.get(pilot.id)!
  const first = pilot.fires[0].stop
  const old: Run = { ...initial(pilot), rotation: { last: 'M05', remaining: [] },
    pose: parked(first, 0), trail: shortest(graph, pilot.start, first).path }
  await saveFixture(page, old)
  await enter(page, '이어하기')
  await expect(truck(page)).toHaveAttribute('data-node', first)
  await expect(button(page, '불끄기')).toBeEnabled()
  expect(await read(page)).toEqual(old)
  await button(page, '홈으로').tap()
  await enter(page, '새로 시작하기')
  await button(page, '새로 출동').tap()
  const newDispatch = await read(page)
  expect([newDispatch.mazeId, ...newDispatch.rotation.remaining].sort()).toEqual(ids.filter(id => id !== pilot.id))
})
