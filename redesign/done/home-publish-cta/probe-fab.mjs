// Iteration 1 probe: verify FAB in mockup renders + crops for Checkpoint 3
import { chromium } from '@playwright/test'

const DIR = new URL('./proposal/', import.meta.url).pathname

const browser = await chromium.launch()
for (const [name, viewport] of Object.entries({
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
})) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`file://${DIR}mockup.html`, { waitUntil: 'load' })
  await page.waitForTimeout(800)

  const fab = page.locator('#publish-fab')
  const fabBox = await fab.boundingBox()
  const headerPub = await page.locator('header div.lg\\:hidden a[href="/crear"]').count()
  const entrar = await page.locator('header div.lg\\:hidden a[href="/login"]').count()
  const desktopLabel = await page.locator('header nav a[href="/crear"]').count()
  console.log(
    `${name}: FAB=${fabBox ? `${Math.round(fabBox.width)}x${Math.round(fabBox.height)} @y=${Math.round(fabBox.y)}` : 'ABSENT'} | header mobile pub=${headerPub} | entrar=${entrar} | desktop nav label=${desktopLabel}`
  )
  await ctx.close()
}

// crops: mobile viewport shot (FAB in situ) + header decluttered
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`file://${DIR}mockup.html`, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}crop-mobile-fab.png` }) // viewport only — FAB fixed at bottom
  await page.screenshot({
    path: `${DIR}crop-mobile-header-v2.png`,
    fullPage: true,
    clip: { x: 0, y: 0, width: 375, height: 140 },
  })
  // mid-scroll state: content under FAB
  await page.evaluate(() => window.scrollTo(0, 1200))
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${DIR}crop-mobile-fab-scrolled.png` })
  await ctx.close()
}
await browser.close()
console.log('crops saved: crop-mobile-fab.png, crop-mobile-header-v2.png, crop-mobile-fab-scrolled.png')
