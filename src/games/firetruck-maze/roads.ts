import type { Maze, Point } from './maps'

export type Pose = { from: string; to: string | null; offset: number; heading: number }
export type Graph = ReturnType<typeof connect>
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export function connect(maze: Maze) {
  const links = new Map<string, string[]>(Object.keys(maze.nodes).map(id => [id, []]))
  for (const [a, b] of maze.roads) {
    const p = maze.nodes[a], q = maze.nodes[b]
    if (!p || !q || a === b || (p.x === q.x) === (p.y === q.y) || links.get(a)!.includes(b))
      throw Error(`Invalid road in ${maze.id}: ${a} → ${b}`)
    links.get(a)!.push(b)
    links.get(b)!.push(a)
  }
  return { maze, links }
}

export const atStop = (pose: Pose, node: string) => pose.from === node && pose.to === null

export const parked = (from: string, heading = 0): Pose => ({ from, to: null, offset: 0, heading })

export function position(graph: Graph, pose: Pose): Point {
  const a = graph.maze.nodes[pose.from]
  if (!pose.to) return a
  const b = graph.maze.nodes[pose.to], ratio = pose.offset / distance(a, b)
  return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio }
}

function bearing(a: Point, b: Point) {
  return a.x !== b.x ? (b.x > a.x ? 0 : 180) : (b.y > a.y ? 90 : 270)
}

export function travel(graph: Graph, initial: Pose, target: Point, goal: string) {
  let pose = initial
  const visited: string[] = []
  const { nodes } = graph.maze
  // All movement is consumed on the current edge or on a neighbor of a reached node.
  for (let hop = 0; hop < graph.links.size; hop++) {
    const current = position(graph, pose)
    if (!pose.to) {
      const dx = target.x - current.x, dy = target.y - current.y
      const horizontal = Math.abs(dx) >= Math.abs(dy)
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 3) break
      const heading = horizontal ? (dx >= 0 ? 0 : 180) : (dy >= 0 ? 90 : 270)
      const next = graph.links.get(pose.from)!.find(id => bearing(current, nodes[id]) === heading)
      if (!next) break
      pose = { ...pose, to: next, heading }
    }
    const a = nodes[pose.from], b = nodes[pose.to!], length = distance(a, b)
    const projection = ((target.x - a.x) * (b.x - a.x) + (target.y - a.y) * (b.y - a.y)) / length
    const nextOffset = projection < 3 ? 0 : projection > length - 3 ? length : projection
    const heading = nextOffset >= pose.offset ? bearing(a, b) : bearing(b, a)
    if (nextOffset > 0 && nextOffset < length) {
      pose = { ...pose, offset: nextOffset, heading }
      break
    }
    const node = nextOffset === 0 ? pose.from : pose.to!
    if (node !== pose.from) visited.push(node)
    pose = parked(node, heading)
    if (node === goal || Math.abs(projection - nextOffset) < 3) break
  }
  return { pose, visited }
}

export function adjacentStops(graph: Graph, pose: Pose) {
  return pose.to ? [pose.from, pose.to] : graph.links.get(pose.from)!
}

export function stepTo(graph: Graph, pose: Pose, next: string) {
  if (!adjacentStops(graph, pose).includes(next)) return pose
  return parked(next, bearing(position(graph, pose), graph.maze.nodes[next]))
}

export function remember(trail: string[], visited: string[]) {
  for (const point of visited) {
    const index = trail.indexOf(point)
    trail = index >= 0 ? trail.slice(0, index + 1) : [...trail, point]
  }
  return trail
}

export function shortest(graph: Graph, from: string, goal: string) {
  const { nodes } = graph.maze
  const costs = new Map<string, number>([[from, 0]])
  const previous = new Map<string, string>()
  const remaining = new Set(graph.links.keys())
  while (remaining.size) {
    let best = Infinity, next: string | undefined
    for (const id of remaining) {
      const cost = costs.get(id) ?? Infinity
      if (cost < best) { next = id; best = cost }
    }
    if (next === undefined) break
    if (next === goal) {
      const path = [next]
      for (let at = previous.get(next); at !== undefined; at = previous.get(at)) path.unshift(at)
      return { path, length: best }
    }
    remaining.delete(next)
    for (const neighbor of graph.links.get(next)!) {
      const cost = best + distance(nodes[next], nodes[neighbor])
      if (cost < (costs.get(neighbor) ?? Infinity)) {
        costs.set(neighbor, cost)
        previous.set(neighbor, next)
      }
    }
  }
  return { path: [], length: Infinity }
}

