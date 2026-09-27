// Stage 8 after captures for home-publish-cta ITERATION 1 (FAB bottom)
// Route / on branch redesign/home-publish-cta (iter.1: FAB + header móvil sin botón).
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
  'home-publish-cta after captures ITERATION 1 — 2026-09-22',
  'route: / | state: anon | branch: redesign/home-publish-cta (FAB bottom, header móvil sin botón)',
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
    writeFileSync(`${DIR}dom.txt`, `# / — viewport ${name}, anon, branch redesign/home-publish-cta iter.1 (FAB)\n\n${aria}\n`)
    domCaptured = true
  }

  const publishLinks = await page.locator('a:has-text("Publicá"), a:has-text("publicá")').all()
  let visible = 0
  for (const l of publishLinks) if (await l.boundingBox()) visible++
  const fab = page.locator('#publish-fab')
  const fabBox = await fab.boundingBox()
  lines.push(`${name}: / | viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2, anon | publish links: total=${publishLinks.length} visible=${visible} | FAB: ${fabBox ? `${Math.round(fabBox.width)}x${Math.round(fabBox.height)} @y=${Math.round(fabBox.y)}` : 'absent'}`)

  if (name === 'mobile') {
    const headerPubVisible = await page.locator('header div.lg\\:hidden a[href="/crear"]').count()
    asserts.push(`mobile header publish button removed: ${headerPubVisible === 0}`)
    asserts.push(`mobile FAB visible+48px: ${!!fabBox} ${fabBox?.height}px @y=${Math.round(fabBox.y)} (viewport 812)`)
    asserts.push(`mobile Entrar still present: ${(await page.locator('header a[href="/login"]').count()) > 0}`)
    // footer clearance: scroll to bottom, copyright (absolute) must end above FAB top (absolute)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    const clearance = await page.evaluate(() => {
      const p = [...document.querySelectorAll('footer p')].pop()
      const fabEl = document.getElementById('publish-fab')
      if (!p || !fabEl) return null
      const copyBottom = p.getBoundingClientRect().bottom + window.scrollY
      const fabTop = fabEl.getBoundingClientRect().top + window.scrollY
      return { copyBottom: Math.round(copyBottom), fabTop: Math.round(fabTop), ok: copyBottom <= fabTop }
    })
    asserts.push(`mobile footer clearance (copyright bottom ${clearance?.copyBottom} <= FAB top ${clearance?.fabTop}): ${clearance?.ok}`)
    await page.evaluate(() => window.scrollTo(0, 0))
    // horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    asserts.push(`horizontal overflow 375px: ${overflow}`)
    // viewport crop of FAB
    await page.screenshot({ path: `${DIR}crop-mobile-fab.png` })
  }
  if (name === 'tablet') {
    asserts.push(`tablet FAB visible: ${!!fabBox} (${fabBox?.height}px)`)
  }
  if (name === 'desktop') {
    asserts.push(`desktop FAB absent (hidden via lg): ${!(await fab.isVisible())}`)
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
