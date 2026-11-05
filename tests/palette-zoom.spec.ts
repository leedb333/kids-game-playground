import {test, expect} from '@playwright/test'
import {drawings} from '../src/games/coloring/data/drawings'

for (const drawing of Object.values(drawings)) test(`${drawing.id}: visible palette and fixed 300 percent hint`, async ({page}) => {
  await page.setViewportSize({width:1280,height:800})
  await page.goto('./')
  await page.getByRole('button',{name:'순서대로 색칠놀이',exact:true}).click()
  await page.getByRole('button',{name:`${drawing.title}, ${drawing.colors.length}색, 색칠하기`,exact:true}).click()
  const colors=await page.locator('.color-chip').evaluateAll(chips=>chips.map(chip=>{
    const label=chip.querySelector('span')!
    return {background:getComputedStyle(chip).backgroundColor,labelBackground:getComputedStyle(label).backgroundColor,text:getComputedStyle(label).color}
  }))
  expect(new Set(colors.map(c=>c.background)).size).toBeGreaterThan(15)
  for(const c of colors){expect(c.labelBackground).toBe('rgba(0, 0, 0, 0)');expect(c.text).not.toBe(c.background)}
  const zoom=page.getByRole('button',{name:'원래 크기로',exact:true})
  for(let i=0;i<4;i++) await page.getByRole('button',{name:'확대',exact:true}).click()
  await expect(zoom).toHaveText('300%')
  await expect(page.getByRole('button',{name:'확대',exact:true})).toBeDisabled()
  await zoom.click()
  await page.getByRole('button',{name:'힌트',exact:true}).click()
  await expect(zoom).toHaveText('300%')
  await page.getByRole('button',{name:'축소',exact:true}).click()
  await expect(zoom).toHaveText('250%')
  await page.getByRole('button',{name:'힌트',exact:true}).click()
  await expect(zoom).toHaveText('300%')
  await page.screenshot({path:`docs/palette-zoom-${drawing.id}.png`,fullPage:true})
})
