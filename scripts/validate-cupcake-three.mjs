// Phase-one lab only. No production entry, save key, source asset or game code is changed.
import {build} from 'vite'
import {chromium} from '@playwright/test'
import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {resolve} from 'node:path'
import assert from 'node:assert/strict'

const out='docs/cupcake-three-study',root='public/assets/cooking-v2/cupcake/'
mkdirSync(out,{recursive:true})
const source=path=>resolve(path).replaceAll('\\','/')
const entry=`import {renderCupcake} from ${JSON.stringify(source('src/games/cooking-v2/cupcake/Cupcake.tsx'))};
import {loadImages,creamMask,urls} from ${JSON.stringify(source('src/games/cooking-v2/cupcake/assets.ts'))};
import {fresh,edit,pipe,sprinkle,remove,undo,layout} from ${JSON.stringify(source('src/games/cooking-v2/cupcake/model.ts'))};
globalThis.study={renderCupcake,loadImages,creamMask,urls,fresh,edit,pipe,sprinkle,remove,undo,layout};`
const output=await build({configFile:false,define:{'process.env.NODE_ENV':JSON.stringify('production')},logLevel:'error',plugins:[{name:'cupcake-study-entry',resolveId:id=>id==='virtual:cupcake-study'?'\0cupcake-study':undefined,load:id=>id==='\0cupcake-study'?entry:undefined}],build:{rollupOptions:{input:'virtual:cupcake-study'},write:false,emptyOutDir:false,minify:false,reportCompressedSize:false,lib:{entry:'virtual:cupcake-study',name:'CupcakeStudy',formats:['iife']}}})
const bundle=(Array.isArray(output)?output[0]:output).output.find(f=>f.type==='chunk').code
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)})
const checks=[]
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true})
 await page.setContent(`<html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
 *{box-sizing:border-box}body{margin:0;font:15px 'Malgun Gothic',sans-serif;color:#76544a;background:#fff1e8}main{height:100svh;display:flex;flex-direction:column}header{text-align:center;padding:8px;background:#fff9ee}header strong{font-size:20px}header small{display:block;font-size:12px;color:#a24e4b}nav{display:flex;justify-content:center;gap:12px;padding:6px;background:#fff5ed}button{min-width:48px;min-height:48px;font:inherit;color:inherit;border:2px solid #deb8a8;border-radius:18px;background:#fffaf1;padding:5px 15px;cursor:pointer}nav button{display:flex;align-items:center;gap:7px;width:180px;height:86px;font-weight:bold}nav canvas{width:70px;height:70px}button[aria-pressed=true]{background:#ffe6b3;border-color:#d5a255}section{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background-position:center;background-size:cover}#food{display:block;max-width:96vw;max-height:100%;aspect-ratio:1;height:100%;width:auto;touch-action:none}footer{display:flex;justify-content:center;align-items:center;gap:10px;padding:8px;background:#fff5ed;flex-wrap:wrap}#notice{margin:0;font-size:12px;color:#986b59;text-align:center;background:#fff9ee;padding:4px}.group nav{display:none}
 @media(max-width:600px){header strong{font-size:17px}header small{font-size:10px}nav{gap:5px}nav button{width:30%;padding:2px;font-size:12px;height:76px;flex-direction:column;gap:0}nav canvas{width:48px;height:48px}footer{gap:5px}footer button{font-size:12px;padding:4px 9px}#notice{font-size:10px}}
 </style><main><header><strong>컵케이크 3개 · 구성 검증</strong><small>운영 게임 미반영 · 3구 트레이와 굽기 과정은 아직 구현하지 않았어요</small></header><nav aria-label="검증용 컵 선택">${[1,2,3].map(n=>`<button data-cup="${n}" aria-label="${n}번 컵케이크"><canvas width="200" height="200"></canvas><span>${n}번 컵케이크</span></button>`).join('')}</nav><section><canvas id="food" width="1400" height="1400" aria-label="검증용 컵케이크"></canvas></section><p id="notice">검증용 조작: 크림 종류 · 장식 · 되돌리기 · 3개 합성. 실제 게임 저장은 하지 않습니다.</p><footer><button id="strawberry">딸기 크림</button><button id="vanilla">바닐라 크림</button><button id="pipe">크림 올리기 검증</button><button id="sprinkle">장식 추가 검증</button><button id="undo">되돌리기</button><button id="group">3개 합성 보기</button></footer></main></html>`)
 page.on('pageerror',e=>console.error('검증 도구 브라우저 오류:',e.message))
 await page.addScriptTag({content:bundle})
 await page.evaluate(async()=>{
  const m=globalThis.study,images=await m.loadImages(),valid=m.creamMask(images);globalThis.lab={selected:0,group:false,sessions:[0,1,2].map(()=>m.edit(m.fresh(),{step:'decorate',ingredients:['egg','milk','flour','sugar'],mix:1,filled:true,oven:'done',elapsed:3000})),images}
  const clear=new Image();clear.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';await clear.decode();globalThis.lab.foodImages={...images,plate:clear}
  document.querySelector('section').style.backgroundImage=`url("${m.urls.background}")`
  globalThis.drawGroup=()=>{const result=document.createElement('canvas');result.width=result.height=1400;const ctx=result.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(images.plate,40,660,1320,456);lab.sessions.forEach((s,i)=>ctx.drawImage(m.renderCupcake(s.work,lab.foodImages,1000),-10+i*400,250,620,620));return result}
  globalThis.redraw=()=>{const source=lab.group?drawGroup():m.renderCupcake(lab.sessions[lab.selected].work,images);const dest=document.getElementById('food');dest.getContext('2d').clearRect(0,0,1400,1400);dest.getContext('2d').drawImage(source,0,0,1400,1400);document.querySelector('main').classList.toggle('group',lab.group);document.querySelectorAll('[data-cup]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===lab.selected&&!lab.group));const c=b.querySelector('canvas');c.getContext('2d').clearRect(0,0,200,200);c.getContext('2d').drawImage(m.renderCupcake(lab.sessions[i].work,images,200),0,0)})}
  document.querySelectorAll('[data-cup]').forEach((b,i)=>b.onclick=()=>{lab.selected=i;lab.group=false;redraw()})
  for(const cream of ['vanilla','strawberry'])document.getElementById(cream).onclick=()=>{lab.sessions[lab.selected]=m.edit(lab.sessions[lab.selected],{cream});lab.group=false;redraw()}
  document.getElementById('pipe').onclick=()=>{lab.sessions[lab.selected]=m.pipe(lab.sessions[lab.selected],1);redraw()}
  document.getElementById('sprinkle').onclick=()=>{const s=lab.sessions[lab.selected],n=s.work.sprinkles.length,u=.3+(n%5)*.08,v=.6+Math.floor(n/5)%3*.10;if(valid(u,v))lab.sessions[lab.selected]=m.sprinkle(s,u,v);redraw()}
  document.getElementById('undo').onclick=()=>{lab.sessions[lab.selected]=m.undo(lab.sessions[lab.selected]);redraw()}
  document.getElementById('group').onclick=()=>{lab.group=!lab.group;redraw()}
  document.getElementById('food').onpointerdown=e=>{if(lab.group)return;const r=e.currentTarget.getBoundingClientRect(),l=m.layout(lab.sessions[lab.selected].work).cream,u=((e.clientX-r.left)/r.width*1000-l.x)/l.w,v=((e.clientY-r.top)/r.height*1000-l.y)/l.h;if(valid(u,v)){lab.sessions[lab.selected]=m.sprinkle(lab.sessions[lab.selected],u,v);redraw()}}
  redraw()
 })
 // Audit all original files without rewriting or cleaning any source image.
 const prior=JSON.parse(readFileSync('docs/cupcake-prototype/asset-audit.json','utf8')),audit=[]
 for(const name of readdirSync(root).filter(n=>n.endsWith('.png')).sort()){
  const bytes=readFileSync(root+name),sha256=createHash('sha256').update(bytes).digest('hex');assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(sha256,prior.find(a=>a.name===name).sha256)
  const pixels=await page.evaluate(async data=>{const im=new Image();im.src=data;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let transparent=0,partial=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)transparent++;else if(d[i]<255)partial++}return {width:im.width,height:im.height,transparent,partial}},'data:image/png;base64,'+bytes.toString('base64'))
  audit.push({name,sha256,colorType:bytes[25],...pixels})
 }
 assert.equal(audit.length,9);checks.push('원본 9종 PNG 형식·크기·알파·해시 검사')
 writeFileSync(`${out}/asset-audit.json`,JSON.stringify(audit,null,2)+'\n')
 await page.screenshot({path:`${out}/01-empty-design-lab.png`})
 for(let i=0;i<3;i++){
  await page.getByRole('button',{name:`${i+1}번 컵케이크`,exact:true}).click();await page.getByRole('button',{name:i===1?'바닐라 크림':'딸기 크림',exact:true}).click();await page.getByRole('button',{name:'크림 올리기 검증',exact:true}).click()
  for(let n=0;n<3+i*3;n++)await page.getByRole('button',{name:'장식 추가 검증',exact:true}).click()
  await page.screenshot({path:`${out}/0${i+2}-cup-${i+1}.png`})
 }
 const snapshot=await page.evaluate(()=>lab.sessions.map(s=>s.work));assert.deepEqual(snapshot.map(s=>s.cream),['strawberry','vanilla','strawberry']);assert.deepEqual(snapshot.map(s=>s.sprinkles.length),[3,6,9]);checks.push('서로 다른 크림·장식 개수 3/6/9 독립 유지')
 await page.getByRole('button',{name:'1번 컵케이크',exact:true}).click();assert.equal(await page.evaluate(()=>lab.selected),0);assert.deepEqual(await page.evaluate(()=>lab.sessions.map(s=>s.work)),snapshot);checks.push('3번→1번 전환 시 전체 디자인 유지')
 await page.getByRole('button',{name:'장식 추가 검증',exact:true}).click();await page.getByRole('button',{name:'되돌리기',exact:true}).click();assert.deepEqual(await page.evaluate(()=>lab.sessions.map(s=>s.work)),snapshot);checks.push('선택한 컵의 장식 추가·되돌리기와 나머지 2개 불변')
 const removal=await page.evaluate(()=>{const before=lab.sessions.map(s=>JSON.stringify(s.work)),id=lab.sessions[0].work.sprinkles[0].id,removed=study.remove(lab.sessions[0],id);return {count:removed.work.sprinkles.length,restored:JSON.stringify(study.undo(removed).work)===before[0],other:lab.sessions.slice(1).every((s,i)=>JSON.stringify(s.work)===before[i+1])}});assert.deepEqual(removal,{count:2,restored:true,other:true});checks.push('개별 장식 제거 및 복구, 다른 컵 불변')
 await page.getByRole('button',{name:'3개 합성 보기',exact:true}).click();await page.screenshot({path:`${out}/05-three-composition.png`})
 const png=await page.evaluate(()=>drawGroup().toDataURL('image/png'));const bytes=Buffer.from(png.split(',')[1],'base64');assert.equal(bytes.readUInt32BE(16),1400);assert.equal(bytes.readUInt32BE(20),1400);writeFileSync(`${out}/three-cupcakes.png`,bytes)
 const exported=await page.evaluate(()=>{const c=drawGroup(),ctx=c.getContext('2d'),screen=document.getElementById('food').getContext('2d').getImageData(0,0,1400,1400).data,d=ctx.getImageData(0,0,1400,1400).data;let difference=0;for(let i=0;i<d.length;i++)difference+=Math.abs(screen[i]-d[i]);return {corner:d[3],difference}});assert.deepEqual(exported,{corner:0,difference:0});checks.push('1400×1400 투명 합성 PNG와 검증 화면 픽셀 일치')
 const sample={status:'proposal-only',version:2,selectedCupId:'cup-1',mix:{ingredients:snapshot[0].ingredients,progress:1},oven:{phase:'done',elapsedMs:3000},cups:snapshot.map((s,i)=>({id:`cup-${i+1}`,traySlot:i,fillProgress:1,bakeProgress:1,design:{cream:s.cream,piping:s.piping,sprinkles:s.sprinkles,nextId:s.nextId,done:s.piping>0}}))};assert.deepEqual(JSON.parse(JSON.stringify(sample)),sample);checks.push('제안 데이터 JSON 직렬화 왕복 — 실제 저장·이전 아님');writeFileSync(`${out}/proposed-state-example.json`,JSON.stringify(sample,null,2)+'\n')
 await page.getByRole('button',{name:'3개 합성 보기',exact:true}).click()
 for(const [name,width,height] of [['tablet-wide',1280,720],['phone',360,800],['phone-landscape',800,360]]){await page.setViewportSize({width,height});await page.screenshot({path:`${out}/${name}-study.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}checks.push('구성 검증 화면: 태블릿·스마트폰 폭 넘침 없음 (정식 게임 검증 아님)')
 writeFileSync(`${out}/study-results.json`,JSON.stringify({phase:1,productionGameChanged:false,newFoodAssetsCreated:false,actualGameSavingImplemented:false,checks,exported,assetCount:audit.length},null,2)+'\n')
 console.log(JSON.stringify({assetCount:audit.length,checks,output:out},null,2))
}finally{await browser.close()}
