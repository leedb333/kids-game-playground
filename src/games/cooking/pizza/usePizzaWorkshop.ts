import {useEffect,useState} from 'react'
import {read,write} from '../../../storage'
import {cookingKey,freshState,validState} from '../hooks/useCooking'
import type {Recipe} from '../types'
import {sauceZones,type PizzaState,type PizzaTool,type Sauce} from './types'
export function freshPizza(recipe:Recipe):PizzaState{return {...freshState(recipe),interaction:{tool:null,horizontal:0,vertical:0,sauce:null,sauceCells:[],oven:'closed',cuts:[]}}}
export function validPizza(value:unknown,recipe:Recipe):value is PizzaState{
 if(!validState(value,recipe))return false
 const p=(value as PizzaState).interaction
 const indices=(v:unknown,max:number):boolean=>Array.isArray(v)&&v.length<=max&&new Set(v).size===v.length&&v.every(n=>Number.isInteger(n)&&n>=0&&n<max)
 return !!p&&[null,'rolling-pin','spoon','cutter'].includes(p.tool)&&[p.horizontal,p.vertical].every(n=>Number.isInteger(n)&&n>=0&&n<=6)&&[null,'tomato','cream'].includes(p.sauce)&&indices(p.sauceCells,12)&&indices(p.cuts,8)&&['closed','open','loaded','baking','done'].includes(p.oven)&&(p.oven==='baking'?value.bakeUntil!==null:value.bakeUntil===null)
}
export function isPizzaComplete(value:unknown,recipe:Recipe){return validPizza(value,recipe)&&value.interaction.cuts.length===8}
export function usePizzaWorkshop(recipe:Recipe){
 const [state,setState]=useState<PizzaState>(()=>{const s=read<unknown>(cookingKey(recipe),null);return validPizza(s,recipe)&&!isPizzaComplete(s,recipe)?s:freshPizza(recipe)})
 const [storageOk,setStorageOk]=useState(true)

 const p=state.interaction,step=recipe.steps[state.step],heating=p.oven==='baking'
 const rolled=p.horizontal+p.vertical>=6&&p.horizontal>0&&p.vertical>0
 const sauced=p.sauceCells.length>=8
 const complete=p.cuts.length===8
 const ready=state.step===0?rolled:state.step===1?sauced:state.step===2?true:state.step===3?p.oven==='done':complete
 useEffect(()=>{setStorageOk(write(cookingKey(recipe),state))},[state,recipe])
 useEffect(()=>{
  if(state.bakeUntil===null)return
  const token=state.bakeUntil
  const timer=setTimeout(()=>{setState(s=>s.bakeUntil!==token?s:{...s,bakeUntil:null,step:4,progress:{...s.progress,oven:1},interaction:{...s.interaction,oven:'done',tool:null}})},Math.max(0,token-Date.now()))
  return()=>clearTimeout(timer)
 },[state.bakeUntil])
 function equip(tool:PizzaTool){setState(s=>({...s,interaction:{...s.interaction,tool}}))}
 function roll(axis:'horizontal'|'vertical'){if(state.step!==0||p.tool!=='rolling-pin'||rolled)return;setState(s=>{if(s.interaction.horizontal+s.interaction.vertical>=5&&((axis==='horizontal'&&s.interaction.vertical===0)||(axis==='vertical'&&s.interaction.horizontal===0)))return s;const next={...s.interaction,[axis]:Math.min(6,s.interaction[axis]+1)};const done=next.horizontal+next.vertical>=6&&next.horizontal>0&&next.vertical>0;return {...s,progress:{...s.progress,dough:done?1:0},interaction:next}})}
 function chooseSauce(sauce:Sauce){setState(s=>({...s,progress:{...s.progress,sauce:0,oven:0},interaction:{...s.interaction,sauce,sauceCells:[],oven:'closed',cuts:[],tool:null}}))}
 function brush(x:number,y:number){if(state.step!==1||p.tool!=='spoon'||!p.sauce||sauced)return;setState(s=>{const hits=sauceZones.map((point,i)=>Math.hypot(point.x-x,point.y-y)<80?i:-1).filter(i=>i>=0);const cells=[...new Set([...s.interaction.sauceCells,...hits])];return {...s,progress:{...s.progress,sauce:cells.length>=8?3:0,oven:0},interaction:{...s.interaction,sauceCells:cells,oven:'closed',cuts:[]}}})}
 function place(x:number,y:number,ingredientId=state.selected){if(state.step!==2||!ingredientId)return;setState(s=>{if(s.placements.length>=90)return s;const {cx,cy,radius}=recipe.placementArea,d=Math.hypot(x-cx,y-cy),scale=d>radius?radius/d:1;return {...s,progress:{...s.progress,oven:0},placements:[...s.placements,{id:(s.placements.at(-1)?.id??0)+1,stepId:'toppings',ingredientId,x:cx+(x-cx)*scale,y:cy+(y-cy)*scale,rotation:s.placements.length*47%360}],interaction:{...s.interaction,oven:'closed',cuts:[]}}})}
 function ovenDoor(){if(state.step!==3)return;setState(s=>s.interaction.oven==='closed'?{...s,interaction:{...s.interaction,oven:'open'}}:s.interaction.oven==='loaded'?{...s,bakeUntil:Date.now()+3000,interaction:{...s.interaction,oven:'baking'}}:s)}
 function loadOven(){if(state.step===3&&p.oven==='open')setState(s=>({...s,interaction:{...s.interaction,oven:'loaded'}}))}
 function cut(index:number){if(state.step!==4||p.tool!=='cutter'||!Number.isInteger(index)||index<0||index>7)return;setState(s=>({...s,interaction:{...s.interaction,cuts:[...new Set([...s.interaction.cuts,index])]}}))}
 return {state,step,p,heating,rolled,sauced,complete,ready,storageOk,equip,roll,brush,chooseSauce,place,ovenDoor,loadOven,cut,
 select:(id:string)=>setState(s=>({...s,selected:id})),
 undo:()=>setState(s=>({...s,placements:s.placements.slice(0,-1),progress:{...s.progress,oven:0},interaction:{...s.interaction,oven:'closed',cuts:[]}})),
 next:()=>{if(ready&&!heating)setState(s=>({...s,step:Math.min(4,s.step+1),interaction:{...s.interaction,tool:null}}))},
 previous:()=>{if(!heating)setState(s=>({...s,step:Math.max(0,s.step-1),interaction:{...s.interaction,tool:null}}))},
 reset:()=>setState(freshPizza(recipe))}
}
