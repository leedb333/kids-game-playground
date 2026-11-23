import type { ComponentType } from 'react'
export type GameId = 'bricks' | 'memory'
export type GameDefinition = { id: GameId; title: string; color: string; caption: string; load: () => Promise<{ default: ComponentType }> }
export const games:GameDefinition[] = [
  {id:'bricks',title:'벽돌깨기',caption:'통통! 신나게 맞혀요',color:'green',load:()=>import('./brick-breaker')},
  {id:'memory',title:'반짝반짝 짝꿍 카드',caption:'같은 그림의 짝꿍을 찾아요',color:'blue',load:()=>import('./memory-card')},
]
