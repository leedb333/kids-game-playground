import { test, expect } from '@playwright/test'
for(const [name,width,height] of [['tablet-16x9',1280,720],['tablet',1280,800],['phone',360,800],['phone-landscape',800,360],['small-phone',320,640]] as const){
 test(name,async({page})=>{
  await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('./');await expect(page.getByRole('heading',{name:'어린이 게임 놀이터'})).toBeVisible()
  await expect(page.locator('.card:disabled')).toHaveCount(6)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  for(const card of await page.locator('.card').all()){const box=await card.boundingBox();expect(box!.width).toBeGreaterThan(48);expect(box!.height).toBeGreaterThan(48)}
  const sound=page.getByRole('button',{name:/소리/});await sound.click();await expect(sound).toHaveAttribute('aria-pressed','false');await page.reload();await expect(sound).toHaveAttribute('aria-pressed','false')
  await page.getByRole('button',{name:'홈으로 이동'}).click();await expect(page.getByRole('heading',{level:1})).toBeFocused()
  await page.screenshot({path:`docs/screenshots/${name}.png`,fullPage:true});expect(errors).toEqual([])
 })
}
test('offline shell and scoped settings',async({page,context})=>{
 await page.goto('./');await page.evaluate(()=>{localStorage.setItem('old-coloring-app','keep');return navigator.serviceWorker.ready})
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
 await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{level:1})).toBeVisible()
 await page.getByRole('button',{name:/소리/}).click();expect(await page.evaluate(()=>localStorage.getItem('old-coloring-app'))).toBe('keep')
 await context.setOffline(false)
})
test('keyboard and blocked storage',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked')}})
 await page.goto('./');await expect(page.getByRole('heading',{level:1})).toBeVisible();await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'게임 목록으로 건너뛰기'})).toBeFocused()
 await page.getByRole('button',{name:/소리/}).click();await expect(page.getByRole('status')).toContainText('저장할 수 없어요')
})
