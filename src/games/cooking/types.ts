export type RecipeId = 'pizza' | 'spaghetti' | 'sandwich' | 'skewer'
export type StepKind = 'prepare' | 'spread' | 'place' | 'heat' | 'finish'
export type Ingredient = {id:string; name:string; icon:string; color:string}
export type CookingStep = {id:string; title:string; kind:StepKind; instruction:string; actionLabel?:string; toolIds:string[]}
export type Recipe = {id:RecipeId; title:string; subtitle:string; icon:string; ready:boolean; revision:number; scene:'pizza' | 'placeholder' | 'spaghetti' | 'sandwich' | 'skewer'; placementArea:{cx:number;cy:number;radius:number;hitRadius:number}; ingredients:Ingredient[]; tools:{id:string; name:string; icon:string}[]; steps:CookingStep[]; completion:{title:string; message:string}; heatDurationMs:number}
export type Placement = {id:number; stepId:string; ingredientId:string; x:number; y:number; rotation:number}
export type CookingState = {version:1; revision:number; step:number; progress:Record<string,number>; placements:Placement[]; bakeUntil:number|null; selected:string|null}
