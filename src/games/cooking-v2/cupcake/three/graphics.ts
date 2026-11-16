import metadata from './composition.json?raw'
import {loadImages,type Images} from '../assets'
import {renderCupcake} from '../Cupcake'
import type {Work} from './model'
import type {Ingredient} from '../model'
import front from '../../../../../public/assets/cooking-v2/cupcake/three/cup-wrapper-front.png'
import back from '../../../../../public/assets/cooking-v2/cupcake/three/cup-wrapper-back-inside.png'
import empty from '../../../../../public/assets/cooking-v2/cupcake/three/mixing-bowl-empty.png'
import tray3 from '../../../../../public/assets/cooking-v2/cupcake/three/cupcake-tray-3-base.png'
import rawBase from '../../../../../public/assets/cooking-v2/cupcake/cupcake-baked-base.png'
import rawBowl from '../../../../../public/assets/cooking-v2/cupcake/mixing-bowl-batter.png'
import egg from '../../../../../public/assets/cooking-v2/cupcake/three/ingredient-egg.png'
import milk from '../../../../../public/assets/cooking-v2/cupcake/three/ingredient-milk.png'
import flour from '../../../../../public/assets/cooking-v2/cupcake/three/ingredient-flour.png'
import sugar from '../../../../../public/assets/cooking-v2/cupcake/three/ingredient-sugar.png'
export const geometry=JSON.parse(metadata) as {cup:{contentClip:{startX:number;endX:number;bottomPerX:number[]}};tray:{anchors:number[][];cupScale:number;protectedFrontY:number}}
// Bundled URLs join the existing offline cache without changing Pages/PWA settings.
export const extraUrls={front,back,empty,tray3,rawBase,rawBowl,egg,milk,flour,sugar}
export const make=(w=1254,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c}
const ctx=(c:HTMLCanvasElement)=>c.getContext('2d',{willReadFrequently:true})!
// Food silhouettes use the approved cards as texture, never the card frame or label.
function ingredientSprite(id:Ingredient,texture:HTMLCanvasElement){
 const c=make(420,260),x=ctx(c);
 const oval=(cx:number,cy:number,rx:number,ry:number,color:string)=>{x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);x.fillStyle=color;x.fill()};
 if(id==='egg'||id==='milk'){
  const liquid=x.createRadialGradient(180,90,10,210,140,200);liquid.addColorStop(0,'#fffef5');liquid.addColorStop(1,id==='egg'?'#f6e1b1':'#f6eee0');
  x.beginPath();x.moveTo(35,140);x.bezierCurveTo(15,90,95,65,145,85);x.bezierCurveTo(205,35,260,85,300,75);x.bezierCurveTo(405,65,425,160,355,190);x.bezierCurveTo(300,230,235,202,180,215);x.bezierCurveTo(100,230,35,195,35,140);x.fillStyle=liquid;x.fill();
  oval(115,108,37,9,'#ffffffb8');oval(309,165,23,6,'#ffffffa0');
  if(id==='egg'){const yolk=x.createRadialGradient(185,110,5,220,135,85);yolk.addColorStop(0,'#ffe96a');yolk.addColorStop(.6,'#ffc527');yolk.addColorStop(1,'#eea519');x.fillStyle=yolk;x.beginPath();x.ellipse(215,133,78,61,0,0,Math.PI*2);x.fill();oval(192,111,26,11,'#fff7c4')}
  else{oval(343,79,13,7,'#fffaf0');oval(365,108,8,5,'#fffaf0')}
 }else{
  x.beginPath();x.moveTo(35,205);x.bezierCurveTo(60,168,100,145,132,122);x.bezierCurveTo(155,90,175,52,204,61);x.bezierCurveTo(231,47,260,108,285,124);x.bezierCurveTo(330,154,375,177,391,205);x.bezierCurveTo(310,249,100,248,35,205);x.closePath();
  x.save();x.clip();x.fillStyle=id==='flour'?'#f4e8d8':'#fff4e8';x.fillRect(0,0,420,260);x.globalAlpha=.65;x.drawImage(texture,0,0,420,260);x.globalAlpha=1;
  // Deterministic grains survive reloads and do not shimmer while whisking.
  for(let i=0;i<650;i++){const a=(i*137.508)%420,b=(i*73.173)%260;x.fillStyle=i%3===0?'#ffffffd9':id==='sugar'?'#decbbb8c':'#cbbba345';const r=id==='sugar'?2+i%3:1+i%2;x.fillRect(a,b,r,r)}x.restore();
 }
 return c
}
export type Graphics={images:Images;extra:Record<keyof typeof extraUrls,HTMLImageElement>;front:ImageData;bowlFilled:ImageData;bowlMask:Uint8Array;frontIndices:number[];cake:HTMLCanvasElement;patches:Record<Ingredient,HTMLCanvasElement>;clear:HTMLImageElement;last?:{key:string;canvas:HTMLCanvasElement}}
// The same food-and-48px-interior-connection mask used by the approved #30 editor.
// A horizontal y=650 cut would incorrectly classify some original batter as bowl front.
function bowlInterior(p:ImageData){const n=1254*1254,top=new Int32Array(1254).fill(1254),bottom=new Int32Array(1254).fill(-1),distance=new Int16Array(n).fill(-1),queue=new Int32Array(n);let h=0,t=0;
 for(let k=0;k<n;k++){const x=k%1254,y=Math.floor(k/1254),i=k*4;if(y>230&&y<680&&p.data[i+3]>100&&p.data[i+1]>p.data[i+2]+18&&p.data[i]>p.data[i+1]){top[x]=Math.min(top[x],y);bottom[x]=Math.max(bottom[x],y)}}
 for(let k=0;k<n;k++){const x=k%1254,y=Math.floor(k/1254);if(y>=top[x]&&y<=bottom[x]){distance[k]=0;queue[t++]=k}}
 while(h<t){const k=queue[h++],x=k%1254,d=distance[k];if(d>=48)continue;for(const j of [x?k-1:-1,x<1253?k+1:-1,k-1254,k+1254])if(j>=0&&j<n&&distance[j]<0){const xx=j%1254,yy=Math.floor(j/1254);if(((xx-622)/540)**2+((yy-430)/225)**2<1){distance[j]=d+1;queue[t++]=j}}}
 return Uint8Array.from(distance,d=>d>=0&&d<48?1:0)}
