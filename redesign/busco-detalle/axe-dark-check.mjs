// Quick dark-mode axe check on branch (anon, both states)
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:3000'
const IDS = ['679962b7-ddfd-4a65-ab27-50d0b47d1859', 'f8609770-80c1-441f-8c37-9729816ef450']
const browser = await chromium.launch()
for (const id of IDS) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/busco/${id}`, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(300)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()
  console.log(id.slice(0, 8), 'dark:', r.violations.length, 'violations')
  for (const v of r.violations) console.log(' -', v.id, v.nodes.length)
  await ctx.close()
}
await browser.close()
