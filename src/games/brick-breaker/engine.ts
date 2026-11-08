import type {Brick,Engine,Stage} from './types'
import {stageBricks} from './stages'
type Rect={x:number;y:number;w:number;h:number}
type Hit={t:number;nx:number;ny:number;brick?:Brick;kind:'brick'|'paddle'|'wall'}
/** Swept circle vs rounded rectangle: flat faces plus exact circular corner arcs. */
export function sweepCircleRect(x:number,y:number,vx:number,vy:number,r:number,rect:Rect,dt:number,corner=8):Omit<Hit,'kind'>|null{
 const hits:Omit<Hit,'kind'>[]=[],c=Math.min(corner,rect.w/2,rect.h/2),epsilon=1e-8
 function face(t:number,nx:number,ny:number,within:boolean){if(t>=-epsilon&&t<=dt+epsilon&&within&&vx*nx+vy*ny<0)hits.push({t:Math.max(0,t),nx,ny})}
 if(vx>0){const t=(rect.x-r-x)/vx,py=y+vy*t;face(t,-1,0,py>=rect.y+c&&py<=rect.y+rect.h-c)}
 if(vx<0){const t=(rect.x+rect.w+r-x)/vx,py=y+vy*t;face(t,1,0,py>=rect.y+c&&py<=rect.y+rect.h-c)}
 if(vy>0){const t=(rect.y-r-y)/vy,px=x+vx*t;face(t,0,-1,px>=rect.x+c&&px<=rect.x+rect.w-c)}
 if(vy<0){const t=(rect.y+rect.h+r-y)/vy,px=x+vx*t;face(t,0,1,px>=rect.x+c&&px<=rect.x+rect.w-c)}
 for(const [cx,cy,sx,sy] of [[rect.x+c,rect.y+c,-1,-1],[rect.x+rect.w-c,rect.y+c,1,-1],[rect.x+c,rect.y+rect.h-c,-1,1],[rect.x+rect.w-c,rect.y+rect.h-c,1,1]]){
  const dx=x-cx,dy=y-cy,a=vx*vx+vy*vy,b=2*(dx*vx+dy*vy),d=b*b-4*a*(dx*dx+dy*dy-(r+c)**2)
  if(a===0||d<0)continue
  const t=(-b-Math.sqrt(d))/(2*a),px=x+vx*t,py=y+vy*t,nx=(px-cx)/(r+c),ny=(py-cy)/(r+c)
  if((px-cx)*sx>=-epsilon&&(py-cy)*sy>=-epsilon)face(t,nx,ny,true)
 }
 return hits.sort((a,b)=>a.t-b.t)[0]??null
}
export function createEngine(stage:Stage,height:number,removed:string[]=[]):Engine{
 const h=Math.max(250,height),r=height>1000?18:12,paddle={x:500,y:h-66,w:stage.paddleWidth,h:44},layout=stageBricks(stage,h)
 // Preserve reaction time when a tall pattern is shown in a short landscape viewport.
 const clearance=paddle.y-Math.max(...layout.map(b=>b.y+b.h))-r,speed=Math.min(stage.speed*h/620,Math.max(90,clearance/.6))
 return {stage:stage.id,width:1000,height:h,phase:'ready',pausedFrom:'ready',paddle,ball:{x:500,y:paddle.y-r-3,vx:0,vy:0,r},bricks:layout.filter(b=>!removed.includes(b.id)),removed:[...removed],trail:[],particles:[],speed,misses:0,clearReason:null,events:[]}
}
export function movePaddle(e:Engine,x:number){e.paddle.x=Math.max(e.paddle.w/2+4,Math.min(e.width-e.paddle.w/2-4,x));if(e.phase==='ready'){e.ball.x=e.paddle.x;e.ball.y=e.paddle.y-e.ball.r-3}}
export function launch(e:Engine){if(e.phase!=='ready')return;e.phase='playing';e.ball.vx=e.speed*.24;e.ball.vy=-e.speed*Math.sqrt(1-.24**2);e.trail=[]}
export function togglePause(e:Engine){if(e.phase==='cleared')return;if(e.phase==='paused')e.phase=e.pausedFrom;else{e.pausedFrom=e.phase;e.phase='paused'}}
function safeDirection(e:Engine){let {vx,vy}=e.ball;const signX=Math.sign(vx)||1,signY=Math.sign(vy)||-1;if(Math.abs(vy)<e.speed*.43){vy=signY*e.speed*.43;vx=signX*Math.sqrt(e.speed**2-vy**2)}if(Math.abs(vx)<e.speed*.12){vx=signX*e.speed*.12;vy=signY*Math.sqrt(e.speed**2-vx**2)}const length=Math.hypot(vx,vy);e.ball.vx=vx/length*e.speed;e.ball.vy=vy/length*e.speed}
export function step(e:Engine,dt:number){
 e.events=[]
 if(e.phase==='paused')return
 for(const p of e.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=110*dt}e.particles=e.particles.filter(p=>p.life>0)
 if(e.phase!=='playing')return
 let left=dt
 for(let bounce=0;left>1e-7&&bounce<12&&e.phase==='playing';bounce++){
  const ball=e.ball,hits:Hit[]=[],{x,y,vx,vy,r}=ball
  const wall=(t:number,nx:number,ny:number)=>{if(t>=-1e-8&&t<=left)hits.push({t:Math.max(0,t),nx,ny,kind:'wall'})}
  if(vx<0)wall((r-x)/vx,1,0);if(vx>0)wall((e.width-r-x)/vx,-1,0);if(vy<0)wall((r-y)/vy,0,1)
  for(const brick of e.bricks){const hit=sweepCircleRect(x,y,vx,vy,r,brick,left,Math.min(9,brick.h*.3));if(hit)hits.push({...hit,kind:'brick',brick})}
  if(vy>0){const rect={x:e.paddle.x-e.paddle.w/2,y:e.paddle.y,w:e.paddle.w,h:e.paddle.h},hit=sweepCircleRect(x,y,vx,vy,r,rect,left,18);if(hit&&y+vy*hit.t<=rect.y+rect.h*.55)hits.push({...hit,kind:'paddle'})}
  const hit=hits.sort((a,b)=>a.t-b.t)[0]
  if(!hit){ball.x+=vx*left;ball.y+=vy*left;left=0;break}
  ball.x+=vx*hit.t;ball.y+=vy*hit.t;left-=hit.t
  if(hit.kind==='brick'&&hit.brick){const brick=hit.brick;e.bricks=e.bricks.filter(b=>b.id!==brick.id);e.removed.push(brick.id);e.events.push(brick.gold?'gold':'brick');for(let i=0;i<(brick.gold?18:6);i++){const a=i*2.399963;e.particles.push({x:brick.x+brick.w/2,y:brick.y+brick.h/2,vx:Math.cos(a)*(70+i*3),vy:Math.sin(a)*80-30,life:brick.gold?.9:.45,color:brick.color})}e.particles=e.particles.slice(-100);if(brick.gold||e.bricks.length===0){e.phase='cleared';e.clearReason=brick.gold?'gold':'all';break}}
  // The paddle is a horizontal reflector: preserve incoming speed and horizontal
  // direction at every contact position, including its forgiving rounded ends.
  if(hit.kind==='paddle'){ball.vy=-ball.vy;ball.y=e.paddle.y-r-.2;e.events.push('paddle')}
  else{const dot=ball.vx*hit.nx+ball.vy*hit.ny;ball.vx-=2*dot*hit.nx;ball.vy-=2*dot*hit.ny;ball.x+=hit.nx*.05;ball.y+=hit.ny*.05}
  if(hit.kind!=='paddle')safeDirection(e)
 }
 e.trail.push({x:e.ball.x,y:e.ball.y});if(e.trail.length>26)e.trail.shift()
 if(e.ball.y-e.ball.r>e.height){e.misses++;e.events.push('miss');e.phase='ready';e.ball.vx=0;e.ball.vy=0;e.trail=[];movePaddle(e,e.paddle.x)}
}
