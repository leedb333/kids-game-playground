import {test,expect,type Page} from '@playwright/test'
import {spaghetti} from '../src/games/cooking/data/spaghetti'
import {sandwich} from '../src/games/cooking/data/sandwich'
import {skewer} from '../src/games/cooking/data/skewer'
import {freshMeal,mealReducer,validMeal} from '../src/games/cooking/meal/model'
import {cookingKey} from '../src/games/cooking/hooks/useCooking'
const key=(r=spaghetti)=>'kids-game-playground:v1:'+cookingKey(r)
async function enter(page:Page,title:string){await page.goto('./');await page.getByRole('button',{name:'요리놀이',exact:true}).click();await page.getByRole('button',{name:new RegExp(title)}).click()}
async function at(page:Page,x:number,y:number){return page.locator('[data-meal-surface]>.meal-scene').evaluate((svg,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);return {x:q.x,y:q.y}},{x,y})}
async function drag(page:Page,from:{x:number;y:number},to:{x:number;y:number}){await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up()}
async function ingredient(page:Page,name:string,x=380,y=245){const b=await page.getByRole('button',{name,exact:true}).boundingBox();await drag(page,{x:b!.x+b!.width/2,y:b!.y+b!.height/2},await at(page,x,y))}
async function tool(page:Page,name:string){const b=await page.getByRole('button',{name:name+' 가져오기'}).boundingBox();await drag(page,{x:b!.x+b!.width/2,y:b!.y+b!.height/2},await at(page,380,245));await expect(page.locator('.meal-equipped')).toHaveCount(1)}
async function stir(page:Page,n:number){for(let i=0;i<n;i++)await drag(page,await at(page,320,220),await at(page,420,270))}
async function homeFresh(page:Page,id:string){await page.getByRole('button',{name:'요리 선택',exact:true}).click();await expect(page.locator(`.recipe-${id} .cook-recipe-start`)).toHaveText('만들기 시작 →')}

test('meal storage validation, per-unit caps and independent recipes',()=>{
 for(const recipe of [spaghetti,sandwich,skewer]){const s=freshMeal(recipe);expect(validMeal(s,recipe)).toBe(true);for(const bad of [null,{}, {...s,recipeId:'pizza'},{...s,step:99},{...s,cuts:null},{...s,garnish:[{id:'parsley',x:NaN,y:10}]}])expect(validMeal(bad,recipe)).toBe(false)}
 for(const recipe of [sandwich,skewer]){let s=mealReducer(freshMeal(recipe),{type:'count',count:3},recipe);for(let unit=0;unit<3;unit++)for(let j=0;j<10;j++)s=mealReducer(s,{type:'place',id:recipe.ingredients[j%recipe.ingredients.length].id,unit},recipe);expect(s.units.map(u=>u.length)).toEqual(Array(3).fill(recipe.id==='sandwich'?7:5));expect(validMeal(s,recipe)).toBe(true);expect(validMeal({...s,units:[...s.units,['unknown']]},recipe)).toBe(false);const before=s.units[0];s=mealReducer(s,{type:'undo'},recipe);expect(s.units[0]).toEqual(before);expect(s.units[2]).toHaveLength(recipe.id==='sandwich'?6:4)}
 expect(new Set([spaghetti,sandwich,skewer].map(cookingKey)).size).toBe(3)
})

