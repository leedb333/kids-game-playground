const themes = [
  ['동물 친구들', 3, 3, ['강아지', '고양이', '토끼', '판다']],
  ['탈것 친구들', 3, 4, ['비행기', '기차', '우주선', '크루즈선']],
  ['상상 속 모험', 4, 4, ['공룡', '거북이', '동화 속 성', '로봇']],
  ['자연과 계절', 4, 6, ['봄', '여름', '가을', '겨울']],
  ['놀이공원', 4, 8, ['범퍼카', '회전목마', '후룸라이드', '롤러코스터']],
] as const

export const levels = themes.map(([theme, rows, columns, titles], index) => {
  const id = index + 1
  const label = String(id).padStart(2, '0')
  const pictures = titles.map((title, picture) => {
    const id = `L${label}-0${picture + 1}`
    return { id, title, path: `assets/puzzle/level-${label}/${id}.webp` }
  })
  return { id, theme, rows, columns, pictures }
})
export type Level = (typeof levels)[number]
export type Picture = Level['pictures'][number]
