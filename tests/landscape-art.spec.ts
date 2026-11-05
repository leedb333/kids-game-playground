import {test,expect} from '@playwright/test'
import {drawings} from '../src/games/coloring/data/drawings'
for(const drawing of Object.values(drawings))test(`${drawing.id}: wide drawing label hit targets`,async({page})=>{
 await page.setViewportSize({width:1280,height:800});await page.goto('./');await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click();await page.getByRole('button',{name:`${drawing.title}, ${drawing.colors.length}색, 색칠하기`,exact:true}).click()
 const failures=await page.locator('.canvas-panel svg').evaluate((svg,regions)=>regions.flatMap(r=>{const p=new DOMPoint(...r.label).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);const hit=document.elementFromPoint(p.x,p.y)?.getAttribute('data-region');return hit===r.id?[]:[{id:r.id,hit,label:r.label}]}),drawing.regions)
 console.log(drawing.id,drawing.colors.length,drawing.regions.length,JSON.stringify(failures))
 await page.screenshot({path:`docs/coloring-v4-final/wide-${drawing.id}-start.png`,fullPage:true})
 expect(failures).toEqual([])
})
