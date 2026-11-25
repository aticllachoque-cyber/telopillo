// Stage 6 fallback proposal builder — vitrina-seller-catalog (2026-09-28)
// Delta-on-real-DOM recipe (precedent: home-publish-cta). Fetches the live
// pages, applies the F-1..F-6 patches statically, saves one self-contained
// mockup.html (storefront + seller manager sections).
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const BASE = 'http://localhost:3000'
const OUT = new URL('./mockup.html', import.meta.url).pathname

// Delta CSS: addresses F-1 (featured carousel <640px), F-2 (chips 44px mobile),
// F-3 (pagination stacks centered on mobile), F-6 (chips scroll fade affordance).
const DELTA_CSS = `
<style id="mockup-delta-f1-f6">
/* F-1: Destacados as horizontal scroll-snap carousel under 640px (was stacked full-width cards) */
@media (max-width: 639.5px) {
  section[aria-labelledby="featured-heading"] > ul,
  section[aria-labelledby="featured-heading"] ul[role="list"] {
    display: flex !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }
  section[aria-labelledby="featured-heading"] ul > li {
    flex: 0 0 72vw !important;
    max-width: 280px;
    scroll-snap-align: start;
  }
}
/* F-2: chips hit 44px touch target on mobile (parity with SearchSort) */
@media (max-width: 639.5px) {
  nav[aria-label="Categorías del catálogo"] a { min-height: 44px; }
}
/* F-6: right-edge fade signals horizontal scroll on chips */
nav[aria-label="Categorías del catálogo"] { position: relative; }
@media (max-width: 639.5px) {
  nav[aria-label="Categorías del catálogo"]::after {
    content: '';
    position: absolute;
    right: 0; top: 0; bottom: 4px; width: 40px;
    background: linear-gradient(to left, var(--background), transparent);
    pointer-events: none;
  }
}
/* F-3: pagination stacks vertically, centered, no ugly wrap on mobile */
@media (max-width: 639.5px) {
  nav[aria-label="Paginación de productos"] {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  nav[aria-label="Paginación de productos"] > span[aria-hidden="true"] { display: none; }
}
/* ---- Iteración 1: seller manager (F-7..F-11) — scoped to [data-mockup-seller] ---- */
/* F-7: visible position badge per card (order within its category section) */
[data-mockup-seller] .mockup-order-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.5rem; height: 1.5rem; padding: 0 0.4rem;
  border-radius: 9999px; background: var(--muted); color: var(--muted-foreground);
  font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums;
}
/* F-8: thumbnail placeholder next to the title (real impl: product image) */
[data-mockup-seller] .mockup-thumb {
  float: right; width: 56px; height: 56px; margin-left: 0.75rem; margin-bottom: 0.25rem;
  border-radius: var(--radius, 0.5rem); object-fit: cover;
  display: flex; align-items: center; justify-content: center;
  background: var(--muted); color: var(--muted-foreground);
  font-size: 0.8rem; font-weight: 600;
}
/* F-10: cap explanation visible without hover, next to the counter */
[data-mockup-seller] .mockup-cap-note { color: var(--muted-foreground); font-weight: 500; }
/* F-11: desktop ≥1024px reorder chevrons revealed on card hover/focus */
@media (min-width: 1024px) {
  [data-mockup-seller] [data-slot="card"] button[aria-label^="Subir"],
  [data-mockup-seller] [data-slot="card"] button[aria-label^="Bajar"] {
    opacity: 0; transition: opacity 0.15s ease;
  }
  [data-mockup-seller] [data-slot="card"]:hover button[aria-label^="Subir"],
  [data-mockup-seller] [data-slot="card"]:hover button[aria-label^="Bajar"],
  [data-mockup-seller] [data-slot="card"]:focus-within button[aria-label^="Subir"],
  [data-mockup-seller] [data-slot="card"]:focus-within button[aria-label^="Bajar"] {
    opacity: 1;
  }
}
/* Mockup-only: section divider between the two surfaces */
.mockup-divider { margin: 3rem 0; border: 0; border-top: 3px dashed var(--muted-foreground); position: relative; }
.mockup-divider-label {
  position: absolute; top: -0.9rem; left: 50%; transform: translateX(-50%);
  background: var(--background); padding: 0 1rem;
  font-size: 0.8rem; font-weight: 600; color: var(--muted-foreground); white-space: nowrap;
}
</style>
`

