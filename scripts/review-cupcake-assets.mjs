// Offline asset preparation only; no game code or originals are changed.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const names=['ingredient-egg','ingredient-milk','ingredient-flour','ingredient-sugar','mixing-bowl-empty','mix-egg-layer','mix-milk-layer','mix-flour-layer','mix-sugar-layer','cupcake-cup-empty','cupcake-cup-filled','cupcake-cup-half-baked','cupcake-tray-3-base'];
if(!process.argv[2])throw Error('Supply the read-only source image folder as the first argument.');
const dir=process.argv[2].replaceAll('\\','/').replace(/\/$/,'')+'/',out='../output/cupcake-assets',docs='docs/cupcake-three-assets';
mkdirSync(out,{recursive:true});mkdirSync(docs,{recursive:true});
const inputs=names.map(name=>{const b=readFileSync(dir+name+'.png.png');return{name,data:b.toString('base64'),sha256:createHash('sha256').update(b).digest('hex'),colorType:b[25]}});
inputs.push({name:'existing-baked',data:readFileSync('public/assets/cooking-v2/cupcake/cupcake-baked-base.png').toString('base64')});
inputs.push({name:'existing-bowl',data:readFileSync('public/assets/cooking-v2/cupcake/mixing-bowl-batter.png').toString('base64')});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const page=await browser.newPage({viewport:{width:1500,height:1100}});await page.setContent('<body style="margin:0;background:#ddd"></body>');
 const result=await page.evaluate(async inputs=>{
 globalThis.assets={};const reports=[];
 for(const input of inputs){const im=new Image();im.src='data:image/png;base64,'+input.data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);const p=x.getImageData(0,0,c.width,c.height),d=p.data,w=c.width,h=c.height,n=w*h;
 let transparent=0,partial=0,minX=w,minY=h,maxX=0,maxY=0;for(let i=0;i<n;i++){const a=d[i*4+3];if(!a)transparent++;else{if(a<255)partial++;if(a>32){minX=Math.min(minX,i%w);maxX=Math.max(maxX,i%w);minY=Math.min(minY,Math.floor(i/w));maxY=Math.max(maxY,Math.floor(i/w));}}}
 let removed=0; if(!input.name.startsWith('existing')){const seen=new Uint8Array(n),queue=new Int32Array(n);for(let i=0;i<n;i++){if(seen[i]||d[i*4+3]<8)continue;let head=0,tail=1;queue[0]=i;seen[i]=1;while(head<tail){const k=queue[head++],px=k%w;for(const j of [px>0?k-1:-1,px<w-1?k+1:-1,k-w,k+w])if(j>=0&&j<n&&!seen[j]&&d[j*4+3]>=8){seen[j]=1;queue[tail++]=j;}}if(tail<120){removed+=tail;for(let j=0;j<tail;j++)d[queue[j]*4+3]=0;}}
 for(let i=0;i<n;i++)if(d[i*4+3]<8)d[i*4+3]=0;x.putImageData(p,0,0);}
 const target=input.name.startsWith('ingredient')?1024:input.name.includes('tray')?1800:1254,th=input.name.includes('tray')?1000:target;
 const dest=document.createElement('canvas');dest.width=target;dest.height=th;const dx=dest.getContext('2d'),s=Math.min(target/w,th/h);dx.drawImage(c,(target-w*s)/2,(th-h*s)/2,w*s,h*s);assets[input.name]=dest;
 const final=dx.getImageData(0,0,target,th).data;let zeros=0,semi=0,edge=0;for(let k=0;k<target*th;k++){const a=final[k*4+3];if(!a)zeros++;else if(a<255)semi++;if(a>32&&(k%target===0||k%target===target-1||k<target||k>=target*(th-1)))edge++;}
 reports.push({name:input.name,input:[w,h],output:[target,th],colorType:input.colorType,sha256:input.sha256,transparent,partial,bounds:[minX,minY,maxX,maxY],removedSmallComponentPixels:removed,final:{transparent:zeros,partial:semi,edgePixels:edge},png:dest.toDataURL()});
 }
 globalThis.sheet=(kind)=>{const cv=document.createElement('canvas');cv.width=1500;cv.height=kind==='all'?1800:1000;const ctx=cv.getContext('2d');for(let y=0;y<cv.height;y+=20)for(let x=0;x<1500;x+=20){ctx.fillStyle=(x/20+y/20)%2?'#e0e6ea':'#fff';ctx.fillRect(x,y,20,20);}ctx.font='20px Arial';ctx.fillStyle='#332a29';
 if(kind==='all'){let i=0;for(const [name,a]of Object.entries(assets)){const col=i%4,row=Math.floor(i/4);ctx.drawImage(a,col*375,row*440+35,365,365);ctx.fillText(name,col*375+5,row*440+25);i++;}}
 else if(kind==='cups'){['existing-baked','cupcake-cup-empty','cupcake-cup-filled','cupcake-cup-half-baked'].forEach((name,i)=>{ctx.drawImage(assets[name],i*375,60,375,375);ctx.fillText(name,i*375+4,35);});['cupcake-cup-empty','cupcake-cup-filled','cupcake-cup-half-baked'].forEach((name,i)=>{ctx.globalAlpha=.5;ctx.drawImage(assets['existing-baked'],i*500,470,500,500);ctx.drawImage(assets[name],i*500,470,500,500);ctx.globalAlpha=1;});}
 else if(kind==='bowl'){['egg','milk','flour','sugar'].forEach((name,i)=>{ctx.drawImage(assets['mixing-bowl-empty'],i*375,50,375,375);ctx.drawImage(assets['mix-'+name+'-layer'],i*375,50,375,375);ctx.fillText(name+' / same canvas',i*375+4,30);});ctx.drawImage(assets['existing-bowl'],20,450,500,500);ctx.drawImage(assets['mixing-bowl-empty'],520,450,500,500);ctx.fillText('Existing bowl',20,440);ctx.fillText('New empty bowl: different shape',520,440);ctx.globalAlpha=.5;ctx.drawImage(assets['existing-bowl'],1000,450,500,500);ctx.drawImage(assets['mixing-bowl-empty'],1000,450,500,500);ctx.globalAlpha=1;}
 else if(kind==='approved'){['egg','milk','flour','sugar'].forEach((name,i)=>{ctx.fillStyle='#263740';ctx.fillRect(i*375,500,375,500);ctx.drawImage(assets['ingredient-'+name],i*375,40,375,375);ctx.drawImage(assets['ingredient-'+name],i*375,540,375,375);ctx.fillStyle='#332a29';ctx.fillText(name,i*375+5,25);});}
 document.body.replaceChildren(cv);return cv.toDataURL();};
 return reports;
},inputs);
const approvedDir='public/assets/cooking-v2/cupcake/three';mkdirSync(approvedDir,{recursive:true});
for(const r of result){const b=Buffer.from(r.png.split(',')[1],'base64');writeFileSync(out+'/'+r.name+'.png',b);delete r.png;if(r.name.startsWith('ingredient-')){assert.equal(r.final.edgePixels,0);assert.ok(r.final.transparent>1000&&r.final.partial>0);assert.equal(b[25],6);writeFileSync(approvedDir+'/'+r.name+'.png',b);r.status='approved-card';r.outputSha256=createHash('sha256').update(b).digest('hex');}else if(!r.name.startsWith('existing'))r.status='rejected-composition';}
for(const input of inputs.filter(i=>i.sha256))assert.equal(createHash('sha256').update(readFileSync(dir+input.name+'.png.png')).digest('hex'),input.sha256);
writeFileSync(docs+'/audit.json',JSON.stringify(result,null,2));for(const kind of ['all','cups','bowl','approved']){const png=await page.evaluate(k=>sheet(k),kind);writeFileSync(docs+'/'+kind+'-review.png',Buffer.from(png.split(',')[1],'base64'));}
console.log(JSON.stringify(result.map(({name,input,transparent,partial,removedSmallComponentPixels})=>({name,input,transparent,partial,removedSmallComponentPixels})),null,2));
}finally{await browser.close()}
