export type Picture = {
  id: string; title: string; difficulty: string; count: number; version: string
  enabled: boolean; offline: boolean
}

export const pictures: readonly Picture[] = [
  { id: 'D01', title: '동물 친구들의 놀이터', difficulty: '중하', count: 7,
    version: 'D01-1.0.0', enabled: true, offline: true },
]

export function pictureFiles(id: string) {
  const dir = `assets/spot-the-difference/${id}/`
  return {
    data: dir + id + '.json', original: dir + id + '-original.webp',
    modified: dir + id + '-modified.webp', thumb: dir + id + '-thumbnail.webp',
  }
}
