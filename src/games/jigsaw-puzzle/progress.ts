import { read, write } from '../../storage'
import type { Level, Picture } from './catalog'

type Progress = {
  version: 1
  geometry: 1 | 2
  imageId: string
  level: number
  rows: number
  columns: number
  pieceCount: number
  placed: number[]
  remaining: number[]
  complete: boolean
}

export const saveKey = (id: string, geometry = 1) => `game:jigsaw-puzzle:${id}:r${geometry}`
const geometryFor = (level: Level) => level.id >= 4 ? 2 : 1

export function fresh(level: Level, picture: Picture): Progress {
  const remaining = Array.from({ length: level.rows * level.columns }, (_, id) => id)
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
  }
  return {
    version: 1, geometry: geometryFor(level), imageId: picture.id, level: level.id,
    rows: level.rows, columns: level.columns, pieceCount: remaining.length, placed: [], remaining, complete: false,
  }
}

function decode(raw: unknown, level: Level, picture: Picture, geometry: 1 | 2, rows: number, columns: number): Progress | null {
  const value = raw as Partial<Progress> | null
  if (!value || value.version !== 1 || value.geometry !== geometry || value.imageId !== picture.id ||
      value.level !== level.id || !Array.isArray(value.placed) || !Array.isArray(value.remaining) ||
      value.complete !== (value.remaining.length === 0)) return null
  const count = rows * columns
  const legacy = geometry === 1 && value.rows === undefined && value.columns === undefined && value.pieceCount === undefined
  if (!legacy && (value.rows !== rows || value.columns !== columns || value.pieceCount !== count)) return null
  const ids = [...value.placed, ...value.remaining]
  if (ids.length !== count || new Set(ids).size !== count || !ids.every(id => Number.isInteger(id) && id >= 0 && id < count)) return null
  return { ...value, rows, columns, pieceCount: count } as Progress
}

export const restore = (raw: unknown, level: Level, picture: Picture) =>
  decode(raw, level, picture, geometryFor(level), level.rows, level.columns)

export const loadProgress = (level: Level, picture: Picture) =>
  restore(read<unknown>(saveKey(picture.id, geometryFor(level)), null), level, picture)
export const saveProgress = (value: Progress) => write(saveKey(value.imageId, value.geometry), value)

export function completedLegacyPuzzle(level: Level, picture: Picture) {
  if (geometryFor(level) === 1) return false
  const old = read<unknown>(saveKey(picture.id), null)
  return decode(old, level, picture, 1, 4, level.id === 4 ? 6 : 8)?.complete === true
}

export function place(value: Progress, id: number): Progress {
  if (!value.remaining.includes(id)) return value
  return {
    ...value, placed: [...value.placed, id],
    remaining: value.remaining.filter(piece => piece !== id), complete: value.remaining.length === 1,
  }
}

export function undo(value: Progress): Progress {
  const last = value.placed.at(-1)
  if (last === undefined) return value
  return { ...value, placed: value.placed.slice(0, -1), remaining: [...value.remaining, last], complete: false }
}
