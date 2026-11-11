export const SIZE=1024,CENTER=512,SAUCE_RX=407,SAUCE_RY=392,BRUSH_RADIUS=84,REQUIRED_COVERAGE=.65
export const storageKey='kids-game-playground:v1:game:cooking-v2:pizza:prototype:r1'
export type Point={x:number;y:number;start?:boolean}
export type Ingredient='cheese'|'pepperoni'|'mushroom'|'onion'|'paprika'|'olive'
export type Tool=Ingredient|'spoon'|'move'|'erase'
export type Topping={id:number;kind:Ingredient;x:number;y:number;rotation:number;scale:number;variant:number;group:number}
export type Action=({kind:'sauce';points:Point[]}|{kind:'place';items:Topping[]}|{kind:'move';id:number;x:number;y:number}|{kind:'remove';id:number;group?:number})&{gesture?:number}
export type State={version:1;step:'sauce'|'topping';actions:Action[];nextId:number}
export const fresh=():State=>({version:1,step:'sauce',actions:[],nextId:1})
export const inside=(p:Point,margin=0)=>((p.x-CENTER)/(SAUCE_RX-margin))**2+((p.y-CENTER)/(SAUCE_RY-margin))**2<=1
export const strokes=(s:State)=>s.actions.filter((a):a is Extract<Action,{kind:'sauce'}>=>a.kind==='sauce')
export function toppings(s:State):Topping[]{let items:Topping[]=[];for(const a of s.actions){if(a.kind==='place')items.push(...a.items);else if(a.kind==='move')items=items.map(t=>t.id===a.id?{...t,x:a.x,y:a.y}:t);else if(a.kind==='remove')items=items.filter(t=>a.group===undefined?t.id!==a.id:t.group!==a.group)}return items}
export function place(s:State,kind:Ingredient,p:Point,group=s.nextId):State{
 if(s.step!=='topping'||!inside(p,kind==='cheese'?15:65))return s
 const current=toppings(s);if(kind==='cheese'?current.filter(t=>t.kind==='cheese').length>=720:current.filter(t=>t.kind!=='cheese').length>=100)return s
 const count=kind==='cheese'?10:1,items:Topping[]=[]
 for(let i=0;i<count;i++){const seed=(s.nextId+i)*2.399963,rad=kind==='cheese'?12+42*Math.sqrt((i+1)/count):0,x=p.x+Math.cos(seed)*rad,y=p.y+Math.sin(seed)*rad;if(!inside({x,y},15))continue;items.push({id:s.nextId+i,kind,x,y,rotation:kind==='cheese'?seed%Math.PI*2:Math.sin(seed)*.34,scale:kind==='cheese'?.82+(i%4)*.12:.94+(s.nextId%3)*.06,variant:kind==='cheese'?(i%5===0?1:i%7===0?2:0):0,group})}
 return {...s,nextId:s.nextId+count,actions:[...s.actions,{kind:'place',items}]}
}
export const dimensions=(t:Topping)=>({w:({cheese:52,pepperoni:157,mushroom:164,onion:142,paprika:116,olive:82}[t.kind])*t.scale,h:({cheese:30,pepperoni:138,mushroom:116,onion:130,paprika:100,olive:76}[t.kind])*t.scale})
export function hit(items:Topping[],p:Point):Topping|undefined{return [...items].reverse().find(t=>{const d=dimensions(t),dx=p.x-t.x,dy=p.y-t.y,c=Math.cos(t.rotation),s=Math.sin(t.rotation),x=dx*c+dy*s,y=-dx*s+dy*c;return (x/(d.w/2+16))**2+(y/(d.h/2+16))**2<=1})}
export function undo(s:State):State{if(!s.actions.length)return s;const last=s.actions.at(-1)!;let end=s.actions.length-1;if(last.gesture!==undefined)while(end>0&&s.actions[end-1].gesture===last.gesture)end--;return {...s,step:s.actions.slice(end).some(a=>a.kind==='sauce')?'sauce':s.step,actions:s.actions.slice(0,end)}}
export function restore(value:unknown):State{
 try{const s=value as State;if(!s||s.version!==1||!['sauce','topping'].includes(s.step)||!Array.isArray(s.actions)||s.actions.length>1500||!Number.isInteger(s.nextId)||s.nextId<1||s.nextId>100000)return fresh()
 const point=(p:unknown)=>{const v=p as Point;return !!v&&typeof v.x==='number'&&Number.isFinite(v.x)&&v.x>=0&&v.x<=SIZE&&typeof v.y==='number'&&Number.isFinite(v.y)&&v.y>=0&&v.y<=SIZE}
 const ids=new Set<number>()
 for(const a of s.actions){if(!a||!['sauce','place','move','remove'].includes(a.kind))return fresh();if(a.kind==='sauce'){if(!Array.isArray(a.points)||a.points.length>4096||!a.points.length||!a.points.every(point))return fresh()}else if(a.kind==='place'){if(!Array.isArray(a.items)||a.items.length>10)return fresh();for(const t of a.items){if(!point(t)||!['cheese','pepperoni','mushroom','onion','paprika','olive'].includes(t.kind)||!Number.isInteger(t.id)||t.id<1||t.id>=s.nextId||ids.has(t.id)||!Number.isInteger(t.group)||t.group<1||t.group>s.nextId||!Number.isFinite(t.rotation)||Math.abs(t.rotation)>10||!Number.isFinite(t.scale)||t.scale<.5||t.scale>2||!Number.isInteger(t.variant)||t.variant<0||t.variant>2)return fresh();ids.add(t.id)}}else if(!ids.has(a.id)||a.kind==='move'&&!point(a))return fresh()}
 return s
 }catch{return fresh()}
}
export function readState(){try{return restore(JSON.parse(localStorage.getItem(storageKey)??'null'))}catch{return fresh()}}
