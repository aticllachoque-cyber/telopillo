// Stage 6 fallback (stitch:fallback, precedent x6): faithful mockups of
// /busco/[id] over hydrated real DOM with minimal inline patches:
//   F-1 avatar-fallback muted -> foreground/80 (sidebar + OfferCard minis)
//   F-2 compact near-top mobile CTA (anon), patrón hermano producto F-1
//   F-3 meta duplicada: fila bajo H1 removida (Resumen = única fuente)
//   F-4 voseo CTA copy
//   F-6 Resumen role=list/listitem (mock equivalente de ul/li)
//   F-5 deferred (badge queda con matiz semántico — sin cambio visual)
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const STATES = {
  primary: '679962b7-ddfd-4a65-ab27-50d0b47d1859',
  ofertas: 'f8609770-80c1-441f-8c37-9729816ef450',
}

const browser = await chromium.launch()

for (const [state, id] of Object.entries(STATES)) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/busco/${id}`, { waitUntil: 'load' })
  await page.waitForSelector('text=Esta persona publicó la necesidad', { timeout: 30_000 })
  await page.waitForTimeout(1200)

  const html = await page.evaluate(() => {
    // --- base recipe: strip + inline CSS ---
    document.querySelectorAll('script').forEach((s) => s.remove())
    document.querySelectorAll('nextjs-portal').forEach((n) => n.remove())
    const inlineCss = async () => {
      for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
        const css = await fetch(link.href).then((r) => r.text())
        const style = document.createElement('style')
        style.textContent = css
        link.replaceWith(style)
      }
    }

    // --- F-3: remove duplicated meta row under H1 (h1 + div.text-muted-foreground) ---
    const titleBlock = document.querySelector('h1')?.parentElement
    const metaRow = document.querySelector('h1 + div.text-muted-foreground')
    metaRow?.remove()

    // --- F-1: avatar fallback contrast (sidebar + OfferCard minis) ---
    for (const el of document.querySelectorAll('[data-slot="avatar-fallback"]')) {
      el.classList.remove('text-muted-foreground')
      el.classList.add('text-foreground/80')
    }

    // --- F-4 + F-2: voseo copy + compact near-top mobile CTA (anon) ---
    const loginLink = document.querySelector('a[href*="/login?redirect"]')
    let compactDone = false
    if (loginLink) {
      const ctaCard = loginLink.closest('[data-slot="card"]') || loginLink.parentElement.parentElement
      // voseo on the original button (F-4) — stays for desktop
      const btnLabel = loginLink.querySelector('span')
      ;(btnLabel ?? loginLink).textContent = 'Iniciá sesión para ofrecer'
      // original card: desktop-only (F-2 keeps desktop CTA, mobile uses compact)
      ctaCard?.classList.add('hidden', 'lg:block')
      // voseo the card copy too
      const cardP = ctaCard?.querySelector('p.text-muted-foreground')
      if (cardP) cardP.textContent = '¿Tenés lo que esta persona busca?'
      // compact CTA (F-2) — clone under the title block, mobile/tablet only
      const clone = loginLink.cloneNode(true)
      clone.classList.remove('w-full')
      clone.classList.add('shrink-0')
      const p = document.createElement('p')
      p.className = 'text-sm text-foreground/80 text-pretty min-w-0'
      p.textContent = '¿Tenés lo que esta persona busca?'
      const compact = document.createElement('div')
      compact.className = 'flex items-center justify-between gap-3 rounded-lg border border-border/80 p-3 lg:hidden'
      compact.appendChild(p)
      compact.appendChild(clone)
      titleBlock?.after(compact)
      compactDone = true
    }

    // --- F-6: Resumen semantics (role=list/listitem == ul/li equivalent in mock) ---
    const resumen = document.querySelector('[aria-label="Resumen"]')
    if (resumen) {
      resumen.setAttribute('role', 'list')
      resumen.removeAttribute('aria-label')
      resumen.setAttribute('aria-label', 'Resumen')
      for (const child of [...resumen.children]) child.setAttribute('role', 'listitem')
    }

    return inlineCss().then(() => document.documentElement.outerHTML)
  })
  writeFileSync(DIR + `mockup-${state}.html`, html)
  console.log(`mockup-${state}.html:`, (html.length / 1024).toFixed(0), 'KB')
  await ctx.close()
}
await browser.close()
console.log('mockups done')
