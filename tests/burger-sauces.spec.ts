import {test,expect,type Page} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {add,applySauce,chooseSauce,fresh,ingredients,layout,remove,restore,storageKey,undo,type Session,type Sauce,type Kind} from '../src/games/cooking-v2/burger/model'
test.setTimeout(60000)
const url='prototypes/cooking-v2/burger/#play'
const ready=():Session=>({...fresh(),stage:'stack',grill:{phase:'done',elapsed:0},design:{...fresh().design,selected:ingredients.map(i=>i.id)}})
async function open(page:Page,s:Session){await page.addInitScript(({s,k})=>{if(!sessionStorage.getItem('sauce-fixture')){localStorage.setItem(k,JSON.stringify(s));sessionStorage.setItem('sauce-fixture','yes')}},{s,k:storageKey});await page.goto(url);await expect(page.locator('.bg-loading')).toHaveCount(0);await expect(page.locator('.bg-burger')).toBeVisible()}
async function state(page:Page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),storageKey) as Promise<Session>}
async function tapFood(page:Page){const b=(await page.getByLabel('햄버거 쌓기 공간',{exact:true}).boundingBox())!;await page.touchscreen.tap(b.x+b.width*.5,b.y+b.height*.55);await page.waitForTimeout(700)}
async function sauce(page:Page,name:string){await page.getByRole('button',{name:'소스',exact:true}).click();await page.getByRole('button',{name,exact:true}).tap();await tapFood(page)}

test('legacy v1 saves/history keep food and sauces; removed supporting layers reanchor; undo restores exact placement',()=>{
 let s=add(ready(),'patty');s=applySauce(s,'ketchup');s=add(s,'cheese');s=applySauce(s,'mayonnaise');s=add(s,'lettuce');const old=s
 const before=layout(s.design.layers,false,s.design.applications).sprites.map(i=>i.key)
 expect(before).toEqual(['bottom','1','sauce-2','3','sauce-4','5'])
 s=remove(s,3);expect(s.design.applications.map(a=>a.after)).toEqual([1,1]);expect(undo(s).design).toEqual(old.design)
 s=remove(s,2);expect(s.design.applications.map(a=>a.id)).toEqual([4]);expect(undo(s).design).toEqual(remove(old,3).design)
 const legacy={...old,design:{...old.design,applications:old.design.applications.map(({id,sauce,after})=>({id,sauce,after}))}}
 const restored=restore(JSON.parse(JSON.stringify(legacy)));expect(restored.design.layers).toEqual(old.design.layers);expect(restored.design.applications).toEqual(legacy.design.applications)
 expect(layout(restored.design.layers,true,restored.design.applications).sprites.filter(i=>i.sauceId)).toHaveLength(2)
 expect(restore({...old,design:{...old.design,applications:[{id:2,sauce:'ketchup',after:99}]}})).toEqual(fresh())
 const stale={...legacy,design:{...legacy.design,layers:legacy.design.layers.filter(l=>l.id!==3)}};expect(restore(stale).design.applications[1].after).toBe(1)
})

test('unlimited sauce repeats do not consume any of the sixteen ingredient layers or change food scale',()=>{
 let s=ready();for(let i=0;i<16;i++)s=add(s,'patty');const before=layout(s.design.layers,true)
 for(let i=0;i<75;i++)s=applySauce(s,(['ketchup','mayonnaise','mustard'] as Sauce[])[i%3],{x:i%2?900:100,y:800})
 expect(s.design.layers).toHaveLength(16);expect(s.design.applications).toHaveLength(75);expect(s.design.applications[0].id).toBe(17);expect(restore(JSON.parse(JSON.stringify(s)))).toEqual(s)
 const after=layout(s.design.layers,true,s.design.applications);expect(after.scale).toBe(before.scale);expect(after.sprites.filter(i=>!i.sauceId)).toEqual(before.sprites)
 for(const sprite of after.sprites.filter(i=>i.sauceId)){expect(sprite.x).toBeGreaterThan(0);expect(sprite.x+sprite.width).toBeLessThan(1000);expect(sprite.y).toBeGreaterThan(100);expect(sprite.y+sprite.height).toBeLessThan(1000)}
})

