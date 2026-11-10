import {test,expect,type Page} from '@playwright/test'
import {mkdirSync,writeFileSync} from 'node:fs'
import {createEngine,launch,step,togglePause} from '../src/games/brick-breaker/engine'
import {stages,stageBricks} from '../src/games/brick-breaker/stages'
import {ballSpeedConfig,stageBaseSpeed,targetBallSpeed} from '../src/games/brick-breaker/speed'
import {freshProgress,progressKey,restartStage,restoreProgress} from '../src/games/brick-breaker/progress'
const key='kids-game-playground:v1:'+progressKey

test('audit all ten stages at compact/reference/portrait sizes; no pattern-dependent cap',()=>{
 const report=[]
 for(const s of stages){
  expect(s.speed).toBe(222+(s.id-1)*7);expect(stageBaseSpeed(s.id)).toBe(s.speed)
  for(const h of [300,350,511,620,1200,2000]){const e=createEngine(s,h);expect(e.speed).toBeCloseTo(s.speed*h/620*1.2,10);launch(e);expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(e.speed,10)}
  const h=511,e=createEngine(s,h),bottom=Math.max(...stageBricks(s,h).map(b=>b.y+b.h)),before=Math.min(s.speed*h/620,Math.max(90,(h-66-bottom-12)/.6))*1.2
  report.push({stage:s.id,base:s.speed,beforeAt511:before,afterAt511:e.speed,referenceAt620:createEngine(s,620).speed,measuredAt511:Math.hypot(...(()=>{launch(e);return [e.balls[0].vx,e.balls[0].vy] as const})()),units:'world units/second; field width=1000'})
 }
 expect(report[7].beforeAt511).toBe(138);expect(report[8].beforeAt511).toBe(138);expect(report[7].afterAt511).toBeCloseTo(268.0277419355);expect(report[8].afterAt511).toBeCloseTo(274.9509677419);expect(ballSpeedConfig.boost).toBe(1.2)
 mkdirSync('docs/brick-speed-restart',{recursive:true});writeFileSync('docs/brick-speed-restart/speed-audit.json',JSON.stringify(report,null,2)+'\n')
})

test('30/60/90/120/144Hz and jitter move all stages by elapsed seconds, not by frame count',()=>{
 for(const s of stages)for(const h of [350,511,620,2000])for(const fps of [30,60,90,120,144]){
  const e=createEngine(s,h);e.bricks=[];launch(e);const {x,y,vx,vy}=e.balls[0]
  for(let i=0;i<fps;i++)step(e,1/fps)
  expect(e.balls[0].x).toBeCloseTo(x+vx,7);expect(e.balls[0].y).toBeCloseTo(y+vy,7);expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(targetBallSpeed(s.speed,h),9)
 }
 const e=createEngine(stages[8],511);e.bricks=[];launch(e);const start={...e.balls[0]};let elapsed=0
 for(const dt of [.01,.027,.009,.019,.034,.017,.025]){step(e,dt);elapsed+=dt}expect(e.balls[0].x).toBeCloseTo(start.x+start.vx*elapsed,9);expect(e.balls[0].y).toBeCloseTo(start.y+start.vy*elapsed,9)
})

test('every stage preserves target magnitude through paddle, brick, wall, pause, miss and two-ball launches',()=>{
 for(const s of stages){
  const e=createEngine(s,511),speed=e.speed;e.bricks=[];launch(e);togglePause(e);const paused=JSON.stringify(e);step(e,2);expect(JSON.stringify(e)).toBe(paused);togglePause(e)
  Object.assign(e.balls[0],{x:500,y:e.paddle.y-16,vx:speed*.24,vy:speed*Math.sqrt(1-.24**2)});step(e,.05);expect(e.events).toContain('paddle');expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(speed,9)
  const brick={id:'probe',x:450,y:180,w:100,h:30,color:'pink' as const,gold:false};e.bricks=[brick,{...brick,id:'gold',gold:true,x:100,y:35}];Object.assign(e.balls[0],{x:500,y:226,vx:speed*.24,vy:-speed*Math.sqrt(1-.24**2)});step(e,.05);expect(e.events).toContain('brick');expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(speed,9)
  Object.assign(e.balls[0],{x:986,y:150,vx:speed*.8,vy:-speed*.6});step(e,.05);expect(e.balls[0].vx).toBeLessThan(0);expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(speed,9)
  e.balls.forEach(b=>{b.y=e.height+100;b.vy=speed});step(e,1/120);expect(e.phase).toBe('ready');expect(e.speed).toBe(speed);launch(e);expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(speed,9)
  const two=createEngine(s,511,[],10);launch(two);expect(two.balls).toHaveLength(2);for(const b of two.balls)expect(Math.hypot(b.vx,b.vy)).toBeCloseTo(speed,9)
 }
})

