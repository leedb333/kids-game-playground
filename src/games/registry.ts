import type { ComponentType } from 'react'
export type GameId = 'coloring' | 'cooking' | 'dressup' | 'bricks'
export type GameDefinition = { id:GameId; title:string; color:string; caption:string } & ({status:'coming-soon'} | {status:'ready'; load:()=>Promise<{default:ComponentType}>})
export const games:GameDefinition[] = [
  {id:'coloring',title:'순서대로 색칠놀이',caption:'알록달록, 하나씩 칠해요',color:'pink',status:'ready',load:()=>import('./coloring')},
  {id:'cooking',title:'요리놀이',caption:'맛있는 상상을 만들어요',color:'yellow',status:'coming-soon'},
  {id:'dressup',title:'코디놀이',caption:'내가 고르는 오늘의 옷',color:'purple',status:'coming-soon'},
  {id:'bricks',title:'벽돌깨기',caption:'통통! 신나게 맞혀요',color:'green',status:'coming-soon'},
]
