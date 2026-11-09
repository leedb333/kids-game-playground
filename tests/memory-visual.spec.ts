import {test,expect} from '@playwright/test'

test('real-clock previews and touch-play captures show front/back/matched cards together',async({page})=>{
 await page.setViewportSize({width:1280,height:800})
 await page.goto('./')
 await page.screenshot({path:'docs/memory-card/home.png',fullPage:true,animations:'disabled'})
 await page.getByRole('button',{name:'반짝반짝 짝꿍 카드',exact:true}).click()
 await expect(page.locator('.memory-game')).toHaveAttribute('data-phase','preview')
 const metrics:Record<string,unknown>={}
 for(const stage of [8,15]){
  await page.getByRole('button',{name:'스테이지 선택',exact:true}).click()
  await page.getByRole('button',{name:new RegExp(`^${stage}단계 `)}).click()
  await expect(page.locator('.memory-card.face-up')).toHaveCount(stage===8?12:20)
  if(stage===8)await page.screenshot({path:'docs/memory-card/stage-08-preview.png',fullPage:true,animations:'disabled'})
  await expect(page.locator('.memory-game')).toHaveAttribute('data-phase','play',{timeout:4500})
  const pair=await page.locator('.memory-card').evaluateAll(els=>{const first=(els[0] as HTMLElement).dataset.picture;return els.filter(e=>(e as HTMLElement).dataset.picture===first).map(e=>(e as HTMLElement).dataset.card!)})
  for(const uid of pair)await page.locator(`[data-card="${uid}"]`).tap()
  await expect(page.locator('.memory-card[data-matched=true]')).toHaveCount(2)
  await page.locator('.memory-card:not([data-matched=true])').first().tap()
  await expect(page.locator('.memory-card.face-up')).toHaveCount(3)
  await page.screenshot({path:`docs/memory-card/stage-${stage}-play.png`,fullPage:true,animations:'disabled'})
  const box=(await page.locator('.memory-card').first().boundingBox())!
  metrics[stage]={width:box.width,height:box.height,viewport:'1280x800',cards:await page.locator('.memory-card').count()}
 }
 const {writeFile}=await import('node:fs/promises')
 await writeFile('docs/memory-card/card-sizes.json',JSON.stringify(metrics,null,2)+'\n')
})
