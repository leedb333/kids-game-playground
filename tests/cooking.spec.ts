import {test,expect,type Page} from '@playwright/test'
import {pizza} from '../src/games/cooking/data/pizza'
import {freshState,validState,cookingKey} from '../src/games/cooking/hooks/useCooking'
const key='kids-game-playground:v1:'+cookingKey(pizza)
async function enter(page:Page){await page.goto('./');await page.getByRole('button',{name:'요리놀이',exact:true}).click();await page.getByRole('button',{name:/피자 만들기/}).click()}
async function toppings(page:Page){await enter(page);await page.getByRole('button',{name:'반죽 펴기',exact:true}).last().click();await page.getByRole('button',{name:'다음 →',exact:true}).click();await page.getByRole('button',{name:'소스 넓게 바르기',exact:true}).last().click();await page.getByRole('button',{name:'다음 →',exact:true}).click()}

test('cooking validates saved data and keeps recipes independent',()=>{
 const good=freshState(pizza);expect(validState(good,pizza)).toBe(true)
 for(const bad of [null,{}, {...good,step:99},{...good,placements:[{id:1,stepId:'toppings',ingredientId:'unknown',x:300,y:240,rotation:0}]},{...good,progress:{dough:'bad'}},{...good,selected:'unknown'}])expect(validState(bad,pizza)).toBe(false)
})
test('pizza: touch, drag, undo, bake, completion, resume and reset',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await toppings(page)
 await expect(page.locator('.cook-ingredient')).toHaveCount(6)
 await page.getByRole('button',{name:'토마토',exact:true}).click()
 const touch=await page.getByRole('button',{name:'선택한 재료 올리기',exact:true}).boundingBox()
 await page.touchscreen.tap(touch!.x+touch!.width/2,touch!.y+touch!.height/2)
 await expect(page.locator('[data-topping=tomato]')).toHaveCount(1)
 const ingredient=await page.getByRole('button',{name:'버섯',exact:true}).boundingBox(),board=await page.locator('.cook-board').boundingBox()
 await page.mouse.move(ingredient!.x+ingredient!.width/2,ingredient!.y+ingredient!.height/2);await page.mouse.down();await page.mouse.move(board!.x+board!.width/2,board!.y+board!.height/2,{steps:8});await page.mouse.up()
 await expect(page.locator('[data-topping=mushroom]')).toHaveCount(1)
 await page.getByRole('button',{name:'마지막 토핑 빼기',exact:false}).click();await expect(page.locator('[data-topping=mushroom]')).toHaveCount(0)
 await page.getByRole('button',{name:'선택한 재료 올리기',exact:true}).press('Enter');await expect(page.locator('[data-topping]')).toHaveCount(2)
 await page.reload();await page.getByRole('button',{name:'요리놀이',exact:true}).click();await page.getByRole('button',{name:/피자 만들기/}).click();await expect(page.locator('[data-topping]')).toHaveCount(2)
 for(const ingredient of pizza.ingredients){await page.getByRole('button',{name:ingredient.name,exact:true}).click();for(let i=0;i<2;i++)await page.getByRole('button',{name:'선택한 재료 올리기',exact:true}).press('Enter')}
 await expect(page.locator('[data-topping]')).toHaveCount(14)
 await page.getByRole('button',{name:'다음 →',exact:true}).click();await page.getByRole('button',{name:'오븐에 넣기',exact:true}).last().click()
 await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeDisabled()
 await expect(page.locator('.oven-overlay')).toBeVisible();await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled({timeout:8000});await page.getByRole('button',{name:'다음 →',exact:true}).click()
 await expect(page.getByRole('heading',{name:'✦ 나만의 피자 완성! ✦',exact:true})).toBeVisible();await expect(page.locator('[data-topping]')).toHaveCount(14)
 await page.screenshot({path:'docs/cooking/pizza-complete-tablet.png',fullPage:true})
 await page.getByRole('button',{name:'다시 만들기',exact:false}).click();await page.getByRole('button',{name:'계속 만들기',exact:true}).click();await expect(page.locator('[data-topping]')).toHaveCount(14)
 await page.getByRole('button',{name:'다시 만들기',exact:false}).click();await page.getByRole('button',{name:'처음부터 만들기',exact:true}).click();await expect(page.locator('[data-topping]')).toHaveCount(0);await expect(page.locator('[aria-current=step]')).toContainText('반죽 준비')
})
for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`cooking layout ${name}`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});await toppings(page)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 for(const button of await page.locator('.cooking-game button:visible').all()){const b=await button.boundingBox();expect(b!.height).toBeGreaterThanOrEqual(48);expect(b!.width).toBeGreaterThanOrEqual(48)}
 await page.screenshot({path:`docs/cooking/pizza-${name}.png`,fullPage:true});expect(errors).toEqual([])
 if(width===1280){expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);const kitchen=await page.locator('.cook-kitchen').boundingBox(),panel=await page.locator('.cook-panel').boundingBox();expect(kitchen!.width/(kitchen!.width+panel!.width)).toBeGreaterThan(.67)}
})
test('cooking home: prepared cards, common sound and home navigation',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'요리놀이',exact:true}).click();await expect(page.locator('.cook-recipe:disabled')).toHaveCount(3);await page.screenshot({path:'docs/cooking/recipe-selection.png',fullPage:true});await page.getByRole('button',{name:/소리/}).click();await expect(page.getByRole('button',{name:/소리/})).toHaveAttribute('aria-pressed','false');await page.getByRole('button',{name:'홈으로 이동'}).click();await expect(page.getByRole('heading',{name:'어린이 게임 놀이터'})).toBeVisible()
})
test('cooking offline resume, interrupted oven and coloring data isolation',async({page,context})=>{
 await page.goto('./');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
 await page.evaluate(({key,state})=>{localStorage.setItem('kids-game-playground:v1:game:coloring:keep','unchanged');localStorage.setItem(key,JSON.stringify(state))},{key,state:{...freshState(pizza),step:3,progress:{dough:1,sauce:3},bakeUntil:Date.now()+2000}})
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'요리놀이',exact:true}).click();await page.getByRole('button',{name:/피자 만들기/}).click();await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled({timeout:8000});await page.getByRole('button',{name:'다음 →',exact:true}).click();await expect(page.locator('.cook-completion')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('kids-game-playground:v1:game:coloring:keep'))).toBe('unchanged');await context.setOffline(false)
})
test('cooking handles corrupt saves and blocked storage',async({page})=>{
 await page.addInitScript(key=>{localStorage.setItem(key,'{bad');Storage.prototype.setItem=()=>{throw Error('blocked')}},key)
 await enter(page);await expect(page.getByText('지금은 저장할 수 없어요',{exact:true})).toBeVisible();await page.getByRole('button',{name:'반죽 펴기',exact:true}).last().click();await page.getByRole('button',{name:'다음 →',exact:true}).click();await expect(page.locator('[aria-current=step]')).toContainText('소스 바르기')
})
