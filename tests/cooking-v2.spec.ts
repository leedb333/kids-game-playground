import {test,expect,type Page} from '@playwright/test'
import {fresh,place,toppings,undo,restore,inside,storageKey,type State} from '../src/games/cooking-v2/model'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
test.setTimeout(60000)
const route='prototypes/cooking-v2/'
async function open(page:Page){await page.goto(route);await expect(page.locator('.cv2-app')).toHaveAttribute('data-loaded','true')}
async function pos(page:Page,x=512,y=512){const b=(await page.locator('canvas').boundingBox())!;return {x:b.x+x/1024*b.width,y:b.y+y/1024*b.height}}
async function tap(page:Page,x=512,y=512){const p=await pos(page,x,y);await page.touchscreen.tap(p.x,p.y)}
async function paint(page:Page){const b=(await page.locator('canvas').boundingBox())!;for(let y=200;y<=820;y+=100){await page.mouse.move(b.x+120/1024*b.width,b.y+y/1024*b.height);await page.mouse.down();await page.mouse.move(b.x+910/1024*b.width,b.y+y/1024*b.height,{steps:14});await page.mouse.up()}await expect(page.locator('canvas')).toHaveAttribute('data-coverage',/0\.[7-9]|1\.0000/)}
async function topping(page:Page){await paint(page);await page.getByRole('button',{name:'토핑 올리기 →'}).click();await expect(page.locator('.cv2-app')).toHaveAttribute('data-step','topping')}
test('model: repeated placement, per-item state, collision rejection, move/remove and gesture undo',()=>{
 let s:State={...fresh(),step:'topping'};s=place(s,'pepperoni',{x:400,y:450});s=place(s,'mushroom',{x:600,y:550});expect(toppings(s)).toHaveLength(2);expect(place(s,'pepperoni',{x:0,y:0})).toBe(s)
 expect(new Set(toppings(s).map(t=>t.rotation)).size).toBe(2);s=place(s,'cheese',{x:512,y:512});expect(toppings(s).filter(t=>t.kind==='cheese')).toHaveLength(10)
 s={...s,actions:[...s.actions,{kind:'move',id:1,x:500,y:500},{kind:'remove',id:2}]};expect(toppings(s).find(t=>t.id===1)?.x).toBe(500);expect(toppings(undo(s))).toHaveLength(12)
 const u={...s,actions:s.actions.map(a=>({...a,gesture:7}))};expect(undo(u).actions).toHaveLength(0);expect(restore(JSON.parse(JSON.stringify(s)))).toEqual(s);expect(restore({...s,nextId:0})).toEqual(fresh());expect(restore({...s,actions:[{kind:'sauce',points:[{x:NaN,y:4}]}]})).toEqual(fresh());expect(inside({x:512,y:512})).toBe(true)
})
test('all eight original assets preserved and browser-decodable, all derivatives load',async({page})=>{
 const audit=JSON.parse(readFileSync('docs/cooking-v2-prototype/asset-audit.json','utf8'));const originals=Object.entries(audit.originals).map(([file,entry])=>({file,...entry as object})) as {file:string;sha256:string}[]
 expect(originals).toHaveLength(8)
 for(const entry of originals){const file=entry.file;expect(createHash('sha256').update(readFileSync(`public/assets/cooking-v2/pizza/${file}`)).digest('hex')).toBe(entry.sha256)}
 await open(page);const decoded=await page.evaluate(async()=>{const files=['pizza-prep-bg','pizza-dough-flat','pizza-sauce-tomato','pizza-cheese-raw','topping-pepperoni','topping-mushroom','tool-spoon','pizza-cutting-board'];return Promise.all(files.map(async f=>{const i=new Image();i.src=`/kids-game-playground/assets/cooking-v2/pizza/${f}.png`;await i.decode();return [i.naturalWidth,i.naturalHeight]}))});expect(decoded).toHaveLength(8);expect(decoded[0]).toEqual([1672,941]);expect(decoded.slice(1).every(d=>d[0]===1254&&d[1]===1254)).toBe(true)
})
test('real texture paint clips at inner crust, coverage gate, preserved sauce, tablet screenshots',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await open(page);await expect(page.getByRole('button',{name:'토핑 올리기 →'})).toBeDisabled();await tap(page);await page.waitForTimeout(180)
 await page.screenshot({path:'docs/cooking-v2-prototype/tablet-sauce-partial.png'})
 const before=await page.locator('canvas').evaluate(c=>(()=>{const d=(c as HTMLCanvasElement).getContext('2d')!.getImageData(0,0,1200,1200).data;return Array.from({length:240*240},(_,j)=>{const i=(Math.floor(j/240)*5*1200+(j%240)*5)*4;return [d[i],d[i+1],d[i+2]]})})())
 await paint(page);await page.waitForTimeout(180)
 const differences=await page.locator('canvas').evaluate((c,before)=>{const data=(c as HTMLCanvasElement).getContext('2d')!.getImageData(0,0,1200,1200).data;let outside=0,inside=0;for(let y=0;y<1200;y+=5)for(let x=0;x<1200;x+=5){const i=(y*1200+x)*4,changed=Math.max(Math.abs(data[i]-before[y/5*240+x/5][0]),Math.abs(data[i+1]-before[y/5*240+x/5][1]),Math.abs(data[i+2]-before[y/5*240+x/5][2]))>3;const v=((x/1200*1024-512)/407)**2+((y/1200*1024-512)/392)**2;if(changed&&v>1.02)outside++;if(changed&&v<.9)inside++}return {outside,inside}},before)
 expect(differences.outside).toBe(0);expect(differences.inside).toBeGreaterThan(1000)
 await page.getByRole('button',{name:'토핑 올리기 →'}).click();await expect(page.locator('canvas')).toHaveAttribute('data-coverage',/0\.[7-9]|1\.0000/)
 await page.getByRole('button',{name:'치즈',exact:true}).tap();for(const [x,y] of [[360,350],[550,350],[710,450],[400,570],[600,650],[530,500]])await tap(page,x,y)
 await page.getByRole('button',{name:'페퍼로니',exact:true}).tap();for(const [x,y] of [[350,430],[630,360],[640,630]])await tap(page,x,y)
 await page.getByRole('button',{name:'버섯',exact:true}).tap();for(const [x,y] of [[480,340],[720,520],[400,670]])await tap(page,x,y)
 await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','6');await expect(page.locator('canvas')).toHaveAttribute('data-cheese-count','60');await page.screenshot({path:'docs/cooking-v2-prototype/tablet-toppings.png'});await page.getByRole('button',{name:'시험판 완료',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.screenshot({path:'docs/cooking-v2-prototype/tablet-complete.png'})
})
test('panel drag, tap, move, remove, undo, reload and unrelated storage preservation',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await open(page);await page.evaluate(()=>localStorage.setItem('existing-game-test','keep'));await topping(page)
 const p=await pos(page,420,420),b=(await page.getByRole('button',{name:'페퍼로니',exact:true}).boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(p.x,p.y,{steps:12});await page.mouse.up();await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','1')
 await page.getByRole('button',{name:'옮기기',exact:true}).click();await page.mouse.move(p.x,p.y);await page.mouse.down();const target=await pos(page,650,550);await page.mouse.move(target.x,target.y,{steps:8});await page.mouse.up();const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),storageKey);expect(saved.actions.at(-1).kind).toBe('move');expect(saved.actions.at(-1).x).toBeCloseTo(650,0)
 await page.getByRole('button',{name:'빼기',exact:true}).click();await tap(page,650,550);await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','0');await page.getByRole('button',{name:'되돌리기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','1');await page.reload();await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','1');expect(await page.evaluate(()=>localStorage.getItem('existing-game-test'))).toBe('keep')
})
test('cheese swiping undoes as one gesture and invalid placement does not commit',async({page})=>{
 await open(page);await topping(page);await page.getByRole('button',{name:'치즈',exact:true}).tap();const a=await pos(page,300,500),b=await pos(page,700,500);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:30});await page.mouse.up();expect(Number(await page.locator('canvas').getAttribute('data-cheese-count'))).toBeGreaterThan(30);await page.getByRole('button',{name:'되돌리기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-cheese-count','0');await page.getByRole('button',{name:'버섯',exact:true}).tap();await tap(page,20,20);await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','0')
})
for(const [name,width,height] of [['tablet-16x9',1280,720],['phone',360,800],['phone-landscape',800,360],['small-phone',320,640]] as const)test(`responsive touch: ${name}`,async({page})=>{
 await page.setViewportSize({width,height});await open(page);await topping(page);await page.getByRole('button',{name:'버섯',exact:true}).tap();await tap(page);await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','1');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 for(const selector of ['.cv2-food','.cv2-dock','.cv2-header']){const b=(await page.locator(selector).boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.y).toBeGreaterThanOrEqual(-1);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(height+1)}
 for(const b of await page.getByRole('button').all()){if(!await b.isVisible())continue;const r=(await b.boundingBox())!;expect(r.height).toBeGreaterThanOrEqual(48);expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width+1)}await page.screenshot({path:`docs/cooking-v2-prototype/${name}.png`})
})
test('offline prototype works after cache install without affecting main entry',async({page,context})=>{
 await open(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await expect(page.locator('.cv2-app')).toHaveAttribute('data-loaded','true');await tap(page);await expect(page.locator('canvas')).not.toHaveAttribute('data-coverage','0.0000');await page.goto('./');await expect(page.getByRole('heading',{name:'어린이 게임 놀이터'})).toBeVisible();await context.setOffline(false)
})
test('touch pointer dragging paints and places; pointer cancellation discards unfinished work',async({page,context})=>{
 await open(page);await topping(page);const cdp=await context.newCDPSession(page),b=(await page.getByRole('button',{name:'버섯',exact:true}).boundingBox())!,p=await pos(page,550,450)
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...p,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('canvas')).toHaveAttribute('data-topping-count','1')
 const before=await page.evaluate(k=>localStorage.getItem(k),storageKey);await page.getByRole('button',{name:'페퍼로니',exact:true}).tap();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+20,y:p.y,id:2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});expect(await page.evaluate(k=>localStorage.getItem(k),storageKey)).toBe(before)
 await page.getByRole('button',{name:'1 소스 바르기',exact:true}).click();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:3}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x-30,y:p.y,id:3}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect(JSON.parse((await page.evaluate(k=>localStorage.getItem(k),storageKey))!).actions.at(-1).kind).toBe('sauce')
})
test('reset asks first, cancellation preserves work and approval only clears prototype; storage blocked is explicit',async({page})=>{
 await open(page);await tap(page);await page.getByRole('button',{name:'새로 만들기',exact:true}).click();await page.getByRole('button',{name:'계속 만들기',exact:true}).click();await expect(page.locator('canvas')).not.toHaveAttribute('data-coverage','0.0000');await page.getByRole('button',{name:'새로 만들기',exact:true}).click();await page.getByRole('button',{name:'처음부터 만들기',exact:true}).click();await expect(page.locator('canvas')).toHaveAttribute('data-coverage','0.0000')
 await page.locator('canvas').focus();for(let i=0;i<25;i++)await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'토핑 올리기 →'})).toBeEnabled()
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('blocked')}});await page.reload();await expect(page.getByText('지금은 저장할 수 없어요. 놀이는 계속할 수 있어요.')).toBeVisible();await tap(page);await expect(page.locator('canvas')).not.toHaveAttribute('data-coverage','0.0000')
})
test('a failed food asset reports a loading problem instead of substituting drawn food',async({page})=>{
 await page.route('**/dough-*.png',route=>route.abort());await page.goto(route);await expect(page.getByText('요리 그림을 불러오지 못했어요.')).toBeVisible();await expect(page.locator('canvas')).toHaveCount(0)
})
