// Stage 1 intake captures for home-publish-cta: / (landing)
// Feedback 2026-09-22: users enter app but cannot find how to publish.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./input/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}landing-${name}.png`, fullPage: true })
  await ctx.close()
  console.log(`${name} captured`)
}
await browser.close()
