import {test,expect,type Page} from '@playwright/test'
import {freshDress,dressKey,restoreDress,dressReducer,validDress} from '../src/games/dressup/model'
import {availableItems,categoriesFor} from '../src/games/dressup/data'
const key='kids-game-playground:v1:'+dressKey
async function enter(page:Page){await page.goto('./');await page.getByRole('button',{name:'코디놀이',exact:true}).click();await page.locator('.dress-season.spring').click()}
async function drag(page:Page,id:string,target:'boy'|'dog'){
 const b=(await page.locator(`[data-item-drag=${id}]`).boundingBox())!,t=(await page.locator(`[data-character-target=${target}]`).boundingBox())!
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:12})
}
test('version 2 migration keeps human looks and history, collapsing dog clothes with explicit priority',()=>{
 const human={top:'sky-shirt',bottom:'blue-jeans',headwear:'mint-cap'}
 for(const [legacy,expected] of [[{top:'dog-tee',bottom:'dog-shorts'},'dog-tee'],[{bottom:'dog-shorts'},'dog-allinone'],[{bottom:'dog-waist'},'dog-harness'],[{dogOutfit:'dog-allinone'},'dog-allinone']] as const){
  const looks={boy:human,girl:{onepiece:'flower-dress'},dog:{...legacy,headwear:'dog-cap',eyewear:'dog-glasses',footwear:'dog-boots'}},old={version:2,season:'spring',looks,history:[looks],selected:'dog',photo:false},before=JSON.stringify(old),s=restoreDress(old)
  expect(validDress(s)).toBe(true);expect(s.version).toBe(4);expect(s.looks.boy).toEqual(human);expect(s.looks.dog).toEqual({dogOutfit:expected,dogHeadwear:'dog-cap',dogEyewear:'dog-glasses',dogFootwear:'dog-boots'});expect(s.history).toEqual([s.looks]);expect(JSON.stringify(old)).toBe(before)
 }
 let s=freshDress();for(const item of availableItems('dog','outfit')){s=dressReducer(s,{type:'equip',character:'dog',itemId:item.itemId});expect(s.looks.dog).toEqual({dogOutfit:item.itemId})}
 s=dressReducer(s,{type:'random',character:'dog',random:()=>.1});expect(Object.keys(s.looks.dog).sort()).toEqual(['dogFootwear','dogHeadwear','dogOutfit']);expect(categoriesFor('dog')).toHaveLength(3);expect(categoriesFor('boy')).toHaveLength(4)
})
test('dog wardrobe has three tabs and switching from human bottoms safely opens dog clothes',async({page})=>{
 await enter(page);await expect(page.getByRole('tab')).toHaveCount(4);await page.getByRole('tab',{name:'하의',exact:true}).click();await page.locator('[data-character-target=dog]').click();await expect(page.getByRole('tab')).toHaveCount(3);await expect(page.getByRole('tab',{name:'강아지 옷'})).toHaveAttribute('aria-selected','true');await expect(page.locator('.dress-item')).toHaveCount(availableItems('dog','outfit').length)
 await page.getByRole('tab',{name:'강아지 옷'}).press('End');await expect(page.getByRole('tab',{name:'신발',exact:true})).toBeFocused();await page.getByRole('tab',{name:'신발',exact:true}).press('ArrowRight');await expect(page.getByRole('tab',{name:'모자·안경'})).toBeFocused();await page.locator('[data-character-target=boy]').click();await expect(page.getByRole('tab')).toHaveCount(4)
})
test('dog live drag fits before release, replaces outfits and rejects a human target',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await enter(page);await page.locator('[data-character-target=dog]').click();await page.getByRole('tab',{name:'강아지 옷'}).click();await drag(page,'dog-tee','dog');const live=page.locator('.dress-live-fitting [data-equipped-item=dog-tee]');await expect(live).toHaveCount(1);expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).looks.dog,key)).toEqual({});const before=(await live.boundingBox())!;await page.mouse.up();const actual=page.locator('.dress-canvas [data-character-art=dog] [data-equipped-item=dog-tee]');await expect(actual).toHaveCount(1);const after=(await actual.boundingBox())!;expect(after.x).toBeCloseTo(before.x,2);expect(after.y).toBeCloseTo(before.y,2)
 await drag(page,'dog-knit','boy');await expect(page.locator('.dress-live-fitting')).toHaveCount(0);await page.mouse.up();await expect(page.locator('.dress-canvas [data-character-art=boy] [data-equipped-item]')).toHaveCount(0);await expect(actual).toHaveCount(1)
 await drag(page,'dog-vest','dog');await page.mouse.up();await expect(page.locator('.dress-canvas [data-character-art=dog] [data-slot=dogOutfit]')).toHaveAttribute('data-equipped-item','dog-vest');await page.getByRole('button',{name:'되돌리기',exact:true}).click();await expect(actual).toHaveCount(1)
 await page.reload();await page.getByRole('button',{name:'코디놀이',exact:true}).click();await page.locator('.dress-season.spring').click();await expect(actual).toHaveCount(1)
})
for(const [name,width,height] of [['tablet',1280,800],['tablet-16x9',1280,720],['phone',360,800],['small-phone',320,640],['phone-landscape',800,360]] as const)test(`dog wardrobe screenshot ${name}`,async({page})=>{
 const s=freshDress();s.selected='dog';s.looks={boy:{top:'sky-shirt',bottom:'blue-jeans',footwear:'cream-sneakers'},girl:{onepiece:'flower-dress',headwear:'flower-band',footwear:'rose-sandals'},dog:{dogHeadwear:'dog-cap',dogEyewear:'dog-glasses',dogOutfit:'dog-tee',dogFootwear:'dog-sneakers'}}
 await page.addInitScript(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key,s});await page.setViewportSize({width,height});await enter(page);await page.getByRole('tab',{name:'강아지 옷'}).click();await expect(page.getByRole('tab')).toHaveCount(3);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===1280)expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true)
 await page.screenshot({path:`docs/dressup-seasons/dog-${name}.png`,fullPage:true})
})
test('dog garment closeups show all five fitted silhouettes plus the natural base',async({page})=>{
 await enter(page);await page.locator('[data-character-target=dog]').click();await page.getByRole('tab',{name:'강아지 옷'}).click();const frames:{name:string;svg:string}[]=[]
 for(const item of [null,...availableItems('dog','outfit')]){
  while(await page.locator('.dress-item[aria-pressed=true]').count())await page.locator('.dress-item[aria-pressed=true]').first().press('Enter')
  if(item)await page.getByRole('button',{name:item.name+' 입히기',exact:true}).press('Enter')
  const svg=await page.locator('.dress-canvas [data-character-art=dog]>.dress-character-art').evaluate(g=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 220 320 300');svg.setAttribute('width','640');svg.setAttribute('height','600');svg.append(g.cloneNode(true));return new XMLSerializer().serializeToString(svg)})
  frames.push({name:item?.name??'두부 · 기본 자세',svg})
 }
 const encoded=await page.evaluate(async frames=>{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=Math.ceil(frames.length/3)*380;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#f8f1e2';ctx.fillRect(0,0,1200,canvas.height);for(let i=0;i<frames.length;i++){const img=new Image(),url=URL.createObjectURL(new Blob([frames[i].svg],{type:'image/svg+xml'}));try{img.src=url;await img.decode();const x=i%3*400,y=Math.floor(i/3)*380;ctx.fillStyle='#fffaf1';ctx.fillRect(x+6,y+6,388,368);ctx.drawImage(img,x,y+5,400,375);ctx.fillStyle='#795f50';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText(frames[i].name,x+200,y+355)}finally{URL.revokeObjectURL(url)}}return canvas.toDataURL('image/png').split(',')[1]},frames)
 const {writeFile}=await import('node:fs/promises');await writeFile('docs/dressup-seasons/dog-closeups.png',Buffer.from(encoded,'base64'))
})

test('native phone touch drag dresses the dog while the clothes list remains in place',async({page})=>{
 await page.setViewportSize({width:360,height:800});await enter(page);await page.locator('[data-character-target=dog]').click();await page.getByRole('tab',{name:'강아지 옷'}).click()
 const source=page.locator('[data-item-drag=dog-tee]'),b=(await source.boundingBox())!,t=(await page.locator('[data-character-target=dog]').boundingBox())!,from={x:b.x+b.width/2,y:b.y+b.height/2},to={x:t.x+t.width/2,y:t.y+t.height*.7},cdp=await page.context().newCDPSession(page)
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12}]})
 await expect(page.locator('.dress-live-fitting [data-equipped-item=dog-tee]')).toHaveCount(1);await expect(source).toBeVisible();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await expect(page.locator('.dress-canvas [data-character-art=dog] [data-equipped-item=dog-tee]')).toHaveCount(1);await expect(page.locator('.dress-drag-ghost')).toHaveCount(0)
})
