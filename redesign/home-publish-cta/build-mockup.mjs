// Stage 6 faithful mockup for home-publish-cta
// Real hydrated DOM of / + minimal patches (F-1..F-5). Precedent: stitch:fallback x8.
// Patches:
//   P-1 mobile/tablet header: compact primary "Publicá gratis" button (clone Entrar) in lg:hidden controls
//   P-2 desktop header label: "Publicar Gratis" -> "Publicá gratis"
//   P-3 hero: seller action row — primary "Publicá gratis" (/crear) + existing muted /busco link
//   P-4 CtaStrip: primary "Publicá gratis" first, "Crear cuenta gratis" outline, login link kept
//   P-5 drawer label handled in impl (portal not in static DOM)
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

  // ---- P-2: desktop header label voseo
  for (const a of document.querySelectorAll('header a[href="/crear"]')) {
    if (a.textContent.trim() === 'Publicar Gratis') {
      a.textContent = 'Publicá gratis'
      log.push('P-2 desktop header label -> Publicá gratis')
    }
  }

  // ---- P-1: mobile controls publish button (clone Entrar for exact button classes)
  const mobileControls = document.querySelector('header div.lg\\:hidden')
  const entrar = mobileControls?.querySelector('a[href="/login"]')
  if (mobileControls && entrar) {
    const pub = entrar.cloneNode(true)
    pub.setAttribute('href', '/crear')
    pub.setAttribute('aria-label', 'Publicá gratis')
    pub.innerHTML = `${megaphoneSvg}<span>Publicá</span><span class="hidden sm:inline"> gratis</span>`
    mobileControls.insertBefore(pub, entrar)
    log.push('P-1 mobile publish button injected before Entrar')
  } else {
    log.push('P-1 FAILED: mobile controls or Entrar not found')
  }

  // ---- P-3: hero seller action row
  const heroCard = document.getElementById('hero-heading')?.closest('div')
  const mutedLinkP = heroCard?.querySelector('p a[href="/busco"]')?.closest('p')
  if (heroCard && mutedLinkP) {
    const registerBtn = document.querySelector('a[href="/register"]') // CtaStrip primary (anon state) — exact default button classes
    const row = document.createElement('div')
    row.className = 'mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4'
    const pubA = document.createElement('a')
    pubA.setAttribute('href', '/crear')
    pubA.className = registerBtn
      ? registerBtn.className + ' min-h-[44px] touch-manipulation px-6'
      : 'inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90'
    pubA.setAttribute('aria-label', 'Publicá gratis — sin costo ni comisiones')
    pubA.innerHTML = `${megaphoneSvg}<span>Publicá gratis</span>`
    row.appendChild(pubA)
    // keep the seller-discovery link, copy clarified (F-3)
    const link = mutedLinkP.querySelector('a')
    if (link) {
      const span = link.querySelector('span.text-pretty')
      if (span) span.textContent = '¿Vendés? Mirá qué buscan los compradores'
    }
    row.appendChild(mutedLinkP.cloneNode(true))
    mutedLinkP.replaceWith(row)
    log.push('P-3 hero action row: publish primary + /busco link kept')
  } else {
    log.push('P-3 FAILED: hero muted link not found')
  }

  // ---- P-4: CtaStrip reorder — publish first, register outline
  const stripCard = entrar && document.querySelector('a[href="/register"]')?.closest('[data-slot="card-content"], .card') || null
  const regBtn = document.querySelector('a[href="/register"]')
  if (regBtn) {
    const container = regBtn.closest('div')
    const loginLink = container?.querySelector('a[href="/login"]')
    // publish primary (clone register default button)
    const pubA = regBtn.cloneNode(true)
    pubA.setAttribute('href', '/crear')
    pubA.innerHTML = `${megaphoneSvg}<span>Publicá gratis</span>`
    pubA.setAttribute('aria-label', 'Publicá gratis — sin costo ni comisiones')
    // register -> outline variant (shadcn outline classes)
    regBtn.className = regBtn.className
      .replace(/bg-primary\s*/, '')
      .replace(/text-primary-foreground\s*/, '')
      .replace(/hover:bg-primary\/90\s*/, '') +
      ' border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground'
    regBtn.textContent = 'Crear cuenta gratis'
    container.insertBefore(pubA, regBtn)
    log.push('P-4 CtaStrip: publish primary first, register outline, login link kept' + (loginLink ? '' : ' (login link missing?)'))
  } else {
    log.push('P-4 FAILED: register button not found (authed state?)')
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
