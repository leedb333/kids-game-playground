export type Picture = {
  id: string; title: string; difficulty: string; count: number; version: string
  enabled: boolean; offline: boolean
}

export const pictures: readonly Picture[] = [
  { id: 'D02', title: '즐거운 가족 소풍', difficulty: '하', count: 6,
    version: 'D02-1.0.0', enabled: true, offline: false },
  { id: 'D03', title: '맛있는 케이크 가게', difficulty: '하', count: 6,
    version: 'D03-1.0.0', enabled: true, offline: false },
  { id: 'D01', title: '동물 친구들의 놀이터', difficulty: '중하', count: 7,
    version: 'D01-1.0.0', enabled: true, offline: true },
  { id: 'D04', title: '자동차가 다니는 도시', difficulty: '중하', count: 7,
    version: 'D04-1.0.0', enabled: true, offline: false },
  { id: 'D05', title: '공룡들의 세상', difficulty: '중', count: 8,
    version: 'D05-1.0.0', enabled: true, offline: false },
  { id: 'D06', title: '신나는 바닷속 탐험', difficulty: '중', count: 8,
    version: 'D06-1.0.0', enabled: true, offline: false },
  { id: 'D07', title: '동화 속 마법의 성', difficulty: '상', count: 9,
    version: 'D07-1.0.0', enabled: true, offline: false },
  { id: 'D08', title: '즐거운 놀이공원', difficulty: '상', count: 9,
    version: 'D08-1.0.0', enabled: true, offline: false },
  { id: 'D09', title: '신비로운 우주여행', difficulty: '최상', count: 10,
    version: 'D09-1.0.0', enabled: true, offline: false },
  { id: 'D10', title: '크리스마스 마을', difficulty: '최상', count: 10,
    version: 'D10-1.0.0', enabled: true, offline: false },
]

export function pictureFiles(id: string) {
  const dir = `assets/spot-the-difference/${id}/`
  return {
    data: dir + id + '.json', original: dir + id + '-original.webp',
    modified: dir + id + '-modified.webp', thumb: dir + id + '-thumbnail.webp',
  }
}
