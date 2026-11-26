import { read, write } from '../../storage'
import { pictureFiles, type Picture } from './catalog'

export type Point = [number, number]
type Ellipse = { shape: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
type Circle = { shape: 'circle'; cx: number; cy: number; r: number }
type Polygon = { shape: 'polygon'; points: Point[] }
export type Region = Ellipse | Circle | Polygon
export type Side = 'original' | 'modified'
export type Answer = {
  id: string
  originalTouchRegion: Region; modifiedTouchRegion: Region
  originalDisplayRegion: Region; modifiedDisplayRegion: Region
  hintRegion?: Region
}
export type Data = { width: number; height: number; answers: Answer[] }
export const touch = (answer: Answer, side: Side) => answer[`${side}TouchRegion`]
export const display = (answer: Answer, side: Side) => answer[`${side}DisplayRegion`]
const unit = (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= 1
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const sides = ['original', 'modified'] as const

function radii(region: Ellipse | Circle) {
  return region.shape === 'circle' ? [region.r, region.r] : [region.rx, region.ry]
}

function validRegion(value: unknown): value is Region {
  if (!record(value)) return false
  if (value.shape === 'polygon') return Array.isArray(value.points) && value.points.length >= 3 &&
    value.points.every(p => Array.isArray(p) && p.length === 2 && p.every(unit))
  if (value.shape !== 'ellipse' && value.shape !== 'circle') return false
  const { cx, cy } = value
  const rx = value.shape === 'circle' ? value.r : value.rx
  const ry = value.shape === 'circle' ? value.r : value.ry
  return unit(cx) && unit(cy) && unit(rx) && unit(ry) && rx > 0 && ry > 0 &&
    cx - rx >= 0 && cx + rx <= 1 && cy - ry >= 0 && cy + ry <= 1
}

export function parseData(raw: unknown, picture: Picture): Data {
  if (!record(raw) || raw.schemaVersion !== '1.0.0' || raw.gameId !== 'spot-the-difference' ||
    raw.id !== picture.id || raw.dataVersion !== picture.version || raw.title !== picture.title ||
    raw.difficulty !== picture.difficulty || raw.differenceCount !== picture.count ||
    !record(raw.coordinates) || raw.coordinates.unit !== 'normalized' || raw.coordinates.origin !== 'top-left' ||
    typeof raw.width !== 'number' || raw.width <= 0 || raw.height !== raw.width ||
    raw.aspectRatio !== 1 || !Array.isArray(raw.answers) || raw.answers.length !== picture.count ||
    picture.count < 6 || picture.count > 10) throw new Error('Invalid picture data')
  const files = pictureFiles(picture.id)
  if (raw.originalImage !== files.original.split('/').at(-1) || raw.modifiedImage !== files.modified.split('/').at(-1) ||
    raw.thumbnail !== files.thumb.split('/').at(-1)) throw new Error('Invalid picture filename')
  const ids = new Set()
  for (const answer of raw.answers) {
    if (!record(answer) || typeof answer.id !== 'string' || !answer.id || ids.has(answer.id) ||
      !sides.every(side => validRegion(answer[`${side}TouchRegion`]) && validRegion(answer[`${side}DisplayRegion`])) ||
      (answer.hintRegion !== undefined && !validRegion(answer.hintRegion))) throw new Error('Invalid answer region')
    ids.add(answer.id)
  }
  return { width: raw.width, height: raw.width, answers: raw.answers as Answer[] }
}

export function contains(region: Region, [x, y]: Point) {
  if (!unit(x) || !unit(y)) return false
  if (region.shape !== 'polygon') {
    const [rx, ry] = radii(region)
    return ((x - region.cx) / rx) ** 2 + ((y - region.cy) / ry) ** 2 <= 1 + 1e-10
  }
  let inside = false
  for (let i = 0; i < region.points.length; i++) {
    const [ax, ay] = region.points[i], [bx, by] = region.points[(i + 1) % region.points.length]
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax)
    if (Math.abs(cross) < 1e-10 && x >= Math.min(ax, bx) && x <= Math.max(ax, bx) &&
      y >= Math.min(ay, by) && y <= Math.max(ay, by)) return true
    if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside
  }
  return inside
}

export function regionBounds(region: Region) {
  if (region.shape === 'polygon') {
    const x = region.points.map(point => point[0]), y = region.points.map(point => point[1])
    return { left: Math.min(...x), right: Math.max(...x), top: Math.min(...y), bottom: Math.max(...y) }
  }
  const [rx, ry] = radii(region)
  return { left: region.cx - rx, right: region.cx + rx, top: region.cy - ry, bottom: region.cy + ry }
}

export function answerAt(answers: readonly Answer[], side: Side, point: Point) {
  return answers.find(answer => contains(touch(answer, side), point))
}

const key = (id: string) => 'game:spot-the-difference:r1:' + id
export type Progress = {
  imageId: string; dataVersion: string; total: number; found: string[]; completedEver: boolean
}

export function progress(picture: Picture, answers?: Answer[]): Progress {
  const initial: Progress = { imageId: picture.id, dataVersion: picture.version, total: picture.count, found: [], completedEver: false }
  const saved = read<Progress | null>(key(picture.id), null)
  if (!saved || saved.imageId !== picture.id || saved.dataVersion !== picture.version || saved.total !== picture.count) return initial
  if (!Array.isArray(saved.found) || new Set(saved.found).size !== saved.found.length ||
    saved.found.length > picture.count || !saved.found.every(id => typeof id === 'string' && id.startsWith(picture.id + '-')) ||
    (answers && saved.found.some(id => !answers.some(answer => answer.id === id)))) return initial
  return { ...initial, found: saved.found, completedEver: saved.completedEver === true || saved.found.length === picture.count }
}

export const save = (value: Progress) => write(key(value.imageId), value)
