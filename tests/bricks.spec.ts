import {test,expect,type Page} from '@playwright/test'
import {stages} from '../src/games/brick-breaker/stages'
import {freshProgress,progressKey} from '../src/games/brick-breaker/progress'
const key='kids-game-playground:v1:'+progressKey
async function enter(page:Page){await page.goto('./');await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();const canvas=page.locator('.brick-field>canvas');await expect(canvas).toHaveAttribute('data-world-height',/\d/);await expect.poll(async()=>{const box=(await canvas.boundingBox())!;return Math.abs(Number(await canvas.getAttribute('data-world-height'))-1000*box.height/box.width)}).toBeLessThan(1)}
async function choose(page:Page,id:number){await page.getByRole('button',{name:'단계 선택',exact:true}).click();await page.getByRole('button',{name:new RegExp(`^${id}단계 `)}).click();await expect(page.locator('.brick-field>canvas')).toHaveAttribute('data-stage',String(id))}
async function aimAtOnlyGold(page:Page){const canvas=page.locator('.brick-field>canvas'),height=Number(await canvas.getAttribute('data-world-height')),r=height>1000?18:12,scale=Math.min(1,Math.max(.38,(height-145)/350)),goldBottom=18+(43-40)*scale+40*scale,ballY=height-66-r-3,targetX=500-(ballY-(goldBottom+r))*.24/Math.sqrt(1-.24**2),box=(await canvas.boundingBox())!;await page.mouse.move(box.x+targetX/1000*box.width,box.y+box.height*.7);await canvas.focus();await canvas.press(' ')}

test('live play adds a second ball after ten seconds without acceleration and resets on a new stage',async({page})=>{
 test.setTimeout(40000);await page.setViewportSize({width:1280,height:800});await enter(page)
 const canvas=page.locator('.brick-field>canvas'),base=Number(await canvas.getAttribute('data-ball-speed')),box=(await canvas.boundingBox())!
 expect(Number(await canvas.getAttribute('data-paddle-width'))).toBeCloseTo(stages[0].paddleWidth*2/3,2);expect(Number(await canvas.getAttribute('data-paddle-height'))).toBeCloseTo(44*2/3,2)
 await page.getByRole('button',{name:'공 보내기',exact:true}).click();await page.getByRole('button',{name:'일시정지',exact:true}).click();await page.waitForTimeout(150)
 const paused=await canvas.getAttribute('data-play-seconds');await page.waitForTimeout(500);expect(await canvas.getAttribute('data-play-seconds')).toBe(paused);expect(Number(await canvas.getAttribute('data-ball-speed'))).toBe(base)
 await page.getByRole('button',{name:'계속하기',exact:true}).click()
 const deadline=Date.now()+22000
 while(Number(await canvas.getAttribute('data-play-seconds'))<10.2&&Date.now()<deadline){
  const x=Number(await canvas.getAttribute('data-ball-x'));await page.mouse.move(box.x+x/1000*box.width,box.y+box.height*.96)
  if(await canvas.getAttribute('data-phase')==='ready')await page.getByRole('button',{name:'공 보내기',exact:true}).click()
  await page.waitForTimeout(40)
 }
 expect(Number(await canvas.getAttribute('data-play-seconds'))).toBeGreaterThanOrEqual(10)
 expect(Number(await canvas.getAttribute('data-ball-speed'))).toBe(base)
 await expect(canvas).toHaveAttribute('data-ball-count','2')
 await page.screenshot({path:'docs/brick-two-balls/two-balls-tablet.png',fullPage:true})
 await page.getByRole('button',{name:'일시정지',exact:true}).click();await choose(page,2)
 await expect.poll(()=>canvas.getAttribute('data-play-seconds')).toBe('0.000');await expect(canvas).toHaveAttribute('data-ball-count','1')
})

