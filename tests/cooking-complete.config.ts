import {resolve} from 'node:path'
import {defineConfig} from '@playwright/test'
import base from '../playwright.config'
export default defineConfig({
 ...base,
 webServer:{command:`"${process.execPath}" node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4180 --strictPort`,cwd:resolve(import.meta.dirname,'..'),url:'http://127.0.0.1:4180/kids-game-playground/',reuseExistingServer:false},
 testDir:'.',
 testMatch:['cooking-complete.spec.ts','cooking-v2-full.spec.ts','burger.spec.ts','cupcake-three.spec.ts','icecream.spec.ts','icecream-toppings.spec.ts'],
 grep:/complete review:|real four-step touch|resume, reset confirmation|real touch grill and flip|three sauces select|touch ingredients, circular whisk|migration requires explicit consent|container selection, same-flavor|all ten flavors add|real topping drag adds|finish and transparent download|maximum toppings, editing/,
 use:{...base.use,serviceWorkers:'block'}
})
