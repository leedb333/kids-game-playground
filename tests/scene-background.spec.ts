import {test,expect} from '@playwright/test'
import {drawings} from '../src/games/coloring/data/drawings'
import {storageKey} from '../src/games/coloring/engine'
import {readFile} from 'node:fs/promises'

for(const drawing of Object.values(drawings))test(`${drawing.id}: fixed background never paints`,async({page})=>{
 await page.setViewportSize({width:1280,height:800});await page.goto('./');await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click();await page.getByRole('button',{name:`${drawing.title}, ${drawing.colors.length}색, 색칠하기`,exact:true}).click()
 const bg=page.locator('[data-background=true]');await expect(bg).toHaveCount(1);await expect(bg).toHaveAttribute('pointer-events','none')
 const points=drawing.id==='baby-dinosaur'?[[600,8],[600,drawing.viewBox[3]-8],[1100,drawing.viewBox[3]-8]]:drawing.id==='garden-butterfly'?[[8,8],[1170,25]]:[[30,30],[600,35],[1150,drawing.viewBox[3]-15]]
 for(const point of points){
  const p=await page.locator('.canvas-panel svg').evaluate((svg,p)=>{const at=new DOMPoint(p[0],p[1]).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);return {x:at.x,y:at.y,region:document.elementFromPoint(at.x,at.y)?.getAttribute('data-region')}},point)
  expect(p.region).toBeNull();await page.touchscreen.tap(p.x,p.y)
 }
 await expect(page.locator('[data-painted=true]')).toHaveCount(0);await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');await expect(page.getByRole('button',{name:'되돌리기',exact:true})).toBeDisabled()
})

test('offline PNG includes the approved background with its original colors',async({page,context})=>{
 const drawing=drawings['police-car-robot'];const order=drawing.colors.flatMap(c=>drawing.regions.filter(r=>r.colorId===c.id)).map(r=>r.id)
 await page.goto('./');await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
 await page.evaluate(({key,history})=>localStorage.setItem(key,JSON.stringify({version:1,updatedAt:new Date().toISOString(),history})),{key:storageKey(drawing),history:order})
 await context.setOffline(true);await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click();await page.getByRole('button',{name:new RegExp(`${drawing.title}, .*이어서`)}).click()
 const bgURL=(await page.locator('[data-background=true]').getAttribute('href'))!
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'완성한 그림 PNG로 저장',exact:true}).click();const download=await event;const bytes=await readFile((await download.path())!)
 const samples=await page.evaluate(async({png,bgURL,width,height})=>{
  const load=async(src:string)=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,width,height);return ctx}
  const a=await load(png),b=await load(bgURL);return [[30,30],[600,35],[1150,height-15]].map(([x,y])=>({actual:Array.from(a.getImageData(x,y,1,1).data),expected:Array.from(b.getImageData(x,y,1,1).data)}))
 },{png:'data:image/png;base64,'+bytes.toString('base64'),bgURL,width:drawing.viewBox[2],height:drawing.viewBox[3]})
 for(const sample of samples){expect(sample.actual[3]).toBe(255);for(let i=0;i<3;i++)expect(Math.abs(sample.actual[i]-sample.expected[i])).toBeLessThanOrEqual(2)}
 await download.saveAs('docs/coloring-v4-final/police-offline-export.png');await context.setOffline(false)
})
