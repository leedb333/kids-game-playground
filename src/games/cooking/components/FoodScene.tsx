import type {CookingState,Recipe} from '../types'
import {IngredientArt} from './IngredientArt'
import {useId} from 'react'
// Register a new recipe renderer here; shared navigation/storage never depend on pizza geometry.
export function FoodScene({recipe,state,heating}:{recipe:Recipe;state:CookingState;heating:boolean}){
 const id=useId().replace(/:/g,'')
 if(recipe.scene!=='pizza')return <svg viewBox="0 0 600 480" aria-hidden="true"><text x="300" y="260" textAnchor="middle" fontSize="160">{recipe.icon}</text></svg>
 const prepared=!!state.progress.dough,sauce=!!state.progress.sauce,baked=!!state.progress.oven
 const finished=recipe.steps[state.step].kind==='finish'
 return <svg className={`food-art${heating?' is-baking':''}`} viewBox="0 0 600 480" aria-hidden="true" data-food-scene="pizza">
  <defs><clipPath id={id+'sauceClip'}><ellipse cx="300" cy="238" rx="171" ry="164"/></clipPath><radialGradient id={id+'dough'}><stop stopColor={baked?'#ffe19b':'#fff2c7'}/><stop offset=".8" stopColor={baked?'#f5bd64':'#f6d99e'}/><stop offset="1" stopColor={baked?'#cc813f':'#dfb677'}/></radialGradient><radialGradient id={id+'sauce'}><stop stopColor="#ef8a59"/><stop offset="1" stopColor="#cb4b3e"/></radialGradient><filter id={id+'shadow'} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#a86b46" floodOpacity=".22"/></filter></defs>
  {finished?<><ellipse cx="300" cy="263" rx="220" ry="202" fill="#d6e7d9" stroke="white" strokeWidth="12"/><ellipse cx="300" cy="253" rx="202" ry="185" fill="#f7fbf4"/></>:<><rect x="67" y="36" width="466" height="410" rx="42" fill="#b98057"/><rect x="67" y="26" width="466" height="410" rx="42" fill="#e7ba8e" stroke="#d19d73" strokeWidth="3"/>{[80,155,238,325,407].map(y=><path key={y} d={`M88 ${y}Q260 ${y-8} 512 ${y+4}`} stroke="#d7a57c" strokeWidth="2" fill="none" opacity=".6"/>)}</>}
  <g filter={`url(#${id}shadow)`}>
   <ellipse cx="300" cy="240" rx={prepared?191:133} ry={prepared?184:126} fill={`url(#${id}dough)`} stroke="#dca86e" strokeWidth="3"/>
   {prepared&&<><ellipse cx="300" cy="238" rx="171" ry="164" fill={sauce?`url(#${id}sauce)`:'#fce6ad'}/><ellipse cx="300" cy="235" rx="173" ry="166" fill="none" stroke="#fff1bf" strokeWidth="5" opacity=".6"/></>}
   {sauce&&<path clipPath={`url(#${id}sauceClip)`} d="M203 170Q330 107 407 210T226 324T260 182" fill="none" stroke="#ffad78" strokeWidth="8" opacity=".4" strokeLinecap="round"/>}
   {state.placements.map(p=><g key={p.id} data-topping={p.ingredientId} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation})`}><svg x="-23" y="-23" width="46" height="46" viewBox="0 0 60 60"><IngredientArt kind={recipe.ingredients.find(i=>i.id===p.ingredientId)!.icon}/></svg></g>)}
   {baked&&<g fill="#bd772f" opacity=".45">{[[141,231],[181,115],[314,64],[442,140],[474,278],[376,402],[208,389]].map(([x,y])=><ellipse key={x} cx={x} cy={y} rx="6" ry="4"/>)}</g>}
  </g>
  {heating&&<g className="oven-overlay"><rect x="49" y="26" width="502" height="412" rx="38" fill="#805650" opacity=".82" stroke="#edb99f" strokeWidth="12"/><rect x="83" y="67" width="434" height="300" rx="24" fill="#ffaf55" opacity=".25"/><path d="M105 51H495" stroke="#ffe3c6" strokeWidth="12" strokeLinecap="round"/><text x="300" y="226" textAnchor="middle" fill="#fff7e2" fontSize="46">♨</text><text x="300" y="286" textAnchor="middle" fill="#fff7e2" fontSize="23">노릇노릇 굽는 중</text></g>}
 </svg>
}
