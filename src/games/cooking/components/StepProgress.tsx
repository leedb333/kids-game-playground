import type {Recipe} from '../types'
export function StepProgress({recipe,current}:{recipe:Recipe;current:number}){return <ol className="cook-steps" aria-label="요리 순서">{recipe.steps.map((step,index)=><li key={step.id} aria-current={index===current?'step':undefined} className={index<current?'done':''}><span>{index<current?'✓':index+1}</span><strong>{step.title}</strong></li>)}</ol>}
