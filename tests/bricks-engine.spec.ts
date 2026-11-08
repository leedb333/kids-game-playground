import {writeFileSync} from 'node:fs'
import {test,expect} from '@playwright/test'
import {stages,stageBricks} from '../src/games/brick-breaker/stages'
import {createEngine,launch,movePaddle,step,sweepCircleRect,togglePause} from '../src/games/brick-breaker/engine'
import {completeStage,freshProgress,restoreProgress,type Progress} from '../src/games/brick-breaker/progress'

test('ten distinct stage patterns, exactly three hearts/three clovers and one nonoverlapping gold each',()=>{
 expect(stages).toHaveLength(10);expect(stages.filter(s=>s.theme==='heart')).toHaveLength(3);expect(stages.filter(s=>s.theme==='clover')).toHaveLength(3);expect(new Set(stages.map(s=>JSON.stringify(s.bricks.map(b=>[b.x,b.y,b.color])))).size).toBe(10)
 const problems:string[]=[]
 for(const s of stages){if(s.bricks.filter(b=>b.gold).length!==1||s.bricks.length<21||new Set(s.bricks.map(b=>b.id)).size!==s.bricks.length)problems.push('metadata '+s.id);for(let i=0;i<s.bricks.length;i++){const a=s.bricks[i];if(a.x<=0||a.x+a.w>=1000)problems.push('bounds '+a.id);for(const b of s.bricks.slice(i+1))if(!(a.x>=b.x+b.w||b.x>=a.x+a.w||a.y>=b.y+b.h||b.y>=a.y+a.h))problems.push('overlap '+a.id+' / '+b.id)}for(const height of [350,560,620,2000])for(const b of stageBricks(s,height))if(b.y+b.h>=height-85)problems.push('paddle gap '+s.id+' at '+height)}
 expect(problems).toEqual([]);expect(createEngine(stages[8],511).speed).toBeLessThan(stages[8].speed*511/620)
})
test('swept rounded collision handles all faces, corner arcs, misses and high-speed tunneling',()=>{
 const rect={x:100,y:100,w:80,h:30};expect(sweepCircleRect(50,115,500,0,10,rect,.2)).toMatchObject({t:.08,nx:-1,ny:0});expect(sweepCircleRect(140,50,0,500,10,rect,.2)).toMatchObject({t:.08,nx:0,ny:-1});expect(sweepCircleRect(140,180,0,-500,10,rect,.2)).toMatchObject({t:.08,nx:0,ny:1});expect(sweepCircleRect(230,115,-500,0,10,rect,.2)).toMatchObject({t:.08,nx:1,ny:0});expect(sweepCircleRect(30,30,-100,-100,10,rect,.2)).toBeNull()
 const corner=sweepCircleRect(70,70,500,500,10,rect,.2)!;expect(corner.nx).toBeCloseTo(-Math.SQRT1_2);expect(corner.ny).toBeCloseTo(-Math.SQRT1_2)
 const e=createEngine(stages[0],620);e.phase='playing';e.bricks=[{id:'fast',x:460,y:200,w:80,h:30,color:'pink',gold:false},{id:'gold',x:460,y:40,w:80,h:30,color:'gold',gold:true}];e.ball={x:500,y:400,vx:0,vy:-5000,r:12};e.speed=5000;step(e,.05);expect(e.removed).toEqual(['fast']);expect(e.ball.vy).toBeGreaterThan(0);expect(e.phase).toBe('playing')
})
test('gold immediately clears while normal bricks remain; normals alone never bypass a remaining gold',()=>{
 const e=createEngine(stages[0],620);const gold=e.bricks.find(b=>b.gold)!;e.phase='playing';e.ball={x:gold.x+gold.w/2,y:gold.y+gold.h+30,vx:0,vy:-400,r:12};e.speed=400;step(e,.1);expect(e.phase).toBe('cleared');expect(e.clearReason).toBe('gold');expect(e.bricks.length).toBe(stages[0].bricks.length-1)
 const remaining=createEngine(stages[0],620,stages[0].bricks.filter(b=>!b.gold).map(b=>b.id));expect(remaining.bricks).toHaveLength(1);expect(remaining.phase).toBe('ready');launch(remaining);step(remaining,.05);expect(remaining.phase).toBe('playing')
 const all=createEngine(stages[0],620);all.phase='playing';all.bricks=[{id:'last',x:450,y:200,w:100,h:30,color:'pink',gold:false}];all.ball={x:500,y:260,vx:0,vy:-400,r:12};all.speed=400;step(all,.1);expect(all.phase).toBe('cleared');expect(all.clearReason).toBe('all')
})
test('paddle mirrors incoming angle at every contact position without changing speed or horizontal direction',()=>{
 for(const offset of [-.98,-.8,0,.8,.98])for(const vx of (Math.abs(offset)>.9?[0]:[-299,-180,0,180,299])){const e=createEngine(stages[0],620);e.bricks=[];e.phase='playing';e.speed=300;const vy=Math.sqrt(300**2-vx**2),time=.001;e.ball={x:e.paddle.x+offset*e.paddle.w/2-vx*time,y:e.paddle.y-12-vy*time,vx,vy,r:12};for(let i=0;i<120&&!e.events.includes('paddle');i++)step(e,1/120);expect(e.events).toContain('paddle');expect(e.ball.vx).toBeCloseTo(vx,10);expect(e.ball.vy).toBeCloseTo(-vy,10);expect(Math.atan2(e.ball.vx,-e.ball.vy)).toBeCloseTo(Math.atan2(vx,vy),10);expect(Math.hypot(e.ball.vx,e.ball.vy)).toBeCloseTo(300,10)}
 const outside=createEngine(stages[0],620);outside.bricks=[];outside.phase='playing';outside.ball={x:outside.paddle.x+outside.paddle.w/2+16,y:outside.paddle.y-20,vx:0,vy:300,r:12};outside.speed=300;step(outside,.1);expect(outside.ball.vy).toBeGreaterThan(0)
 const wall=createEngine(stages[0],620);wall.bricks=[];wall.phase='playing';wall.speed=300;wall.ball={x:985,y:200,vx:300,vy:.001,r:12};step(wall,.05);expect(wall.ball.vx).toBeLessThan(0);expect(Math.abs(wall.ball.vy)).toBeGreaterThan(100);expect(wall.ball.x).toBeLessThanOrEqual(988)
 for(const x of [-1000,2000]){movePaddle(wall,x);expect(wall.paddle.x-wall.paddle.w/2).toBeGreaterThanOrEqual(0);expect(wall.paddle.x+wall.paddle.w/2).toBeLessThanOrEqual(1000)}
})
test('smaller paddle and a single 1.2x boost after ten active seconds, retained across misses and resize',()=>{
 for(const stage of stages){const e=createEngine(stage,620);expect(e.paddle.w).toBeCloseTo(stage.paddleWidth*2/3);expect(e.paddle.h).toBeCloseTo(44*2/3)}
 const e=createEngine(stages[0],620),base=e.speed
 step(e,30);expect(e.playSeconds).toBe(0);launch(e);togglePause(e);step(e,30);expect(e.playSeconds).toBe(0);togglePause(e)
 // An empty playfield isolates timing from stage completion. Catch the ball normally.
 e.bricks=[]
 for(let tick=0;tick<1199;tick++){movePaddle(e,e.ball.x);step(e,1/120)}
 expect(e.boosted).toBe(false);expect(e.speed).toBe(base)
 const direction=Math.atan2(e.ball.vy,e.ball.vx);step(e,1/120)
 expect(e.boosted).toBe(true);expect(e.speed).toBeCloseTo(base*1.2);expect(Math.hypot(e.ball.vx,e.ball.vy)).toBeCloseTo(base*1.2);expect(Math.atan2(e.ball.vy,e.ball.vx)).toBeCloseTo(direction)
 for(let tick=0;tick<2400;tick++){movePaddle(e,e.ball.x);step(e,1/120)}
 expect(e.speed).toBeCloseTo(base*1.2)
 e.ball.y=e.height+20;e.ball.vy=100;step(e,1/120);expect(e.phase).toBe('ready');const elapsed=e.playSeconds;step(e,20);expect(e.playSeconds).toBe(elapsed);launch(e);expect(Math.hypot(e.ball.vx,e.ball.vy)).toBeCloseTo(base*1.2)
 const resized=createEngine(stages[0],510,e.removed,e.playSeconds),fresh=createEngine(stages[0],510);expect(resized.boosted).toBe(true);expect(resized.speed).toBeCloseTo(fresh.speed*1.2)
 const next=createEngine(stages[1],620);expect(next.playSeconds).toBe(0);expect(next.boosted).toBe(false)
})