test('cached playground starts in a new offline window and opens all four games',async({page,context})=>{
 await page.goto('./');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
 const url=page.url();await context.setOffline(true);await page.close();const offline=await context.newPage(),errors:string[]=[];offline.on('pageerror',e=>errors.push(e.message))
 await offline.goto(url);await expect(offline.getByRole('heading',{name:'어린이 게임 놀이터',exact:true})).toBeVisible()
 for(const name of ['순서대로 색칠놀이','요리놀이','코디놀이','벽돌깨기']){
  await offline.getByRole('button',{name,exact:true}).click();await expect(offline.getByRole('region',{name,exact:true})).toBeVisible();await expect(offline.locator('.game-shell')).not.toBeEmpty()
  await offline.getByRole('button',{name:'홈으로 이동',exact:true}).click()
 }
 expect(errors).toEqual([]);await context.setOffline(false)
})

test('all ten stages start, stage gallery matches data, and each layout is captured',async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:1280,height:800});await enter(page);const canvas=page.locator('.brick-field>canvas');await expect(canvas).toHaveAttribute('data-stage','1')
 for(let id=1;id<=10;id++){if(id!==1)await choose(page,id);await expect.poll(()=>canvas.getAttribute('data-remaining')).toBe(String(stages[id-1].bricks.length));await page.screenshot({path:`docs/brick-breaker/stage-${String(id).padStart(2,'0')}.png`,fullPage:true})}
 await page.getByRole('button',{name:'단계 선택',exact:true}).click();await expect(page.locator('.brick-stage-card')).toHaveCount(10);await page.screenshot({path:'docs/brick-breaker/stage-gallery.png',fullPage:true})
})
for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`live breakout layout ${name}`,async({page})=>{
 await page.setViewportSize({width,height});await enter(page);await choose(page,10);await page.getByRole('button',{name:'공 보내기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-phase','playing');await page.waitForTimeout(180);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true)
 const box=(await page.locator('.brick-field').boundingBox())!;expect(box.height/height).toBeGreaterThan(.76);for(const button of await page.locator('.toolbar button').all()){const b=(await button.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(48);expect(b.height).toBeGreaterThanOrEqual(48)}await page.screenshot({path:`docs/brick-breaker/live-${name}.png`,fullPage:true})
})
test('native phone touch moves the paddle only horizontally, captures a grab offset and blocks scroll',async({page})=>{
 await page.setViewportSize({width:360,height:800});await enter(page);const canvas=page.locator('canvas'),b=(await canvas.boundingBox())!,cdp=await page.context().newCDPSession(page),from={x:b.x+b.width*.42,y:b.y+b.height*.97},to={x:b.x+b.width*.9,y:b.y+b.height*.6}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});await expect.poll(async()=>Math.round(Number(await canvas.getAttribute('data-paddle-x')))).toBe(500);for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await expect.poll(async()=>Number(await canvas.getAttribute('data-paddle-x'))).toBeGreaterThan(800);expect(await page.evaluate(()=>scrollY)).toBe(0);await expect(canvas).toHaveAttribute('data-phase','ready');await page.screenshot({path:'docs/brick-breaker/phone-touch.png',fullPage:true})
 await canvas.focus();await canvas.press('ArrowLeft',{delay:200});await expect.poll(async()=>Number(await canvas.getAttribute('data-paddle-x'))).toBeLessThan(800)
})
test('pause freezes the ball, resumes without a time jump and backgrounding pauses automatically',async({page})=>{
 await enter(page);await page.getByRole('button',{name:'공 보내기',exact:true}).click();await page.waitForTimeout(200);await page.getByRole('button',{name:'일시정지',exact:true}).click();const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-phase','paused');await page.waitForTimeout(150);const before=await canvas.getAttribute('data-ball-y');await page.waitForTimeout(250);expect(await canvas.getAttribute('data-ball-y')).toBe(before);await page.screenshot({path:'docs/brick-breaker/paused.png',fullPage:true});await page.getByRole('button',{name:'계속하기',exact:true}).focus();await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'단계 선택',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(canvas).toHaveAttribute('data-phase','playing');await expect.poll(()=>canvas.getAttribute('data-ball-y')).not.toBe(before)
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(canvas).toHaveAttribute('data-phase','paused')
})
test('remaining gold is playable, naturally clears with other bricks absent, saves next stage and resumes',async({page})=>{
 const normal=stages[0].bricks.filter(b=>!b.gold).map(b=>b.id);await page.addInitScript(({key,s})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(s))},{key,s:{...freshProgress(),boards:{'1':normal}}});await page.setViewportSize({width:1280,height:800});await enter(page);await expect.poll(()=>page.locator('canvas').getAttribute('data-remaining')).toBe('1');await expect(page.getByText('황금별을 찾았어요!',{exact:true})).toHaveCount(0);await aimAtOnlyGold(page);await expect(page.getByRole('heading',{name:'황금별을 찾았어요!',exact:true})).toBeVisible({timeout:8000});await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).completed,key)).toEqual([1]);await page.screenshot({path:'docs/brick-breaker/stage-clear.png',fullPage:true});await page.getByRole('button',{name:'다음 단계',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-stage','2');await page.reload();await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-stage','2')
})
test('stage ten naturally clears to a special celebration and can restart stage one',async({page})=>{
 await page.addInitScript(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s:{...freshProgress(),current:10,completed:[1,2,3,4,5,6,7,8,9],boards:{'10':stages[9].bricks.filter(b=>!b.gold).map(b=>b.id)}}});await page.setViewportSize({width:1280,height:800});await enter(page);await aimAtOnlyGold(page);await expect(page.getByRole('heading',{name:'마지막 별에 닿았어요!',exact:true})).toBeVisible({timeout:8000});await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).completed.length,key)).toBe(10);await page.screenshot({path:'docs/brick-breaker/finale.png',fullPage:true});await page.getByRole('button',{name:'처음부터 다시 놀기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-stage','1')
})
test('offline first open, isolated progress and muted/blocked storage remain playable',async({page,context})=>{
 await page.goto('./');await page.evaluate(()=>{localStorage.setItem('kids-game-playground:v1:game:cooking:pizza:r2','keep');localStorage.setItem('kids-game-playground:v1:game:dressup:spring:r1','keep');localStorage.setItem('kids-game-playground:v1:game:coloring:keep','keep');return navigator.serviceWorker.ready});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-stage','1');await choose(page,4);await page.reload();await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-stage','4');for(const suffix of ['game:cooking:pizza:r2','game:dressup:spring:r1','game:coloring:keep'])expect(await page.evaluate(key=>localStorage.getItem(key),'kids-game-playground:v1:'+suffix)).toBe('keep');await context.setOffline(false)
})
test('muted brick hits make no audio and blocked storage does not stop play',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('blocked')};const old=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){(window as any).__brickTones=((window as any).__brickTones??0)+1;return old.call(this)}});await enter(page);await page.getByRole('button',{name:/소리/}).click();await choose(page,2);await page.getByRole('button',{name:'공 보내기',exact:true}).click();await page.waitForTimeout(1700);expect(await page.evaluate(()=>(window as any).__brickTones??0)).toBe(0);await expect(page.locator('canvas')).toHaveAttribute('data-phase',/playing|ready/);await expect(page.locator('.brick-game [role=status]')).toContainText('저장할 수 없어요')
})

test('real destroyed bricks persist independently when leaving home and returning',async({page})=>{
 await enter(page);await page.getByRole('button',{name:'공 보내기',exact:true}).click();await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{}').boards?.['1']?.length??0,key),{timeout:7000}).toBeGreaterThan(0);await page.getByRole('button',{name:'홈으로 이동',exact:true}).click();const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key);expect(saved.completed).toEqual([]);await page.getByRole('button',{name:'벽돌깨기',exact:true}).click();await expect.poll(()=>page.locator('canvas').getAttribute('data-remaining')).toBe(String(stages[0].bricks.length-saved.boards['1'].length));await expect(page.locator('canvas')).toHaveAttribute('data-phase','ready')
})
