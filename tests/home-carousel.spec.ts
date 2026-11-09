import {test,expect,type Page} from '@playwright/test'
import {build} from 'vite'
import {resolve} from 'node:path'
import {games} from '../src/games/registry'

let fixtureJs='',fixtureCss=''
test.beforeAll(async()=>{
 const bundle=await build({configFile:false,logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},build:{write:false,minify:false,lib:{entry:resolve('tests/fixtures/home-carousel.tsx'),formats:['iife'],name:'CarouselFixture'}}}) as {output:{type:string;code?:string;source?:string|Uint8Array}[]} | {output:{type:string;code?:string;source?:string|Uint8Array}[]}[]
 const output=(Array.isArray(bundle)?bundle:[bundle]).flatMap(b=>b.output)
 fixtureJs=output.find(f=>f.type==='chunk')!.code!
 fixtureCss=output.filter(f=>f.type==='asset'&&typeof f.source==='string').map(f=>f.source).join('\n')
})
async function expanded(page:Page,count=12){
 const catalog=Array.from({length:count},(_,i)=>({...games[i%games.length],id:i<5?games[i].id:`extra-${i}`,title:i<5?games[i].title:`추가 게임 ${i+1}`,load:undefined}))
 await page.route('**/__carousel_fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fixtureCss}</style><div id="root"></div><script id="catalog" type="application/json">${JSON.stringify(catalog)}</script><script>${fixtureJs}</script>`}))
 await page.goto('__carousel_fixture');await expect(page.locator('.home-games .card')).toHaveCount(count)
}
async function swipe(page:Page){
 const r=(await page.locator('.home-game-rail').boundingBox())!,y=r.y+r.height*.55,x=r.x+Math.min(r.width-22,290)
 const cdp=await page.context().newCDPSession(page)
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*15,y}]})
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()
}

