import {fresh,restore,type State} from '../model'
export const sessionKey='kids-game-playground:v1:game:cooking-v2:pizza:full:r1'
export type Stage='dough'|'sauce'|'topping'|'oven'|'complete'
export type OvenPhase='closed'|'open'|'inside'|'baking'|'done'
export type Session={version:1;stage:Stage;rolling:number;rollHistory:number[];work:State;oven:{phase:OvenPhase;elapsed:number}}
export const newSession=():Session=>({version:1,stage:'dough',rolling:0,rollHistory:[],work:fresh(),oven:{phase:'closed',elapsed:0}})
export const BAKE_MS=4000,ROLL_DISTANCE=1600
export function parseSession(value:unknown):Session{
 try{const s=value as Session;if(!s||s.version!==1||!['dough','sauce','topping','oven','complete'].includes(s.stage)||!Number.isFinite(s.rolling)||s.rolling<0||s.rolling>1||!Array.isArray(s.rollHistory)||s.rollHistory.length>100||s.rollHistory.some(n=>!Number.isFinite(n)||n<0||n>1)||!s.oven||!['closed','open','inside','baking','done'].includes(s.oven.phase)||!Number.isFinite(s.oven.elapsed)||s.oven.elapsed<0||s.oven.elapsed>BAKE_MS)return newSession();const work=restore(s.work);if(JSON.stringify(work)!==JSON.stringify(s.work))return newSession();if(s.stage!=='dough'&&s.rolling<1||s.stage==='complete'&&s.oven.phase!=='done')return newSession();return {...s,work}}catch{return newSession()}
}
export function readSession(){try{return parseSession(JSON.parse(localStorage.getItem(sessionKey)??'null'))}catch{return newSession()}}
export function advanceBake(s:Session,delta:number):Session{if(s.stage!=='oven'||s.oven.phase!=='baking')return s;const elapsed=Math.min(BAKE_MS,s.oven.elapsed+Math.max(0,Math.min(100,delta)));return {...s,stage:elapsed===BAKE_MS?'complete':'oven',oven:{phase:elapsed===BAKE_MS?'done':'baking',elapsed}}}
export const recipes=[{id:'pizza',name:'피자 만들기',ready:true},{id:'spaghetti',name:'스파게티 만들기',ready:false},{id:'sandwich',name:'샌드위치 만들기',ready:false},{id:'skewer',name:'꼬치구이 만들기',ready:false}] as const
