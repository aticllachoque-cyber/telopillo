// Direct axe scan for storefront-a11y intake (desktop + mobile, light).
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:3000'
const URL = '/negocio/tienda-electronica-la-paz'
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
let failures = 0
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await context.newPage()
  const resp = await page.goto(BASE + URL, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1', { timeout: 15_000 })
  await page.waitForTimeout(500)

  const results = await new AxeBuilder({ page }).analyze()
  const violations = results.violations.filter((v) =>
    ['serious', 'critical', 'moderate'].includes(v.impact)
  )
  console.log(
    `\n=== ${name} HTTP ${resp?.status()} — ${violations.length} violations ===`
  )
  for (const v of violations) {
    console.log(`- ${v.id} (${v.impact}): ${v.nodes.length} node(s), tags: ${v.tags.filter((t) => t.startsWith('wcag')).join(',')}`)
    for (const n of v.nodes.slice(0, 6)) {
      console.log(`  target: ${n.target.join(' ')}`)
      console.log(`  html: ${n.html.slice(0, 160)}`)
      const c = n.any.filter((x) => x.id === 'color-contrast')[0]
      if (c?.data) {
        console.log(
          `  contrast: fg=${c.data.fgColor} bg=${c.data.bgColor} ratio=${c.data.contrastRatio} size=${c.data.fontSize} weight=${c.data.fontWeight}`
        )
      }
      failures++
    }
  }
  await context.close()
}
await browser.close()
console.log(failures === 0 ? '\nAXE: CLEAN' : `\nAXE: ${failures} violation node(s)`)
