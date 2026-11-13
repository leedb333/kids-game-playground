import type {CSSProperties} from 'react'
import {urls,type Images} from './assets'
import {ingredients,layout,type Layer,type Application,type Sprite} from './model'
type Props={layers:Layer[];applications?:Application[];complete:boolean;selected?:number;onSelect?:(id:number)=>void;settle?:{id:number;x:number;y:number}}
export function Burger({layers,applications=[],complete,selected,onSelect,settle}:Props){
 const l=layout(layers,complete,applications)
 return <svg viewBox="0 100 1000 900" className="bg-burger" role="img" aria-label={'내가 쌓은 햄버거: 아랫빵'+layers.map(i=>', '+ingredients.find(k=>k.id===i.kind)!.name).join('')+(complete?', 윗빵':'')} data-scale={l.scale.toFixed(3)} data-order={layers.map(i=>i.kind).join(',')} data-sauces={applications.map(a=>a.sauce).join(',')}>
  <image href={urls.plate} x={l.plate.x} y={l.plate.y} width={l.plate.width} height={l.plate.height} preserveAspectRatio="none"/>
  {l.sprites.map(i=>{
   const id=i.layerId??i.sauceId,landing=settle&&settle.id===id
   return <g key={i.key} data-food={i.key} data-asset={i.asset} className={landing?(i.sauceId?'bg-drizzle-settle':'bg-settle'):''} style={landing?{'--drop-x':Math.max(-170,Math.min(170,settle.x-i.x-i.width/2))+'px','--drop-y':Math.max(-180,Math.min(180,settle.y-i.y-i.height/2))+'px'} as CSSProperties:undefined} onPointerDown={e=>{if(onSelect&&id){e.stopPropagation();onSelect(id)}}}>
    <g transform={i.rotation?`rotate(${i.rotation} ${i.x+i.width/2} ${i.y+i.height/2})`:undefined}>
     {selected!==undefined&&selected===id&&<ellipse cx={i.x+i.width/2} cy={i.y+i.height*.65} rx={i.width*.51} ry={i.height*.4} fill="#ffe8a040" stroke="#eab351" strokeWidth="7"/>}
     <image href={urls[i.asset]} x={i.x} y={i.y} width={i.width} height={i.height} preserveAspectRatio="none"/>
    </g>
   </g>
  })}
 </svg>
}
// SVG display and PNG export share sprite positions, painter order and rotation.
export function drawSprite(ctx:CanvasRenderingContext2D,i:Sprite,image:HTMLImageElement){
 ctx.save();ctx.translate(i.x+i.width/2,i.y+i.height/2);ctx.rotate((i.rotation??0)*Math.PI/180)
 ctx.drawImage(image,-i.width/2,-i.height/2,i.width,i.height);ctx.restore()
}
export async function downloadBurger(layers:Layer[],images:Images,applications:Application[]=[]){
 const snapshot=layers.map(l=>({...l})),sauces=applications.map(a=>({...a})),l=layout(snapshot,true,sauces),canvas=document.createElement('canvas')
 canvas.width=1400;canvas.height=1400;const ctx=canvas.getContext('2d')!;ctx.scale(1.4,1.4)
 for(const i of [l.plate,...l.sprites])drawSprite(ctx,i,images[i.asset])
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG')),'image/png'))
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='나만의-햄버거.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)
}
