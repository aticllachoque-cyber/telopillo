// Stage 6 renders: screenshot each proposal mockup at its matched viewports.
// Same settings as current/ captures (fullPage, dsf=2) for 1:1 pairs.
import { chromium } from '@playwright/test'

const DIR = new URL('./proposal/', import.meta.url).pathname

const RENDERS = [
  ['mockup-owner-notice', ['desktop', 'tablet', 'mobile']],
  ['mockup-usermenu', ['desktop']],
  ['mockup-drawer', ['mobile']],
  ['mockup-draft', ['desktop']],
  ['mockup-offline', ['desktop']],
]

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [name, views] of RENDERS) {
  for (const v of views) {
    const ctx = await browser.newContext({ viewport: VIEWPORTS[v], deviceScaleFactor: 2 })
    const p = await ctx.newPage()
    await p.goto(`file://${DIR}${name}.html`, { waitUntil: 'load' })
    await p.waitForTimeout(900)
    await p.screenshot({ path: `${DIR}render-${name}-${v}.png`, fullPage: true })
    await ctx.close()
    console.log(`render-${name}-${v}.png`)
  }
}
await browser.close()
