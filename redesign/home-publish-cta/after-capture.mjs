// Stage 8 after captures for home-publish-cta: / (landing) on branch redesign/home-publish-cta
// Mirror of current-capture.mjs + publish CTA probe + live asserts.
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./after/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

const LANDMARK = 'Lo buscás, ¡te lo pillo!'

const browser = await chromium.launch()
const lines = [
  'home-publish-cta after captures — 2026-09-22',
  'route: / | state: anon | branch: redesign/home-publish-cta (impl F-1..F-5)',
]
let domCaptured = false
const asserts = []

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  const res = await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForSelector(`text=${LANDMARK}`, { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })

  if (!domCaptured) {
    writeFileSync(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
    const aria = await page.locator('main').first().ariaSnapshot().catch(() => 'aria snapshot unavailable')
    writeFileSync(`${DIR}dom.txt`, `# / — viewport ${name}, anon, branch redesign/home-publish-cta\n\n${aria}\n`)
    domCaptured = true
  }

  const publishLinks = await page.locator('a:has-text("Publicá"), a:has-text("publicá")').all()
  let visible = 0
  for (const l of publishLinks) if (await l.boundingBox()) visible++
  lines.push(`${name}: / | viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2, anon | publish links: total=${publishLinks.length} visible=${visible}`)

  // live asserts per viewport
  if (name === 'mobile') {
    const btn = page.getByRole('banner').getByRole('link', { name: 'Publicá gratis' })
    asserts.push(`mobile header publish visible+44px: ${!!(await btn.boundingBox())} ${(await btn.boundingBox())?.height}px`)
  }
  if (name === 'desktop') {
    asserts.push(`desktop header label voseo: ${await page.getByRole('banner').getByRole('link', { name: 'Publicá gratis' }).isVisible()}`)
    asserts.push(`hero publish link: ${await page.locator('main a[href="/crear"]').first().isVisible()}`)
    asserts.push(`hero+strip publish links (aria-label): ${await page.getByRole('link', { name: /Publicá gratis — sin costo/i }).count()}`)
    asserts.push(`old label gone: ${!(await page.locator('a:has-text("Publicar Gratis")').count())}`)
  }

  await ctx.close()
}

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
writeFileSync(`${DIR}asserts.txt`, asserts.join('\n') + '\n')
await browser.close()
console.log(lines.join('\n'))
console.log('--- asserts ---')
console.log(asserts.join('\n'))
