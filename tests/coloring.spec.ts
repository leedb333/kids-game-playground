import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { drawings, officialCatalog } from '../src/games/coloring/data/drawings'
import { activeColor, paint, decodeProgress, storageKey } from '../src/games/coloring/engine'

async function gallery(page:Page){await page.goto('./');await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click();await expect(page.locator('.drawing-card')).toHaveCount(4)}
async function open(page:Page,id:string){await gallery(page);await page.getByRole('button',{name:`${drawings[id].title}, ${drawings[id].colors.length}색, 색칠하기`,exact:true}).click()}
async function tapHint(page:Page){
  await page.getByRole('button',{name:'힌트',exact:true}).click()
  const path=page.locator('[data-region][data-hint=true]')
  await expect(path).toHaveCount(1)
  const id=(await path.getAttribute('data-region'))!
  const point=await path.evaluate((el)=>{
    const svg=el.closest('svg')!;const label=Array.from(svg.querySelectorAll('text')).find(t=>t.textContent===el.getAttribute('data-color')&&Math.abs(Number(t.getAttribute('x')))>0)
    return {id:el.getAttribute('data-region'),label:!!label}
  })
  expect(point.label).toBe(true)
  // Use the exact original label position, rather than the bounding box of an irregular path.
  const drawingId=await page.locator('.coloring').getAttribute('data-drawing')
  const region=drawings[drawingId!].regions.find(r=>r.id===id)!
  await expect.poll(async()=>path.evaluate((el,p)=>{const pt=new DOMPoint(...p).matrixTransform(el.closest('svg')!.getScreenCTM()!);return document.elementFromPoint(pt.x,pt.y)?.getAttribute('data-region')},region.label)).toBe(id)
  const p=await path.evaluate((el,label)=>{const pt=new DOMPoint(...label).matrixTransform(el.closest('svg')!.getScreenCTM()!);return {x:pt.x,y:pt.y}},region.label)
  await page.touchscreen.tap(p.x,p.y)
  await expect(path).toHaveCount(0)
  await expect(page.locator(`[data-region="${id}"]`)).toHaveAttribute('data-painted','true')
}

