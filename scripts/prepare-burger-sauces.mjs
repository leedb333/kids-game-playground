import {chromium} from '@playwright/test'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
const dir='public/assets/cooking-v2/burger/',out='src/games/cooking-v2/burger/assets/'
mkdirSync('docs/burger-sauces',{recursive:true})
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)})
try {
 const page=await browser.newPage(),audit=[]
 for(const sauce of ['ketchup','mayonnaise','mustard']) {
  const name=`sauce-${sauce}-drizzle.png`,bytes=readFileSync(dir+name)
  await page.setContent(`<img src="data:image/png;base64,${bytes.toString('base64')}">`)
  const result=await page.locator('img').evaluate(async im=>{
   await im.decode();const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h
   const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,w,h),p=d.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[],components=0,transparent=0,partial=0
   for(let n=0;n<w*h;n++){const a=p[n*4+3];if(a===0)transparent++;else if(a<255)partial++;if(a<20||seen[n])continue
    components++;let start=0,end=1;queue[0]=n;seen[n]=1
    while(start<end){const i=queue[start++],x=i%w;for(const j of [x?i-1:-1,x<w-1?i+1:-1,i-w,i+w])if(j>=0&&j<w*h&&!seen[j]&&p[j*4+3]>=20){seen[j]=1;queue[end++]=j}}
    if(end>largest.length)largest=Array.from(queue.subarray(0,end))
   }
   const keep=new Uint8Array(w*h);let left=w,top=h,right=0,bottom=0
   for(const i of largest){const x=i%w,y=Math.floor(i/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)keep[yy*w+xx]=1}}
   let removed=0;for(let i=0;i<w*h;i++)if(!keep[i]){if(p[i*4+3])removed++;p[i*4+3]=0}
   // Keep the original fractional alpha on the connected food edge; remove detached speckles only.
   ctx.putImageData(d,0,0);left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(w-1,right+2);bottom=Math.min(h-1,bottom+2)
   const target=document.createElement('canvas');target.width=right-left+1;target.height=bottom-top+1;target.getContext('2d').drawImage(c,left,top,target.width,target.height,0,0,target.width,target.height)
   return {width:w,height:h,transparent,partial,components,removed,cropped:{width:target.width,height:target.height},bounds:{left,top,right,bottom},png:target.toDataURL('image/png')}
  })
  const {png,...meta}=result;writeFileSync(out+name,Buffer.from(png.split(',')[1],'base64'));audit.push({name,format:bytes.subarray(1,4).toString(),colorType:bytes[25],sha256:createHash('sha256').update(bytes).digest('hex'),...meta})
 }
 writeFileSync('docs/burger-sauces/asset-audit.json',JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2))
} finally {await browser.close()}