const browser = await chromium.launch()

// ---- Surface 1: storefront (anon) — F-1/F-2/F-3/F-6 ----
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const pageA = await ctxA.newPage()
await pageA.goto(`${BASE}/negocio/electrolab-bolivia`, { waitUntil: 'networkidle' })
await pageA.addStyleTag({ content: DELTA_CSS })
const htmlA = await pageA.content()
await ctxA.close()

// ---- Surface 2: mis-productos (logged in as ElectroLab owner) — F-4/F-5 ----
const ctxB = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const pageB = await ctxB.newPage()
await pageB.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await pageB.locator('#email').fill('marco.antonio.quintanilla@telopillo.test')
await pageB.locator('#password').fill('TestPassword123')
await pageB.getByRole('button', { name: 'Iniciar Sesión' }).click()
await pageB.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 })
await pageB.goto(`${BASE}/perfil/mis-productos`, { waitUntil: 'networkidle' })
await pageB.getByText('Destacados:').waitFor({ timeout: 15000 })

const patchInfo = await pageB.evaluate(() => {
  let removedLinks = 0
  let disabledButtons = 0
  // F-5: drop the duplicate "Ver mi vitrina" from the header card (keep the
  // contextual one inside CatalogManager). Header card = the link NOT next to
  // the "Destacados: X de 4" counter.
  const links = [...document.querySelectorAll('a')].filter((a) =>
    a.textContent?.trim().includes('Ver mi vitrina')
  )
  for (const a of links) {
    const inManager =
      a.closest('p')?.textContent?.includes('Destacados:') ||
      a.previousElementSibling?.textContent?.includes('Destacados:')
    const nearCounter = a.parentElement?.querySelector('p')?.textContent?.includes('Destacados:')
    if (!nearCounter && !inManager) {
      a.closest('button, a')?.remove()
      removedLinks++
    }
  }
  // F-4: Destacar buttons lie at cap — disable them with explanatory title
  for (const btn of document.querySelectorAll('button')) {
    const label = btn.textContent?.trim()
    if (label === 'Destacar' && !btn.disabled) {
      btn.disabled = true
      btn.setAttribute('aria-disabled', 'true')
      btn.title = 'Máximo 4 destacados. Quita uno para destacar otro.'
      disabledButtons++
    }
  }
  // Iteración 1 patches (F-7..F-10) on the manager cards:
  let badges = 0, thumbs = 0, arrowTitles = 0
  for (const section of document.querySelectorAll('section[aria-labelledby^="catalog-"]')) {
    const catName = section.querySelector('h3')?.textContent?.replace(/\(\d+\)/, '').trim() ?? ''
    const cards = section.querySelectorAll('[data-slot="card"]')
    cards.forEach((card, i) => {
      // F-7: position badge (1-based, per category section)
      if (!card.querySelector('.mockup-order-badge')) {
        const badge = document.createElement('span')
        badge.className = 'mockup-order-badge'
        badge.textContent = `${i + 1}`
        badge.title = `Posición ${i + 1} en ${catName}`
        const titleBox = card.querySelector('a.hover\\:underline')?.parentElement
        titleBox?.prepend(badge)
        if (badge.isConnected) badges++
      }
      // F-8: thumbnail placeholder with product initials (real impl: product image)
      if (!card.querySelector('.mockup-thumb')) {
        const title = card.querySelector('a.hover\\:underline')?.textContent ?? ''
        const initials = title.split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()
        const thumb = document.createElement('div')
        thumb.className = 'mockup-thumb'
        thumb.setAttribute('aria-hidden', 'true')
        thumb.textContent = initials || '·'
        thumb.title = 'Mockup: placeholder — la implementación usa la imagen del producto'
        card.querySelector('[data-slot="card-content"]')?.prepend(thumb)
        if (thumb.isConnected) thumbs++
      }
    })
    // F-9: arrow tooltips name the category list they reorder
    for (const btn of section.querySelectorAll('button[aria-label^="Subir"], button[aria-label^="Bajar"]')) {
      btn.title = btn.getAttribute('aria-label') + ` (lista ${catName})`
      arrowTitles++
    }
  }
  // F-10: cap explanation next to the counter, visible without hover
  let capNote = 0
  for (const p of document.querySelectorAll('p')) {
    if (p.textContent.includes('de') && /Destacados:\s*\d+\s*de\s*\d+/.test(p.textContent) && !p.querySelector('.mockup-cap-note')) {
      const note = document.createElement('span')
      note.className = 'mockup-cap-note'
      note.textContent = ' · Máximo alcanzado — quitá uno para destacar otro'
      p.appendChild(note)
      capNote++
    }
  }
  return { removedLinks, disabledButtons, totalLinks: links.length, badges, thumbs, arrowTitles, capNote }
})
console.log('patches:', JSON.stringify(patchInfo))

