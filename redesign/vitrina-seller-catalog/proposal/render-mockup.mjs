// Stage 6 render — screenshot mockup.html at the 3 mandated viewports
// (full-page, dsf=2) as proposal/stitch-render-*.png for comparison.html.
// Uses CDP captureBeyondViewport directly: Playwright's fullPage picks up a
// phantom scrollWidth (875 vs 375) from the carousel's scrolled-out flex items.
import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const mockupUrl = 'http://127.0.0.1:3999/redesign/vitrina-seller-catalog/proposal/mockup.html'
const VIEWPORTS = [
  ['desktop', 1920, 1080],
  ['tablet', 768, 1024],
  ['mobile', 375, 812],
]

const browser = await chromium.launch()
for (const [name, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  await page.goto(mockupUrl, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const out = fileURLToPath(new URL(`./stitch-render-${name}.png`, import.meta.url))
  const contentHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const cdp = await ctx.newCDPSession(page)
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height: Math.min(contentHeight, 16000), scale: 2 },
  })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(out, Buffer.from(data, 'base64'))
  console.log('rendered', out)
  await ctx.close()
}
await browser.close()
