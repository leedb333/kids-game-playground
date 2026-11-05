import type { GameId } from './games/registry'
const prefix='kids-game-playground:v1:'
export function read<T>(key:string, fallback:T):T {try{const raw=localStorage.getItem(prefix+key);return raw ? JSON.parse(raw) as T : fallback}catch{return fallback}}
export function write(key:string,value:unknown):boolean {try{localStorage.setItem(prefix+key,JSON.stringify(value));return true}catch{return false}}
// Each game owns a separate, versioned record; no other app's keys are touched.
export const gameStorage=(id:GameId)=>({load:<T,>(fallback:T)=>read('game:'+id,fallback),save:(value:unknown)=>write('game:'+id,value)})
