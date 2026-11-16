export const flavors=['vanilla','chocolate','strawberry','mint-choco','cookies-cream','mango','blueberry','pistachio','cotton-candy','rainbow-sherbet'] as const
export const labels=['바닐라','초콜릿','딸기','민트초코','쿠키앤크림','망고','블루베리','피스타치오','솜사탕','레인보우샤베트']
export type Flavor=typeof flavors[number]
import {counts,toppingConfig,validDecoration,type Decoration} from './toppings'
export type State={version:1;container:'cup'|'cone';scoops:Flavor[];step:1|2|3;sound:boolean;toppings?:Decoration[]}
export const key='kids-cooking-v2-icecream-v1'
export const fresh=():State=>({version:1,container:'cup',scoops:[],step:1,sound:true})
export function read():State{try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s?.version===1&&['cup','cone'].includes(s.container)&&[1,2,3].includes(s.step)&&typeof s.sound==='boolean'&&Array.isArray(s.scoops)&&s.scoops.length<=3&&s.scoops.every((f:Flavor)=>flavors.includes(f))){const toppings=s.toppings===undefined?[]:s.toppings;if(Array.isArray(toppings)&&toppings.length<=Object.values(toppingConfig).reduce((sum,t)=>sum+t.limit,0)&&toppings.every(validDecoration)&&Object.entries(counts(toppings)).every(([k,n])=>n<=toppingConfig[k as keyof typeof toppingConfig].limit))return{...s,step:s.step===3&&!s.scoops.length?2:s.step,toppings}}}catch{/* Storage is optional. */}return fresh()}
