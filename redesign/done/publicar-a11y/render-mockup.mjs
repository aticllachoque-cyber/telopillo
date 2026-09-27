// Render proposal mockups at matching viewports (fullPage dsf=2) for comparison.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
import { pathToFileURL } from 'url'
import path from 'path'

const DIR = path.dirname(new URL(import.meta.url).pathname)
mkdirSync(path.join(DIR, 'proposal'), { recursive: true })

const JOBS = [
  ['mockup-demanda.html', 'demanda-fixed', null], // null = all 3 viewports
  ['mockup-error-desktop.html', 'error-fixed-desktop', 'desktop'],
  ['mockup-error-mobile.html', 'error-fixed-mobile', 'mobile'],
]

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [file, prefix, only] of JOBS) {
  const url = pathToFileURL(path.join(DIR, 'proposal', file)).href
  const names = only ? [only] : Object.keys(VIEWPORTS)
  for (const name of names) {
    const ctx = await browser.newContext({
      viewport: VIEWPORTS[name],
      deviceScaleFactor: 2,
    })
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'load' })
    await page.waitForTimeout(700)
    await page.screenshot({
      path: path.join(DIR, 'proposal', `render-${prefix}-${name}.png`),
      fullPage: true,
    })
    console.log(`render-${prefix}-${name}.png`)
    await ctx.close()
  }
}
await browser.close()
