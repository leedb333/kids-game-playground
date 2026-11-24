export const size = 1000

type Point = [number, number]
type Curve = [Point, Point, Point, Point]

// The same cubic segments are used in reverse on the neighboring piece.
const profile: Curve[] = [
  [[0, 0], [.15, 0], [.31, 0], [.38, 0]],
  [[.38, 0], [.45, 0], [.33, .52], [.37, .76]],
  [[.37, .76], [.41, 1.08], [.59, 1.08], [.63, .76]],
  [[.63, .76], [.67, .52], [.55, 0], [.62, 0]],
  [[.62, 0], [.69, 0], [.85, 0], [1, 0]],
]

function edge(x: number, y: number, dx: number, dy: number, depth: number): Curve[] {
  const length = Math.hypot(dx, dy)
  const map = ([along, across]: Point): Point => [
    x + along * dx - across * dy / length * depth,
    y + along * dy + across * dx / length * depth,
  ]
  const curves = depth === 0 ? [[[0, 0], [0, 0], [1, 0], [1, 0]] as Curve] : profile
  return curves.map(([a, b, c, d]) => [map(a), map(b), map(c), map(d)])
}

const reverse = (curves: Curve[]): Curve[] => [...curves].reverse().map(([a, b, c, d]) => [d, c, b, a])

export function makePieces(rows: number, columns: number) {
  const width = size / columns
  const height = size / rows
  const padding = Math.min(width, height) * .24
  const horizontal = Array.from({ length: rows + 1 }, (_, row) =>
    Array.from({ length: columns }, (_, col) =>
      edge(col * width, row * height, width, 0, row === 0 || row === rows ? 0 : padding * ((row + col) % 2 ? 1 : -1)),
    ),
  )
  const vertical = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns + 1 }, (_, col) =>
      edge(col * width, row * height, 0, height, col === 0 || col === columns ? 0 : padding * ((row + col) % 2 ? -1 : 1)),
    ),
  )
  return Array.from({ length: rows * columns }, (_, id) => {
    const row = Math.floor(id / columns), col = id % columns
    const x = col * width, y = row * height
    const edges = [horizontal[row][col], vertical[row][col + 1], reverse(horizontal[row + 1][col]), reverse(vertical[row][col])]
    const path = `M ${x} ${y} ` + edges.flat().map(([, a, b, c]) => `C ${a.join(' ')} ${b.join(' ')} ${c.join(' ')}`).join(' ') + ' Z'
    return { id, x, y, width, height, padding, path, edges }
  })
}
export type Piece = ReturnType<typeof makePieces>[number]

export function fits(piece: Piece, x: number, y: number) {
  return Math.abs(x - piece.x - piece.width / 2) <= piece.width * .43 &&
    Math.abs(y - piece.y - piece.height / 2) <= piece.height * .43
}
