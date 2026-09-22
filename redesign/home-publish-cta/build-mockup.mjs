// Stage 6 faithful mockup for home-publish-cta — ITERATION 1 (Checkpoint 4 feedback)
// Dev server serves impl v1: P-2/P-3/P-4/P-5 already live in DOM (idempotent guards skip).
// Iteration delta:
//   D-1 remove mobile header publish button (declutter: 5 controls -> 4 on 375px)
//   D-2 inject FAB: fixed bottom pill "Publicá gratis" (<1024px only), token values
//      read live from a real primary button via getComputedStyle (no fabricated values)
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const MEGAPHONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-megaphone" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>`

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`${BASE}/`, { waitUntil: 'load' })
await page.waitForSelector('text=Lo buscás, ¡te lo pillo!', { timeout: 60_000 })
await page.waitForTimeout(1500)

await page.evaluate((megaphoneSvg) => {
  const log = []

  // ---- P-2: desktop header label voseo (idempotent — impl v1 already live)
  let p2 = false
  for (const a of document.querySelectorAll('header nav a[href="/crear"]')) {
    if (a.textContent.trim() === 'Publicar Gratis') {
      a.textContent = 'Publicá gratis'
      p2 = true
    }
  }
  log.push(p2 ? 'P-2 desktop header label -> Publicá gratis' : 'P-2 skip: desktop label already voseo (impl v1)')

  // ---- P-3/P-4 skip check (impl v1 live)
  const heroRowDone = !!document.querySelector('#hero-heading')?.closest('div')?.querySelector('a[href="/crear"]')
  log.push(heroRowDone ? 'P-3 skip: hero action row already in DOM (impl v1)' : 'P-3 MISSING: hero action row not found')
  const stripDone = !!document.querySelector('a[href="/crear"][aria-label*="sin costo"]')
  log.push(stripDone ? 'P-4 skip: CtaStrip publish primary already in DOM (impl v1)' : 'P-4 MISSING: CtaStrip publish not found')

  // ---- D-1: remove mobile header publish button (declutter — Checkpoint 4 feedback)
  const mobilePub = document.querySelector('header div.lg\\:hidden a[href="/crear"]')
  if (mobilePub) {
    mobilePub.remove()
    log.push('D-1 mobile header publish button removed')
  } else {
    log.push('D-1 FAILED: mobile header publish button not found')
  }

  // ---- D-2: FAB fixed bottom pill (<1024px), token values from live primary button
  const tokenSrc = document.querySelector('a[href="/crear"][aria-label*="sin costo"]') // hero primary (impl v1)
  if (tokenSrc) {
    const cs = getComputedStyle(tokenSrc)
    const fab = document.createElement('a')
    fab.id = 'publish-fab'
    fab.setAttribute('href', '/crear')
    fab.setAttribute('aria-label', 'Publicá gratis — sin costo ni comisiones')
    fab.style.cssText = [
      'position: fixed',
      'bottom: calc(env(safe-area-inset-bottom, 0px) + 12px)',
      'left: 50%',
      'transform: translateX(-50%)',
      'z-index: 40',
      'display: inline-flex',
      'align-items: center',
      'gap: 8px',
      'min-height: 48px',
      'padding: 0 22px',
      'border-radius: 9999px',
      `background-color: ${cs.backgroundColor}`,
      `color: ${cs.color}`,
      `font-family: ${cs.fontFamily}`,
      'font-size: 15px',
      'font-weight: 600',
      'text-decoration: none',
      'box-shadow: 0 4px 16px rgb(0 0 0 / 0.25)',
      'border: none',
    ].join('; ')
    fab.innerHTML = `${megaphoneSvg.replace('width="16" height="16"', 'width="20" height="20"')}<span>Publicá gratis</span>`
    const mq = document.createElement('style')
    mq.textContent = '@media (min-width: 1024px) { #publish-fab { display: none !important; } }'
    document.head.appendChild(mq)
    document.body.appendChild(fab)
    log.push(`D-2 FAB injected (bg ${cs.backgroundColor}, fg ${cs.color}) — desktop-hidden via media query`)
  } else {
    log.push('D-2 FAILED: token source primary button not found')
  }

  window.__patchLog = log
}, MEGAPHONE_SVG)

const patchLog = await page.evaluate(() => window.__patchLog)
console.log(patchLog.join('\n'))

// Serialize: strip scripts/portal, inline all CSS, absolutize asset URLs
const html = await page.evaluate((baseUrl) => {
  document.querySelectorAll('script, nextjs-portal').forEach((el) => el.remove())
  let css = ''
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) css += rule.cssText + '\n'
    } catch {
      /* cross-origin sheet skip */
    }
  }
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
  document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.remove())
  // absolutize src/href for static-server rendering (dev server serves them)
  for (const el of document.querySelectorAll('[src], [href]')) {
    for (const attr of ['src', 'href']) {
      const v = el.getAttribute(attr)
      if (v && v.startsWith('/_next')) el.setAttribute(attr, baseUrl + v)
    }
  }
  return '<!DOCTYPE html>\n' + document.documentElement.outerHTML
}, BASE)

writeFileSync(`${DIR}mockup.html`, html)
console.log('mockup.html saved')

// ---- renders at 3 viewports (serve over http from proposal dir via data: not needed — file URL with absolute image URLs works)
for (const [name, viewport] of Object.entries({
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
})) {
  const rctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const rpage = await rctx.newPage()
  await rpage.goto(`file://${DIR}mockup.html`, { waitUntil: 'load' })
  // trigger lazy images
  await rpage.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await rpage.waitForTimeout(1200)
  await rpage.screenshot({ path: `${DIR}render-${name}.png`, fullPage: true })
  console.log(`render-${name}.png saved`)
  await rctx.close()
}

await ctx.close()
await browser.close()
