import type {CookingState} from '../types'
export type PizzaTool='rolling-pin'|'spoon'|'cutter'
export type Sauce='tomato'|'cream'
export type PizzaInteraction={tool:PizzaTool|null;horizontal:number;vertical:number;sauce:Sauce|null;sauceCells:number[];oven:'closed'|'open'|'loaded'|'baking'|'done';cuts:number[]}
export type PizzaState=CookingState & {interaction:PizzaInteraction}
// Twelve broad, overlapping brush zones; no precision or pixel-perfect coverage needed.
export const sauceZones=Array.from({length:12},(_,i)=>{const angle=i*Math.PI/6,r=i%2?105:62;return {x:300+Math.cos(angle)*r,y:240+Math.sin(angle)*r}})
export const cutAngles=Array.from({length:8},(_,i)=>i*Math.PI/4-Math.PI/2)
