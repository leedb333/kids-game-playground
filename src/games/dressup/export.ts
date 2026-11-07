import type {SeasonId} from './data'
export async function savePortrait(svg:SVGSVGElement,season:SeasonId='spring'){
 const copy=svg.cloneNode(true) as SVGSVGElement
 copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width','2160');copy.setAttribute('height','1340')
 const source=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'}))
 try{
  const image=new Image();image.src=source;await image.decode()
  const canvas=document.createElement('canvas');canvas.width=2160;canvas.height=1340
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas unavailable');ctx.drawImage(image,0,0,2160,1340)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG unavailable')),'image/png'))
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=({spring:'봄날',summer:'여름날',autumn:'가을날',winter:'겨울날'}[season])+'-코디-기념사진.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)
 }finally{URL.revokeObjectURL(source)}
}
