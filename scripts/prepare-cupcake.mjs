import {chromium} from '@playwright/test'
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
const root='public/assets/cooking-v2/cupcake/',out='src/games/cooking-v2/cupcake/assets/'
mkdirSync(out,{recursive:true});mkdirSync('docs/cupcake-prototype',{recursive:true})
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)})
try {const page=await browser.newPage({viewport:{width:1440,height:1250}}),names=readdirSync(root).filter(n=>n.endsWith('.png')).sort(),audit=[]
 await page.setContent('<style>body{margin:0;background:#fff0e6;font:14px sans-serif}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.item{background:#fff8;text-align:center;height:400px}img{width:100%;height:370px;object-fit:contain}</style><div class="grid">'+names.map(n=>`<div class="item"><img alt="${n}" src="data:image/png;base64,${readFileSync(root+n).toString('base64')}">${n}</div>`).join('')+'</div>')
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:'docs/cupcake-prototype/original-assets.png',fullPage:true})
 for(const name of names){const result=await page.getByAltText(name,{exact:true}).evaluate(im=>{
  const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,w,h),p=d.data;let transparent=0,partial=0;for(let i=3;i<p.length;i+=4){if(!p[i])transparent++;else if(p[i]<255)partial++}
  const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[]
  if(transparent)for(let n=0;n<w*h;n++){if(p[n*4+3]<40||seen[n])continue;let a=0,b=1;queue[0]=n;seen[n]=1;while(a<b){const i=queue[a++],x=i%w;for(const j of [x?i-1:-1,x<w-1?i+1:-1,i-w,i+w])if(j>=0&&j<w*h&&!seen[j]&&p[j*4+3]>=40){seen[j]=1;queue[b++]=j}}if(b>largest.length)largest=Array.from(queue.subarray(0,b))}
  const keep=new Uint8Array(w*h);let left=0,top=0,right=w-1,bottom=h-1,removed=0
  if(transparent){left=w;top=h;right=bottom=0;for(const i of largest){const x=i%w,y=Math.floor(i/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h)keep[(y+dy)*w+x+dx]=1}for(let i=0;i<w*h;i++)if(!keep[i]){if(p[i*4+3])removed++;p[i*4+3]=0}left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(w-1,right+2);bottom=Math.min(h-1,bottom+2);ctx.putImageData(d,0,0)}
  const dst=document.createElement('canvas');dst.width=right-left+1;dst.height=bottom-top+1;dst.getContext('2d').drawImage(c,left,top,dst.width,dst.height,0,0,dst.width,dst.height)
  const extra={}
  if(im.alt==='mixing-bowl-batter.png'){const sw=Math.round(dst.width*.81),sh=Math.round(dst.height*.30),surface=document.createElement('canvas');surface.width=sw;surface.height=sh;const sc=surface.getContext('2d');sc.beginPath();sc.ellipse(sw/2,sh/2,sw/2-2,sh/2-2,0,0,Math.PI*2);sc.clip();sc.drawImage(dst,dst.width*.095,dst.height*.17,sw,sh,0,0,sw,sh);extra['batter-surface.png']=surface.toDataURL('image/png')}
  if(im.alt==='topping-sprinkles.png'){
   // Crop a clearly exposed cyan capsule. Retain its color-connected silhouette and white highlight.
   for(const [key,rect,color] of [['sprinkle-blue.png',[550,510,190,160],'blue'],['sprinkle-purple.png',[430,292,120,110],'purple'],['sprinkle-yellow.png',[507,269,205,195],'yellow']]){
    const [x,y,pw,ph]=rect,part=document.createElement('canvas');part.width=pw;part.height=ph;const pc=part.getContext('2d',{willReadFrequently:true});pc.drawImage(c,x,y,pw,ph,0,0,pw,ph);const ip=pc.getImageData(0,0,pw,ph),v=ip.data,mask=new Uint8Array(pw*ph)
    for(let n=0;n<mask.length;n++){const i=n*4,r=v[i],g=v[i+1],b=v[i+2];mask[n]=v[i+3]>40&&(color==='blue'?b>r*1.08&&g>r*1.02:color==='purple'?b>g*1.08&&r>g*1.03&&b>r*.98:r>b*1.25&&g>b*1.08)?1:0}
    // Fill only enclosed highlights; exterior remains transparent.
    const exterior=new Uint8Array(pw*ph),todo=[];for(let x=0;x<pw;x++)todo.push(x,(ph-1)*pw+x);for(let y=0;y<ph;y++)todo.push(y*pw,y*pw+pw-1);while(todo.length){const n=todo.pop();if(n<0||n>=mask.length||exterior[n]||mask[n])continue;exterior[n]=1;const x=n%pw;if(x)todo.push(n-1);if(x<pw-1)todo.push(n+1);todo.push(n-pw,n+pw)}for(let n=0;n<mask.length;n++)if(exterior[n])v[n*4+3]=0;pc.putImageData(ip,0,0);if(color==='yellow'){pc.globalCompositeOperation='destination-in';pc.beginPath();for(const [i,[px,py]] of [[100,0],[113,5],[133,53],[184,58],[205,73],[198,94],[158,126],[170,180],[159,192],[105,168],[52,193],[35,184],[44,126],[5,96],[0,83],[10,66],[73,57],[86,14]].entries()){if(i)pc.lineTo(px,py);else pc.moveTo(px,py)}pc.closePath();pc.fill()}extra[key]=part.toDataURL('image/png')
   }
  }
  return {width:w,height:h,transparent,partial,removed,bounds:{left,top,right,bottom},cropped:{width:dst.width,height:dst.height},png:dst.toDataURL('image/png'),extra}
 });const {png,extra,...meta}=result;writeFileSync(out+name,Buffer.from(png.split(',')[1],'base64'));for(const [n,url] of Object.entries(extra))writeFileSync(out+n,Buffer.from(url.split(',')[1],'base64'));audit.push({name,sha256:createHash('sha256').update(readFileSync(root+name)).digest('hex'),format:readFileSync(root+name).subarray(1,4).toString(),colorType:readFileSync(root+name)[25],...meta})}
 writeFileSync('docs/cupcake-prototype/asset-audit.json',JSON.stringify(audit,null,2)+'\n');console.log(JSON.stringify(audit,null,2))
}finally{await browser.close()}