for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['small-tablet',960,600],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`equal real-game cards and fully visible controls: ${name}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('./')
 const cards=page.locator('.home-games .card');await expect(cards).toHaveCount(5);await expect(page.locator('.future-cards,.mini')).toHaveCount(0)
 const boxes=await Promise.all((await cards.all()).map(card=>card.boundingBox()))
 for(const b of boxes){expect(b!.width).toBeGreaterThanOrEqual(180);expect(b!.height).toBeGreaterThanOrEqual(175);expect(Math.abs(b!.width-boxes[0]!.width)).toBeLessThan(1);expect(Math.abs(b!.height-boxes[0]!.height)).toBeLessThan(1);expect(Math.abs(b!.y-boxes[0]!.y)).toBeLessThan(1)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 if(width===1280){const rail=(await page.locator('.home-game-rail').boundingBox())!;expect(boxes[4]!.x+boxes[4]!.width).toBeLessThanOrEqual(rail.x+rail.width+1);await expect(page.getByRole('button',{name:'다음 게임 보기'})).toHaveCount(0)}
 else{const next=page.getByRole('button',{name:'다음 게임 보기'}),b=(await next.boundingBox())!;expect(b.y+b.height).toBeLessThanOrEqual(height);await next.click();await expect.poll(()=>page.locator('.home-game-rail').evaluate(el=>el.scrollLeft)).toBeGreaterThan(10)}
 await page.screenshot({path:`docs/home-carousel/layout-${name}.png`,fullPage:true})
})

test('all five real games launch and return home',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await page.goto('./')
 for(const game of games){await page.getByRole('button',{name:game.title,exact:true}).click();await expect(page.getByRole('region',{name:game.title,exact:true})).toBeVisible();await expect(page.locator('.game-shell')).not.toContainText('놀이를 불러오지 못했어요');await page.getByRole('button',{name:'홈으로 이동',exact:true}).click();await expect(page.locator('.home-games .card')).toHaveCount(5)}
})

test('12 registered entries keep five-card sizing; a 13th appears without editing the component',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await expanded(page)
 const rail=page.locator('.home-game-rail'),width=(await page.locator('.card').first().boundingBox())!.width
 expect(width).toBeGreaterThan(200);expect(await rail.evaluate(el=>el.scrollWidth/el.clientWidth)).toBeGreaterThan(2)
 for(const c of await page.locator('.card').all())expect(Math.abs((await c.boundingBox())!.width-width)).toBeLessThan(1)
 await page.getByRole('button',{name:'게임 등록',exact:true}).click();await expect(page.locator('.card')).toHaveCount(13);expect((await page.locator('.card').last().boundingBox())!.width).toBe(width)
 await rail.focus();await rail.press('End');await expect(page.getByRole('button',{name:'다음 게임 보기'})).toBeDisabled();await page.getByRole('button',{name:'추가 게임 13',exact:true}).click();await expect(page.locator('[data-chosen]')).toHaveAttribute('data-chosen','extra-12')
 await page.screenshot({path:'docs/home-carousel/thirteen-games.png',fullPage:true})
})

test('native phone swipe scrolls without launch; a subsequent tap still launches',async({page})=>{
 await page.setViewportSize({width:360,height:800});await expanded(page)
 await swipe(page);await expect.poll(()=>page.locator('.home-game-rail').evaluate(el=>el.scrollLeft)).toBeGreaterThan(50);await expect(page.locator('[data-chosen]')).toHaveAttribute('data-chosen','')
 await page.waitForTimeout(500);const target=await page.locator('.card').evaluateAll(els=>{const rail=els[0].parentElement!.getBoundingClientRect();return els.findIndex(e=>{const r=e.getBoundingClientRect();return r.x>=rail.x&&r.right<=rail.right})});expect(target).toBeGreaterThanOrEqual(0);await page.locator('.card').nth(target).tap();await expect(page.locator('[data-chosen]')).not.toHaveAttribute('data-chosen','')
})

test('mouse drag blocks click, stops when released, and keyboard scrolling reaches the last game',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await expanded(page)
 const r=(await page.locator('.home-game-rail').boundingBox())!,y=r.y+140
 await page.mouse.move(r.x+500,y);await page.mouse.down();await page.mouse.move(r.x+100,y,{steps:15});await page.mouse.up();await expect(page.locator('[data-chosen]')).toHaveAttribute('data-chosen','');await expect.poll(()=>page.locator('.home-game-rail').evaluate(el=>el.scrollLeft)).toBeGreaterThan(100)
 await page.waitForTimeout(500);const before=await page.locator('.home-game-rail').evaluate(el=>el.scrollLeft);await page.mouse.move(r.x+800,y);await page.waitForTimeout(100);expect(await page.locator('.home-game-rail').evaluate(el=>el.scrollLeft)).toBe(before)
 const rail=page.locator('.home-game-rail');await rail.focus();await rail.press('End');await expect(page.getByRole('button',{name:'다음 게임 보기'})).toBeDisabled();await page.locator('.card').last().press('Enter');await expect(page.locator('[data-chosen]')).toHaveAttribute('data-chosen','extra-11')
})

test('cancelled scroll rejects a trailing click while a fresh tap works',async({page})=>{
 await expanded(page);const card=page.locator('.card').first()
 const pointer={pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:150,clientY:140}
 await card.dispatchEvent('pointerdown',pointer);await card.dispatchEvent('pointermove',{...pointer,clientX:180});await card.dispatchEvent('pointercancel',pointer);await card.dispatchEvent('click',{detail:1})
 await expect(page.locator('[data-chosen]')).toHaveAttribute('data-chosen','')
 await card.dispatchEvent('pointerdown',pointer);await card.dispatchEvent('pointerup',pointer);await card.dispatchEvent('click',{detail:1});await expect(page.locator('[data-chosen]')).toHaveAttribute('data-chosen','coloring')
})

test('home scrolling, resizing and arrows preserve existing saved values',async({page})=>{
 const saved={'kids-game-playground:v1:game:memory-card:r1':'{"existing":"memory"}','kids-game-playground:v1:game:bricks:r1':'{"existing":"bricks"}','old-coloring-app':'keep'}
 await page.addInitScript(values=>{for(const [key,value] of Object.entries(values))localStorage.setItem(key,value)},saved)
 await page.setViewportSize({width:360,height:800});await page.goto('./');await page.getByRole('button',{name:'다음 게임 보기'}).click();await page.setViewportSize({width:1280,height:800})
 for(const [key,value] of Object.entries(saved))expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(value)
})
