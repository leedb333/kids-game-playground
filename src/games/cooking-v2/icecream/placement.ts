import {create,type Decoration,type Kind,type Point} from './toppings'
import {spriteGeometry,world,type Food} from './decoration-graphics'

export const maximumPlacementShift=64 // 800×1160 food coordinates; never jump to another scoop.
export function scoopAt(f:Food,p:Point){const x=Math.round(p.x),y=Math.round(p.y),k=y*800+x;return x>=0&&x<800&&y>=0&&y<1160&&f.alpha[k*4+3]>100?(f.owner?.[k]??0):-1}
const normalized=(f:Food,p:Point):Point=>({x:(p.x-f.left)/f.width,y:(p.y-f.top)/f.height})
export function severeOverlap(a:{x:number;y:number;w:number;h:number},b:typeof a){const area=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));return area/Math.min(a.w*a.h,b.w*b.h)>.35}
function interior(f:Food,p:Point,scoop:number,radius:number){return [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dy])=>scoopAt(f,{x:p.x+dx,y:p.y+dy})===scoop)}

export function place(kind:Kind,target:Point,existing:Decoration[],f:Food,images:Record<string,HTMLImageElement>):Decoration|undefined{
 const scoop=scoopAt(f,target);if(scoop<0||kind==='choco-syrup')return;
 const t={...create(kind,normalized(f,target)),scoop};
 if(kind==='sprinkles'){
  // Uniform disk sampling inside the selected visible region, with separation between sticks.
  // Save accepted points once; rendering/reload must never roll randomness again.
  let seed=2166136261;for(const c of t.id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const points:Point[]=[],radius=Math.min(115,f.width*.28);
  for(let i=0;i<600&&points.length<14;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*radius,p={x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r};if(interior(f,p,scoop,8)&&points.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>=12))points.push(p)}
  if(!points.length)return;t.points=points.map(p=>normalized(f,p));return t;
 }
 const obstacles=existing.filter(e=>!['sprinkles','choco-syrup'].includes(e.kind)).map(e=>spriteGeometry(e,f,images).box);
 const acceptable=(p:Point)=>{if(!interior(f,p,scoop,10))return;const next={...t,...normalized(f,p)},box=spriteGeometry(next,f,images).box;if(box.x<0||box.y<0||box.x+box.w>800||box.y+box.h>1160||obstacles.some(b=>severeOverlap(box,b)))return;return next};
 const exact=acceptable(target);if(exact)return exact;
 // A point near an edge isn't permission to relocate the user's decoration. Only collisions
 // trigger correction; otherwise reject the drop and ask for a point farther inside the scoop.
 if(!interior(f,target,scoop,10)||!obstacles.some(b=>severeOverlap(spriteGeometry(t,f,images).box,b)))return;
 for(let radius=8;radius<=maximumPlacementShift;radius+=8)for(let i=0;i<24;i++){const a=i*Math.PI*2/24,p={x:target.x+Math.cos(a)*radius,y:target.y+Math.sin(a)*radius},next=acceptable(p);if(next)return next}
 return;
}
