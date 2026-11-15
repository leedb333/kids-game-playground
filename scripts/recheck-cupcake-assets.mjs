// Asset-only inspection. All trial composites stay outside public until visually approved.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='public/assets/cooking-v2/cupcake/',docs='docs/cupcake-three-recheck',local='../output/cupcake-recheck';
const names=['mixing-bowl-empty','mix-egg-layer','mix-milk-layer','mix-flour-layer','mix-sugar-layer','cupcake-cup-empty','cupcake-cup-filled','cupcake-cup-half-baked','cupcake-tray-3-base'];
const source=process.argv[2];if(!source)throw Error('Source directory required');
const sha=b=>createHash('sha256').update(b).digest('hex');
mkdirSync(docs,{recursive:true});mkdirSync(local,{recursive:true});
const inputs=names.map(name=>{const path=source+'/'+name+'.png.png',b=readFileSync(path);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');return{name,path,sha256:sha(b),sourceSize:[b.readUInt32BE(16),b.readUInt32BE(20)],colorType:b[25],data:b.toString('base64')}});
for(const name of ['cupcake-baked-base','mixing-bowl-batter','cupcake-kitchen-bg','cupcake-tray','frosting-strawberry','frosting-vanilla','piping-bag-vanilla','tool-whisk','topping-sprinkles']){const b=readFileSync(root+name+'.png');inputs.push({name,path:root+name+'.png',sha256:sha(b),data:b.toString('base64'),reference:true});}
for(const name of ['cupcake-a-mixing','cupcake-b-decorating','cupcake-c-complete']){const path='public/assets/reference/cooking-v2/cupcake/'+name+'.png',b=readFileSync(path);inputs.push({name,path,sha256:sha(b),data:b.toString('base64'),reference:true});}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.setContent('<body></body>');
 const results=await page.evaluate(async inputs=>{
  const make=(w=1254,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const ctx=c=>c.getContext('2d',{willReadFrequently:true});
  const pixels=c=>ctx(c).getImageData(0,0,c.width,c.height);
  const stats=c=>{const d=pixels(c).data,w=c.width,h=c.height;let zero=0,semi=0,edge=0,b=[w,h,0,0];for(let i=0;i<w*h;i++){const a=d[i*4+3];if(!a)zero++;else if(a<255)semi++;if(a>32){b=[Math.min(b[0],i%w),Math.min(b[1],Math.floor(i/w)),Math.max(b[2],i%w),Math.max(b[3],Math.floor(i/w))];if(i%w===0||i%w===w-1||i<w||i>=w*(h-1))edge++;}}return{size:[w,h],zero,semi,edge,bounds:b};};
  const clean=c=>{const p=pixels(c),d=p.data,w=c.width,n=w*c.height,seen=new Uint8Array(n),q=new Int32Array(n);let best=[];for(let i=0;i<n;i++){if(seen[i]||d[4*i+3]<32)continue;let h=0,t=1;q[0]=i;seen[i]=1;while(h<t){const k=q[h++],x=k%w;for(const j of [x?k-1:-1,x<w-1?k+1:-1,k-w,k+w])if(j>=0&&j<n&&!seen[j]&&d[4*j+3]>=32){seen[j]=1;q[t++]=j;}}if(t>best.length)best=Array.from(q.subarray(0,t));}const keep=new Uint8Array(n);for(const k of best){const x=k%w,y=Math.floor(k/w);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<c.height)keep[k+dy*w+dx]=1;}let removed=0;for(let i=0;i<n;i++)if(!keep[i]||d[4*i+3]<8){if(d[4*i+3])removed++;d[4*i+3]=0;}ctx(c).putImageData(p,0,0);return removed;};
  const assets={},raw={},reports=[];
  for(const input of inputs){const im=new Image();im.src='data:image/png;base64,'+input.data;await im.decode();const c=make(im.width,im.height);ctx(c).drawImage(im,0,0);raw[input.name]=c;
   if(input.reference){assets[input.name]=c;continue;}
   const before=stats(c),copy=make(c.width,c.height);ctx(copy).drawImage(c,0,0);const removed=clean(copy),w=input.name.includes('tray')?1800:1254,h=input.name.includes('tray')?1000:1254,dest=make(w,h),s=Math.min(w/c.width,h/c.height);ctx(dest).drawImage(copy,(w-c.width*s)/2,(h-c.height*s)/2,c.width*s,c.height*s);assets[input.name]=dest;reports.push({name:input.name,sha256:input.sha256,colorType:input.colorType,source:before,processed:stats(dest),removed});
  }
  const metrics={};
  // Compare the actual front region and heart positions, not just canvas dimensions.
  const old=pixels(assets['cupcake-baked-base']),rowStart=740;
  metrics.rawCupFront=names=>names.map(name=>{const d=pixels(assets[name]).data;let changed=0,count=0,error=0;for(let y=rowStart;y<1100;y++)for(let x=250;x<1000;x++){const i=(y*1254+x)*4;if(old.data[i+3]>32){count++;let e=0;for(let k=0;k<4;k++)e+=Math.abs(old.data[i+k]-d[i+k]);if(e)changed++;error+=e;}}return{name,region:[250,rowStart,1000,1100],count,changed,meanChannelAbsoluteError:error/count/4};});
  metrics.rawCupFront=metrics.rawCupFront(['cupcake-cup-empty','cupcake-cup-filled','cupcake-cup-half-baked']);
  // Common front extraction experiment. Not auto-approved: the hidden rear/inside is unknown.
  const front=make(),fp=ctx(front).createImageData(1254,1254),mask=new Uint8Array(1254*1254);
  for(let x=130;x<1120;x++){let cut=-1;for(let y=500;y<725;y++){const i=(y*1254+x)*4,[r,g,b,a]=old.data.slice(i,i+4);if(a>100&&r>g*1.12&&b>g*1.12){cut=Math.max(0,y-2);break;}}if(cut>=0)for(let y=cut;y<1254;y++){const k=y*1254+x;mask[k]=1;for(let c=0;c<4;c++)fp.data[k*4+c]=old.data[k*4+c];}}
  ctx(front).putImageData(fp,0,0);assets['trial-wrapper-front']=front;
  metrics.commonFrontTrials=[];
  for(const name of ['empty','filled','half-baked']){const c=make(),x=ctx(c);x.drawImage(assets['cupcake-cup-'+name],0,0);const p=pixels(c);for(let k=0;k<mask.length;k++)if(mask[k])for(let j=0;j<4;j++)p.data[k*4+j]=old.data[k*4+j];x.putImageData(p,0,0);assets['trial-common-front-'+name]=c;let changed=0,count=0;const out=pixels(c).data;for(let k=0;k<mask.length;k++)if(mask[k]&&old.data[k*4+3]>250){count++;if([0,1,2,3].some(j=>out[k*4+j]!==old.data[k*4+j]))changed++;}metrics.commonFrontTrials.push({name,count,changed,approved:false,reason:'visible jagged join and remaining new-wrapper outline'});}
  // Bowl: reuse the exact old exterior, replace only its food surface with a new inner bowl crop.
  const bowl=make(),bx=ctx(bowl);bx.drawImage(assets['mixing-bowl-batter'],0,0);
  const oldBowl=pixels(bowl),surface=make();ctx(surface).save();ctx(surface).beginPath();ctx(surface).ellipse(622,478,518,181,0,0,Math.PI*2);ctx(surface).clip();
  // Uniform scale/translation of the supplied empty-bowl inner texture; no redrawing.
  ctx(surface).drawImage(assets['mixing-bowl-empty'],-2,-130,1254,1254);ctx(surface).restore();bx.drawImage(surface,0,0);assets['trial-bowl-reused-exterior']=bowl;
  const layers=['egg','milk','flour','sugar'];
  const placements={egg:{x:415,y:465,scale:.32},milk:{x:790,y:460,scale:.28},flour:{x:540,y:530,scale:.27},sugar:{x:760,y:540,scale:.22}};
  for(const name of layers){const c=make(),x=ctx(c),im=assets['mix-'+name+'-layer'],st=stats(im),b=st.bounds,p=placements[name],s=p.scale;
   x.save();x.beginPath();x.ellipse(622,478,502,163,0,0,Math.PI*2);x.clip();x.drawImage(im,p.x-(b[0]+b[2])*s/2,p.y-(b[1]+b[3])*s/2,1254*s,1254*s);x.restore();assets['trial-mix-'+name]=c;
  }
  metrics.layerPlacements=placements;metrics.bowlProtectedEllipse={cx:622,cy:478,rx:518,ry:181};
  let unchanged=0,changed=0;const nb=pixels(bowl);for(let y=0;y<1254;y++)for(let x=0;x<1254;x++){if(((x-622)/518)**2+((y-478)/181)**2>1.02){const k=(y*1254+x)*4;unchanged++;if([0,1,2,3].some(c=>nb.data[k+c]!==oldBowl.data[k+c]))changed++;}}
  metrics.bowlExteriorTrial={testedPixels:unchanged,changed};
  const board=(w,h,title)=>{const c=make(w,h),x=ctx(c);for(let y=0;y<h;y+=20)for(let z=0;z<w;z+=20){x.fillStyle=(y/20+z/20)%2?'#f4ede7':'#fff';x.fillRect(z,y,20,20);}x.fillStyle='#563b38';x.font='21px Arial';x.fillText(title,18,28);return c;};
  const sheets={};
  let rc=board(1600,500,'C0 / supplied empty bowl + layers at their original coordinates (failed)'),rx=ctx(rc);layers.forEach((n,i)=>{rx.drawImage(assets['mixing-bowl-empty'],i*400,40,400,400);rx.drawImage(assets['mix-'+n+'-layer'],i*400,40,400,400);rx.fillText(n,i*400+10,475);});sheets['C0-input-bowl-composites']=rc;
  let c=board(1600,1300,'INPUTS / original references — no automatic approval'),x=ctx(c);Object.keys(assets).filter(n=>!n.startsWith('trial')).forEach((n,i)=>{const col=i%5,row=Math.floor(i/5);if(row>3)return;const a=assets[n];x.drawImage(a,col*320,row*310+60,310,240);x.fillText(n,col*320+5,row*310+52);});sheets['00-inputs']=c;
  c=board(1600,500,'A / four cupcake states in original coordinates');x=ctx(c);['cupcake-cup-empty','cupcake-cup-filled','cupcake-cup-half-baked','cupcake-baked-base'].forEach((n,i)=>{x.drawImage(assets[n],i*400,50,400,400);x.fillText(n,i*400+4,470);});sheets['A-cup-states']=c;
  c=board(1500,1080,'B / upper: input overlay; lower: common-front trial (NOT approved)');x=ctx(c);['empty','filled','half-baked'].forEach((n,i)=>{x.globalAlpha=.5;x.drawImage(assets['cupcake-baked-base'],i*500,40,500,500);x.drawImage(assets['cupcake-cup-'+n],i*500,40,500,500);x.globalAlpha=1;x.drawImage(assets['trial-common-front-'+n],i*500,550,500,500);});sheets['B-cup-overlay-trial']=c;
  c=board(1600,1050,'C / upper: repositioned single ingredients; lower: accumulated / reused exterior trial');x=ctx(c);layers.forEach((n,i)=>{x.drawImage(bowl,i*400,40,400,400);x.drawImage(assets['trial-mix-'+n],i*400,40,400,400);x.fillText(n,i*400+10,470);});let acc=make();ctx(acc).drawImage(bowl,0,0);layers.forEach((n,i)=>{ctx(acc).drawImage(assets['trial-mix-'+n],0,0);x.drawImage(acc,i*400,520,400,400);x.fillText(layers.slice(0,i+1).join(' + '),i*400+5,980);});sheets['C-bowl-composites-trial']=c;
  const tray=assets['cupcake-tray-3-base'];metrics.tray={canvas:[1800,1000],cupSourceAnchor:[623,1082],slots:[{x:393,y:680},{x:902,y:680},{x:1404,y:680}],scale:.45,frontOcclusion:'trial: original tray pixels below y=690 copied back; review required'};
  for(const [letter,name]of [['D','cupcake-cup-empty'],['E','cupcake-cup-filled'],['F','cupcake-baked-base']]){const tc=make(1800,1000),tx=ctx(tc);tx.drawImage(tray,0,0);for(const p of metrics.tray.slots)tx.drawImage(assets[name],p.x-623*.45,p.y-1082*.45,1254*.45,1254*.45);tx.drawImage(tray,0,690,1800,310,0,690,1800,310);const sheet=board(1800,1060,letter+' / tray fit diagnostic — cupcake states not approved');ctx(sheet).drawImage(tc,0,50);sheets[letter+'-tray-'+name]=sheet;}
  c=board(1500,860,'G / detail: existing wrapper vs new wrapper; old bowl vs reused-exterior trial');x=ctx(c);x.drawImage(assets['cupcake-baked-base'],250,700,750,400,0,80,750,400);x.drawImage(assets['cupcake-cup-filled'],250,700,750,400,750,80,750,400);x.drawImage(assets['mixing-bowl-batter'],100,280,1000,410,0,520,750,307.5);x.drawImage(bowl,100,280,1000,410,750,520,750,307.5);sheets['G-detail']=c;
  const trayPass=stats(tray);if(trayPass.edge!==0||trayPass.zero===0)throw Error('Tray alpha/edge check failed');
  const trayBoxes=metrics.tray.slots.map(p=>({left:p.x+(138-623)*.45,right:p.x+(1108-623)*.45,footY:p.y}));
  metrics.tray.bakedCupBoxes=trayBoxes;metrics.tray.gaps=[trayBoxes[1].left-trayBoxes[0].right,trayBoxes[2].left-trayBoxes[1].right];if(metrics.tray.gaps.some(g=>g<=0))throw Error('Tray cup overlap');
  return{reports,metrics,sheets:Object.fromEntries(Object.entries(sheets).map(([k,v])=>[k,v.toDataURL()])),candidates:Object.fromEntries(Object.entries(assets).filter(([k])=>!inputs.find(i=>i.reference&&i.name===k)).map(([k,v])=>[k,v.toDataURL()]))};
 },inputs);
 for(const [name,png]of Object.entries(results.sheets))writeFileSync(docs+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'));
 for(const [name,png]of Object.entries(results.candidates))writeFileSync(local+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'));
 for(const input of inputs)assert.equal(sha(readFileSync(input.path)),input.sha256);
 const accepted=Buffer.from(results.candidates['cupcake-tray-3-base'].split(',')[1],'base64');assert.equal(accepted[25],6);assert.equal(accepted.readUInt32BE(16),1800);assert.equal(accepted.readUInt32BE(20),1000);writeFileSync(root+'three/cupcake-tray-3-base.png',accepted);
 const decisions=names.map(name=>({name,status:name==='cupcake-tray-3-base'?'approved':'held',gameAssetUploaded:name==='cupcake-tray-3-base'}));
 writeFileSync(docs+'/audit.json',JSON.stringify({sourceHashes:inputs.map(({name,sha256,reference})=>({name,sha256,reference:!!reference})),reports:results.reports,metrics:results.metrics,decisions,trayOutputSha256:sha(accepted),originalsUnchanged:true,productionCodeChanged:false},null,2));
 console.log(JSON.stringify({reports:results.reports,metrics:results.metrics},null,2));
}finally{await browser.close();}