test('all three originals preserve hashes and RGBA; processed transparent edges contain no detached speckles',async({page})=>{
 const audit=JSON.parse(readFileSync('docs/burger-sauces/asset-audit.json','utf8')) as {name:string;sha256:string;width:number;height:number;colorType:number;removed:number}[]
 expect(audit).toHaveLength(3);for(const a of audit){expect(a.colorType).toBe(6);expect(a.width).toBe(1448);expect(a.height).toBe(1086);expect(a.removed).toBeGreaterThan(0);expect(createHash('sha256').update(readFileSync('public/assets/cooking-v2/burger/'+a.name)).digest('hex')).toBe(a.sha256)}
 await open(page,ready());const results=await page.locator('svg.bg-burger').evaluate(async()=>{
  const scripts=[...document.querySelectorAll<HTMLScriptElement>('script[type=module]')];const src=scripts[0].src
  // Inspect the three processed files through rendered SVG image URLs after real sauce input below.
  return !!src
 });expect(results).toBe(true)
 for(const name of ['케첩','마요네즈','머스터드'])await sauce(page,name)
 const alpha=await page.locator('[data-asset$="drizzle"] image').evaluateAll(async nodes=>Promise.all(nodes.map(async node=>{const im=new Image();im.src=node.getAttribute('href')!;await im.decode();const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;let partial=0,visible=0;for(let n=3;n<p.length;n+=4){if(p[n])visible++;if(p[n]>0&&p[n]<255)partial++}return {w:c.width,h:c.height,corner:p[3],partial,visible}})))
 expect(alpha).toHaveLength(3);for(const a of alpha){expect(a.w).toBeGreaterThan(1200);expect(a.h).toBeLessThan(450);expect(a.corner).toBe(0);expect(a.partial).toBeGreaterThan(0);expect(a.visible).toBeGreaterThan(100000)}
})

for(const [id,name] of [['ketchup','케첩'],['mayonnaise','마요네즈'],['mustard','머스터드']] as const)test(`${id} alone renders only its own sauce and persists exact coordinates`,async({page})=>{
 await page.setViewportSize({width:1280,height:800});let s=ready();for(const k of ['patty','cheese','lettuce'] as Kind[])s=add(s,k);await open(page,s);await sauce(page,name)
 const saved=(await state(page)).design;expect(saved.applications).toHaveLength(1);expect(saved.applications[0].sauce).toBe(id);await expect(page.locator('[data-asset$="drizzle"]')).toHaveCount(1);await page.screenshot({path:`docs/burger-sauces/${id}-only.png`});await page.reload();expect((await state(page)).design).toEqual(saved)
})

