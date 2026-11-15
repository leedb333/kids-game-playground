// Deterministic cutouts from approved originals only. No failed candidate assets.
export const make=(w=1254,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export const context=c=>c.getContext('2d',{willReadFrequently:true});
export const data=c=>context(c).getImageData(0,0,c.width,c.height);
export const slots=[{id:'cup-1',x:393,y:680},{id:'cup-2',x:902,y:680},{id:'cup-3',x:1404,y:680}];
export const bowlInside={cx:622,cy:450,rx:470,ry:155};
export function clipInside(x){x.beginPath();x.ellipse(bowlInside.cx,bowlInside.cy,bowlInside.rx,bowlInside.ry,0,0,Math.PI*2);x.clip();}
export function prepare(images){
 const original=make();context(original).drawImage(images.base,0,0);const source=data(original),front=make(),frontData=context(front).createImageData(1254,1254),mask=new Uint8Array(1254*1254),cuts=[];
 // Find pink body, then use a continuous curve instead of per-column jagged pasting.
 for(let px=138;px<=1109;px++){let cut=720;for(let py=520;py<725;py++){const i=(py*1254+px)*4,[r,g,b,a]=source.data.slice(i,i+4);if(a>200&&r-g>28&&b-g>24){cut=py-3;break;}}cuts.push(cut);}
 const smooth=cuts.map((_,i)=>{let sum=0,n=0;for(let j=Math.max(0,i-6);j<=Math.min(cuts.length-1,i+6);j++){sum+=cuts[j];n++;}return sum/n;});
 const maskCanvas=make(),mx=context(maskCanvas);mx.beginPath();mx.moveTo(138,1254);mx.lineTo(138,smooth[0]);for(let i=0;i<smooth.length;i+=3)mx.lineTo(138+i,smooth[i]);mx.lineTo(1109,1254);mx.closePath();mx.fill();const maskData=data(maskCanvas).data;
 for(let k=0;k<mask.length;k++){if(maskData[k*4+3]===255){mask[k]=1;for(let j=0;j<4;j++)frontData.data[k*4+j]=source.data[k*4+j];}}
 context(front).putImageData(frontData,0,0);
 const cake=make(),cakeData=context(cake).createImageData(1254,1254);for(let k=0;k<mask.length;k++)if(!mask[k])for(let j=0;j<4;j++)cakeData.data[k*4+j]=source.data[k*4+j];context(cake).putImageData(cakeData,0,0);
 const cutsForCard={egg:[450,595,150,100],milk:[440,640,90,60],flour:[395,235,120,80],sugar:[545,485,120,80]},patches={};
 for(const [key,r] of Object.entries(cutsForCard)){const c=make(210,140),x=context(c);x.drawImage(images[key],...r,0,0,210,140);x.globalCompositeOperation='destination-in';const g=x.createRadialGradient(105,70,20,105,70,78);g.addColorStop(0,'#fff');g.addColorStop(.65,'#fff');g.addColorStop(1,'#fff0');x.fillStyle=g;x.fillRect(0,0,210,140);patches[key]=c;}
 return{original,source,front,cake,mask,patches,cutsForCard};
}
export function drawCup(images,prepared,state,progress=0){
 if(state==='baked'||progress===1)return prepared.original;
 const key=state+':'+progress;if(!prepared.cache)prepared.cache=new Map();if(prepared.cache.has(key))return prepared.cache.get(key);
 const c=make(),x=context(c);
 // Missing rear/inner shell is intentionally left transparent: this is a failed empty-cup trial.
 if(state!=='empty'){
  x.save();x.beginPath();x.ellipse(623,570,430,120,0,0,Math.PI*2);x.clip();x.drawImage(images.surface,183,450,860,240);x.restore();
  const p=state==='risen'?.45:progress;
  if(p>0){const scale=.45+.55*p;x.save();x.globalAlpha=Math.min(1,p*1.7);x.translate(623,650);x.scale(scale,scale);x.drawImage(prepared.cake,-623,-650);x.restore();}
 }
 x.drawImage(prepared.front,0,0);
 // Preserve original foreground pixels exactly in the shared fixed-coordinate mask.
 const p=data(c);for(let k=0;k<prepared.mask.length;k++)if(prepared.mask[k])for(let j=0;j<4;j++)p.data[k*4+j]=prepared.source.data[k*4+j];x.putImageData(p,0,0);if(progress===0)prepared.cache.set(key,c);return c;
}
export function drawTray(images,prepared,cups,phase,progress){
 const c=make(1800,1000),x=context(c);x.drawImage(images.tray,0,0,1800,1000);
 const im=drawCup(images,prepared,phase==='original'?'baked':'filled',phase==='original'?1:progress);
 cups.forEach((cup,i)=>{const s=slots[i];x.drawImage(im,s.x-623*.45,s.y-1082*.45,1254*.45,1254*.45);if(cup.cream){const cream=images[cup.cream];x.drawImage(cream,s.x-140,s.y-510,280,260);}});
 x.drawImage(images.tray,0,690,1800,310,0,690,1800,310);return c;
}
export function difference(a,b,accept){let changed=0,count=0;for(let k=0;k<a.length/4;k++)if(accept(k)){count++;if([0,1,2,3].some(j=>a[k*4+j]!==b[k*4+j]))changed++;}return{count,changed};}
