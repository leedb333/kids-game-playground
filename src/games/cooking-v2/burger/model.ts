export const storageKey='kids-game-playground:v1:game:cooking-v2:burger:prototype:r1'
export const MAX_LAYERS=16,SIDE_MS=1800,FLIP_MS=550
export type Kind='patty'|'cheese'|'lettuce'|'tomato'|'onion'|'pickle'|'bacon'|'egg'|'mushroom'
export type Sauce='ketchup'|'mayonnaise'|'mustard'
export type Stage='grill'|'choose'|'stack'|'complete'
export type Grill={phase:'ready'|'first'|'awaitFlip'|'flipping'|'second'|'done';elapsed:number}
export type Layer={id:number;kind:Kind}
// Optional placement fields preserve version-1 saves made before drizzle graphics existed.
export type Application={id:number;sauce:Sauce;after:number;offsetX?:number;offsetY?:number;scale?:number;rotation?:number}
export type Design={selected:Kind[];layers:Layer[];sauce:Sauce|null;applications:Application[]}
export type Session={version:1;stage:Stage;grill:Grill;grillHistory:Grill[];design:Design;history:Design[];nextId:number;sound:boolean}
export const ingredients:{id:Kind;name:string;asset:string;thumb:string;width:number;height:number;thickness:number;overhang:number}[]=[
 {id:'patty',name:'패티',asset:'patty-cooked',thumb:'patty-cooked',width:640,height:265,thickness:68,overhang:0},
 {id:'cheese',name:'치즈',asset:'cheese-stack',thumb:'cheese',width:665,height:245,thickness:24,overhang:28},
 {id:'lettuce',name:'양상추',asset:'lettuce-stack',thumb:'lettuce',width:665,height:230,thickness:35,overhang:10},
 {id:'tomato',name:'토마토',asset:'tomato-stack',thumb:'tomato',width:630,height:245,thickness:40,overhang:7},
 {id:'onion',name:'양파',asset:'onion-group',thumb:'onion-group',width:610,height:230,thickness:32,overhang:10},
 {id:'pickle',name:'피클',asset:'pickle-group',thumb:'pickle-group',width:590,height:225,thickness:35,overhang:10},
 {id:'bacon',name:'베이컨',asset:'bacon',thumb:'bacon',width:650,height:220,thickness:30,overhang:16},
 {id:'egg',name:'달걀',asset:'egg',thumb:'egg',width:640,height:245,thickness:38,overhang:12},
 {id:'mushroom',name:'버섯',asset:'mushroom-group',thumb:'mushroom-group',width:590,height:245,thickness:42,overhang:10},
]
export const sauces:{id:Sauce;name:string;asset:string}[]=[{id:'ketchup',name:'케첩',asset:'sauce-ketchup-bottle'},{id:'mayonnaise',name:'마요네즈',asset:'sauce-mayonnaise-bottle'},{id:'mustard',name:'머스터드',asset:'sauce-mustard-bottle'}]
export const fresh=():Session=>({version:1,stage:'grill',grill:{phase:'ready',elapsed:0},grillHistory:[],design:{selected:['patty','cheese','lettuce','tomato'],layers:[],sauce:null,applications:[]},history:[],nextId:1,sound:true})
const kinds=new Set(ingredients.map(i=>i.id)),sauceIds=new Set(sauces.map(i=>i.id))
export function edit(s:Session,design:Design):Session{return {...s,design,history:[...s.history.slice(-59),s.design]}}
export function select(s:Session,kind:Kind){return edit(s,{...s.design,selected:s.design.selected.includes(kind)?s.design.selected.filter(k=>k!==kind):[...s.design.selected,kind]})}
export function add(s:Session,kind:Kind):Session{if(s.stage!=='stack'||!s.design.selected.includes(kind)||s.design.layers.length>=MAX_LAYERS)return s;return {...edit(s,{...s.design,layers:[...s.design.layers,{id:s.nextId,kind}]}),nextId:s.nextId+1}}
export function remove(s:Session,id:number){
 const index=s.design.layers.findIndex(l=>l.id===id)
 if(index<0)return s.design.applications.some(a=>a.id===id)?edit(s,{...s.design,applications:s.design.applications.filter(a=>a.id!==id)}):s
 // Keep condiments, moving them onto the surface directly below the removed ingredient.
 const below=s.design.layers[index-1]?.id??0
 return edit(s,{...s.design,layers:s.design.layers.filter(l=>l.id!==id),applications:s.design.applications.map(a=>a.after===id?{...a,after:below}:a)})
}
export function chooseSauce(s:Session,sauce:Sauce){return edit(s,{...s.design,sauce})}
export function applySauce(s:Session,sauce:Sauce,point?:{x:number;y:number}){
 const after=s.design.layers.at(-1)?.id??0,count=s.design.applications.filter(a=>a.after===after).length
 const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
 const a:Application={id:s.nextId,sauce,after,offsetX:point?clamp((point.x-500)/2500,-.045,.045):0,offsetY:clamp(((count%3)-1)*.04+(point?(point.y-500)/10000:0),-.06,.06),scale:.82+(count%3)*.025,rotation:[-3,1,3][count%3]}
 return {...edit(s,{...s.design,sauce,applications:[...s.design.applications,a]}),nextId:s.nextId+1}
}
export function pan(s:Session):Session{if(s.grill.phase!=='ready')return s;return {...s,grillHistory:[...s.grillHistory,s.grill],grill:{phase:'first',elapsed:0}}}
export function flip(s:Session):Session{if(!['first','awaitFlip'].includes(s.grill.phase))return s;return {...s,grillHistory:[...s.grillHistory,s.grill],grill:{phase:'flipping',elapsed:0}}}
export function heat(s:Session,delta:number):Session{const g=s.grill;if(s.stage!=='grill'||!['first','flipping','second'].includes(g.phase))return s;const limit=g.phase==='flipping'?FLIP_MS:SIDE_MS,elapsed=Math.min(limit,g.elapsed+Math.max(0,Math.min(100,delta)));return {...s,grill:elapsed===limit?{phase:g.phase==='first'?'awaitFlip':g.phase==='flipping'?'second':'done',elapsed:0}:{...g,elapsed}}}
export function cooked(g:Grill){return g.phase==='ready'?0:g.phase==='first'?.5*g.elapsed/SIDE_MS:g.phase==='awaitFlip'||g.phase==='flipping'?.5:g.phase==='second'?.5+.5*g.elapsed/SIDE_MS:1}
export function undo(s:Session):Session{if(s.stage==='grill'){if(!s.grillHistory.length)return s;return {...s,grill:s.grillHistory.at(-1)!,grillHistory:s.grillHistory.slice(0,-1)}}if(!s.history.length)return s;return {...s,design:s.history.at(-1)!,history:s.history.slice(0,-1)}}
export type Sprite={key:string;asset:string;x:number;y:number;width:number;height:number;layerId?:number;sauceId?:number;rotation?:number}
export function layout(layers:Layer[],complete:boolean,applications:Application[]=[]){
 let surface=740
 const food:Sprite[]=[{key:'bottom',asset:'bun-bottom',x:175,y:520,width:650,height:310}]
 // Insert each sauce immediately after its supporting ingredient, before any later food.
 function drizzle(base:Sprite,id:number){for(const a of applications.filter(a=>a.after===id)){
  const width=base.width*(a.scale??.84),height=width*.20
  food.push({key:`sauce-${a.id}`,asset:`sauce-${a.sauce}-drizzle`,x:base.x+base.width/2-width/2+(a.offsetX??0)*base.width,y:base.y+base.height*(.78+(a.offsetY??0))-height/2,width,height,sauceId:a.id,rotation:a.rotation??0})
 }}
 drizzle(food[0],0)
 for(const l of layers){const i=ingredients.find(i=>i.id===l.kind)!,sprite={key:String(l.id),asset:i.asset,x:500-i.width/2,y:surface+i.overhang-i.height,width:i.width,height:i.height,layerId:l.id};food.push(sprite);drizzle(sprite,l.id);surface-=i.thickness}
 const capTop=surface+26-345,scale=Math.min(1,700/(830-capTop))
 if(complete)food.push({key:'top',asset:'bun-top',x:170,y:capTop,width:660,height:345})
 const sprites=food.map(i=>({...i,x:500+(i.x-500)*scale,y:830+(i.y-830)*scale,width:i.width*scale,height:i.height*scale}))
 return {sprites,scale,plate:{key:'plate',asset:'plate',x:50,y:565,width:900,height:400} as Sprite}
}
export function restore(value:unknown):Session{
 try{const s=value as Session;const grill=(g:Grill)=>g&&['ready','first','awaitFlip','flipping','second','done'].includes(g.phase)&&Number.isFinite(g.elapsed)&&g.elapsed>=0&&g.elapsed<=(g.phase==='flipping'?FLIP_MS:SIDE_MS);const design=(d:Design)=>d&&Array.isArray(d.selected)&&d.selected.length<=9&&new Set(d.selected).size===d.selected.length&&d.selected.every(k=>kinds.has(k))&&Array.isArray(d.layers)&&d.layers.length<=MAX_LAYERS&&new Set(d.layers.map(l=>l.id)).size===d.layers.length&&d.layers.every(l=>Number.isInteger(l.id)&&l.id>0&&l.id<s.nextId&&kinds.has(l.kind))&&(d.sauce===null||sauceIds.has(d.sauce))&&Array.isArray(d.applications)&&new Set([...d.layers,...d.applications].map(i=>i.id)).size===d.layers.length+d.applications.length&&d.applications.every(a=>Number.isInteger(a.id)&&a.id>0&&a.id<s.nextId&&sauceIds.has(a.sauce)&&Number.isInteger(a.after)&&a.after>=0&&a.after<s.nextId&&[(a.offsetX??0),(a.offsetY??0),(a.scale??.84),(a.rotation??0)].every(Number.isFinite)&&Math.abs(a.offsetX??0)<=.05&&Math.abs(a.offsetY??0)<=.15&&(a.scale??.84)>=.7&&(a.scale??.84)<=.9&&Math.abs(a.rotation??0)<=5);if(!s||s.version!==1||!['grill','choose','stack','complete'].includes(s.stage)||!Number.isInteger(s.nextId)||s.nextId<1||!Number.isSafeInteger(s.nextId)||typeof s.sound!=='boolean'||!grill(s.grill)||!Array.isArray(s.grillHistory)||s.grillHistory.length>20||!s.grillHistory.every(grill)||!design(s.design)||!Array.isArray(s.history)||s.history.length>60||!s.history.every(design)||s.stage!=='grill'&&s.grill.phase!=='done')return fresh();const repair=(d:Design):Design=>({...d,applications:d.applications.map(a=>({...a,after:a.after===0||d.layers.some(l=>l.id===a.after)?a.after:(d.layers.filter(l=>l.id<a.after).at(-1)?.id??0)}))});return {...s,design:repair(s.design),history:s.history.map(repair)} }catch{return fresh()}
}
export function read(){try{return restore(JSON.parse(localStorage.getItem(storageKey)??'null'))}catch{return fresh()}}
