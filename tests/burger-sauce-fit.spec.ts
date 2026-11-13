import {test,expect,type Page} from '@playwright/test'
import {mkdirSync,readFileSync} from 'node:fs'
import {add,applySauce,fresh,ingredients,layout,remove,restore,storageKey,undo,type Session,type Kind,type Sauce} from '../src/games/cooking-v2/burger/model'
const phase=process.env.BURGER_FIT_PHASE==='before'?'before':'after',dir=`docs/burger-sauce-fit/${phase}`
test.setTimeout(60000)
test.beforeAll(()=>mkdirSync(dir,{recursive:true}))
const ready=():Session=>({...fresh(),stage:'stack',grill:{phase:'done',elapsed:0},design:{...fresh().design,selected:ingredients.map(i=>i.id)}})
function recipe(names:Kind[]){let s=ready();for(const name of names)s=add(s,name);return s}
function drizzle(s:Session,names:Sauce[]){for(const name of names)s=applySauce(s,name,{x:500,y:550});return s}
async function open(page:Page,s:Session){await page.addInitScript(({s,k})=>{if(!sessionStorage.getItem('fit-fixture')){localStorage.setItem(k,JSON.stringify(s));sessionStorage.setItem('fit-fixture','yes')}},{s,k:storageKey});await page.goto('prototypes/cooking-v2/burger/#play');await expect(page.locator('.bg-burger')).toBeVisible()}
const scenarios=['ketchup-once','mustard-once','mustard-three','mixed','under-cheese','under-stack','complete','cheese-diagnostic'] as const
function scenario(name:typeof scenarios[number]){
 let s=recipe(['patty','cheese','lettuce'])
 if(name==='ketchup-once')s=drizzle(s,['ketchup'])
 if(name==='mustard-once')s=drizzle(s,['mustard'])
 if(name==='mustard-three')s=drizzle(s,['mustard','mustard','mustard'])
 if(name==='mixed'||name==='complete'||name==='under-stack')s=drizzle(s,['ketchup','mayonnaise','mustard'])
 if(name==='under-cheese')s=add(drizzle(recipe(['patty']),['ketchup']),'cheese')
 if(name==='under-stack')for(const kind of ['tomato','onion','bacon'] as Kind[])s=add(s,kind)
 if(name==='complete')s={...s,stage:'complete'}
 if(name==='cheese-diagnostic')s=recipe(['patty','cheese'])
 return s
}
for(const name of scenarios)test(`comparison ${name}`,async({page})=>{
 await page.setViewportSize({width:1280,height:800});const s=scenario(name);await open(page,s);await page.screenshot({path:`${dir}/${name}.png`})
 const order=await page.locator('[data-food]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-food')))
 expect(order).toEqual(layout(s.design.layers,s.stage==='complete',s.design.applications).sprites.map(i=>i.key))
 if(name==='cheese-diagnostic'){await expect(page.locator('[data-asset="cheese-stack"]')).toHaveCount(1);await expect(page.locator('[data-asset$="drizzle"]')).toHaveCount(0)}
 if(name==='under-cheese')expect(order.indexOf('sauce-2')).toBeLessThan(order.indexOf('3'))
 if(name==='complete'){
  const wait=page.waitForEvent('download');await page.getByRole('button',{name:'PNG 저장',exact:true}).click();await (await wait).saveAs(`${dir}/export.png`)
  const png=readFileSync(`${dir}/export.png`);expect(png.readUInt32BE(16)).toBe(1400);expect(png.readUInt32BE(20)).toBe(1400)
 }
})

test('surface geometry: all ingredients, bottom bun, old saves and many repeats remain small, thin and stable',()=>{
 for(const kind of [undefined,...ingredients.map(i=>i.id)]){
  let s=kind?recipe([kind]):ready();for(let i=0;i<20;i++)s=applySauce(s,'mustard',{x:i%2?100:900,y:800})
  const result=layout(s.design.layers,false,s.design.applications),base=result.sprites.find(i=>i.key===(kind?'1':'bottom'))!,sauces=result.sprites.filter(i=>i.sauceId)
  const centers=new Set<string>()
  for(const a of sauces){expect(a.width/base.width).toBeGreaterThanOrEqual(.4);expect(a.width/base.width).toBeLessThanOrEqual(.65);expect(a.height/a.width).toBeLessThanOrEqual(.12);expect(a.x).toBeGreaterThan(base.x);expect(a.x+a.width).toBeLessThan(base.x+base.width);expect(a.y).toBeGreaterThan(base.y);expect(a.y+a.height).toBeLessThan(base.y+base.height*.65);centers.add(`${a.x}:${a.y}`)}
  expect(centers.size).toBe(20)
  const before=JSON.stringify(s);expect(restore(JSON.parse(before))).toEqual(s);layout(s.design.layers,true,s.design.applications);expect(JSON.stringify(s)).toBe(before)
  const removed=remove(s,s.design.applications[2].id),left=layout(removed.design.layers,false,removed.design.applications).sprites
  for(const a of sauces.filter((_,i)=>i!==2))expect(left.find(i=>i.key===a.key)).toEqual(a)
  expect(undo(removed).design).toEqual(s.design)
 }
 const old=drizzle(recipe(['patty']),['ketchup']);old.design.applications[0]={id:2,sauce:'ketchup',after:1,scale:.9,offsetY:.15,offsetX:.05,rotation:5};const normalized=restore(JSON.parse(JSON.stringify(old)))
 expect(normalized).toEqual(old);const sprites=layout(normalized.design.layers,false,normalized.design.applications).sprites,base=sprites[1],sauce=sprites[2];expect(sauce.width/base.width).toBeLessThan(.65);expect(sauce.y+sauce.height).toBeLessThan(base.y+base.height*.65)
})

test('ingredient removal/reanchor and undo preserve exact sauce placement without changing food layout',()=>{
 let s=drizzle(recipe(['patty','cheese','lettuce']),['ketchup','mayonnaise','mustard']);const initial=layout(s.design.layers,false,s.design.applications)
 const food=layout(s.design.layers,false).sprites;expect(initial.sprites.filter(i=>!i.sauceId)).toEqual(food)
 const reduced=remove(s,3);expect(reduced.design.applications.every(a=>a.after===2)).toBe(true);expect(undo(reduced).design).toEqual(s.design);expect(layout(undo(reduced).design.layers,false,undo(reduced).design.applications)).toEqual(initial)
 s=add(s,'cheese');const order=layout(s.design.layers,true,s.design.applications).sprites.map(i=>i.key);expect(order.indexOf('sauce-6')).toBeLessThan(order.indexOf('7'));expect(order.at(-1)).toBe('top')
})
