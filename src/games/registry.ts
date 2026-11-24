import type { ComponentType } from 'react'
export type GameId = 'bricks' | 'memory' | 'jigsaw-puzzle'
export type GameDefinition = { id: GameId; title: string; color: string; caption: string; load: () => Promise<{ default: ComponentType }> }
export const games:GameDefinition[] = [
  {id:'bricks',title:'벽돌깨기',caption:'통통! 신나게 맞혀요',color:'green',load:()=>import('./brick-breaker')},
  {id:'memory',title:'반짝반짝 짝꿍 카드',caption:'같은 그림의 짝꿍을 찾아요',color:'blue',load:()=>import('./memory-card')},
  {id:'jigsaw-puzzle',title:'그림 퍼즐 맞추기',caption:'그림 조각을 모아 맞춰요',color:'purple',load:()=>import('./jigsaw-puzzle')},
]