export async function load():Promise<Graphics>{const images=await loadImages(),extra=Object.fromEntries(await Promise.all(Object.entries(extraUrls).map(async([k,url])=>{const im=new Image();im.src=url;await im.decode();return [k,im]}))) as Graphics['extra'],f=make(),cake=make();ctx(f).drawImage(extra.front,0,0);const front=ctx(f).getImageData(0,0,1254,1254),frontIndices:number[]=[];ctx(cake).drawImage(extra.rawBase,0,0);const cp=ctx(cake).getImageData(0,0,1254,1254);for(let k=0;k<1254*1254;k++){if(front.data[k*4+3])frontIndices.push(k*4);const x=k%1254,y=Math.floor(k/1254);if(front.data[k*4+3]||x<150||x>1098||y<165||y>690)cp.data[k*4+3]=0}ctx(cake).putImageData(cp,0,0);
 const crops:Record<Ingredient,number[]>={egg:[450,595,150,100],milk:[440,640,90,60],flour:[395,235,120,80],sugar:[545,485,120,80]},patches={} as Graphics['patches'];for(const k of Object.keys(crops) as Ingredient[]){const c=make(210,140),x=ctx(c),r=crops[k];x.drawImage(extra[k],r[0],r[1],r[2],r[3],0,0,210,140);x.globalCompositeOperation='destination-in';const gr=x.createRadialGradient(105,70,20,105,70,78);gr.addColorStop(0,'#fff');gr.addColorStop(.65,'#fff');gr.addColorStop(1,'#fff0');x.fillStyle=gr;x.fillRect(0,0,210,140);patches[k]=ingredientSprite(k,c)}
 const clear=new Image();clear.src=make(1).toDataURL();await clear.decode();const bowl=make();ctx(bowl).drawImage(extra.rawBowl,0,0);const bowlFilled=ctx(bowl).getImageData(0,0,1254,1254);return {images,extra,front,bowlFilled,bowlMask:bowlInterior(bowlFilled),frontIndices,cake,patches,clear}}