test('old saves cannot restore a stale speed; current-stage reset preserves all other boards/completions',()=>{
 for(const id of [1,8,9]){
  const old={...freshProgress(),current:id,completed:[2,4,10],boards:{[id]:stages[id-1].bricks.filter(b=>!b.gold).slice(0,4).map(b=>b.id),'3':[stages[2].bricks[1].id]},speed:1,vx:1}
  const restored=restoreProgress(old),saved=JSON.stringify(restored),e=createEngine(stages[id-1],511,restored.boards[id]);launch(e);expect(Math.hypot(e.balls[0].vx,e.balls[0].vy)).toBeCloseTo(targetBallSpeed(stages[id-1].speed,511),9)
  const fresh=restartStage(restored,id);expect(JSON.stringify(restored)).toBe(saved);expect(fresh.current).toBe(id);expect(fresh.completed).toEqual([2,4,10]);expect(fresh.boards[id]).toEqual([]);expect(fresh.boards[3]).toEqual(old.boards[3]);expect(restoreProgress(fresh)).toEqual(fresh)
  const reset=createEngine(stages[id-1],511,fresh.boards[id]);expect(reset.bricks).toHaveLength(stages[id-1].bricks.length);expect(reset.bricks.filter(b=>b.gold)).toHaveLength(1);expect(reset).toMatchObject({phase:'ready',playSeconds:0,split:false,misses:0,particles:[],removed:[]});expect(reset.balls).toHaveLength(1);expect(reset.paddle.x).toBe(500);expect(reset.balls[0]).toMatchObject({x:500,vx:0,vy:0,trail:[]})
 }
})

async function enter(page:Page,id=1){await page.goto('./');await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();if(id!==1){await page.getByRole('button',{name:'단계 선택',exact:true}).click();await page.getByRole('button',{name:new RegExp(`^${id}단계 `)}).click()}await expect(page.locator('.brick-field>canvas')).toHaveAttribute('data-stage',String(id))}
async function savedBoard(page:Page,id:number){const p={...freshProgress(),current:id,completed:[2,4,10],boards:{[id]:stages[id-1].bricks.filter(b=>!b.gold).slice(0,4).map(b=>b.id),'3':[stages[2].bricks[1].id]}};await page.addInitScript(({key,p})=>localStorage.setItem(key,JSON.stringify(p)),{key,p});return p}
for(const id of [1,8,9])test(`stage ${id}: cancel a moving game, confirm reset, persist and resume with full gold/normal bricks`,async({page})=>{
 const saved=await savedBoard(page,id);await page.setViewportSize({width:1280,height:800});await page.goto('./');await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();const c=page.locator('.brick-field>canvas');await expect(c).toHaveAttribute('data-stage',String(id));await expect.poll(()=>c.getAttribute('data-remaining')).toBe(String(stages[id-1].bricks.length-4));await page.getByRole('button',{name:'공 보내기',exact:true}).click();await expect.poll(async()=>Number(await c.getAttribute('data-play-seconds'))).toBeGreaterThan(.1)
 await page.locator('.brick-restart-top').click();const dialog=page.getByRole('dialog',{name:'이 단계를 처음부터 다시 시작할까요?',exact:true});await expect(dialog).toBeVisible();const frozen=await c.getAttribute('data-play-seconds');await page.waitForTimeout(250);expect(await c.getAttribute('data-play-seconds')).toBe(frozen);await dialog.getByRole('button',{name:'취소',exact:true}).click();await expect(c).toHaveAttribute('data-phase','playing');await expect.poll(async()=>Number(await c.getAttribute('data-play-seconds'))).toBeGreaterThan(Number(frozen))
 await page.locator('.brick-restart-top').click();await dialog.getByRole('button',{name:'다시 시작 확인',exact:true}).click();await expect(c).toHaveAttribute('data-phase','ready');await expect.poll(()=>c.getAttribute('data-remaining')).toBe(String(stages[id-1].bricks.length));await expect.poll(()=>c.getAttribute('data-paddle-x')).toBe('500.00');await expect(c).toHaveAttribute('data-ball-count','1');await expect(c).toHaveAttribute('data-play-seconds','0.000');await expect(c).toHaveAttribute('data-actual-ball-speeds','0.0000')
 const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key);expect(after.current).toBe(id);expect(after.completed).toEqual(saved.completed);expect(after.boards[id]).toEqual([]);expect(after.boards[3]).toEqual(saved.boards[3]);await page.getByRole('button',{name:'홈으로 이동',exact:true}).click();await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();await expect.poll(()=>c.getAttribute('data-remaining')).toBe(String(stages[id-1].bricks.length));await page.getByRole('button',{name:'공 보내기',exact:true}).click();await expect.poll(async()=>Number(await c.getAttribute('data-actual-ball-speeds'))).toBeGreaterThan(1);expect(Number(await c.getAttribute('data-actual-ball-speeds'))).toBeCloseTo(Number(await c.getAttribute('data-ball-speed')),3)
})

