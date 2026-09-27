// Stage 6 renders: proposal mockups at 3 viewports, fullPage dsf=2 (file:// — CSS inlined).
import { chromium } from '@playwright/test'

const DIR = new URL('./proposal/', import.meta.url).pathname
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [state, viewportNames] of Object.entries({ primary: true, ofertas: true })) {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(`file://${DIR}mockup-${state}.html`, { waitUntil: 'load' })
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${DIR}render-${state}-${name}.png`, fullPage: true })
    await ctx.close()
    console.log(`render-${state}-${name}.png`)
  }
}
await browser.close()
