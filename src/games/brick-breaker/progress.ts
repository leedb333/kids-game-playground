import {stages} from './stages'
export type Progress={version:1;current:number;completed:number[];boards:Record<string,string[]>}
export const progressKey='game:bricks:r1'
export const freshProgress=():Progress=>({version:1,current:1,completed:[],boards:{}})
export function restoreProgress(value:unknown):Progress{
 const s=value as Progress
 if(!s||s.version!==1||!Number.isInteger(s.current)||s.current<1||s.current>stages.length||!Array.isArray(s.completed)||!s.boards||typeof s.boards!=='object'||Array.isArray(s.boards))return freshProgress()
 if(s.completed.some(n=>!Number.isInteger(n)||n<1||n>stages.length))return freshProgress()
 for(const [key,ids] of Object.entries(s.boards)){const stage=stages[Number(key)-1];if(!stage||String(stage.id)!==key||!Array.isArray(ids))return freshProgress();const allowed=new Set(stage.bricks.filter(b=>!b.gold).map(b=>b.id));if(ids.some(id=>typeof id!=='string'||!allowed.has(id))||new Set(ids).size!==ids.length)return freshProgress()}
 return {version:1,current:s.current,completed:[...new Set(s.completed)].sort((a,b)=>a-b),boards:Object.fromEntries(Object.entries(s.boards).map(([key,ids])=>[key,[...ids]]))}
}
export function completeStage(s:Progress,id:number):Progress{const boards={...s.boards};delete boards[id];return {version:1,current:Math.min(stages.length,id+1),completed:[...new Set([...s.completed,id])].sort((a,b)=>a-b),boards}}