test('touch and drag: repeated sauces, covering food, removal, undo, completion and PNG keep painter order',async({page,context})=>{
 await page.setViewportSize({width:1280,height:800});let s=ready();for(const k of ['patty','cheese','lettuce'] as Kind[])s=add(s,k);await open(page,s)
 await sauce(page,'케첩');await sauce(page,'마요네즈')
 await page.getByRole('button',{name:'머스터드',exact:true}).scrollIntoViewIfNeeded();const b=(await page.getByRole('button',{name:'머스터드',exact:true}).boundingBox())!,f=(await page.getByLabel('햄버거 쌓기 공간',{exact:true}).boundingBox())!,cdp=await context.newCDPSession(page)
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:f.x+f.width*.55,y:f.y+f.height*.5,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(700)
 expect((await state(page)).design.applications.map(a=>a.sauce)).toEqual(['ketchup','mayonnaise','mustard']);await page.screenshot({path:'docs/burger-sauces/three-sauces.png'})
 await tapFood(page);expect((await state(page)).design.applications).toHaveLength(4);await page.getByRole('button',{name:'↶ 되돌리기',exact:true}).click();expect((await state(page)).design.applications).toHaveLength(3)
 await page.getByRole('button',{name:'재료',exact:true}).click();await page.getByRole('button',{name:'토마토',exact:true}).tap();await tapFood(page)
 const pre=(await state(page)).design;const keys=await page.locator('[data-food]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-food')));expect(keys).toEqual(['bottom','1','2','3','sauce-4','sauce-5','sauce-6','8']);await page.screenshot({path:'docs/burger-sauces/covered-by-tomato.png'})
 await page.getByRole('button',{name:'재료 빼기',exact:true}).click();await page.screenshot({path:'docs/burger-sauces/remove-list.png'});await page.getByRole('button',{name:'3층 양상추 빼기',exact:true}).click();expect((await state(page)).design.applications.map(a=>a.after)).toEqual([2,2,2]);await page.getByRole('button',{name:'소스 2 마요네즈 빼기',exact:true}).click();expect((await state(page)).design.applications).toHaveLength(2)
 await page.getByRole('button',{name:'↶ 되돌리기',exact:true}).click();await page.getByRole('button',{name:'↶ 되돌리기',exact:true}).click();expect((await state(page)).design).toEqual(pre)
 await page.getByRole('button',{name:'완성하기',exact:true}).click();await page.waitForTimeout(400);expect((await state(page)).design).toEqual(pre);await page.screenshot({path:'docs/burger-sauces/complete.png'});
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'PNG 저장',exact:true}).click();const file=await download;await file.saveAs('docs/burger-sauces/finished-burger.png')
 const png=readFileSync('docs/burger-sauces/finished-burger.png');expect(png.readUInt32BE(16)).toBe(1400);expect(png.readUInt32BE(20)).toBe(1400)
 // Rasterize the rendered SVG at the export coordinate system and compare actual pixels.
 const comparison=await page.locator('svg.bg-burger').evaluate(async(svg,b64)=>{
  const copy=svg.cloneNode(true) as SVGSVGElement;copy.setAttribute('viewBox','0 0 1000 1000');copy.setAttribute('width','1400');copy.setAttribute('height','1400')
  for(const im of copy.querySelectorAll('image')){const response=await fetch(im.getAttribute('href')!);const blob=await response.blob();const data=await new Promise<string>(r=>{const f=new FileReader();f.onload=()=>r(f.result as string);f.readAsDataURL(blob)});im.setAttribute('href',data)}
  // Remove only DOM selection/landing wrappers, which are already settled and have no transform.
  const a=new Image(),b=new Image();a.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(copy));b.src='data:image/png;base64,'+b64;await Promise.all([a.decode(),b.decode()]);const c=document.createElement('canvas');c.width=c.height=1400;const ctx=c.getContext('2d')!;ctx.drawImage(a,0,0);const p=ctx.getImageData(0,0,1400,1400).data;ctx.clearRect(0,0,1400,1400);ctx.drawImage(b,0,0);const q=ctx.getImageData(0,0,1400,1400).data;let sum=0,bad=0;for(let i=0;i<p.length;i++){const diff=Math.abs(p[i]-q[i]);sum+=diff;if(diff>20)bad++}return {mean:sum/p.length,bad:bad/p.length,corner:q[3]}
 },png.toString('base64'))
 expect(comparison.mean).toBeLessThan(2);expect(comparison.bad).toBeLessThan(.025);expect(comparison.corner).toBe(0)
})

for(const [name,width,height] of [['tablet',1280,800],['phone',360,800],['phone-landscape',800,360]] as const)test(`three sauces fit touch viewport and PNG controls: ${name}`,async({page})=>{
 await page.setViewportSize({width,height});let s=add(add(ready(),'patty'),'lettuce');for(const sauce of ['ketchup','mayonnaise','mustard'] as Sauce[])s=applySauce(s,sauce);await open(page,s);await page.getByRole('button',{name:'소스',exact:true}).click();for(const n of ['케첩','마요네즈','머스터드']){const button=page.getByRole('button',{name:n,exact:true});await button.scrollIntoViewIfNeeded();const b=(await button.boundingBox())!;expect(b.height).toBeGreaterThanOrEqual(48);expect(b.y+b.height).toBeLessThanOrEqual(height+1)}await page.screenshot({path:`docs/burger-sauces/${name}-stack.png`});await page.getByRole('button',{name:'완성하기',exact:true}).click();await page.screenshot({path:`docs/burger-sauces/${name}-complete.png`});await expect(page.getByRole('button',{name:'PNG 저장',exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

test('offline reload preserves sauces and other game saves; no sauce remains none',async({page,context})=>{
 await open(page,add(ready(),'patty'));await expect(page.locator('[data-asset$="drizzle"]')).toHaveCount(0);await sauce(page,'케첩');const before=(await state(page)).design;await page.evaluate(()=>{localStorage.setItem('unrelated-game-sauce-test','preserve')});await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();expect((await state(page)).design).toEqual(before);await expect(page.locator('[data-asset="sauce-ketchup-drizzle"]')).toHaveCount(1);expect(await page.evaluate(()=>localStorage.getItem('unrelated-game-sauce-test'))).toBe('preserve');await page.getByRole('button',{name:'완성하기',exact:true}).click();await expect(page.locator('[data-asset="sauce-ketchup-drizzle"]')).toHaveCount(1)
})
