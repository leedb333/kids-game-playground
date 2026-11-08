import type {Brick,BrickColor,Engine} from './types'
export const colors:Record<BrickColor,{top:string;bottom:string;edge:string}>={pink:{top:'#ffb3dd',bottom:'#ff4caa',edge:'#e63388'},yellow:{top:'#fff58b',bottom:'#ffd02c',edge:'#d99b12'},mint:{top:'#b1ffe8',bottom:'#38e9b4',edge:'#1baf98'},purple:{top:'#dab0ff',bottom:'#a36aff',edge:'#7244cd'},blue:{top:'#8ceaff',bottom:'#27b8ef',edge:'#1b8ac6'},gold:{top:'#fff49c',bottom:'#ffbc0c',edge:'#dc8a00'}}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,h/2));ctx.closePath()}
function star(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,fill:string){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.48:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
function brick(ctx:CanvasRenderingContext2D,b:Brick,time:number,reduced:boolean){
 const {x,y,w,h}=b,c=colors[b.color],radius=Math.min(9,h*.3);ctx.save()
 if(b.gold){ctx.shadowColor='#ffe05b';ctx.shadowBlur=reduced?12:15+Math.sin(time*2)*4;rounded(ctx,x-3,y-3,w+6,h+6,radius+2);ctx.fillStyle='#fff2a7';ctx.fill();ctx.shadowBlur=0}
 rounded(ctx,x,y+2,w,h,radius);ctx.fillStyle=c.edge;ctx.fill();const gradient=ctx.createLinearGradient(x,y,x,y+h);gradient.addColorStop(0,c.top);gradient.addColorStop(.45,b.gold?'#ffd92b':c.bottom);gradient.addColorStop(1,c.bottom);rounded(ctx,x,y,w,h,radius);ctx.fillStyle=gradient;ctx.fill();ctx.strokeStyle=b.gold?'#fff2b6':'#ffffffac';ctx.lineWidth=b.gold?2.4:1.8;ctx.stroke()
 rounded(ctx,x+5,y+3,w-10,Math.max(3,h*.2),3);ctx.fillStyle='#ffffff4d';ctx.fill();ctx.beginPath();ctx.ellipse(x+8,y+7,3,1.8,-.5,0,Math.PI*2);ctx.fillStyle='#fff9f4';ctx.fill()
 if(b.gold){star(ctx,x+w/2,y+h/2,Math.min(15,h*.39),'#fff9bc');ctx.strokeStyle='#d99412';ctx.lineWidth=1;ctx.stroke();star(ctx,x-13,y+h*.3,4,'#fff4bd');star(ctx,x+w+12,y+h*.62,3,'#fff4bd')}
 ctx.restore()
}
export function render(ctx:CanvasRenderingContext2D,e:Engine,cssWidth:number,cssHeight:number,dpr:number,time:number,reduced=false){
 const scale=cssWidth/1000;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0)
 for(const b of e.bricks)brick(ctx,b,time,reduced)
 if(!reduced)for(let i=0;i<e.trail.length;i+=2){const p=e.trail[i],f=(i+1)/e.trail.length;ctx.beginPath();ctx.arc(p.x,p.y,1+f*2.2,0,Math.PI*2);ctx.fillStyle=`rgba(255,244,189,${f*.65})`;ctx.fill()}
 const p=e.paddle,k=p.h/44,x=0,y=0,w=p.w/k,h=44;ctx.save();ctx.translate(p.x-p.w/2,p.y);ctx.scale(k,k);ctx.shadowBlur=12;ctx.shadowColor='#bca4ff80';rounded(ctx,x,y,w,h,20);ctx.fillStyle='#e9e0ff';ctx.fill();ctx.shadowBlur=0
 const rainbow=ctx.createLinearGradient(x,y,x+w,y);['#ff719f','#ffab67','#ffe475','#82e9af','#6dd5ff','#a99aff','#db9bff'].forEach((color,i)=>rainbow.addColorStop(i/6,color));rounded(ctx,x+2,y+2,w-4,h-4,18);ctx.fillStyle=rainbow;ctx.fill();ctx.strokeStyle='#ffffffb8';ctx.lineWidth=1.5;ctx.stroke()
 const sheen=ctx.createLinearGradient(x,y,x,y+h);sheen.addColorStop(0,'#ffffff80');sheen.addColorStop(.45,'#ffffff08');sheen.addColorStop(1,'#493a772e');rounded(ctx,x+3,y+3,w-6,h-6,17);ctx.fillStyle=sheen;ctx.fill();rounded(ctx,x+12,y+6,w-24,5,3);ctx.fillStyle='#ffffff70';ctx.fill();ctx.restore()
 const ball=e.ball;ctx.save();ctx.shadowColor='#ffec9d';ctx.shadowBlur=reduced?12:20;const glow=ctx.createRadialGradient(ball.x-3,ball.y-4,1,ball.x,ball.y,ball.r);glow.addColorStop(0,'#fffefa');glow.addColorStop(.65,'#fffbd6');glow.addColorStop(1,'#ffd34b');ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff7c9';ctx.lineWidth=1.5;ctx.stroke();star(ctx,ball.x,ball.y,ball.r*.62,'#ffe05e');ctx.restore()
 if(!reduced)for(const particle of e.particles){ctx.globalAlpha=Math.max(0,Math.min(1,particle.life*2));star(ctx,particle.x,particle.y,particle.color==='gold'?4:2.6,particle.color==='gold'?'#fff1a4':colors[particle.color as BrickColor]?.top??'#fff6ce')}ctx.globalAlpha=1
 void cssHeight
}