test('spaghetti touch and drag from pot to cream sauce and finished garnish',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await enter(page,'스파게티 만들기');await ingredient(page,'면');await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeDisabled();await tool(page,'젓가락');await stir(page,5);await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled();await page.screenshot({path:'docs/cooking-meals/spaghetti-boil.png',fullPage:true});await page.getByRole('button',{name:'다음 →',exact:true}).click()
 await ingredient(page,'양파',250,230);await ingredient(page,'토마토',510,230);await tool(page,'칼');for(const name of ['양파','토마토'])for(let i=0;i<2;i++)await page.getByRole('button',{name:name+' 썰기',exact:true}).click();await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled();await page.screenshot({path:'docs/cooking-meals/spaghetti-chop.png',fullPage:true})
 await page.reload();await page.getByRole('button',{name:'요리놀이',exact:true}).click();await expect(page.locator('.recipe-spaghetti')).toContainText('이어서 만들기');await page.getByRole('button',{name:/스파게티 만들기/}).click();await page.getByRole('button',{name:'다음 →',exact:true}).click()
 for(const name of ['면','양파','토마토'])await ingredient(page,name);await tool(page,'젓가락');await stir(page,1);await expect(page.locator('.meal-saute-motion')).toBeVisible();await expect(page.getByRole('button',{name:'크림소스',exact:true})).toBeEnabled({timeout:6000});await page.getByRole('button',{name:'크림소스',exact:true}).click();await stir(page,3);await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled();await page.screenshot({path:'docs/cooking-meals/spaghetti-saute.png',fullPage:true});await page.getByRole('button',{name:'다음 →',exact:true}).click()
 for(const name of ['파슬리','치즈가루','후추'])await ingredient(page,name,330,235);await expect(page.locator('[data-garnish]')).toHaveCount(3);await page.getByRole('button',{name:'완성하기',exact:true}).click();await expect(page.locator('.cook-completion')).toBeVisible();await page.screenshot({path:'docs/cooking-meals/spaghetti-complete.png',fullPage:true});await homeFresh(page,'spaghetti');await page.getByRole('button',{name:/스파게티 만들기/}).click();await expect(page.locator('[aria-current=step]')).toContainText('면 삶기');await expect(page.locator('[data-garnish]')).toHaveCount(0)
})

test('three sandwiches: independent layers, cap, undo, toast lid and fresh start',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await enter(page,'샌드위치 만들기');await page.getByRole('button',{name:'3개 만들기'}).click();await expect(page.locator('.cook-steps')).toHaveCount(0)
 for(let unit=0;unit<3;unit++){for(const i of sandwich.ingredients){await page.getByRole('button',{name:i.name,exact:true}).click();await page.locator(`[data-meal-target="${unit}"]`).click()}await page.locator(`[data-meal-target="${unit}"]`).click()}
 await expect(page.locator('[data-sandwich-layer]')).toHaveCount(21);await page.getByRole('button',{name:/마지막 재료 빼기/}).click();await expect(page.locator('[data-sandwich-layer]')).toHaveCount(20);await ingredient(page,'토마토',600,260);await expect(page.locator('[data-sandwich-layer]')).toHaveCount(21);await page.screenshot({path:'docs/cooking-meals/sandwich-stack.png',fullPage:true})
 await page.getByRole('button',{name:'완성하기',exact:true}).click();await expect(page.locator('.meal-top-bread')).toHaveCount(3);await page.waitForTimeout(750);await page.screenshot({path:'docs/cooking-meals/sandwich-complete.png',fullPage:true});await homeFresh(page,'sandwich');await page.getByRole('button',{name:/샌드위치 만들기/}).click();await expect(page.getByRole('button',{name:'1개 만들기'})).toBeVisible();await page.getByRole('button',{name:'1개 만들기'}).click();await expect(page.locator('[data-sandwich-layer]')).toHaveCount(0)
})

test('camp skewers drag, grill, automatic finish and per-recipe save isolation',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await enter(page,'꼬치구이 만들기');await page.getByRole('button',{name:'3개 만들기'}).click();for(let unit=0;unit<3;unit++)for(let j=0;j<5;j++)await ingredient(page,skewer.ingredients[(j+unit)%6].name,unit*250+130,230)
 await expect(page.locator('[data-skewer-ingredient]')).toHaveCount(15);await ingredient(page,'고기',130,230);await expect(page.locator('[data-skewer-ingredient]')).toHaveCount(15);await page.screenshot({path:'docs/cooking-meals/skewer-thread.png',fullPage:true});await page.getByRole('button',{name:'완성하기',exact:true}).click();await expect(page.locator('.meal-camp-fire')).toBeVisible();await page.screenshot({path:'docs/cooking-meals/skewer-grilling.png',fullPage:true});await expect(page.locator('.cook-completion')).toBeVisible({timeout:6000});await page.screenshot({path:'docs/cooking-meals/skewer-complete.png',fullPage:true});await homeFresh(page,'skewer')
 await page.getByRole('button',{name:/샌드위치 만들기/}).click();await page.getByRole('button',{name:'2개 만들기'}).click();await ingredient(page,'햄',260,250);await page.getByRole('button',{name:'← 요리 선택',exact:true}).click();await expect(page.locator('.recipe-sandwich')).toContainText('이어서 만들기');await expect(page.locator('.recipe-skewer')).toContainText('만들기 시작');await page.getByRole('button',{name:/샌드위치 만들기/}).click();await expect(page.locator('[data-sandwich-layer]')).toHaveCount(1)
})

