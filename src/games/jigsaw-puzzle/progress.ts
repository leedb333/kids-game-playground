import { read, write } from '../../storage'
import type { Level, Picture } from './catalog'

type Progress = {
  version: 1
  geometry: 1
  imageId: string
  level: number
  placed: number[]
  remaining: number[]
  complete: boolean
}

export const saveKey = (id: string) => `game:jigsaw-puzzle:${id}:r1`

export function fresh(level: Level, picture: Picture): Progress {
  const remaining = Array.from({ length: level.rows * level.columns }, (_, id) => id)
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
  }
  return { version: 1, geometry: 1, imageId: picture.id, level: level.id, placed: [], remaining, complete: false }
}

export function restore(raw: unknown, level: Level, picture: Picture): Progress | null {
  const value = raw as Partial<Progress> | null
  if (!value || value.version !== 1 || value.geometry !== 1 || value.imageId !== picture.id ||
      value.level !== level.id || !Array.isArray(value.placed) || !Array.isArray(value.remaining) ||
      value.complete !== (value.remaining.length === 0)) return null
  const ids = [...value.placed, ...value.remaining]
  const count = level.rows * level.columns
  if (ids.length !== count || new Set(ids).size !== count || !ids.every(id => Number.isInteger(id) && id >= 0 && id < count)) return null
  return value as Progress
}

export const loadProgress = (level: Level, picture: Picture) => restore(read<unknown>(saveKey(picture.id), null), level, picture)
export const saveProgress = (value: Progress) => write(saveKey(value.imageId), value)

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
