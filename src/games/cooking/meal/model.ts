import type {Recipe} from '../types'
export type MealId='spaghetti'|'sandwich'|'skewer'
export type MealState={version:1;revision:number;recipeId:MealId;step:number;count:number;units:string[][];selected:string;activeUnit:number;tool:'chopsticks'|'knife'|null;boiled:boolean;boilStirs:number;board:string[];cuts:{onion:number;tomato:number};pan:string[];sauteReady:boolean;sauce:'tomato'|'cream'|null;sauceStirs:number;heatUntil:number|null;done:boolean;garnish:{id:string;x:number;y:number}[]}
export type MealAction={type:'count';count:number}|{type:'select';id:string}|{type:'tool';tool:'chopsticks'|'knife'}|{type:'place';id:string;unit?:number;x?:number;y?:number}|{type:'stir';now:number}|{type:'cut';id:'onion'|'tomato'}|{type:'sauce';sauce:'tomato'|'cream'}|{type:'next'}|{type:'previous'}|{type:'finish';now:number}|{type:'timer';now:number}|{type:'undo'}
export function freshMeal(recipe:Recipe):MealState{return {version:1,revision:recipe.revision,recipeId:recipe.id as MealId,step:0,count:0,units:[],selected:recipe.ingredients[0]?.id??'',activeUnit:0,tool:null,boiled:false,boilStirs:0,board:[],cuts:{onion:0,tomato:0},pan:[],sauteReady:false,sauce:null,sauceStirs:0,heatUntil:null,done:false,garnish:[]}}
export const mealReady=(s:MealState)=>s.recipeId==='spaghetti'?(s.step===0?s.boiled&&s.boilStirs===5:s.step===1?s.cuts.onion===2&&s.cuts.tomato===2:s.step===2?s.sauce!==null&&s.sauceStirs>=3&&s.sauteReady:true):s.count>0
export function mealReducer(s:MealState,a:MealAction,recipe:Recipe):MealState{
 if(s.done)return s
 if(a.type==='timer')return s.heatUntil!==null&&a.now>=s.heatUntil?{...s,heatUntil:null,...(s.recipeId==='skewer'?{done:true}:{sauteReady:true})}:s
 if(s.heatUntil!==null)return s
 if(a.type==='select')return recipe.ingredients.some(i=>i.id===a.id)?{...s,selected:a.id}:s
 if(a.type==='tool')return {...s,tool:a.tool}
 if(a.type==='count')return s.recipeId!=='spaghetti'&&s.count===0&&[1,2,3].includes(a.count)?{...s,count:a.count,units:Array.from({length:a.count},()=>[])}:s
 if(a.type==='place'){
  if(s.recipeId!=='spaghetti'){
   const unit=a.unit??s.activeUnit,limit=s.recipeId==='sandwich'?7:5
   if(!recipe.ingredients.some(i=>i.id===a.id)||unit<0||unit>=s.count)return s
   return {...s,activeUnit:unit,units:s.units.map((items,i)=>i===unit&&items.length<limit?[...items,a.id]:items)}
  }
  if(s.step===0&&a.id==='noodle')return {...s,boiled:true}
  if(s.step===1&&['onion','tomato'].includes(a.id))return {...s,board:[...new Set([...s.board,a.id])]}
  if(s.step===2&&['noodle','onion','tomato'].includes(a.id))return {...s,pan:[...new Set([...s.pan,a.id])]}
  if(s.step===3&&['parsley','powder','pepper'].includes(a.id)&&s.garnish.length<30)return {...s,garnish:[...s.garnish,{id:a.id,x:Math.max(215,Math.min(545,a.x??380)),y:Math.max(165,Math.min(345,a.y??255))}]}
 }
 if(a.type==='cut'&&s.recipeId==='spaghetti'&&s.step===1&&s.tool==='knife'&&s.board.includes(a.id))return {...s,cuts:{...s.cuts,[a.id]:Math.min(2,s.cuts[a.id]+1)}}
 if(a.type==='stir'&&s.recipeId==='spaghetti'&&s.tool==='chopsticks'){
  if(s.step===0&&s.boiled)return {...s,boilStirs:Math.min(5,s.boilStirs+1)}
  if(s.step===2&&s.pan.length===3){if(!s.sauteReady)return {...s,heatUntil:a.now+3000};if(s.sauce)return {...s,sauceStirs:Math.min(3,s.sauceStirs+1)}}
 }
 if(a.type==='sauce'&&s.recipeId==='spaghetti'&&s.step===2&&s.sauteReady)return {...s,sauce:a.sauce,sauceStirs:0}
 if(a.type==='next'&&s.recipeId==='spaghetti'&&mealReady(s)&&s.step<3)return {...s,step:s.step+1,tool:null,selected:s.step===0?'onion':s.step===1?'noodle':'parsley'}
 if(a.type==='previous'&&s.recipeId==='spaghetti'&&s.step>0)return {...s,step:s.step-1,tool:null}
 if(a.type==='undo')return s.recipeId==='spaghetti'?s.step===3?{...s,garnish:s.garnish.slice(0,-1)}:s:{...s,units:s.units.map((items,i)=>i===s.activeUnit?items.slice(0,-1):items)}
 if(a.type==='finish'){
  if(s.recipeId==='sandwich'&&s.count)return {...s,done:true}
  if(s.recipeId==='skewer'&&s.units.some(items=>items.length))return {...s,heatUntil:a.now+3000}
  if(s.recipeId==='spaghetti'&&s.step===3)return {...s,done:true}
 }
 return s
}
export function validMeal(value:unknown,recipe:Recipe):value is MealState{
 if(!value||typeof value!=='object')return false
 const s=value as MealState,integer=(n:unknown,max:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=max
 const ids=(v:unknown,allowed:string[],limit:number,unique=false)=>Array.isArray(v)&&v.length<=limit&&v.every(id=>typeof id==='string'&&allowed.includes(id))&&(!unique||new Set(v).size===v.length)
 return s.version===1&&s.revision===recipe.revision&&s.recipeId===recipe.id&&integer(s.step,3)&&integer(s.count,3)&&Array.isArray(s.units)&&s.units.length===s.count&&s.units.every(items=>ids(items,recipe.ingredients.map(i=>i.id),recipe.id==='sandwich'?7:5))&&integer(s.activeUnit,Math.max(0,s.count-1))&&recipe.ingredients.some(i=>i.id===s.selected)&&[null,'chopsticks','knife'].includes(s.tool)&&typeof s.boiled==='boolean'&&integer(s.boilStirs,5)&&ids(s.board,['onion','tomato'],2,true)&&!!s.cuts&&integer(s.cuts.onion,2)&&integer(s.cuts.tomato,2)&&ids(s.pan,['noodle','onion','tomato'],3,true)&&typeof s.sauteReady==='boolean'&&[null,'tomato','cream'].includes(s.sauce)&&integer(s.sauceStirs,3)&&(s.heatUntil===null||typeof s.heatUntil==='number'&&Number.isFinite(s.heatUntil)&&s.heatUntil>0)&&typeof s.done==='boolean'&&(!s.done||s.heatUntil===null)&&Array.isArray(s.garnish)&&s.garnish.length<=30&&s.garnish.every(g=>g&&['parsley','powder','pepper'].includes(g.id)&&Number.isFinite(g.x)&&Number.isFinite(g.y)&&g.x>=215&&g.x<=545&&g.y>=165&&g.y<=345)
}
