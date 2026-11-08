import {test,expect} from '@playwright/test'
import {availableItems,categoriesFor,characters,seasons} from '../src/games/dressup/data'
import {dressKey} from '../src/games/dressup/model'

for(const season of seasons)test(`hidden scrollbar: touch controls reach every ${season.id} item for every character/category`,async({page})=>{
 test.setTimeout(120000)
 await page.setViewportSize({width:1280,height:800});await page.goto('./');await page.getByRole('button',{name:'코디놀이',exact:true}).click();await page.locator(`.dress-season.${season.id}`).click()
 // Android may hide native scrollbars. Navigation must remain visible and usable.
 await page.addStyleTag({content:'.dress-items{scrollbar-width:none!important}.dress-items::-webkit-scrollbar{display:none!important}'})
 for(const character of characters){
  await page.locator(`[data-character-target=${character.id}]`).click()
  for(const category of categoriesFor(character.id)){
   await page.getByRole('tab',{name:category.short,exact:true}).click()
   const panel=page.locator('.dress-items'),up=page.getByRole('button',{name:'옷장 위로 보기',exact:true}),down=page.getByRole('button',{name:'옷장 아래로 보기',exact:true})
   await expect(up).toBeDisabled();await expect(up).toBeVisible();await expect(down).toBeVisible()
   const seen=new Set<string>();let pages=0
   while(true){
    for(const id of await panel.evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll<HTMLElement>('[data-item-drag]')].filter(item=>{const b=item.getBoundingClientRect();return Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top)>=24}).map(item=>item.dataset.itemDrag!)}))seen.add(id)
    if(await down.isDisabled())break
    expect(++pages).toBeLessThan(50);await down.tap();await expect.poll(()=>down.isDisabled()).toBe(await panel.evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1))
   }
   const items=availableItems(character.id,category.id,season.id)
   expect([...seen].sort()).toEqual(items.map(item=>item.itemId).sort())
   const last=items.at(-1)!,art=page.locator(`[data-item-drag="${last.itemId}"]`),a=(await art.boundingBox())!,r=(await panel.boundingBox())!
   // Touch the last item's visible artwork, without scrollIntoView or wheel input.
   await page.touchscreen.tap(a.x+a.width/2,(Math.max(a.y,r.y)+Math.min(a.y+a.height,r.y+r.height))/2)
   await expect.poll(()=>page.evaluate(({key,character,slot})=>JSON.parse(localStorage.getItem(key)!).looks[character][slot],{key:'kids-game-playground:v1:'+dressKey,character:character.id,slot:last.equipSlot})).toBe(last.itemId)
   if(pages){await up.tap();await expect(down).toBeEnabled()}
  }
 }
 await page.screenshot({path:`docs/wardrobe-navigation/${season.id}-tablet.png`,fullPage:true})
})

for(const [name,width,height] of [['short-tablet',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`wardrobe controls fit and reach the last item: ${name}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto('./');await page.getByRole('button',{name:'코디놀이',exact:true}).click();await page.locator('.dress-season.winter').click()
 const down=page.getByRole('button',{name:'옷장 아래로 보기',exact:true}),up=page.getByRole('button',{name:'옷장 위로 보기',exact:true});await down.scrollIntoViewIfNeeded()
 for(const button of [up,down]){const box=(await button.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(48);expect(box.height).toBeGreaterThanOrEqual(48)}
 let count=0;while(!await down.isDisabled()){expect(++count).toBeLessThan(50);await down.tap();await expect.poll(()=>down.isDisabled()).toBe(await page.locator(".dress-items").evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1))}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 const panel=page.locator('.dress-items');expect(await panel.evaluate(el=>el.clientHeight)).toBeGreaterThan(48)
 await expect(page.locator('.dress-item').last()).toBeInViewport()
 await page.screenshot({path:`docs/wardrobe-navigation/${name}.png`,fullPage:true})
})
