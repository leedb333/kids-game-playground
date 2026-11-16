import {defineConfig} from '@playwright/test'
import {resolve} from 'node:path'
import base from '../playwright.config'
const server=(Array.isArray(base.webServer)?base.webServer[0]:base.webServer)!

// This integration checks cupcakes and the five retained games, not the full legacy suite.
export default defineConfig({
 ...base,
 testDir:'.',
 testMatch:['cupcake-three.spec.ts','cupcake-release-smoke.spec.ts'],
 workers:1,
 webServer:{...server,cwd:resolve(import.meta.dirname,'..')},
})
