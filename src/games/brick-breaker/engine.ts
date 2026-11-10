import type {Ball,Brick,Engine,Stage} from './types'
import {stageBricks} from './stages'
import {targetBallSpeed} from './speed'
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
function restingBalls(paddle:Engine['paddle'],r:number,count:number):Ball[]{return Array.from({length:count},(_,i)=>({x:paddle.x+(i-(count-1)/2)*(r*2+4),y:paddle.y-r-3,vx:0,vy:0,r,trail:[]}))}
export function createEngine(stage:Stage,height:number,removed:string[]=[],playSeconds=0,ballCount=playSeconds>=10-1e-9?2:1):Engine{
 const h=Math.max(250,height),r=height>1000?18:12,paddle={x:500,y:h-66,w:stage.paddleWidth*2/3,h:44*2/3},layout=stageBricks(stage,h)
 // One shared rule for launch, miss recovery, resize and saved-board restoration.
 const speed=targetBallSpeed(stage.speed,h)
 return {stage:stage.id,width:1000,height:h,phase:'ready',pausedFrom:'ready',paddle,balls:restingBalls(paddle,r,ballCount),bricks:layout.filter(b=>!removed.includes(b.id)),removed:[...removed],particles:[],speed,playSeconds,split:playSeconds>=10-1e-9,misses:0,clearReason:null,events:[]}
}
export function movePaddle(e:Engine,x:number){e.paddle.x=Math.max(e.paddle.w/2+4,Math.min(e.width-e.paddle.w/2-4,x));if(e.phase==='ready'){const positions=restingBalls(e.paddle,e.balls[0].r,e.balls.length);e.balls.forEach((ball,i)=>{ball.x=positions[i].x;ball.y=positions[i].y})}}
export function launch(e:Engine){if(e.phase!=='ready')return;e.phase='playing';e.balls.forEach((ball,i)=>{const horizontal=e.balls.length===1?.24:i===0?.34:-.42;ball.vx=e.speed*horizontal;ball.vy=-e.speed*Math.sqrt(1-horizontal**2);ball.trail=[]})}
export function togglePause(e:Engine){if(e.phase==='cleared')return;if(e.phase==='paused')e.phase=e.pausedFrom;else{e.pausedFrom=e.phase;e.phase='paused'}}
function normalizeSpeed(e:Engine,ball:Ball){const length=Math.hypot(ball.vx,ball.vy);if(length>0){ball.vx=ball.vx/length*e.speed;ball.vy=ball.vy/length*e.speed}}
function safeDirection(e:Engine,ball:Ball){let {vx,vy}=ball;const signX=Math.sign(vx)||1,signY=Math.sign(vy)||-1;if(Math.abs(vy)<e.speed*.43){vy=signY*e.speed*.43;vx=signX*Math.sqrt(e.speed**2-vy**2)}if(Math.abs(vx)<e.speed*.12){vx=signX*e.speed*.12;vy=signY*Math.sqrt(e.speed**2-vx**2)}ball.vx=vx;ball.vy=vy;normalizeSpeed(e,ball)}
function nextHit(e:Engine,ball:Ball,dt:number):Hit|undefined{
  const hits:Hit[]=[],{x,y,vx,vy,r}=ball
  const wall=(t:number,nx:number,ny:number)=>{if(t>=-1e-8&&t<=dt)hits.push({t:Math.max(0,t),nx,ny,kind:'wall'})}
  if(vx<0)wall((r-x)/vx,1,0);if(vx>0)wall((e.width-r-x)/vx,-1,0);if(vy<0)wall((r-y)/vy,0,1)
  for(const brick of e.bricks){const hit=sweepCircleRect(x,y,vx,vy,r,brick,dt,Math.min(9,brick.h*.3));if(hit)hits.push({...hit,kind:'brick',brick})}
  if(vy>0){const rect={x:e.paddle.x-e.paddle.w/2,y:e.paddle.y,w:e.paddle.w,h:e.paddle.h},hit=sweepCircleRect(x,y,vx,vy,r,rect,dt,Math.min(18,rect.h/2));if(hit&&y+vy*hit.t<=rect.y+rect.h*.55)hits.push({...hit,kind:'paddle'})}
 return hits.sort((a,b)=>a.t-b.t)[0]
}
/** Process the earliest collision across both balls against the shared brick set. */
function advanceBalls(e:Engine,dt:number){
 let left=dt
 for(let bounce=0;left>1e-7&&bounce<24&&e.phase==='playing';bounce++){
  const hits=e.balls.flatMap(ball=>{const hit=nextHit(e,ball,left);return hit?[{...hit,ball}]:[]}),hit=hits.sort((a,b)=>a.t-b.t)[0],travel=hit?hit.t:left
  for(const ball of e.balls){ball.x+=ball.vx*travel;ball.y+=ball.vy*travel}
  if(!hit)break
  left-=travel;const ball=hit.ball,r=ball.r
  if(hit.kind==='brick'&&hit.brick){const brick=hit.brick;e.bricks=e.bricks.filter(b=>b.id!==brick.id);e.removed.push(brick.id);e.events.push(brick.gold?'gold':'brick');for(let i=0;i<(brick.gold?18:6);i++){const a=i*2.399963;e.particles.push({x:brick.x+brick.w/2,y:brick.y+brick.h/2,vx:Math.cos(a)*(70+i*3),vy:Math.sin(a)*80-30,life:brick.gold?.9:.45,color:brick.color})}e.particles=e.particles.slice(-100);if(brick.gold||e.bricks.length===0){e.phase='cleared';e.clearReason=brick.gold?'gold':'all';break}}
  // The paddle is a horizontal reflector: preserve incoming speed and horizontal
  // direction at every contact position, including its forgiving rounded ends.
  if(hit.kind==='paddle'){ball.vy=-ball.vy;normalizeSpeed(e,ball);ball.y=e.paddle.y-r-.2;e.events.push('paddle')}
  else{const dot=ball.vx*hit.nx+ball.vy*hit.ny;ball.vx-=2*dot*hit.nx;ball.vy-=2*dot*hit.ny;ball.x+=hit.nx*.05;ball.y+=hit.ny*.05}
  if(hit.kind!=='paddle')safeDirection(e,ball)
 }
 for(const ball of e.balls){ball.trail.push({x:ball.x,y:ball.y});if(ball.trail.length>26)ball.trail.shift()}
}
export function step(e:Engine,dt:number){
 e.events=[]
 if(e.phase==='paused')return
 for(const p of e.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=110*dt}e.particles=e.particles.filter(p=>p.life>0)
 if(e.phase!=='playing')return
 e.playSeconds+=dt
 // Launch one additional ball from the clear space above the paddle, once only.
 if(!e.split&&e.playSeconds>=10-1e-9){e.split=true;const r=e.balls[0].r,vx=(e.balls[0].vx>=0?-.45:.45)*e.speed;e.balls.push({x:e.paddle.x,y:e.paddle.y-r-3,vx,vy:-Math.sqrt(e.speed**2-vx**2),r,trail:[]})}
 advanceBalls(e,dt)
 if(e.clearReason)return
 e.balls=e.balls.filter(ball=>ball.y-ball.r<=e.height)
 if(!e.balls.length){e.misses++;e.events.push('miss');e.phase='ready';e.balls=restingBalls(e.paddle,e.height>1000?18:12,e.split?2:1)}
}
