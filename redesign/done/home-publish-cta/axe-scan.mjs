// Direct axe scan of / (anon) — evidence for home-publish-cta audit
import { chromium } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./', import.meta.url).pathname

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const lines = [`# axe / — viewport ${name}, anon, ${new Date().toISOString()}`, `violations: ${results.violations.length}`]
  for (const v of results.violations) {
    lines.push(`\n## ${v.id} (${v.impact}) — ${v.help}`)
    lines.push(`helpUrl: ${v.helpUrl}`)
    for (const n of v.nodes.slice(0, 5)) lines.push(`  node: ${n.target.join(' ')} — ${n.failureSummary.split('\n')[0]}`)
  }
  writeFileSync(`${DIR}axe-${name}.txt`, lines.join('\n') + '\n')
  console.log(`${name}: ${results.violations.length} violations`)
  await ctx.close()
}
await browser.close()