test('pause is frozen, misses keep bricks, and variable frame intervals preserve physics',()=>{
 const e=createEngine(stages[0],620);launch(e);togglePause(e);const snapshot=JSON.stringify(e);step(e,1);expect(JSON.stringify(e)).toBe(snapshot);togglePause(e);expect(e.phase).toBe('playing');e.ball.y=e.height+20;e.ball.vy=100;const count=e.bricks.length;step(e,.01);expect(e.phase).toBe('ready');expect(e.misses).toBe(1);expect(e.bricks).toHaveLength(count)
 const simulate=(fps:number)=>{const e=createEngine(stages[0],620);e.bricks=[];e.phase='playing';e.ball={x:910,y:65,vx:220,vy:-180,r:12};e.speed=Math.hypot(220,180);for(let i=0;i<fps*2;i++)step(e,1/fps);return e.ball};const reference=simulate(120);for(const fps of [30,60,144]){const ball=simulate(fps);expect(ball.x).toBeCloseTo(reference.x,5);expect(ball.y).toBeCloseTo(reference.y,5)}
})
test('progress validates each board and preserves other unfinished stages and completion records',()=>{
 let s:Progress={...freshProgress(),boards:{'2':[stages[1].bricks[1].id]}};s=completeStage(s,1);expect(s.current).toBe(2);expect(s.boards['2']).toHaveLength(1);expect(s.completed).toEqual([1]);expect(restoreProgress(s)).toEqual(s);expect(restoreProgress({...s,boards:{'2':[stages[1].bricks[0].id]}})).toEqual(freshProgress());expect(restoreProgress({...s,current:11})).toEqual(freshProgress());for(let id=2;id<=10;id++)s=completeStage(s,id);expect(s.completed).toHaveLength(10);expect(s.current).toBe(10)
})
test('all ten real layouts can clear through simulated paddle control without editing bricks or the ball',()=>{
 test.setTimeout(60000)
 const reports:{stage:number;seconds:number;misses:number;remaining:number;reason:string|null}[]=[]
 for(const stage of stages){const e=createEngine(stage,620);let ticks=0;while(e.phase!=='cleared'&&ticks<120*240){
  if(e.phase==='ready')launch(e)
  if(e.ball.vy>0){const time=Math.max(0,(e.paddle.y-e.ball.r-e.ball.y)/e.ball.vy),span=1000-2*e.ball.r,raw=e.ball.x-e.ball.r+e.ball.vx*time,wrapped=((raw%(2*span))+2*span)%(2*span),landing=e.ball.r+(wrapped>span?2*span-wrapped:wrapped);movePaddle(e,landing)}step(e,1/120);ticks++
 }expect(e.phase,`stage ${stage.id}, ${ticks/120}s, misses ${e.misses}, remaining ${e.bricks.length}`).toBe('cleared');reports.push({stage:stage.id,seconds:Math.round(ticks/120*10)/10,misses:e.misses,remaining:e.bricks.length,reason:e.clearReason})}
 writeFileSync('docs/brick-breaker/simulation.json',JSON.stringify(reports,null,2))
})
