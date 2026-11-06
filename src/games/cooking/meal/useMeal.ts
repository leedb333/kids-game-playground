import {useEffect,useState} from 'react'
import {read,write} from '../../../storage'
import type {Recipe} from '../types'
import {cookingKey} from '../hooks/useCooking'
import {freshMeal,mealReady,mealReducer,validMeal,type MealAction} from './model'
export function loadMeal(recipe:Recipe){const s=read<unknown>(cookingKey(recipe),null);return validMeal(s,recipe)?s:freshMeal(recipe)}
export function useMeal(recipe:Recipe){
 const [state,setState]=useState(()=>{const s=loadMeal(recipe);return s.done?freshMeal(recipe):s}),[storageOk,setStorageOk]=useState(true)
 const dispatch=(action:MealAction)=>setState(s=>mealReducer(s,action,recipe))
 useEffect(()=>{setStorageOk(write(cookingKey(recipe),state))},[state,recipe])
 useEffect(()=>{if(state.heatUntil===null)return;const timer=setTimeout(()=>dispatch({type:'timer',now:Date.now()}),Math.max(0,state.heatUntil-Date.now()));return()=>clearTimeout(timer)},[state.heatUntil])
 return {state,dispatch,storageOk,ready:mealReady(state),heating:state.heatUntil!==null,reset:()=>setState(freshMeal(recipe))}
}
