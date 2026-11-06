import {useEffect, useState} from 'react'
import {read,write} from '../../../storage'
import type {CookingState,Recipe} from '../types'

export const cookingKey=(recipe:Recipe)=>`game:cooking:${recipe.id}:r${recipe.revision}`
export const freshState=(recipe:Recipe):CookingState=>({version:1,revision:recipe.revision,step:0,progress:{},placements:[],bakeUntil:null,selected:recipe.ingredients[0]?.id??null})
export function validState(value:unknown,recipe:Recipe):value is CookingState {
 if(!value||typeof value!=='object')return false
 const s=value as CookingState
 return s.version===1&&s.revision===recipe.revision&&Number.isInteger(s.step)&&s.step>=0&&s.step<recipe.steps.length&&!!s.progress&&typeof s.progress==='object'&&Object.entries(s.progress).every(([id,n])=>recipe.steps.some(step=>step.id===id)&&Number.isInteger(n)&&n>=0&&n<=3)&&Array.isArray(s.placements)&&s.placements.length<=90&&s.placements.every(p=>p&&Number.isInteger(p.id)&&recipe.steps.some(step=>step.id===p.stepId)&&recipe.ingredients.some(i=>i.id===p.ingredientId)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.hypot(p.x-recipe.placementArea.cx,p.y-recipe.placementArea.cy)<=recipe.placementArea.radius+0.01&&Number.isFinite(p.rotation))&&(s.selected===null||recipe.ingredients.some(i=>i.id===s.selected))&&(s.bakeUntil===null||(Number.isFinite(s.bakeUntil)&&s.bakeUntil>0))
}
export function loadCooking(recipe:Recipe){const value=read<unknown>(cookingKey(recipe),null);return validState(value,recipe)?value:freshState(recipe)}
export function useCooking(recipe:Recipe){
 const [state,setState]=useState(()=>loadCooking(recipe))
 const [storageOk,setStorageOk]=useState(true)
 const step=recipe.steps[state.step]
 const heating=state.bakeUntil!==null
 useEffect(()=>{setStorageOk(write(cookingKey(recipe),state))},[state,recipe])
 useEffect(()=>{
  if(state.bakeUntil===null)return
  const until=state.bakeUntil
  const finish=()=>setState(s=>s.bakeUntil===until?{...s,bakeUntil:null,progress:{...s.progress,[recipe.steps[s.step].id]:1}}:s)
  const timer=setTimeout(finish,Math.max(0,until-Date.now()))
  return ()=>clearTimeout(timer)
 },[state.bakeUntil,recipe])
 const ready=step.kind==='place'||step.kind==='finish'||(state.progress[step.id]??0)>=(step.kind==='spread'?3:1)
 function act(){setState(s=>{
  if(s.bakeUntil!==null)return s
  const current=recipe.steps[s.step]
  if(current.kind==='finish'||current.kind==='place')return s
  if(current.kind==='heat')return s.progress[current.id]?s:{...s,bakeUntil:Date.now()+recipe.heatDurationMs}
  const progress={...s.progress,[current.id]:current.kind==='spread'?3:1}
  // Editing an earlier preparation invalidates heat, so the changed dish is baked again.
  for(const later of recipe.steps.slice(s.step+1))if(later.kind==='heat')delete progress[later.id]
  return {...s,progress}
 })}
 function place(x:number,y:number,ingredientId=state.selected){
  if(!ingredientId||step.kind!=='place'||heating)return
  setState(s=>{
   if(s.placements.length>=90)return s
   const {cx,cy,radius}=recipe.placementArea;const distance=Math.hypot(x-cx,y-cy),scale=distance>radius?radius/distance:1
   const progress={...s.progress};for(const later of recipe.steps.slice(s.step+1))if(later.kind==='heat')delete progress[later.id]
   return {...s,progress,placements:[...s.placements,{id:(s.placements.at(-1)?.id??0)+1,stepId:step.id,ingredientId,x:cx+(x-cx)*scale,y:cy+(y-cy)*scale,rotation:(s.placements.length*47)%360}]}
  })
 }
 return {state,step,ready,heating,storageOk,act,place,
  select:(id:string)=>setState(s=>({...s,selected:id})),
  undo:()=>setState(s=>({...s,placements:s.placements.slice(0,-1),progress:Object.fromEntries(Object.entries(s.progress).filter(([id])=>recipe.steps.find(step=>step.id===id)?.kind!=='heat'))})),
  next:()=>{if(ready&&!heating)setState(s=>({...s,step:Math.min(recipe.steps.length-1,s.step+1)}))},
  previous:()=>{if(!heating)setState(s=>({...s,step:Math.max(0,s.step-1)}))},
  reset:()=>setState(freshState(recipe))}
}
