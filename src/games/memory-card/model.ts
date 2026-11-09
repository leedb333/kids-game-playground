import {makeDeck,pictureById,stages,type Card} from './data'
export type Phase='preview'|'play'|'compare'|'hint'|'complete'
export type Game={stage:number;deck:Card[];matched:string[];selected:string[];phase:Phase;remaining:number;paused:boolean;completed:number[]}
export type Progress={version:1;stage:number;deck:Card[];matched:string[];completed:number[]}
export const storageKey='game:memory-card:r1'
export const newGame=(stage=1,completed:number[]=[],previous:Card[]=[]):Game=>({stage,deck:makeDeck(stages[stage-1],Math.random,previous),matched:[],selected:[],phase:'preview',remaining:3000,paused:false,completed})
export function choose(s:Game,uid:string):Game{
 const card=s.deck.find(c=>c.uid===uid)
 if(s.paused||s.phase!=='play'||!card||s.selected.includes(uid)||s.matched.includes(card.picture))return s
 const selected=[...s.selected,uid]
 return {...s,selected,phase:selected.length===2?'compare':'play',remaining:selected.length===2?(s.deck.find(c=>c.uid===selected[0])!.picture===card.picture?450:1000):0}
}
export function hint(s:Game):Game{
 if(s.paused||s.phase!=='play')return s
 const first=s.deck.find(c=>!s.matched.includes(c.picture));if(!first)return s
 return {...s,phase:'hint',selected:s.deck.filter(c=>c.picture===first.picture).map(c=>c.uid),remaining:2000}
}
export function tick(s:Game,ms:number):Game{
 if(s.paused||s.phase==='play'||s.phase==='complete')return s
 const remaining=Math.max(0,s.remaining-Math.max(0,ms));if(remaining>0)return {...s,remaining}
 if(s.phase==='compare'){
  const [a,b]=s.selected.map(uid=>s.deck.find(c=>c.uid===uid)!)
  if(a.picture===b.picture){const matched=[...s.matched,a.picture],complete=matched.length===stages[s.stage-1].pairs
   return {...s,matched,selected:[],phase:complete?'complete':'play',remaining:0,completed:complete?[...new Set([...s.completed,s.stage])].sort((a,b)=>a-b):s.completed}
  }
 }
 return {...s,selected:[],phase:s.matched.length===stages[s.stage-1].pairs?'complete':'play',remaining:0}
}
export const snapshot=(s:Game):Progress=>({version:1,stage:s.stage,deck:s.deck,matched:s.matched,completed:s.completed})
export function restore(value:unknown):Game{
 const p=value as Progress
 if(!p||p.version!==1||!Number.isInteger(p.stage)||p.stage<1||p.stage>stages.length||!Array.isArray(p.completed)||p.completed.some(n=>!Number.isInteger(n)||n<1||n>stages.length)||new Set(p.completed).size!==p.completed.length||!Array.isArray(p.deck)||p.deck.length!==stages[p.stage-1].pairs*2||new Set(p.deck.map(c=>c?.uid)).size!==p.deck.length||!Array.isArray(p.matched)||new Set(p.matched).size!==p.matched.length)return newGame()
 const counts:Record<string,number>={}
 for(const c of p.deck){if(!c||!pictureById[c.picture]||pictureById[c.picture].theme!==stages[p.stage-1].theme||!['a','b'].some(copy=>c.uid===c.picture+':'+copy))return newGame();counts[c.picture]=(counts[c.picture]??0)+1}
 if(Object.values(counts).some(n=>n!==2)||p.matched.some(id=>!counts[id]))return newGame()
 // Every visit gives the same friendly three-second preview; transient flips never persist.
 return {...newGame(p.stage,p.completed),deck:p.deck,matched:p.matched}
}
