export const size = 1000

type Point = [number, number]
export type Curve = [Point, Point, Point, Point]

// The same cubic segments are used in reverse on the neighboring piece.
const profile: Curve[] = [
  [[0, 0], [.15, 0], [.31, 0], [.38, 0]],
  [[.38, 0], [.45, 0], [.33, .52], [.37, .76]],
  [[.37, .76], [.41, 1.08], [.59, 1.08], [.63, .76]],
  [[.63, .76], [.67, .52], [.55, 0], [.62, 0]],
  [[.62, 0], [.69, 0], [.85, 0], [1, 0]],
]

export const variedGeometry = 3
export const geometryFor = (level: { id: number }) => level.id >= 3 ? variedGeometry : 1

function seeded(source: string) {
  let state = 2166136261
  for (const char of source) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
  return (limit: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return Math.floor(state / 4294967296 * limit)
  }
}

function edge(x: number, y: number, dx: number, dy: number, depth: number, pick?: ReturnType<typeof seeded>) {
  const length = Math.hypot(dx, dy)
  const internal = depth !== 0
  const direction = internal && pick ? (pick(2) ? 1 : -1) : Math.sign(depth)
  const center = internal && pick ? pick(3) : 1
  const width = internal && pick ? [.65, .83, 1][pick(3)] : 1
  const relief = internal && pick ? direction * Math.abs(depth) * [.49, .63, .77][pick(3)] : depth
  const skew = internal && pick ? [-.018, 0, .018][pick(3)] : 0
  const map = ([along, across]: Point): Point => {
    // Keep the endpoints fixed. Active curves stay away from both corner
    // strips, and perpendicular depth is smaller than those strips.
    const t = !pick || along === 0 || along === 1 ? along : .38 + center * .12 + (along - .5) * width + across * skew
    return [x + t * dx - across * dy / length * relief, y + t * dy + across * dx / length * relief]
  }
  const curves = internal ? profile : [[[0, 0], [0, 0], [1, 0], [1, 0]] as Curve]
  return { curves: curves.map(([a, b, c, d]): Curve => [map(a), map(b), map(c), map(d)]), direction, center }
}

const reverse = (curves: Curve[]): Curve[] => [...curves].reverse().map(([a, b, c, d]) => [d, c, b, a])

function buildPieces(rows: number, columns: number, pick?: ReturnType<typeof seeded>) {
  const width = size / columns
  const height = size / rows
  const padding = Math.min(width, height) * .24
  const horizontal = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns }, (_, col) =>
      edge(col * width, row * height, width, 0, row === 0 || row === rows ? 0 : padding * ((row + col) % 2 ? 1 : -1), pick),
    ),
  )
  const vertical = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns + 1 }, (_, col) =>
      edge(col * width, row * height, 0, height, col === 0 || col === columns ? 0 : padding * ((row + col) % 2 ? -1 : 1), pick),
    ),
  )
  return Array.from({ length: rows * columns }, (_, id) => {
    const row = Math.floor(id / columns), col = id % columns
    const x = col * width, y = row * height
    const sides = [horizontal[row][col], vertical[row][col + 1], horizontal[row + 1][col], vertical[row][col]]
    const edges = sides.map(({ curves }, index) => index < 2 ? curves : reverse(curves))
    // Coarse signature forces at least one different tab position or polarity.
    const pattern = sides.map(({ direction, center }, index) =>
      direction ? `${direction * (index < 2 ? 1 : -1)}/${center}` : 'flat',
    ).join(';')
    // The profile's outward peak is at the midpoint of its symmetric top
    // curve. The other segments stay inside that peak and the edge endpoints.
    const points = edges.flat().flatMap(([a, b, c, d]) => [
      a, d,
      a.map((axis, i) => (axis + 3 * b[i] + 3 * c[i] + d[i]) / 8),
    ])
    const xs = points.map(point => point[0]), ys = points.map(point => point[1])
    const minX = Math.min(...xs), minY = Math.min(...ys)
    const bounds = { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY }
    const path = `M ${x} ${y} ` + edges.flat().map(([, a, b, c]) => `C ${a.join(' ')} ${b.join(' ')} ${c.join(' ')}`).join(' ') + ' Z'
    return { id, x, y, width, height, bounds, path, edges, pattern }
  })
}
export type Piece = ReturnType<typeof buildPieces>[number]

export function shapeSignature(piece: Piece) {
  return piece.edges.map(edge => edge.map(curve => curve.map(([x, y]) =>
    [Math.round((x - piece.x) * 1e6), Math.round((y - piece.y) * 1e6)],
  ))).map(edge => JSON.stringify(edge)).join(';')
}

export function makePieces(rows: number, columns: number, imageId?: string) {
  if (!imageId) return buildPieces(rows, columns)
  for (let attempt = 0; attempt < 32; attempt++) {
    const pieces = buildPieces(rows, columns, seeded(`jigsaw:${variedGeometry}:${imageId}:${rows}x${columns}:${attempt}`))
    if (new Set(pieces.map(piece => piece.pattern)).size === pieces.length &&
        new Set(pieces.map(shapeSignature)).size === pieces.length) return pieces
  }
  throw new Error(`Could not generate distinct jigsaw outlines for ${imageId}`)
}

export function fits(piece: Piece, x: number, y: number) {
  return Math.abs(x - piece.x - piece.width / 2) <= piece.width * .43 &&
    Math.abs(y - piece.y - piece.height / 2) <= piece.height * .43
}
