export const toppingConfig={sprinkles:{label:'스프링클',limit:5},'choco-cookie':{label:'초코과자',limit:2},candy:{label:'사탕',limit:6},'choco-syrup':{label:'초코시럽',limit:3},cherry:{label:'체리',limit:2},'heart-wafer':{label:'하트웨하스',limit:2}} as const
export type Kind=keyof typeof toppingConfig
export const kinds=Object.keys(toppingConfig) as Kind[]
export type Point={x:number;y:number}
export type Decoration={id:string;kind:Kind;x:number;y:number;size:number;rotation:number;points:Point[];variant:number}
export function counts(items:Decoration[]){return Object.fromEntries(kinds.map(k=>[k,items.filter(t=>t.kind===k).length])) as Record<Kind,number>}
export function validDecoration(t:Decoration){const point=(p:Point)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1;return t&&typeof t.id==='string'&&kinds.includes(t.kind)&&point(t)&&Number.isFinite(t.size)&&t.size>=.05&&t.size<=.5&&Number.isFinite(t.rotation)&&Math.abs(t.rotation)<=.5&&Number.isInteger(t.variant)&&t.variant>=0&&t.variant<4&&Array.isArray(t.points)&&t.points.length<=180&&t.points.every(point)}
export function create(kind:Kind,p:Point,path:Point[]=[]):Decoration{const seed=crypto.getRandomValues(new Uint32Array(1))[0],random=(i:number)=>((Math.imul(seed+i,1664525)>>>0)%1000)/1000;return{id:crypto.randomUUID(),kind,...p,size:kind==='choco-cookie'?.22:kind==='heart-wafer'?.26:.2,rotation:(random(1)-.5)*.4,variant:seed%4,points:kind==='sprinkles'?Array.from({length:14},(_,i)=>({x:Math.max(0,Math.min(1,p.x+(random(i*2+7)-.5)*.38)),y:Math.max(0,Math.min(1,p.y+(random(i*2+8)-.5)*.18))})):path}}
