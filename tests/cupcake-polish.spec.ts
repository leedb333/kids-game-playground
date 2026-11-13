import {test,expect,type Page} from '@playwright/test'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {edit,fresh,layout,storageKey,type Work} from '../src/games/cooking-v2/cupcake/model'

const phase=process.env.CUPCAKE_REVIEW_PHASE==='before'?'before':'after'
const folder=`docs/cupcake-polish/${phase}`
mkdirSync(folder,{recursive:true})
async function fixture(page:Page,patch:Partial<Work>){const s=edit(fresh(),{step:'bake',ingredients:['egg','milk','flour','sugar'],mix:1,filled:true,...patch});await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:storageKey,s});await page.goto('prototypes/cooking-v2/cupcake/#play');await page.reload();await expect(page.getByText('요리 그림을 준비하고 있어요…')).toHaveCount(0)}
async function at(page:Page,x:number,y:number){const r=(await page.locator('.cc-work').boundingBox())!;return {x:r.x+r.width*x/1400,y:r.y+r.height*y/900}}
// Compare the old geometry in the same browser: Windows screenshots are review
// artifacts, not pixel-position expectations for Linux CI with different fonts.
async function baselineBounds(page:Page,step:'bake'|'complete'){
 const style=await page.addStyleTag({content:step==='bake'?`
 .cc-app[data-step=bake] .cc-work.cc-wide{width:min(96cqw,140cqh)!important;top:54%!important}
 @media(max-width:700px){.cc-app[data-step=bake] .cc-work.cc-wide{width:min(100cqw,140cqh)!important}}
 `:`
 .cc-app[data-step=complete] .cc-work{width:min(90cqw,90cqh)!important;aspect-ratio:1!important;top:54%!important;left:50%!important;transform:translate(-50%,-50%)!important}
 @media(max-width:700px){.cc-app[data-step=complete] .cc-work{width:min(98cqw,90cqh)!important}}
 @media(max-height:500px) and (min-width:600px){.cc-app[data-step=complete] .cc-work{width:min(80cqw,90cqh)!important}}
 `});const bounds=(await page.locator('.cc-work').boundingBox())!;await style.evaluate(e=>(e as HTMLElement).remove());return bounds
}
for(const [name,width,height] of [['tablet',1280,800],['tablet-wide',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`cupcake oven and celebration review: ${name}`,async({page,context})=>{
 await page.setViewportSize({width,height});await page.goto('prototypes/cooking-v2/cupcake/');await fixture(page,{oven:'ready'});await page.screenshot({path:`${folder}/${name}-oven.png`})
 const stage=await page.locator('.cc-scene').boundingBox(),work=await page.locator('.cc-work').boundingBox();const metrics:any={stage,work};if(phase==='after')metrics.baselineWork=await baselineBounds(page,'bake')
 await page.getByRole('button',{name:'문 열기',exact:true}).tap();await page.screenshot({path:`${folder}/${name}-open.png`});const cdp=await context.newCDPSession(page)
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...await at(page,350,510),id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...await at(page,1030,440),id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('main')).toHaveAttribute('data-phase','inside');await page.screenshot({path:`${folder}/${name}-inside.png`})
 const close=page.getByRole('button',{name:'문 닫고 굽기',exact:true}),button=(await close.boundingBox())!;expect(button.width).toBeGreaterThanOrEqual(48);expect(button.height).toBeGreaterThanOrEqual(48);expect(button.y+button.height).toBeLessThanOrEqual((await page.locator('.cc-dock').boundingBox())!.y+1)
 await close.tap();await expect(page.locator('main')).toHaveAttribute('data-phase','done',{timeout:6000});await page.screenshot({path:`${folder}/${name}-baked.png`})
 if(phase==='after'){
  const visible=(await page.locator('.cc-scene').boundingBox())!
  for(const selector of ['[data-oven-art]','[data-tray-inside]']){const bounds=(await page.locator(selector).boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(visible.x-1);expect(bounds.x+bounds.width).toBeLessThanOrEqual(visible.x+visible.width+1);expect(bounds.y).toBeGreaterThanOrEqual(visible.y-1);expect(bounds.y+bounds.height).toBeLessThanOrEqual(visible.y+visible.height+1)}
  if(name.startsWith('tablet'))expect(work!.width/metrics.baselineWork.width).toBeGreaterThan(1.15)
 }
 await fixture(page,{step:'complete',oven:'done',elapsed:3000,cream:'strawberry',piping:1});await page.screenshot({path:`${folder}/${name}-complete.png`});metrics.completeFood=await page.locator('.cc-work').boundingBox();metrics.completeLayout=layout(JSON.parse(await page.evaluate(key=>localStorage.getItem(key)!,storageKey)).work)
 if(phase==='after'){const old=JSON.parse(readFileSync(`docs/cupcake-polish/before/${name}-metrics.json`,'utf8'));metrics.baselineCompleteFood=await baselineBounds(page,'complete');expect(metrics.completeFood).toEqual(metrics.baselineCompleteFood);expect(metrics.completeLayout).toEqual(old.completeLayout);const bubble=await page.locator('.cc-celebrate h2').evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,radius:s.borderRadius}});expect(bubble.background).not.toBe('rgba(0, 0, 0, 0)');expect(bubble.radius).not.toBe('0px');const label=(await page.locator('.cc-celebrate h2').boundingBox())!,cake=(await page.locator('.cc-work svg>image').nth(2).boundingBox())!;expect(label.x+label.width/2).toBeCloseTo(width/2,0);expect(label.y+label.height).toBeLessThanOrEqual(cake.y+2)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);writeFileSync(`${folder}/${name}-metrics.json`,JSON.stringify(metrics,null,2))
})