for(const item of officialCatalog){
 const drawing=drawings[item.id]
 test(`${item.id}: all ordered colors, undo boundary, corrupt save`,()=>{
  let history:string[]=[]
  const later=drawing.regions.find(r=>r.colorId===2)!
  expect(paint(drawing,history,later.id)).toBe(history)
  for(const color of drawing.colors){for(const region of drawing.regions.filter(r=>r.colorId===color.id)){expect(activeColor(drawing,history)?.id).toBe(color.id);history=paint(drawing,history,region.id)}}
  expect(activeColor(drawing,history)).toBeUndefined();expect(history.length).toBe(drawing.regions.length)
  expect(activeColor(drawing,history.slice(0,-1))?.id).toBe(drawing.colors.length)
  expect(decodeProgress(drawing,JSON.stringify({version:1,updatedAt:new Date().toISOString(),history}))).not.toBeNull()
  expect(decodeProgress(drawing,'{bad')).toBeNull()
  expect(decodeProgress(drawing,JSON.stringify({version:1,updatedAt:new Date().toISOString(),history:[later.id]}))).toBeNull()
 })
 test(`${item.id}: actual touch, wrong color, resume, undo, reset`,async({page})=>{
  await page.setViewportSize({width:1280,height:800});await open(page,item.id)
  await expect(page.locator('[data-region]')).toHaveCount(drawing.regions.length)
  await page.locator(`[data-region="${drawing.regions.find(r=>r.colorId===2)!.id}"]`).press('Enter')
  await expect(page.locator('[data-painted=true]')).toHaveCount(0)
  await tapHint(page);await expect(page.locator('[data-painted=true]')).toHaveCount(1)
  await page.getByRole('button',{name:'도안 선택',exact:true}).click()
  await page.getByRole('button',{name:new RegExp(`${drawing.title}, ${drawing.colors.length}색, 이어서`)}).click()
  await expect(page.locator('[data-painted=true]')).toHaveCount(1)
  await page.getByRole('button',{name:'되돌리기',exact:true}).click();await expect(page.locator('[data-painted=true]')).toHaveCount(0)
  await tapHint(page);await page.getByRole('button',{name:'처음부터',exact:true}).click()
  await page.getByRole('button',{name:'계속 칠할래요',exact:true}).click();await expect(page.locator('[data-painted=true]')).toHaveCount(1)
  await page.getByRole('button',{name:'처음부터',exact:true}).click();await page.getByRole('button',{name:'처음부터 칠하기',exact:true}).click();await expect(page.locator('[data-painted=true]')).toHaveCount(0)
 })
 test(`${item.id}: completion and exported PNG`,async({page})=>{
  const order=drawing.colors.flatMap(c=>drawing.regions.filter(r=>r.colorId===c.id)).map(r=>r.id)
  await page.addInitScript(({key,history})=>localStorage.setItem(key,JSON.stringify({version:1,updatedAt:new Date().toISOString(),history})),{key:storageKey(drawing),history:order.slice(0,-1)})
  await gallery(page);await page.getByRole('button',{name:new RegExp(`${drawing.title}, ${drawing.colors.length}색, 이어서`)}).click()
  await tapHint(page);await expect(page.getByRole('dialog')).toBeVisible()
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'내 그림 저장하기',exact:true}).click()
  const download=await downloadEvent;const bytes=await readFile((await download.path())!)
  expect(bytes.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect(bytes.readUInt32BE(16)).toBe(1200)
  expect(bytes.readUInt32BE(20)).toBe(drawing.viewBox[3])
  await download.saveAs(`docs/coloring-v4-final/${item.id}-complete.png`)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100')
 })
}
for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['phone',360,800],['phone-landscape',800,360],['small-phone',320,640]] as const){
 test(`coloring layout ${name}`,async({page})=>{
  await page.setViewportSize({width,height});await gallery(page)
  await page.screenshot({path:`docs/coloring-v4-final/gallery-${name}.png`,fullPage:true})
  await page.getByRole('button',{name:`숲속 공룡, ${drawings['baby-dinosaur'].colors.length}색, 색칠하기`,exact:true}).click()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  if(width>=1000) expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true)
  const canvas=(await page.locator('.canvas-scroll').boundingBox())!,art=(await page.locator('.canvas-panel svg').boundingBox())!
  expect(art.height).toBeLessThanOrEqual(canvas.height+1);expect(art.width).toBeLessThanOrEqual(canvas.width+1)
  for(const b of await page.locator('.coloring button').all()){const box=(await b.boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(48)}
  await page.getByRole('button',{name:'확대',exact:true}).click();await expect(page.getByRole('button',{name:'원래 크기로'})).toHaveText('150%')
  await page.getByRole('button',{name:'원래 크기로'}).click()
  await page.screenshot({path:`docs/coloring-v4-final/game-${name}.png`,fullPage:true})
  await page.getByRole('button',{name:'홈으로 이동'}).click();await expect(page.getByRole('heading',{level:1})).toBeFocused()
 })
}
test('offline first game open, reload persistence and isolated storage',async({page,context})=>{
 await page.goto('./');await page.evaluate(async()=>{localStorage.setItem('coloring:v1:rose:r1','legacy-keep');await navigator.serviceWorker.ready});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
 await context.setOffline(true);await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click();await page.getByRole('button',{name:`꽃에 앉은 나비, ${drawings['garden-butterfly'].colors.length}색, 색칠하기`,exact:true}).click();await tapHint(page)
 await page.reload();await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click();await page.getByRole('button',{name:/꽃에 앉은 나비, .*색, 이어서/}).click();await expect(page.locator('[data-painted=true]')).toHaveCount(1)
 expect(await page.evaluate(()=>localStorage.getItem('coloring:v1:rose:r1'))).toBe('legacy-keep');await context.setOffline(false)
})
test('color boundary advances automatically and drawings keep separate progress',async({page})=>{
 const drawing=drawings['baby-dinosaur'];const first=drawing.regions.filter(r=>r.colorId===1).map(r=>r.id)
 await page.addInitScript(({key,history})=>localStorage.setItem(key,JSON.stringify({version:1,updatedAt:new Date().toISOString(),history})),{key:storageKey(drawing),history:first.slice(0,-1)})
 await gallery(page);await page.getByRole('button',{name:/숲속 공룡, .*색, /}).click();await tapHint(page)
 await expect(page.locator('[aria-current=step]')).toHaveText('2')
 await page.getByRole('button',{name:'도안 선택',exact:true}).click();await page.getByRole('button',{name:`꽃에 앉은 나비, ${drawings['garden-butterfly'].colors.length}색, 색칠하기`,exact:true}).click();await expect(page.locator('[data-painted=true]')).toHaveCount(0)
})
test('coloring remains playable when browser storage is blocked',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked')}})
 await open(page,'garden-butterfly');await tapHint(page);await expect(page.locator('[data-painted=true]')).toHaveCount(1)
 await expect(page.locator('.storage-warning')).toBeVisible()
})
test('portrait revision stays intact while landscape starts separately',async({page})=>{
 const previousKey=storageKey({...drawings['garden-butterfly'],revision:1})
 await page.addInitScript(key=>localStorage.setItem(key,'previous-portrait-save'),previousKey)
 await open(page,'garden-butterfly');await expect(page.locator('[data-painted=true]')).toHaveCount(0);await tapHint(page)
 expect(await page.evaluate(key=>localStorage.getItem(key),previousKey)).toBe('previous-portrait-save')
})
test('four revised themes, 25-color vehicles, no rose and previous saves preserved',async({page})=>{
 expect(Object.keys(drawings)).toEqual(['police-car-robot','fire-robot','baby-dinosaur','garden-butterfly'])
 for(const id of ['police-car-robot','fire-robot'])expect(drawings[id].colors).toHaveLength(25)
 for(const drawing of Object.values(drawings)){expect(drawing.revision).toBe(4);expect(drawing.viewBox[2]).toBe(1200);expect(drawing.title).not.toContain('로봇')}
 await page.addInitScript(()=>{localStorage.setItem('kids-game-playground:v1:game:coloring:rose:r2','keep-rose');localStorage.setItem('kids-game-playground:v1:game:coloring:baby-dinosaur:r2','keep-dinosaur')})
 await gallery(page);await expect(page.getByRole('button',{name:/장미꽃|로봇 변신/})).toHaveCount(0)
 expect(await page.evaluate(()=>[localStorage.getItem('kids-game-playground:v1:game:coloring:rose:r2'),localStorage.getItem('kids-game-playground:v1:game:coloring:baby-dinosaur:r2')])).toEqual(['keep-rose','keep-dinosaur'])
})
