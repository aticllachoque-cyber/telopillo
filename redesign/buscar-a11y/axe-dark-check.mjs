// Dark-theme contrast verification for buscar-a11y Stage 8 (sign-off condition).
// Runs axe on /buscar in dark mode for both states and prints violations.
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:3000'
const targets = [
  { name: 'results', url: '/buscar?q=samsung', wait: 'a[href^="/productos/"]' },
  { name: 'empty', url: '/buscar?q=zzzznoexiste', wait: 'text=No encontramos productos' },
]

const browser = await chromium.launch()
let failures = 0

for (const t of targets) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await page.goto(BASE + t.url, { waitUntil: 'networkidle' })
  await page.waitForSelector(t.wait, { timeout: 15_000 })
  // Force dark theme the same way next-themes resolves it (class on <html>)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(300)

  const results = await new AxeBuilder({ page }).analyze()
  const violations = results.violations.filter((v) =>
    ['serious', 'critical', 'moderate'].includes(v.impact)
  )

  console.log(`\n=== ${t.name} (${t.url}) dark mode: ${violations.length} violations ===`)
  for (const v of violations) {
    console.log(`- ${v.id} (${v.impact}): ${v.nodes.length} node(s)`)
    for (const n of v.nodes.slice(0, 5)) {
      console.log(`  target: ${n.target.join(' ')}`)
      console.log(`  ${n.failureSummary?.split('\n')[0]}`)
      failures++
    }
  }
  await context.close()
}

await browser.close()
console.log(failures === 0 ? '\nDARK-MODE AXE: CLEAN' : `\nDARK-MODE AXE: ${failures} violations`)
process.exit(failures === 0 ? 0 : 1)
