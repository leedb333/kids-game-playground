import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
// Build-specific cache: a new build never serves old HTML with missing chunks.
const offline = (): Plugin => ({name:'offline-shell',generateBundle(_, bundle) {
  const scenes=readdirSync('public/assets/coloring-v4').filter(f=>f.endsWith('.png')).map(f=>'./assets/coloring-v4/'+f)
  const files = ['./', './index.html', './prototypes/cooking-v2/', './prototypes/cooking-v2/index.html', './prototypes/cooking-v2/kitchen/', './prototypes/cooking-v2/kitchen/index.html', './prototypes/cooking-v2/burger/', './prototypes/cooking-v2/burger/index.html', './prototypes/cooking-v2/cupcake/', './prototypes/cooking-v2/cupcake/index.html', './icon.svg', './manifest.webmanifest', './icon-192.png', './icon-512.png', ...scenes, ...Object.keys(bundle).map(f=>'./'+f)]
  const imageVersion=scenes.map(file=>createHash('sha256').update(readFileSync('public/'+file.slice(2))).digest('hex')).join('')
  const version = JSON.stringify(files) + imageVersion + Object.values(bundle).filter(f=>f.type==='chunk').map(f=>f.code).join('')
  let hash=0; for(const c of version) hash=(hash*31+c.charCodeAt(0))|0
  this.emitFile({type:'asset',fileName:'sw.js',source:`const PREFIX='kids-playground-'+self.registration.scope;const CACHE=PREFIX+'-${hash >>> 0}';const FILES=${JSON.stringify(files)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request,{ignoreVary:true});if(cached)return cached;try{return await fetch(e.request)}catch(error){if(e.request.mode==='navigate')return c.match('./index.html');throw error}}))});`})
}})
export default defineConfig({base:process.env.BASE_PATH || '/kids-game-playground/',plugins:[react(),offline()],build:{rollupOptions:{input:{main:resolve('index.html'),cookingV2:resolve('prototypes/cooking-v2/index.html'),cookingKitchen:resolve('prototypes/cooking-v2/kitchen/index.html'),cookingBurger:resolve('prototypes/cooking-v2/burger/index.html'),cookingCupcake:resolve('prototypes/cooking-v2/cupcake/index.html')}}}})
