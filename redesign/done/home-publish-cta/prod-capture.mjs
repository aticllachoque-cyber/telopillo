// Production landing captures for home-publish-cta intake verification
// https://www.telopillo.lat/ — feedback source. Compare vs local dev.
import { chromium } from '@playwright/test'

const BASE = 'https://www.telopillo.lat'
const DIR = new URL('./input/', import.meta.url).pathname

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const res = await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `${DIR}prod-landing-${name}.png`, fullPage: true })
  // Check for visible publish CTA in header area + count publish links in DOM
  const publishLinks = await page.locator('a:has-text("Publicar"), a:has-text("Publicá")').all()
  const visible = []
  for (const l of publishLinks) {
    const box = await l.boundingBox()
    if (box) visible.push({ text: (await l.textContent())?.trim(), y: Math.round(box.y) })
  }
  console.log(`${name}: HTTP ${res?.status()} | publish links total=${publishLinks.length} visible=${visible.length}`)
  visible.forEach((v) => console.log(`  visible: "${v.text}" at y=${v.y}`))
  await ctx.close()
}
await browser.close()
