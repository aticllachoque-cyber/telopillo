// Stage 8 after-captures on branch redesign/busco-detalle: mirror current/
// (primary + ofertas x 3 viewports, anon, fullPage dsf=2) + live asserts for
// F-1/F-2/F-3/F-4/F-6.
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

const PRIMARY_ID = '679962b7-ddfd-4a65-ab27-50d0b47d1859'
const OFFERS_ID = 'f8609770-80c1-441f-8c37-9729816ef450'
const LANDMARK = 'Esta persona publicó la necesidad y recibirá las ofertas.'

const browser = await chromium.launch()
const lines = ['busco-detalle after captures — 2026-09-18, branch redesign/busco-detalle']
let domCaptured = false
const asserts = []

for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  const res = await page.goto(`${BASE}/busco/${PRIMARY_ID}`, { waitUntil: 'load' })
  await page.waitForSelector(`text=${LANDMARK}`, { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}.png`, fullPage: true })

  if (!domCaptured) {
    writeFileSync(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
    const aria = await page.locator('main').first().ariaSnapshot().catch(() => 'aria snapshot unavailable')
    writeFileSync(
      `${DIR}dom.txt`,
      `# /busco/${PRIMARY_ID} — viewport ${name}, anon, branch redesign/busco-detalle\n\n${aria}\n`,
    )

    // live asserts (desktop pass)
    asserts.push(
      await page.evaluate(() => {
        const out = []
        // F-1: avatar fallback contrast class
        const fallback = document.querySelector('[data-slot="avatar-fallback"]')
        out.push(`F-1 avatar-fallback classes: ${fallback?.className ?? 'NOT FOUND'}`)
        // F-2: compact CTA exists and is lg:hidden
        const compact = [...document.querySelectorAll('a[href*="/login?redirect"]')].find((a) =>
          a.closest('div.rounded-lg'),
        )
        const compactWrap = compact?.closest('div.rounded-lg')
        out.push(
          `F-2 compact CTA: ${compactWrap ? 'present' : 'MISSING'} classes=${compactWrap?.className ?? '-'}`,
        )
        // F-3: meta row under H1 removed
        out.push(`F-3 h1+div muted meta row: ${document.querySelector('h1 + div.text-muted-foreground') ? 'STILL THERE' : 'removed'}`)
        // F-4: voseo copy
        out.push(`F-4 voseo: ${document.body.textContent.includes('Iniciá sesión para ofrecer') ? 'ok' : 'MISSING'} / ${document.body.textContent.includes('¿Tenés lo que esta persona busca?') ? 'ok' : 'MISSING'}`)
        // F-6: Resumen semantic list
        const list = document.querySelector('ul[aria-label="Resumen"]')
        out.push(`F-6 Resumen ul[role implicit list]: ${list ? `present, ${list.querySelectorAll('li').length} li` : 'MISSING'}`)
        return out.join('\n')
      }),
    )
    domCaptured = true
  }

  await page.goto(`${BASE}/busco/${OFFERS_ID}`, { waitUntil: 'load' })
  await page.waitForSelector('text=/Ofertas \\(\\d+\\)/', { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${DIR}${name}-ofertas.png`, fullPage: true })

  lines.push(
    `${name}: primary ${PRIMARY_ID} | ofertas ${OFFERS_ID} (viewport ${viewport.width}x${viewport.height}, fullPage, dsf=2, anon, branch)`,
  )
  await ctx.close()
}

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
writeFileSync(`${DIR}asserts.txt`, asserts.join('\n') + '\n')
await browser.close()
console.log('after captures done\n' + asserts.join('\n'))