export function renderCup(g:Graphics,fill:number,bake=0){const key=fill+':'+bake;if(g.last?.key===key)return g.last.canvas;const c=make(),x=ctx(c);if(bake===1){x.drawImage(g.extra.rawBase,0,0)}else{x.drawImage(g.extra.back,0,0);x.save();const cl=geometry.cup.contentClip;x.beginPath();x.moveTo(cl.startX,0);x.lineTo(cl.endX,0);for(let i=cl.bottomPerX.length-1;i>=0;i--)x.lineTo(cl.startX+i,cl.bottomPerX[i]+2);x.closePath();x.clip();if(fill>0){x.save();const cy=690-90*fill;x.beginPath();x.ellipse(623,cy,440,95,0,0,Math.PI*2);x.clip();x.globalAlpha=1-bake;x.drawImage(g.images.surface,183,cy-95,880,190);x.restore()}if(bake>0){x.globalAlpha=Math.min(1,bake*2);x.drawImage(g.cake,0,170*(1-bake));x.globalAlpha=1}x.restore();x.drawImage(g.extra.front,0,0)}
 // Preserve the shared original foreground RGBA, including semitransparent lip pixels.
 const p=x.getImageData(0,0,1254,1254);for(const i of g.frontIndices)for(let j=0;j<4;j++)p.data[i+j]=g.front.data[i+j];x.putImageData(p,0,0);g.last={key,canvas:c};return c}
export function renderTray(g:Graphics,w:Work){const c=make(1800,1000),x=ctx(c),p=w.step==='bake'?w.elapsed/3000:0;x.drawImage(g.extra.tray3,0,0);w.cups.forEach((cup,i)=>{const [sx,sy]=geometry.tray.anchors[i],s=geometry.tray.cupScale;x.drawImage(renderCup(g,cup.fill,p),sx-623*s,sy-1082*s,1254*s,1254*s)});const y=geometry.tray.protectedFrontY;x.drawImage(g.extra.tray3,0,y,1800,1000-y,0,y,1800,1000-y);return c}
export function renderBowl(g:Graphics,w:Work,pour?:{id:Ingredient;progress:number}){
 const c=make(),x=ctx(c),food=make(),fx=ctx(food);x.drawImage(g.extra.empty,0,0);
 const placements:Record<Ingredient,number[]>={egg:[435,445,330,205],milk:[755,430,360,195],flour:[550,535,305,185],sugar:[790,535,265,160]};
 const mix=Math.max(0,Math.min(1,w.mix));
 for(const id of w.ingredients){const [a,b,width,height]=placements[id],angle=mix*Math.PI*2,dx=a-622,dy=b-480,cx=622+(dx*Math.cos(angle)-dy*Math.sin(angle))*(1-mix),cy=480+(dx*Math.sin(angle)*.3+dy*Math.cos(angle))*(1-mix);fx.save();fx.globalAlpha=1-mix;fx.translate(cx,cy);fx.rotate(Math.sin(angle)*.08);fx.drawImage(g.patches[id],-width/2,-height/2,width,height);fx.restore()}
 // Blend only the approved interior mask; rim, front, heart and silhouette remain original pixels.
 const p=x.getImageData(0,0,1254,1254),f=fx.getImageData(0,0,1254,1254).data;
 for(let k=0;k<g.bowlMask.length;k++)if(g.bowlMask[k]){const i=k*4,a=f[i+3]/255;for(let j=0;j<3;j++)p.data[i+j]=Math.round((p.data[i+j]*(1-a)+f[i+j]*a)*(1-mix)+g.bowlFilled.data[i+j]*mix)}
 x.putImageData(p,0,0);
 if(pour){const t=pour.progress;x.save();x.beginPath();x.rect(0,0,1254,300);x.ellipse(622,450,470,155,0,0,Math.PI*2);x.clip();x.globalAlpha=Math.sin(Math.PI*t);x.drawImage(g.patches[pour.id],1120+(622-1120)*t-75,120+(450-120)*t-45,150,90);x.restore()}
 return c
}
// This one composition is used on screen and for the actual transparent download.
export function renderGroup(g:Graphics,w:Work,size=1400){const c=make(size),x=ctx(c);x.scale(size/1400,size/1400);x.imageSmoothingQuality='high';x.drawImage(g.images.plate,40,820,1320,420);const images={...g.images,plate:g.clear};w.cups.forEach((cup,i)=>{const sprite=renderCupcake(cup.decor.work,images,900);x.drawImage(sprite,[-30,390,810][i],400,620,620)});return c}
export async function downloadGroup(g:Graphics,w:Work){const c=renderGroup(g,w),blob=await new Promise<Blob>((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error('PNG')),'image/png')),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='내가-만든-컵케이크-세개.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
