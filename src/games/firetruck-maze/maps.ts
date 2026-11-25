export type Point = { x: number; y: number }
type Grid = readonly [column: number, row: number]
type Road = readonly [string, string]
type Lot = Point & { width: number; height: number; style: number }
export type Fire = Lot & { id: string; stop: string }
export type Maze = {
  id: string; version: number; difficulty: number; theme: string
  width: number; height: number; roadWidth: number
  nodes: Record<string, Point>; roads: Road[]
  start: string; fires: Fire[]; station: Lot & { stop: string }
  buildings: Lot[]; parks: Lot[]
}

const nodeId = (grid: Grid) => grid.join(',')
const point = ([column, row]: Grid): Point => ({ x: 48 + 74 * column, y: 56 + 73 * row })
const lot = (x: number, y: number, width: number, height: number, style = 0): Lot =>
  ({ ...point([x, y]), width, height, style })
const streets: [Grid, Grid][] = [
  [[1, 1], [12, 1]], [[1, 7], [12, 7]], [[1, 1], [1, 7]], [[12, 1], [12, 7]],
  [[1, 3], [10, 3]], [[10, 1], [10, 5]], [[3, 5], [12, 5]],
  [[3, 3], [3, 7]], [[5, 1], [5, 3]], [[7, 3], [7, 7]], [[9, 5], [9, 7]],
  [[0, 2], [1, 2]], [[4, 0], [4, 1]], [[11, 0], [11, 1]],
  [[12, 4], [13, 4]], [[6, 7], [6, 8]], [[0, 6], [1, 6]],
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
  { ...lot(3.1, 7.9, 72, 50, 1), id: '2', stop: '3,7' },
  { ...lot(12.97, 5.65, 68, 53, 2), id: '3', stop: '12,5' },
]
const station = { ...lot(6.2, .13, 80, 51), stop: '6,1' }

export const mazes: readonly Maze[] = [{
  id: 'M05', version: 1, difficulty: 7, theme: '아파트 단지',
  width: 1060, height: 700, roadWidth: 46, ...makeNetwork(streets),
  start: '1,7', fires, station,
  buildings: [
    lot(.05, .75, 54, 59, 0), lot(1.8, .15, 62, 49, 3), lot(3, .17, 54, 57, 1),
    lot(5, .12, 57, 44, 2), lot(7.55, .22, 56, 51, 3), lot(8.62, .14, 58, 49, 1),
    lot(13, .45, 65, 60, 0), lot(2.22, 2.02, 83, 56, 2),
    lot(3.64, 2, 71, 57, 1), lot(4.32, 2, 45, 59, 3),
    lot(6.07, 2, 76, 58, 0), lot(7.48, 2, 56, 64, 1), lot(8.86, 2, 69, 51, 2),
    lot(11, 2, 53, 69, 3), lot(13.02, 2.7, 57, 49, 2),
    lot(2.03, 4.26, 58, 68, 1), lot(4.12, 4.02, 69, 53, 3),
    lot(5.38, 4.13, 69, 57, 0), lot(8.06, 4.15, 74, 48, 0),
    lot(11, 3.9, 54, 57, 2), lot(.08, 4.2, 58, 71, 0),
    lot(4.34, 6.12, 72, 53, 2), lot(5.58, 6.0, 64, 56, 1),
    lot(10.1, 6.06, 53, 63, 3), lot(11.1, 6.02, 57, 55, 0),
    lot(12.95, 7.05, 60, 64, 1), lot(10.6, 7.94, 69, 50, 2),
    lot(8.32, 8.03, 68, 52, 3), lot(1.08, 8.12, 66, 52, 2),
  ],
  parks: [
    lot(9.15, 4.08, 61, 63), lot(8, 6, 76, 67), lot(2.0, 6.09, 52, 68),
    lot(6.13, 4.15, 58, 62), lot(11, 6.55, 44, 17),
  ],
}]
