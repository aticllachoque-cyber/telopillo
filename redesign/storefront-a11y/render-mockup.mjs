// Render proposal/mockup.html at 3 viewports (fullPage dsf=2) for comparison.html.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'fs'
import { pathToFileURL } from 'url'
import path from 'path'

const DIR = path.dirname(new URL(import.meta.url).pathname)
const mockup = pathToFileURL(path.join(DIR, 'proposal', 'mockup.html')).href
mkdirSync(path.join(DIR, 'proposal'), { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await page.goto(mockup, { waitUntil: 'load' })
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(DIR, 'proposal', `storefront-render-${name}.png`), fullPage: true })
  console.log(`storefront-render-${name}.png`)
  await context.close()
}
await browser.close()
