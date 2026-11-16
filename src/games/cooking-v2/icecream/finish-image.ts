import {render,type Images} from './composition'
import type {State} from './model'

// Frame the existing composition as one image; never reposition individual ingredients.
export function finishImage(s:State,images:Images){
 const source=render(s,images),pixels=source.getContext('2d')!.getImageData(0,0,source.width,source.height).data
 let left=source.width,top=source.height,right=-1,bottom=-1
 for(let k=0;k<pixels.length/4;k++)if(pixels[k*4+3]){
  const x=k%source.width,y=Math.floor(k/source.width)
  left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)
 }
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1400
 if(right<left)return canvas
 const width=right-left+1,height=bottom-top+1,scale=Math.min(1272/width,1272/height,2)
 const context=canvas.getContext('2d')!;context.imageSmoothingQuality='high'
 context.drawImage(source,left,top,width,height,(1400-width*scale)/2,(1400-height*scale)/2,width*scale,height*scale)
 return canvas
}

export function pngBlob(canvas:HTMLCanvasElement):Promise<Blob>{return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'))}
