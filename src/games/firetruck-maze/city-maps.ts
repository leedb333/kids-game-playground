import type { BuildingKind, Difficulty, Maze, Park, Point, Waterway } from './maps'
import { districts } from './districts'

type Grid = readonly [column: number, row: number]
type Landmark = readonly [stop: Grid, lot: Grid]
type BuildingLot = readonly [column: number, row: number, width: number, height: number, kind: BuildingKind, style: number]
type GreenLot = readonly [column: number, row: number, width: number, height: number, feature: NonNullable<Park['feature']>]
export type District = {
  id: string; theme: string; difficulty: Difficulty; ground: string
  roads: readonly string[]; start: Grid; padding?: Grid; fires: readonly Landmark[]; station: Landmark
  buildings: readonly BuildingLot[]; parks: readonly GreenLot[]
  water?: { kind: Waterway['kind']; from: Grid; to: Grid; bridges?: number[] }
}

const spacing = 74
const point = ([column, row]: Grid): Point => ({ x: 54 + spacing * column, y: 58 + spacing * row })
const idOf = (grid: Grid) => grid.join(',')

function registerCity(district: District): Maze {
  const { roads: plan, water, fires, station, padding = [0, 0] } = district
  const nodes: Maze['nodes'] = {}
  const roads: Maze['roads'] = []
  for (const [y, row] of plan.entries()) {
    for (const [x, cell] of [...row].entries()) {
      if (cell === '.') continue
      // Each cell stores its east (1) and south (2) connections. Incoming edges are implicit.
      const directions = Number(cell)
      if (!/^[0-3]$/.test(cell)) throw Error(`Invalid cell in ${district.id}: ${cell}`)
      const here = idOf([x, y])
      nodes[here] = point([x, y])
      if (directions & 1) roads.push([here, idOf([x + 1, y])])
      if (directions & 2) roads.push([here, idOf([x, y + 1])])
    }
  }
  return {
    id: district.id, theme: district.theme, difficulty: district.difficulty, version: 1, ground: district.ground,
    width: plan[0].length * spacing + 34 + padding[0], height: plan.length * spacing + 42 + padding[1],
    roadWidth: 46, nodes, roads,
    start: idOf(district.start),
    fires: fires.map(([stop, lot], i) => ({ ...point(lot), width: 64, height: 46,
      style: i, id: String(i + 1), stop: idOf(stop) })),
    station: { ...point(station[1]), stop: idOf(station[0]), style: 0, width: 74, height: 48 },
    buildings: district.buildings.map(([x, y, width, height, kind, style]) =>
      ({ ...point([x, y]), width, height, kind, style })),
    parks: district.parks.map(([x, y, width, height, feature]) =>
      ({ ...point([x, y]), width, height, feature, style: 0 })),
    water: water && { ...point(water.from), width: (water.to[0] - water.from[0]) * spacing,
      height: (water.to[1] - water.from[1]) * spacing, kind: water.kind,
      bridges: water.bridges?.map(row => point([0, row]).y) },
  }
}

export const cityMaps = districts.map(registerCity)
