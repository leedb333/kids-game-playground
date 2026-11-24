import { test, expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { levels } from '../src/games/jigsaw-puzzle/catalog'
import { makePieces, shapeSignature, type Curve, type Piece } from '../src/games/jigsaw-puzzle/geometry'

const reverse = (curves: Curve[]): Curve[] =>
  [...curves].reverse().map(([a, b, c, d]) => [d, c, b, a])

function selfIntersects(piece: Piece) {
  const points = piece.edges.flat().flatMap(([a, b, c, d]) =>
    Array.from({ length: 12 }, (_, i) => {
      const t = i / 12, u = 1 - t
      return a.map((value, axis) => u ** 3 * value + 3 * u * u * t * b[axis] + 3 * u * t * t * c[axis] + t ** 3 * d[axis])
    }),
  )
  const cross = (a: number[], b: number[], c: number[]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  return points.some((a, i) => {
    const b = points[(i + 1) % points.length]
    return points.some((c, j) => {
      if (j <= i + 1 || (i === 0 && j === points.length - 1)) return false
      const d = points[(j + 1) % points.length]
      return cross(a, b, c) * cross(a, b, d) < -1e-8 && cross(c, d, a) * cross(c, d, b) < -1e-8
    })
  })
}

test('audit the 244 seeded outlines and retain a separate silhouette similarity measurement', async ({ page }, info) => {
  const report = []
  for (const level of levels.slice(2)) {
    for (const picture of level.pictures) {
      const old = makePieces(level.rows, level.columns)
      const pieces = makePieces(level.rows, level.columns, picture.id)
      expect(pieces).toHaveLength(level.rows * level.columns)
      expect(pieces).toEqual(makePieces(level.rows, level.columns, picture.id))
      const signatures = new Set(pieces.map(shapeSignature))
      expect(signatures.size).toBe(pieces.length)
      expect(new Set(pieces.map(piece => piece.pattern)).size).toBe(pieces.length)
      for (const piece of pieces) {
        const row = Math.floor(piece.id / level.columns), col = piece.id % level.columns
        expect(selfIntersects(piece)).toBe(false)
        if (col < level.columns - 1) expect(piece.edges[1]).toEqual(reverse(pieces[piece.id + 1].edges[3]))
        if (row < level.rows - 1) expect(piece.edges[2]).toEqual(reverse(pieces[piece.id + level.columns].edges[0]))
        if (row === 0) expect(piece.edges[0].flat().every(point => point[1] === 0)).toBe(true)
        if (col === 0) expect(piece.edges[3].flat().every(point => point[0] === 0)).toBe(true)
        if (row === level.rows - 1) expect(piece.edges[2].flat().every(point => point[1] === 1000)).toBe(true)
        if (col === level.columns - 1) expect(piece.edges[1].flat().every(point => point[0] === 1000)).toBe(true)
      }
      const result = await page.evaluate(({ pieces, old }) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        const paths = pieces.map(piece => new Path2D(piece.path))
        let gaps = 0, overlaps = 0
        for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
          const covered = paths.filter(path => ctx.isPointInPath(path, (x + .371) * 1000 / 64, (y + .719) * 1000 / 64)).length
          if (covered === 0) gaps++
          if (covered > 1) overlaps++
        }
        function similarity(group: typeof pieces) {
          const resolution = 64
          const masks = group.map(({ x, y, width, height, path }) => {
            const shape = new Path2D(path)
            return Uint8Array.from({ length: resolution * resolution }, (_, i) => Number(ctx.isPointInPath(shape,
              x + width * ((i % resolution + .5) / resolution * 1.5 - .25),
              y + height * ((Math.floor(i / resolution) + .5) / resolution * 1.5 - .25),
            )))
          })
          let closest = 0, nearPairs = 0
          let closestIds: number[] = []
          for (let i = 0; i < masks.length; i++) for (let j = i + 1; j < masks.length; j++) {
            let both = 0, either = 0
            for (let k = 0; k < masks[i].length; k++) {
              both += masks[i][k] & masks[j][k]
              either += masks[i][k] | masks[j][k]
            }
            const ratio = both / either
            if (ratio > closest) { closest = ratio; closestIds = [i + 1, j + 1] }
            if (ratio >= .95) nearPairs++
          }
          return { closest: +closest.toFixed(4), closestIds, nearPairs }
        }
        return { gaps, overlaps, before: similarity(old), after: similarity(pieces) }
      }, { pieces, old })
      expect(result.gaps).toBe(0)
      expect(result.overlaps).toBe(0)
      report.push({ id: picture.id, title: picture.title, count: pieces.length,
        uniqueBefore: new Set(old.map(shapeSignature)).size, uniqueAfter: signatures.size, ...result })
    }
  }
  await writeFile(info.outputPath('shape-audit.json'), JSON.stringify(report, null, 2) + '\n')
})
