import {useEffect,useState} from 'react'
import {CookingHome} from './CookingHome'
import {MealWorkshop} from './meal/MealWorkshop'
import type {Recipe} from './types'
import './cooking.css'
import {PizzaWorkshop} from './pizza/PizzaWorkshop'
import './pizza/pizza.css'
import './meal/meal.css'
export default function CookingGame(){
 const [recipe,setRecipe]=useState<Recipe|null>(null)
 useEffect(()=>{if(!recipe)document.getElementById('cook-home-title')?.focus()},[recipe])
 return <div className="cooking-game">{recipe?(recipe.id==='pizza'?<PizzaWorkshop key={recipe.id} recipe={recipe} onBack={()=>setRecipe(null)}/>:<MealWorkshop key={recipe.id} recipe={recipe} onBack={()=>setRecipe(null)}/>):<CookingHome onOpen={setRecipe}/>}</div>
}
