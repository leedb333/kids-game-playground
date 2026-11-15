import background from './assets/cupcake-kitchen-bg.png'
import bowl from './assets/mixing-bowl-batter.png'
import whisk from './assets/tool-whisk.png'
import tray from './assets/cupcake-tray.png'
import base from './assets/cupcake-baked-base.png'
import bag from './assets/piping-bag-vanilla.png'
import vanilla from './assets/frosting-vanilla.png'
import strawberry from './assets/frosting-strawberry.png'
import sprinkles from './assets/topping-sprinkles.png'
import surface from './assets/batter-surface.png'
import blue from './assets/sprinkle-blue.png'
import purple from './assets/sprinkle-purple.png'
import yellow from './assets/sprinkle-yellow.png'
import plate from '../burger/assets/plate.png'
export const urls={background,bowl,whisk,tray,base,bag,vanilla,strawberry,sprinkles,surface,blue,purple,yellow,plate}
export type Asset=keyof typeof urls
export type Images=Record<Asset,HTMLImageElement>
export async function loadImages():Promise<Images>{const pairs=await Promise.all(Object.entries(urls).map(async([key,url])=>{const im=new Image();im.src=url;await im.decode();return [key,im]}));return Object.fromEntries(pairs) as Images}
// The shared opaque area lets decorations survive a cream-flavour change.
export function creamMask(images:Images){const size=180,data=['vanilla','strawberry'].map(key=>{const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(images[key as Asset],0,0,size,size);return ctx.getImageData(0,0,size,size).data});return (u:number,v:number)=>{if(u<.03||u>.97||v<.04||v>.96)return false;const i=(Math.min(size-1,Math.floor(v*size))*size+Math.min(size-1,Math.floor(u*size)))*4+3;return data.every(d=>d[i]>200)}}