for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`paused cancel and restart controls fit without shrinking the field: ${name}`,async({page})=>{
 await page.setViewportSize({width,height});await enter(page,9);const c=page.locator('.brick-field>canvas'),field=(await c.boundingBox())!;await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'다시 시작',exact:true}).click();const dialog=page.getByRole('dialog',{name:'이 단계를 처음부터 다시 시작할까요?',exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'취소',exact:true})).toBeFocused();await dialog.press('Escape');await expect(c).toHaveAttribute('data-phase','paused');await expect(page.getByRole('heading',{name:'잠깐 쉬어 가요',exact:true})).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'다시 시작',exact:true}).click()
 const confirm=dialog.getByRole('button',{name:'다시 시작 확인',exact:true}),b=(await confirm.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(48);expect(b.height).toBeGreaterThanOrEqual(48);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width);expect(b.y+b.height).toBeLessThanOrEqual(height);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await c.boundingBox())!.height).toBe(field.height);await page.screenshot({path:`docs/brick-speed-restart/confirm-${name}.png`,fullPage:true});await confirm.click();await expect(c).toHaveAttribute('data-phase','ready');await page.screenshot({path:`docs/brick-speed-restart/ready-${name}.png`,fullPage:true})
})

test('real browser audits target/actual launch speed and paused/resumed velocity in all ten stages',async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width:1280,height:720});await enter(page);const c=page.locator('.brick-field>canvas'),report=[]
 for(const s of stages){
  if(s.id!==1){await page.getByRole('dialog').getByRole('button',{name:'단계 선택',exact:true}).click();await page.getByRole('button',{name:new RegExp(`^${s.id}단계 `)}).click()}
  await expect(c).toHaveAttribute('data-stage',String(s.id));await expect.poll(async()=>Number(await c.getAttribute('data-ball-speed'))).toBeCloseTo(targetBallSpeed(s.speed,Number(await c.getAttribute('data-world-height'))),3)
  await page.getByRole('button',{name:'공 보내기',exact:true}).click();await expect.poll(async()=>Number(await c.getAttribute('data-actual-ball-speeds'))).toBeGreaterThan(1)
  const actual=Number(await c.getAttribute('data-actual-ball-speeds')),target=Number(await c.getAttribute('data-ball-speed'));expect(actual).toBeCloseTo(target,3)
  await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.waitForTimeout(120);expect(Number(await c.getAttribute('data-actual-ball-speeds'))).toBeCloseTo(target,3);await page.getByRole('dialog').getByRole('button',{name:'계속하기',exact:true}).click();await expect(c).toHaveAttribute('data-phase','playing');expect(Number(await c.getAttribute('data-actual-ball-speeds'))).toBeCloseTo(target,3);await page.getByRole('button',{name:'일시정지',exact:true}).click()
  const rect=(await c.boundingBox())!;report.push({stage:s.id,worldHeight:Number(await c.getAttribute('data-world-height')),target,actual,cssPixelsPerSecond:actual*rect.width/1000,viewport:'1280x720'})
 }
 writeFileSync('docs/brick-speed-restart/browser-speed-audit.json',JSON.stringify(report,null,2)+'\n')
})
