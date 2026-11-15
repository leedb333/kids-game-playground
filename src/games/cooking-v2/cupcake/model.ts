export const storageKey='kids-game-playground:v1:game:cooking-v2:cupcake:prototype:r1'
export const ingredients=[{id:'egg',name:'달걀'},{id:'milk',name:'우유'},{id:'flour',name:'밀가루'},{id:'sugar',name:'설탕'}] as const
export type Ingredient=typeof ingredients[number]['id']
export const creams=[{id:'vanilla',name:'바닐라 크림',asset:'vanilla'},{id:'strawberry',name:'딸기 크림',asset:'strawberry'}] as const
export type Cream=typeof creams[number]['id']
export const decorations=['blue','purple','yellow'] as const
export type Decoration=typeof decorations[number]
export type Step='mix'|'bake'|'decorate'|'complete'
export type Phase='ready'|'open'|'inside'|'baking'|'done'
export type Piece={id:number;kind:Decoration;u:number;v:number;rotation:number;size:number}
export type Work={step:Step;ingredients:Ingredient[];mix:number;filled:boolean;oven:Phase;elapsed:number;cream:Cream;piping:number;sprinkles:Piece[];nextId:number}
export type Session={version:1;work:Work;history:Work[];sound:boolean}
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n))
export function fresh():Session{return {version:1,work:{step:'mix',ingredients:[],mix:0,filled:false,oven:'ready',elapsed:0,cream:'vanilla',piping:0,sprinkles:[],nextId:1},history:[],sound:true}}
export function edit(s:Session,patch:Partial<Work>,checkpoint=true):Session{return {...s,work:{...s.work,...patch},history:checkpoint?[...s.history,s.work].slice(-60):s.history}}
export function undo(s:Session):Session{return s.history.length?{...s,work:s.history[s.history.length-1],history:s.history.slice(0,-1)}:s}
export function addIngredient(s:Session,id:Ingredient):Session{return s.work.step==='mix'&&!s.work.ingredients.includes(id)?edit(s,{ingredients:[...s.work.ingredients,id]}):s}
export function stir(s:Session,radians:number,checkpoint=true):Session{return s.work.step==='mix'&&s.work.ingredients.length===4&&s.work.mix<1?edit(s,{mix:clamp(s.work.mix+Math.abs(radians)/(Math.PI*8))},checkpoint):s}
export function heat(s:Session,ms:number):Session{if(s.work.step!=='bake'||s.work.oven!=='baking')return s;const elapsed=clamp(s.work.elapsed+Math.max(0,Math.min(ms,150)),0,3000);return edit(s,{elapsed,oven:elapsed===3000?'done':'baking'},false)}
export function pipe(s:Session,amount:number,checkpoint=true):Session{return s.work.step==='decorate'?edit(s,{piping:clamp(s.work.piping+amount)},checkpoint):s}
export function sprinkle(s:Session,u:number,v:number,checkpoint=true):Session{
 if(s.work.step!=='decorate'||s.work.piping<=0)return s
 const id=s.work.nextId,kind=decorations[(id-1)%decorations.length]
 return edit(s,{nextId:id+1,sprinkles:[...s.work.sprinkles,{id,kind,u:clamp(u),v:clamp(v),rotation:(id*137.5)%360,size:kind==='blue'?.055:kind==='yellow'?.048:.037}]},checkpoint)
}
export function remove(s:Session,id:number):Session{return s.work.sprinkles.some(p=>p.id===id)?edit(s,{sprinkles:s.work.sprinkles.filter(p=>p.id!==id)}):s}
function validWork(v:unknown):v is Work{
 if(!v||typeof v!=='object')return false
 const w=v as Work
 return ['mix','bake','decorate','complete'].includes(w.step)&&Array.isArray(w.ingredients)&&w.ingredients.length<=4&&new Set(w.ingredients).size===w.ingredients.length&&w.ingredients.every(id=>ingredients.some(i=>i.id===id))&&Number.isFinite(w.mix)&&w.mix>=0&&w.mix<=1&&typeof w.filled==='boolean'&&['ready','open','inside','baking','done'].includes(w.oven)&&Number.isFinite(w.elapsed)&&w.elapsed>=0&&w.elapsed<=3000&&creams.some(c=>c.id===w.cream)&&Number.isFinite(w.piping)&&w.piping>=0&&w.piping<=1&&Number.isSafeInteger(w.nextId)&&w.nextId>0&&Array.isArray(w.sprinkles)&&w.sprinkles.length<=10000&&w.sprinkles.every(p=>p&&Number.isSafeInteger(p.id)&&p.id>0&&p.id<w.nextId&&decorations.includes(p.kind)&&[p.u,p.v,p.rotation,p.size].every(Number.isFinite)&&p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1&&p.size>0&&p.size<=.15)&&new Set(w.sprinkles.map(p=>p.id)).size===w.sprinkles.length
}
export function read():Session{try{const s=JSON.parse(localStorage.getItem(storageKey)||'null');if(s?.version===1&&validWork(s.work))return {version:1,work:s.work,history:Array.isArray(s.history)?s.history.filter(validWork).slice(-60):[],sound:s.sound!==false}}catch{/* A damaged cupcake save never affects other games. */}return fresh()}
export function layout(w:Pick<Work,'cream'|'piping'>){const width=530*(.35+.65*w.piping),height=width*(w.cream==='vanilla'?989/1064:942/984);return {base:{x:210,y:390,w:580,h:580*912/971},plate:{x:80,y:685,w:840,h:290},cream:{x:500-width/2,y:610-height,w:width,h:height}}}
