// Stage 4 axe scan for busco-detalle: both states x desktop/mobile, anon.
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'
import AxeBuilder from '@axe-core/playwright'

const BASE = 'http://localhost:3000'
const PRIMARY_ID = '679962b7-ddfd-4a65-ab27-50d0b47d1859'
const OFFERS_ID = 'f8609770-80c1-441f-8c37-9729816ef450'

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
}

const browser = await chromium.launch()
const out = []

for (const [state, id] of Object.entries({ primary: PRIMARY_ID, ofertas: OFFERS_ID })) {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/busco/${id}`, { waitUntil: 'load' })
    await page.waitForTimeout(1000)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    out.push(
      `## ${state} / ${vpName} (${viewport.width}x${viewport.height}) — ${results.violations.length} violations`,
    )
    for (const v of results.violations) {
      out.push(`- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`)
      for (const n of v.nodes.slice(0, 5)) {
        out.push(`    target: ${JSON.stringify(n.target)} html: ${n.html.slice(0, 160)}`)
      }
    }
    await ctx.close()
  }
}

writeFileSync('redesign/busco-detalle/axe-scan.txt', out.join('\n') + '\n')
await browser.close()
console.log('axe scan done')