// Extract just the manager area + page header (whole main keeps class context)
const mainHtml = await pageB.evaluate(() => document.querySelector('main')?.outerHTML ?? '')
await ctxB.close()
await browser.close()

// ---- Assemble ----
const divider = `<hr class="mockup-divider"><span class="mockup-divider-label">Superficie 2 — vendedor: /perfil/mis-productos (F-4, F-5)</span>`
const bodyCloseIdx = htmlA.lastIndexOf('</body>')
if (bodyCloseIdx === -1) throw new Error('no </body> in storefront html')
let mockup =
  htmlA.slice(0, bodyCloseIdx) +
  `<div data-mockup-seller class="container mx-auto max-w-7xl px-4 sm:px-6">${divider}${mainHtml}</div>` +
  htmlA.slice(bodyCloseIdx)

// ---- Post-process: make self-contained + render-safe (validated 2026-09-28) ----
// 1. Inline the dev-server CSS (Next dev 403s cross-origin stylesheet requests,
//    so <link> never applies when the mockup is rendered from another origin).
const cssHrefRaw = mockup.match(/<link rel="stylesheet" href="([^"]+)"/)?.[1]
if (cssHrefRaw) {
  const cssHref = cssHrefRaw.startsWith('/') ? BASE + cssHrefRaw : cssHrefRaw
  const res = await fetch(cssHref)
  if (!res.ok) throw new Error(`dev CSS fetch ${res.status} — is dev server up?`)
  let css = await res.text()
  css = css
    .replaceAll('url(../media/', 'url(http://localhost:3000/_next/static/media/')
    .replaceAll('url("../media/', 'url("http://localhost:3000/_next/static/media/')
  mockup = mockup.replace(/<link rel="stylesheet"[^>]*>/, `<style data-inlined-dev-css>${css}</style>`)
}
// 2. Dev font <style type="text/css"> serializes without a closing tag in
//    page.content() — it swallows the delta <style>; close it.
mockup = mockup.replace(
  '<style type="text/css">\n<style id="mockup-delta-f1-f6">',
  '<style type="text/css">\n</style><style id="mockup-delta-f1-f6">'
)
// 3. Strip the Next dev-tools overlay script — page.content() mangles the
//    <nextjs-portal> element into the script's text content, and the script's
//    inline `display: block` makes that raw markup render as visible text.
//    Dev-only artifact; production never ships it.
mockup = mockup.replace(/<script data-nextjs-dev-overlay[\s\S]*?<\/script>/g, '')
// 3b. Absolutize nextjs dev font URLs (relative would break off-origin).
mockup = mockup.replaceAll('url(/__nextjs_font/', 'url(http://localhost:3000/__nextjs_font/')
// 4. Extra delta rules validated against phantom overflow:
//    grid items shrinkable (carousel intrinsic min-content otherwise widens the
//    lg:grid-cols-3 track) + overflow-x guard.
mockup = mockup.replace(
  '</style>\n<style id="mockup-delta-f1-f6">',
  `/* grid items must be shrinkable so the carousel scroll-containers stay in-flow */
@media (max-width: 639.5px) {
  .grid.lg\\:grid-cols-3 > div { min-width: 0; }
}
html, body { overflow-x: hidden; }
</style>
<style id="mockup-delta-f1-f6">`
)

writeFileSync(OUT, mockup)
console.log('written', OUT, mockup.length, 'bytes')
