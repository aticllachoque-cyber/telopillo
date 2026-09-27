// Verify injected publish CTAs actually render in mockup.html
import { chromium } from '@playwright/test'

const DIR = new URL('./proposal/', import.meta.url).pathname

const browser = await chromium.launch()
for (const [name, viewport] of Object.entries({
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
})) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`file://${DIR}mockup.html`, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  const links = await page.locator('a[href="/crear"]').all()
  console.log(`\n=== ${name} ===`)
  for (const l of links) {
    const box = await l.boundingBox()
    console.log(
      `crear-link "${(await l.textContent())?.trim().replace(/\s+/g, ' ')}" visible=${!!box}` +
        (box ? ` box=${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}` : ''),
    )
  }
  if (name === 'mobile') {
    // crops: header, hero action row, ctastrip — readable evidence
    await page.screenshot({ path: `${DIR}crop-mobile-header.png`, clip: { x: 0, y: 0, width: 375, height: 70 } })
    const hero = page.locator('#hero-heading').closest('div')
    const heroBox = await hero.boundingBox()
    if (heroBox) {
      await page.screenshot({ path: `${DIR}crop-mobile-hero.png`, clip: { x: 0, y: heroBox.y, width: 375, height: 620 } })
    }
    const strip = page.getByText('¿Listo para empezar?').locator('..')
    const sBox = await strip.boundingBox().catch(() => null)
    if (sBox) {
      await page.screenshot({ path: `${DIR}crop-mobile-ctastrip.png`, clip: { x: 0, y: Math.max(0, sBox.y - 40), width: 375, height: 320 } })
    }
  }
  await ctx.close()
}
await browser.close()