export function hintRoute(graph: Graph, pose: Pose, goal: string): Point[] {
  const start = position(graph, pose)
  const { nodes } = graph.maze
  const [route] = (pose.to ? [pose.from, pose.to] : [pose.from]).map(id => {
    const route = shortest(graph, id, goal)
    return { ...route, length: route.length + distance(start, nodes[id]) }
  }).sort((a, b) => a.length - b.length)
  const result = [start]
  let junctions = 0, length = 0
  for (const id of route.path) {
    const point = nodes[id], segment = distance(result.at(-1)!, point)
    if (!segment) continue
    result.push(point)
    length += segment
    if (graph.links.get(id)!.length >= 3) junctions++
    if (junctions === 2 || length >= 296) break
  }
  return result
}

function reachable(graph: Graph, start: string, blocked?: string) {
  const visited = new Set([start])
  // Set iteration also visits entries added while walking the graph.
  for (const node of visited) {
    for (const neighbor of graph.links.get(node)!) {
      if (neighbor !== blocked) visited.add(neighbor)
    }
  }
  return visited
}

function pathTurns(maze: Maze, path: string[]) {
  return path.slice(1, -1).filter((node, index) =>
    bearing(maze.nodes[path[index]], maze.nodes[node]) !==
    bearing(maze.nodes[node], maze.nodes[path[index + 2]])).length
}

export function validateMaze(maze: Maze) {
  const graph = connect(maze)
  const stops = [maze.start, ...maze.fires.map(f => f.stop), maze.station.stop]
  if (new Set(stops).size !== stops.length || stops.some(id => !graph.links.has(id) || !graph.links.get(id)!.length))
    throw Error('Invalid or repeated maze destinations')
  if (new Set(maze.fires.map(f => f.id)).size !== maze.fires.length) throw Error('Duplicate building')
  if (reachable(graph, maze.start).size !== graph.links.size) throw Error('Unreachable road')
  if (maze.roads.length !== graph.links.size - 1) throw Error('The road network must be a tree')
  for (const [i, [a, b]] of maze.roads.entries()) {
    const [p, q] = [maze.nodes[a], maze.nodes[b]]
    for (const [c, d] of maze.roads.slice(i + 1)) {
      const [r, s] = [maze.nodes[c], maze.nodes[d]]
      const shared = [a, b].some(id => id === c || id === d)
      const overlapX = Math.min(Math.max(p.x, q.x), Math.max(r.x, s.x)) - Math.max(Math.min(p.x, q.x), Math.min(r.x, s.x))
      const overlapY = Math.min(Math.max(p.y, q.y), Math.max(r.y, s.y)) - Math.max(Math.min(p.y, q.y), Math.min(r.y, s.y))
      if (overlapX >= 0 && overlapY >= 0 && (!shared || overlapX > 0 || overlapY > 0))
        throw Error('Visually connected roads must share a single node')
    }
  }

  const solution = shortest(graph, maze.start, maze.station.stop)
  const onSolution = new Set(solution.path)
  const orderedStops = solution.path.filter(node => stops.includes(node))
  if (orderedStops.length !== stops.length || orderedStops.some((node, i) => node !== stops[i]))
    throw Error('Fire stops must be on the unique solution in order')
  for (let i = 1; i < stops.length - 1; i++) {
    const before = reachable(graph, stops[i - 1], stops[i])
    if (stops.slice(i + 1).some(stop => before.has(stop)))
      throw Error('A fire stop can be bypassed')
  }

  const branches = solution.path.flatMap(from => graph.links.get(from)!
    .filter(entry => !onSolution.has(entry))
    .map(entry => {
      const nodes = [...reachable(graph, entry, from)]
      const deadEnds = nodes.filter(node => graph.links.get(node)!.length === 1)
      const exits = deadEnds.map(leaf => shortest(graph, from, leaf))
      return { from, entry, nodes, junctions: nodes.filter(node => graph.links.get(node)!.length >= 3), deadEnds,
        depth: Math.max(...exits.map(route => route.path.length - 1)),
        distance: Math.max(...exits.map(route => route.length)),
        turns: Math.max(...exits.map(route => pathTurns(maze, route.path))) }
    }))

  return {
    solution, turns: pathTurns(maze, solution.path), branches,
    routes: stops.slice(1).map((goal, index) => {
      const route = shortest(graph, stops[index], goal)
      return { ...route, turns: pathTurns(maze, route.path) }
    }),
    deadEnds: [...graph.links.values()].filter(list => list.length === 1).length,
    junctions: [...graph.links.values()].filter(list => list.length >= 3).length,
  }
}
