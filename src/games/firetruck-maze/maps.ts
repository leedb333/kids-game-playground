import { cityMaps } from './city-maps'

export type Point = { x: number; y: number }
type Grid = readonly [column: number, row: number]
type Road = readonly [string, string]
export type BuildingKind = 'house' | 'shop' | 'tower' | 'school' | 'hospital'
export type Lot = Point & { width: number; height: number; style: number; kind?: BuildingKind }
export type Park = Lot & { feature?: 'garden' | 'playground' | 'field' | 'plaza' }
export type Waterway = Point & { width: number; height: number; kind: 'river' | 'lake' | 'inlet'; bridges?: number[] }
export type Difficulty = '하' | '중' | '상' | '최상'
export type Fire = Lot & { id: string; stop: string }
export type Maze = {
  id: string; version: number; difficulty: Difficulty; theme: string
  width: number; height: number; roadWidth: number
  nodes: Record<string, Point>; roads: Road[]
  start: string; fires: Fire[]; station: Lot & { stop: string }
  buildings: Lot[]; parks: Park[]; water?: Waterway; ground?: string
}

const nodeId = (grid: Grid) => grid.join(',')
const point = ([column, row]: Grid): Point => ({ x: 48 + 74 * column, y: 56 + 73 * row })
const lot = (x: number, y: number, width: number, height: number, style = 0): Lot =>
  ({ ...point([x, y]), width, height, style })
const route: Grid[] = [
  [1, 7], [1, 3], [5, 3], [5, 1], [12, 1], [12, 3], [7, 3],
  [7, 5], [12, 5], [12, 7], [3, 7], [3, 5], [5, 5], [5, 6], [7, 6],
]
const streets: [Grid, Grid][] = [
  ...route.slice(1).map((node, index): [Grid, Grid] => [route[index], node]),
  [[1, 6], [0, 6]],
  [[1, 5], [2, 5]], [[2, 5], [2, 4]], [[2, 4], [3, 4]], [[2, 5], [2, 7]],
  [[1, 3], [1, 1]], [[1, 1], [3, 1]],
  [[7, 1], [7, 2]], [[7, 2], [9, 2]], [[7, 2], [6, 2]],
  [[10, 3], [10, 4]], [[10, 4], [11, 4]], [[10, 4], [9, 4]],
]

function makeNetwork(segments: [Grid, Grid][]) {
  const nodes: Record<string, Point> = {}
  const roads: Road[] = []
  for (const [first, last] of segments) {
    const dx = Math.sign(last[0] - first[0]), dy = Math.sign(last[1] - first[1])
    if (Math.abs(dx) + Math.abs(dy) !== 1) throw Error('A street must be orthogonal')
    const steps = Math.abs(last[0] - first[0]) + Math.abs(last[1] - first[1])
    for (let i = 0; i <= steps; i++) {
      const grid: Grid = [first[0] + dx * i, first[1] + dy * i]
      nodes[nodeId(grid)] = point(grid)
      if (i) roads.push([nodeId([grid[0] - dx, grid[1] - dy]), nodeId(grid)])
    }
  }
  return { nodes, roads }
}

const fires = [
  { ...lot(9.85, .15, 71, 47, 0), id: '1', stop: '10,1' },
  { ...lot(6.05, 4.13, 66, 49, 1), id: '2', stop: '7,4' },
  { ...lot(9.05, 7.92, 70, 50, 2), id: '3', stop: '9,7' },
]
const station = { ...lot(7.96, 5.98, 78, 51), stop: '7,6' }

const pilot: Maze = {
  id: 'M05', version: 2, difficulty: '하', theme: '아파트 단지',
  width: 1060, height: 700, roadWidth: 46, ...makeNetwork(streets),
  start: '1,7', fires, station,
  buildings: [
    lot(.05, .75, 54, 59, 0), lot(1.8, .15, 62, 49, 3), lot(3, .17, 54, 57, 1),
    lot(5, .12, 57, 44, 2), lot(7.55, .22, 56, 51, 3), lot(8.62, .14, 58, 49, 1),
    lot(13, .45, 65, 60, 0), lot(4.05, .4, 83, 44, 2),
    lot(3.45, 2, 71, 57, 1),
    lot(6.07, .15, 76, 45, 0),
    lot(6, 3, 64, 56, 3), lot(11, 2, 53, 69, 3), lot(13.02, 2.7, 57, 49, 2),
    lot(.18, 5.14, 58, 60, 1), lot(4.12, 4.02, 69, 53, 3),
    lot(5.38, 4.13, 69, 57, 0), lot(8.06, 4.15, 74, 48, 0),
    lot(12.95, 3.95, 54, 57, 2), lot(.08, 4.15, 58, 71, 0),
    lot(4, 6.12, 72, 53, 2), lot(12.97, 5.65, 64, 53, 1),
    lot(10.1, 6.06, 53, 63, 3), lot(11.1, 6.02, 57, 55, 0),
    lot(12.95, 7.05, 60, 64, 1), lot(10.6, 7.94, 69, 50, 2),
    lot(6.65, 8.06, 78, 53, 0), lot(8.32, 8.03, 68, 52, 3), lot(1.08, 8.12, 66, 52, 2),
  ],
  parks: [
    lot(9.1, 5.98, 61, 63), lot(3.2, 7.93, 52, 68),
    lot(4.87, 8.01, 65, 52), lot(11, 6.4, 44, 17),
  ],
}

export const mazes: readonly Maze[] = [...cityMaps, pilot].sort((a, b) => a.id.localeCompare(b.id))
