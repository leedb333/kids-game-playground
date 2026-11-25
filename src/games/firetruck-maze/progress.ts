import { read, write } from '../../storage'
import { mazes } from './maps'
import { connect, distance, parked, type Pose } from './roads'

export const saveKey = 'game:firetruck-maze:r1'
export const graphs = new Map(mazes.map(maze => [maze.id, connect(maze)]))

type Rotation = { remaining: string[]; last: string }
export type Run = {
  version: 1; mazeId: string; mazeVersion: number; rotation: Rotation
  pose: Pose; extinguished: string[]; target: string; trail: string[]; complete: boolean
}
export const nextTarget = (mazeId: string, extinguished: string[]) =>
  graphs.get(mazeId)!.maze.fires[extinguished.length]?.id ?? 'station'

export function nextMaze(ids: readonly string[], rotation?: Rotation, random = Math.random): Rotation {
  const queue = rotation?.remaining.length ? [...rotation.remaining] : [...ids]
  if (!rotation?.remaining.length) {
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[queue[i], queue[j]] = [queue[j], queue[i]]
    }
    if (queue.length > 1 && queue[0] === rotation?.last) [queue[0], queue[1]] = [queue[1], queue[0]]
  }
  return { last: queue.shift()!, remaining: queue }
}

export function depart(previous?: Run): Run {
  const rotation = nextMaze([...graphs.keys()], previous?.rotation)
  const maze = graphs.get(rotation.last)!.maze
  return { version: 1, mazeId: maze.id, mazeVersion: maze.version, rotation,
    pose: parked(maze.start), extinguished: [], target: maze.fires[0]?.id ?? 'station',
    trail: [maze.start], complete: false }
}

export function decode(raw: unknown): Run | null {
  const run = raw as Run | null
  if (!run || run.version !== 1) return null
  const graph = graphs.get(run.mazeId)
  if (!graph || run.mazeVersion !== graph.maze.version) return null
  const { pose, rotation, trail, extinguished, target, complete } = run
  const { maze, links } = graph
  if (!pose || !links.has(pose.from) || ![0, 90, 180, 270].includes(pose.heading) ||
      !Number.isFinite(pose.offset)) return null
  if (pose.to === null ? pose.offset !== 0 :
      !links.get(pose.from)!.includes(pose.to) || pose.offset <= 0 ||
      pose.offset >= distance(maze.nodes[pose.from], maze.nodes[pose.to])) return null
  if (!Array.isArray(trail) || trail[0] !== maze.start || trail.at(-1) !== pose.from ||
      new Set(trail).size !== trail.length || trail.some((id, i) => !links.has(id) ||
      (i > 0 && !links.get(trail[i - 1])!.includes(id)))) return null
  if (!Array.isArray(extinguished) || extinguished.length > maze.fires.length ||
      extinguished.some((id, i) => id !== maze.fires[i].id) ||
      target !== nextTarget(maze.id, extinguished)) return null
  if (complete !== (target === 'station' && pose.from === maze.station.stop && pose.to === null)) return null
  if (!rotation || rotation.last !== maze.id || !Array.isArray(rotation.remaining) ||
      new Set(rotation.remaining).size !== rotation.remaining.length ||
      rotation.remaining.some(id => id === maze.id || !graphs.has(id))) return null
  return run
}

export const load = () => decode(read<unknown>(saveKey, null))
export const save = (run: Run) => write(saveKey, run)