for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`three meal layouts ${name}`,async({page})=>{
 await page.setViewportSize({width,height});for(const recipe of [spaghetti,sandwich,skewer]){await enter(page,recipe.title);if(recipe.id!=='spaghetti'){await page.getByRole('button',{name:'3개 만들기'}).click();await page.getByRole('button',{name:recipe.ingredients[0].name,exact:true}).click();await page.locator('[data-meal-target="1"]').click()}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const b of await page.locator('.meal-workshop button:visible').all()){const box=await b.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(48);expect(box!.width).toBeGreaterThanOrEqual(48)}if(width===1280)expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);await page.screenshot({path:`docs/cooking-meals/${recipe.id}-${name}.png`,fullPage:true})}
})

test('keyboard spaghetti and blocked storage remain playable',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('blocked')}});await enter(page,'스파게티 만들기');await expect(page.getByText('지금은 저장할 수 없어요',{exact:true})).toBeVisible();await page.getByRole('button',{name:'면',exact:true}).press('Enter');await page.locator('[data-meal-target=dish]').press('Enter');await page.getByRole('button',{name:'젓가락 가져오기'}).press('Enter');await page.locator('[data-meal-target=dish]').press('Enter');for(let i=0;i<5;i++)await page.locator('[data-meal-target=dish]').press('Enter');await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled();await page.getByRole('button',{name:/소리/}).click();await expect(page.getByRole('button',{name:/소리/})).toHaveAttribute('aria-pressed','false')
})

test('phone touch selection works across separate panels and the cooking surface',async({page})=>{
 await page.setViewportSize({width:360,height:800});await enter(page,'스파게티 만들기');await page.getByRole('button',{name:'면',exact:true}).tap();await page.locator('[data-meal-surface]').scrollIntoViewIfNeeded();let p=await at(page,380,220);await page.touchscreen.tap(p.x,p.y);await page.getByRole('button',{name:'젓가락 가져오기'}).tap();await page.locator('[data-meal-surface]').scrollIntoViewIfNeeded();p=await at(page,380,220);await page.touchscreen.tap(p.x,p.y);await stir(page,5);await expect(page.getByRole('button',{name:'다음 →',exact:true})).toBeEnabled()
})

test('short tablet sauce panel stays inside the screen',async({page})=>{
 const state={...freshMeal(spaghetti),step:2,boiled:true,boilStirs:5,board:['onion','tomato'],cuts:{onion:2,tomato:2},pan:['noodle','onion','tomato'],sauteReady:true};await page.addInitScript(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:key(),state});await page.setViewportSize({width:1280,height:720});await enter(page,'스파게티 만들기');expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);await page.screenshot({path:'docs/cooking-meals/spaghetti-sauce-tablet-16x9.png',fullPage:true})
})

test('offline saved grill resumes; old pizza and coloring data are untouched',async({page,context})=>{
 await page.goto('./');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);const state={...freshMeal(skewer),count:2,units:[['shrimp'],['meat']],heatUntil:Date.now()+1500}
 await page.evaluate(({key,state})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('kids-game-playground:v1:game:coloring:keep','keep');localStorage.setItem('kids-game-playground:v1:game:cooking:pizza:r2','keep')},{key:key(skewer),state});await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'요리놀이',exact:true}).click();await page.getByRole('button',{name:/꼬치구이 만들기/}).click();await expect(page.locator('.cook-completion')).toBeVisible({timeout:6000});expect(await page.evaluate(()=>localStorage.getItem('kids-game-playground:v1:game:coloring:keep'))).toBe('keep');expect(await page.evaluate(()=>localStorage.getItem('kids-game-playground:v1:game:cooking:pizza:r2'))).toBe('keep');await homeFresh(page,'skewer');await context.setOffline(false)
})
