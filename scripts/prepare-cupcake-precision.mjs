// Exact original-pixel preservation around locally restored, previously occluded interiors.
import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='public/assets/cooking-v2/cupcake/',docs='docs/cupcake-precision',local='../output/cupcake-precision';
mkdirSync(docs,{recursive:true});mkdirSync(local,{recursive:true});
const sources={cup:root+'cupcake-baked-base.png',bowl:root+'mixing-bowl-batter.png',cupRestore:docs+'/restoration-source/cup-restoration.png',bowlRestore:docs+'/restoration-source/bowl-restoration.png',surface:'src/games/cooking-v2/cupcake/assets/batter-surface.png',tray:root+'three/cupcake-tray-3-base.png',...Object.fromEntries(['egg','milk','flour','sugar'].map(k=>[k,root+'three/ingredient-'+k+'.png']))};
const input=Object.fromEntries(Object.entries(sources).map(([k,p])=>[k,{data:readFileSync(p).toString('base64'),sha256:createHash('sha256').update(readFileSync(p)).digest('hex')}]));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const page=await browser.newPage({viewport:{width:1600,height:1100}});await page.setContent('<body style="margin:0"></body>');
 const r=await page.evaluate(async input=>{
  const make=(w=1254,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},ctx=c=>c.getContext('2d',{willReadFrequently:true}),px=c=>ctx(c).getImageData(0,0,c.width,c.height),images={};
  for(const [k,v]of Object.entries(input)){const im=new Image();im.src='data:image/png;base64,'+v.data;await im.decode();const c=make(im.width,im.height);ctx(c).drawImage(im,0,0);images[k]=c;}
  const old=px(images.cup),generated=px(images.cupRestore),bo=px(images.bowl),bg=px(images.bowlRestore),stats={};
  const compare=(a,b,include)=>{let count=0,changed=0,error=0;for(let k=0;k<a.length/4;k++)if(include(k)){count++;let e=0;for(let j=0;j<4;j++)e+=Math.abs(a[k*4+j]-b[k*4+j]);if(e)changed++;error+=e;}return{count,changed,mean:error/Math.max(1,count)/4};};
  stats.cupRestoredFrontBeforeCopy=compare(old.data,generated.data,k=>{const x=k%1254,y=Math.floor(k/1254);return x>250&&x<1000&&y>740&&y<1080&&old.data[k*4+3]>200;});
  stats.bowlRestoredExteriorBeforeCopy=compare(bo.data,bg.data,k=>Math.floor(k/1254)>720&&bo.data[k*4+3]>200);
  // Extract the original pink/white wrapper through connected colour segmentation.
  // The golden cake has B significantly below G; the pink paper and white lip do not.
  const n=1254*1254,selected=new Uint8Array(n),queue=new Int32Array(n),eligible=k=>{const [r,g,b,a]=old.data.slice(k*4,k*4+4);return a>8&&r>100&&b>g-16;};
  let h=0,t=1;queue[0]=900*1254+500;selected[queue[0]]=1;
  while(h<t){const k=queue[h++],x=k%1254;for(const j of [x?k-1:-1,x<1253?k+1:-1,k-1254,k+1254])if(j>=0&&j<n&&!selected[j]&&eligible(j)){selected[j]=1;queue[t++]=j;}}
  const front=make(),fp=ctx(front).createImageData(1254,1254),frontMask=make(),fm=ctx(frontMask).createImageData(1254,1254);
  const lip=[];for(let x=138;x<=1109;x++){let top=1254;for(let y=480;y<740;y++)if(selected[y*1254+x]){top=y;break;}lip.push(top);}
  for(let k=0;k<n;k++){const x=k%1254,y=Math.floor(k/1254);selected[k]=x>=138&&x<=1109&&y>=lip[x-138]&&y<1100&&old.data[k*4+3]>0?1:0;if(selected[k]){for(let j=0;j<4;j++)fp.data[k*4+j]=old.data[k*4+j];fm.data[k*4]=fm.data[k*4+1]=fm.data[k*4+2]=255;fm.data[k*4+3]=255;}}
  ctx(front).putImageData(fp,0,0);ctx(frontMask).putImageData(fm,0,0);
  // Keep only restored rear/inside above the shared foreground lip. Preserve original outer side silhouette.
  const back=make(),bp=ctx(back).createImageData(1254,1254);
  for(let k=0;k<n;k++){const x=k%1254,y=Math.floor(k/1254);if(x<138||x>1109)continue;const cut=lip[x-138];if(y<cut+2&&!selected[k]&&generated.data[k*4+3]>0){for(let j=0;j<4;j++)bp.data[k*4+j]=generated.data[k*4+j];}}
  ctx(back).putImageData(bp,0,0);
  // The old bowl exterior is copied exactly; replace only pixels belonging to the yellow food.
  const emptyBowl=make(),eb=ctx(emptyBowl).createImageData(1254,1254),bowlEditMask=new Uint8Array(n);
  const foodTop=new Int32Array(1254).fill(1254),foodBottom=new Int32Array(1254).fill(-1);
  for(let k=0;k<n;k++){const [r,g,b,a]=bo.data.slice(k*4,k*4+4),x=k%1254,y=Math.floor(k/1254);if(y>230&&y<680&&a>100&&g>b+18&&r>g){foodTop[x]=Math.min(foodTop[x],y);foodBottom[x]=Math.max(foodBottom[x],y);}}
  const distance=new Int16Array(n).fill(-1),bq=new Int32Array(n);let bh=0,bt=0;
  for(let k=0;k<n;k++){const x=k%1254,y=Math.floor(k/1254);if(y>=foodTop[x]&&y<=foodBottom[x]){distance[k]=0;bq[bt++]=k;}}
  const feather=48;
  while(bh<bt){const k=bq[bh++],x=k%1254,d=distance[k];if(d>=feather)continue;for(const j of [x?k-1:-1,x<1253?k+1:-1,k-1254,k+1254])if(j>=0&&j<n&&distance[j]<0){const xx=j%1254,yy=Math.floor(j/1254);if(((xx-622)/540)**2+((yy-430)/225)**2<1){distance[j]=d+1;bq[bt++]=j;}}}
  for(let k=0;k<n;k++){const d=distance[k];let weight=0;if(d===0)weight=1;else if(d>0&&d<feather){const t=d/feather;weight=1-t*t*(3-2*t);}bowlEditMask[k]=weight>0?1:0;for(let j=0;j<3;j++)eb.data[k*4+j]=Math.round(bo.data[k*4+j]*(1-weight)+bg.data[k*4+j]*weight);eb.data[k*4+3]=bo.data[k*4+3];}
  ctx(emptyBowl).putImageData(eb,0,0);
  const states={};
  function state(kind){if(kind==='baked')return images.cup;const c=make(),x=ctx(c),food=make(),fx=ctx(food);x.drawImage(back,0,0);if(kind==='filled'){
   fx.save();fx.beginPath();fx.ellipse(623,600,440,95,0,0,Math.PI*2);fx.clip();fx.drawImage(images.surface,183,505,880,190);fx.restore();
  }if(kind==='rising'){const content=make(),cp=ctx(content).createImageData(1254,1254);for(let k=0;k<n;k++){const xx=k%1254,yy=Math.floor(k/1254);if(!selected[k]&&xx>=150&&xx<=1098&&yy>=165&&yy<=690)for(let j=0;j<4;j++)cp.data[k*4+j]=old.data[k*4+j];}ctx(content).putImageData(cp,0,0);fx.drawImage(content,0,170);}
   const foodPixels=px(food);for(let k=0;k<n;k++){const xx=k%1254,yy=Math.floor(k/1254);if(xx<138||xx>1109||yy>lip[xx-138]+2)foodPixels.data[k*4+3]=0;}fx.putImageData(foodPixels,0,0);x.drawImage(food,0,0);
   x.drawImage(front,0,0);const p=px(c);for(let k=0;k<n;k++)if(selected[k])for(let j=0;j<4;j++)p.data[k*4+j]=old.data[k*4+j];x.putImageData(p,0,0);return c;}
  for(const kind of ['empty','filled','rising','baked'])states[kind]=state(kind);
  stats.foreground=Object.fromEntries(Object.entries(states).map(([k,c])=>[k,compare(old.data,px(c).data,i=>selected[i]&&old.data[i*4+3]>250)]));
  const emptyPixels=px(emptyBowl).data;stats.bowlProtected=compare(bo.data,emptyPixels,k=>!bowlEditMask[k]);stats.bowlAlpha={count:n,changed:0};for(let k=0;k<n;k++)if(bo.data[k*4+3]!==emptyPixels[k*4+3])stats.bowlAlpha.changed++;
  stats.bowlEditedPixels=bowlEditMask.reduce((a,b)=>a+b,0);stats.frontMaskPixels=selected.reduce((a,b)=>a+b,0);stats.segmentationFloodPixels=t;
  const sheets={},board=(w,h,label)=>{const c=make(w,h),x=ctx(c);for(let y=0;y<h;y+=20)for(let z=0;z<w;z+=20){x.fillStyle=(z/20+y/20)%2?'#f5eee7':'#fff';x.fillRect(z,y,20,20);}x.fillStyle='#633f3a';x.font='22px Arial';x.fillText(label,15,28);return c;};
  let c=board(1600,1050,'Original / front copied from original / restored back-inside / empty composite'),x=ctx(c);[images.cup,front,back,states.empty].forEach((v,i)=>x.drawImage(v,i*400,40,400,400));x.drawImage(images.cup,200,500,1000,250,0,500,800,200);x.drawImage(states.empty,200,500,1000,250,800,500,800,200);x.drawImage(images.cup,200,780,850,310,0,720,800,292);x.drawImage(states.empty,200,780,850,310,800,720,800,292);sheets['01-shell-comparison']=c;
  c=board(1600,520,'Empty / batter / rising trial / baked — identical original foreground'),x=ctx(c);Object.values(states).forEach((v,i)=>x.drawImage(v,i*400,45,400,400));sheets['02-four-states']=c;
  c=board(1500,1050,'Original filled bowl / restored empty bowl / pixel-preservation overlay'),x=ctx(c);x.drawImage(images.bowl,0,45,500,500);x.drawImage(emptyBowl,500,45,500,500);x.globalAlpha=.5;x.drawImage(images.bowl,1000,45,500,500);x.drawImage(emptyBowl,1000,45,500,500);x.globalAlpha=1;x.drawImage(images.bowl,80,240,1090,470,0,570,750,323);x.drawImage(emptyBowl,80,240,1090,470,750,570,750,323);sheets['03-bowl-comparison']=c;
  c=board(1500,600,'Layer edges on white / dark background'),x=ctx(c);x.fillStyle='#243a46';x.fillRect(750,40,750,560);x.drawImage(states.empty,0,40,550,550);x.drawImage(states.empty,750,40,550,550);sheets['04-edge-check']=c;
  const crops={egg:[450,595,150,100],milk:[440,640,90,60],flour:[395,235,120,80],sugar:[545,485,120,80]},placements={egg:[440,485],milk:[750,470],flour:[540,540],sugar:[755,540]};stats.ingredientFront=[];
  c=board(1600,620,'Approved-card food textures inside the restored bowl — foreground stays unchanged'),x=ctx(c);
  Object.entries(crops).forEach(([name,rect],i)=>{const b=make(),bx=ctx(b);bx.drawImage(emptyBowl,0,0);const patch=make(210,140),pctx=ctx(patch);pctx.drawImage(images[name],...rect,0,0,210,140);pctx.globalCompositeOperation='destination-in';const g=pctx.createRadialGradient(105,70,20,105,70,78);g.addColorStop(0,'#fff');g.addColorStop(.65,'#fff');g.addColorStop(1,'#fff0');pctx.fillStyle=g;pctx.fillRect(0,0,210,140);bx.save();bx.beginPath();bx.ellipse(622,450,470,155,0,0,Math.PI*2);bx.clip();const [cx,cy]=placements[name];bx.drawImage(patch,cx-60,cy-40,120,80);bx.restore();stats.ingredientFront.push({name,...compare(emptyPixels,px(b).data,k=>Math.floor(k/1254)>=650)});x.drawImage(b,i*400,40,400,400);x.fillStyle='#633f3a';x.fillText(name,i*400+150,485);});sheets['05-ingredient-composition']=c;
  c=board(1800,3300,'Three-cup tray: empty / batter / rising trial / fully baked'),x=ctx(c);
  Object.entries(states).forEach(([name,cup],i)=>{const tray=make(1800,1000),tx=ctx(tray);tx.drawImage(images.tray,0,0,1800,1000);for(const cx of [393,902,1404])tx.drawImage(cup,cx-623*.45,680-1082*.45,1254*.45,1254*.45);tx.drawImage(images.tray,0,690,1800,310,0,690,1800,310);x.drawImage(tray,180,i*800+45,1440,800);x.fillStyle='#633f3a';x.fillText(name,20,i*800+65);});sheets['06-tray-states']=c;
  const fileStats=canvas=>{const d=px(canvas).data;let transparent=0,partial=0,edge=0;for(let k=0;k<n;k++){const a=d[k*4+3];if(!a)transparent++;else if(a<255)partial++;if(a>32&&(k<1254||k>=n-1254||k%1254===0||k%1254===1253))edge++;}return{width:canvas.width,height:canvas.height,transparent,partial,edge};};stats.assets=Object.fromEntries(Object.entries({'cup-wrapper-front':front,'cup-wrapper-back-inside':back,'mixing-bowl-empty':emptyBowl}).map(([k,v])=>[k,fileStats(v)]));
  return{stats,lip,files:{'cup-wrapper-front':front.toDataURL(),'cup-wrapper-back-inside':back.toDataURL(),'mixing-bowl-empty':emptyBowl.toDataURL()},states:Object.fromEntries(Object.entries(states).map(([k,c])=>[k,c.toDataURL()])),sheets:Object.fromEntries(Object.entries(sheets).map(([k,c])=>[k,c.toDataURL()]))};
 },input);
 for(const [name,png]of Object.entries(r.files))writeFileSync(local+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'));
 for(const [name,png]of Object.entries(r.states))writeFileSync(docs+'/state-'+name+'.png',Buffer.from(png.split(',')[1],'base64'));
 for(const [name,png]of Object.entries(r.sheets))writeFileSync(docs+'/'+name+'.png',Buffer.from(png.split(',')[1],'base64'));
 for(const check of Object.values(r.stats.foreground)){assert.ok(check.count>300000);assert.equal(check.changed,0);}assert.equal(r.stats.bowlProtected.changed,0);assert.equal(r.stats.bowlAlpha.changed,0);for(const c of r.stats.ingredientFront)assert.equal(c.changed,0);
 const outputHashes={};for(const [name,png]of Object.entries(r.files)){const b=Buffer.from(png.split(',')[1],'base64');assert.equal(b[25],6);assert.equal(b.readUInt32BE(16),1254);assert.equal(b.readUInt32BE(20),1254);assert.ok(r.stats.assets[name].transparent>1000);assert.equal(r.stats.assets[name].edge,0);outputHashes[name]=createHash('sha256').update(b).digest('hex');if(process.argv.includes('--publish'))writeFileSync(root+'three/'+name+'.png',b);}
 if(process.argv.includes('--publish')){
  const reloaded=Object.fromEntries(Object.keys(r.files).map(name=>[name,readFileSync(root+'three/'+name+'.png').toString('base64')]));
  const roundTrip=await page.evaluate(async({reloaded,original})=>{const make=()=>{const c=document.createElement('canvas');c.width=c.height=1254;return c;},load=async b=>{const i=new Image();i.src='data:image/png;base64,'+b;await i.decode();return i;},get=c=>c.getContext('2d').getImageData(0,0,1254,1254).data,ims={};for(const [k,v]of Object.entries(reloaded))ims[k]=await load(v);const old=make();old.getContext('2d').drawImage(await load(original),0,0);const front=make();front.getContext('2d').drawImage(ims['cup-wrapper-front'],0,0);const joined=make();joined.getContext('2d').drawImage(ims['cup-wrapper-back-inside'],0,0);joined.getContext('2d').drawImage(ims['cup-wrapper-front'],0,0);const a=get(old),f=get(front),j=get(joined);let count=0,frontChanged=0,emptyChanged=0;for(let k=0;k<1254*1254;k++)if(f[k*4+3]>250){count++;if([0,1,2,3].some(c=>f[k*4+c]!==a[k*4+c]))frontChanged++;if([0,1,2,3].some(c=>j[k*4+c]!==a[k*4+c]))emptyChanged++;}return{count,frontChanged,emptyChanged,dimensions:Object.fromEntries(Object.entries(ims).map(([k,i])=>[k,[i.width,i.height]]))};},{reloaded,original:input.cup.data});
  assert.equal(roundTrip.frontChanged,0);assert.equal(roundTrip.emptyChanged,0);assert.ok(roundTrip.count>300000);r.stats.publishedFileReload=roundTrip;
 }
 for(const [k,p]of Object.entries(sources))assert.equal(createHash('sha256').update(readFileSync(p)).digest('hex'),input[k].sha256);
 writeFileSync(docs+'/audit.json',JSON.stringify({sourceHashes:Object.fromEntries(Object.entries(input).map(([k,v])=>[k,v.sha256])),...r.stats,outputHashes,published:process.argv.includes('--publish')},null,2));
 writeFileSync(docs+'/composition.json',JSON.stringify({canvas:[1254,1254],cup:{original:root+'cupcake-baked-base.png',front:root+'three/cup-wrapper-front.png',back:root+'three/cup-wrapper-back-inside.png',anchor:[623,1082],layerOrder:['back','content clipped above front lip','front'],contentClip:{startX:138,endX:1109,top:0,bottomPerX:r.lip,overlapPixels:2},foregroundPolicy:'Keep original RGBA in the shared front mask; compose at 1254 before one uniform scene scale.',trial:{batterEllipse:[623,600,440,95],risingContentTranslation:[0,170],baked:'use unchanged original'}} ,bowl:{empty:root+'three/mixing-bowl-empty.png',filled:root+'mixing-bowl-batter.png',ingredientClipEllipse:[622,450,470,155],unchangedAlpha:true},tray:{canvas:[1800,1000],cupScale:.45,anchors:[[393,680],[902,680],[1404,680]],protectedFrontY:690},status:'assets approved for integration; full game and animated baking not implemented'},null,2));
 console.log(JSON.stringify(r.stats,null,2));
}finally{await browser.close();}
