// Stage 6 fallback mockups for buscar-business-card (stitch:fallback precedent
// buscar/storefront/publicar/busco): hydrated real DOM of /buscar?type=negocios
// and type=personas with the result cards rebuilt product-card-like (F-1..F-6)
// and the ul container switched to the ProductGrid grid. Card data comes from
// the page's own API payload (search-businesses / search-profiles), so every
// name/description/count in the mock is real. Scripts + nextjs-portal stripped;
// built CSS inlined; <base> injected so fonts/images resolve for renders.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

// lucide icons, exact markup the real components render (size-3.5 per
// VerificationBadge, h-3 w-3 per productPresentation locationIcon)
const ICONS = {
  phone:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone size-3.5" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
  shield:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check size-3.5 text-green-600 dark:text-green-400" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  mappin:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin h-3 w-3 shrink-0" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  pkg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package h-3 w-3 shrink-0" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
}

// chip = shared VerificationBadge (size="sm", positive variant) exact classes
const CHIP_CLASSES =
  'inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'

const FALLBACK_CSS = `
.aspect-\\[16\\/9\\]{aspect-ratio:16/9}
@media (min-width:640px){.sm\\:aspect-\\[16\\/10\\]{aspect-ratio:16/10}}
.size-3\\.5{width:.875rem;height:.875rem}
.min-h-10{min-height:2.5rem}
.text-\\[11px\\]{font-size:11px}
.tracking-wide{letter-spacing:.025em}
.duration-300{transition-duration:.3s}
.group:hover .group-hover\\:scale-105{transform:scale(1.05)}
.h-20{height:5rem}.w-20{width:5rem}
@media (min-width:640px){.sm\\:h-24{height:6rem}.sm\\:w-24{width:6rem}}
`

const GRID_CLASSES = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6 list-none p-0 m-0'

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function initialsOf(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function tileAvatar(live, name) {
  if (live.imgSrc) {
    return `<img src="${esc(live.imgSrc)}" alt="" class="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-card object-cover transition-transform duration-300 group-hover:scale-105" />`
  }
  // reuse only the live avatar-fallback COLOR tokens (bg-/text- incl. dark:
  // variants) — layout utilities like size-full would fight the tile sizing
  let cls = 'bg-primary/10 text-primary'
  let initials = initialsOf(name)
  if (live.fallbackClass) {
    const kept = live.fallbackClass
      .split(/\s+/)
      .filter((t) => /^(?:dark:)?(?:bg|text)-./.test(t) && !/^(?:dark:)?text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(t))
      .join(' ')
      .trim()
    if (kept) cls = kept
  }
  if (live.initials && /^[A-ZÁÉÍÓÚÑ]{1,3}$/.test(live.initials)) initials = live.initials
  return `<span class="${esc(cls)} flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full text-2xl font-semibold leading-none transition-transform duration-300 group-hover:scale-105">${esc(initials)}</span>`
}

function chip(label) {
  return `<span class="absolute left-2 top-2"><span class="${CHIP_CLASSES}" role="img" aria-label="${esc(label)}">${ICONS.phone}${esc(label)}${ICONS.shield}</span></span>`
}

function businessCard(b, live) {
  const loc = [b.business_city, b.business_department].filter(Boolean).join(', ')
  const desc = String(b.business_description || '').trim()
  return `
<a href="/negocio/${esc(b.slug)}" class="group block overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="${esc(b.business_name)}${loc ? ' — ' + esc(loc) : ''}">
  <div class="relative flex aspect-[16/9] sm:aspect-[16/10] items-center justify-center overflow-hidden bg-muted">
    ${tileAvatar(live, b.business_name)}
    ${b.is_nit_verified ? chip('Negocio con Teléfono') : ''}
  </div>
  <div class="space-y-1.5 p-3 sm:p-4">
    <h3 class="truncate font-semibold text-base sm:text-lg leading-snug transition-colors group-hover:text-primary">${esc(b.business_name)}</h3>
    ${b.business_category ? `<p class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">${esc(b.business_category)}</p>` : ''}
    ${desc ? `<p class="line-clamp-2 min-h-10 text-sm text-muted-foreground">${esc(desc)}</p>` : ''}
    ${loc ? `<div class="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">${ICONS.mappin}<span class="truncate">${esc(loc)}</span></div>` : ''}
    <div class="mt-1.5 flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
      <span class="flex min-w-0 shrink-0 items-center gap-1">${ICONS.pkg}<span>${Number(b.active_listings_count || 0)} productos activos</span></span>
      ${b.owner_name ? `<span class="truncate">Vendedor: ${esc(b.owner_name)}</span>` : ''}
    </div>
  </div>
</a>`
}

function personCard(p, live) {
  const loc = [p.location_city, p.location_department].filter(Boolean).join(', ')
  const href = p.business_slug ? `/negocio/${esc(p.business_slug)}` : `/vendedor/${esc(p.id)}`
  return `
<a href="${href}" class="group block overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="${esc(p.full_name)}${loc ? ' — ' + esc(loc) : ''}">
  <div class="relative flex aspect-[16/9] sm:aspect-[16/10] items-center justify-center overflow-hidden bg-muted">
    ${tileAvatar(live, p.full_name)}
    ${Number(p.verification_level || 0) >= 1 ? chip('Vendedor con Teléfono') : ''}
  </div>
  <div class="space-y-1.5 p-3 sm:p-4">
    <h3 class="truncate font-semibold text-base sm:text-lg leading-snug transition-colors group-hover:text-primary">${esc(p.full_name)}</h3>
    ${loc ? `<div class="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">${ICONS.mappin}<span class="truncate">${esc(loc)}</span></div>` : ''}
    ${live.ratingHtml || ''}
    <div class="mt-1.5 flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
      <span class="flex min-w-0 shrink-0 items-center gap-1">${ICONS.pkg}<span>${Number(p.active_listings_count || 0)} productos activos</span></span>
      <span class="text-amber-600 dark:text-amber-400">Vendedor</span>
    </div>
  </div>
</a>`
}

const browser = await chromium.launch()

// Step 1 (browser): fetch the page's own API payload + per-card live data
// (avatar palette/initials/img, personas rating line). Step 2 (node): build
// card HTML. Step 3 (browser): patch the cloned DOM, strip scripts, inline CSS.
async function buildMockup({ url, apiPath, hrefSelectors, keyOf, cardBuilder, outFile }) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(BASE + url, { waitUntil: 'load' })
  await page.waitForSelector(hrefSelectors.join(','), { timeout: 60_000 })
  await page.waitForTimeout(800)

  const data = await page.evaluate(
    async ({ apiPath, hrefSelectors }) => {
      const esc = (s) =>
        String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      const res = await fetch(apiPath)
      const rows = await res.json()
      const payload = rows.businesses || rows.profiles || []
      const anchors = [...document.querySelectorAll(hrefSelectors.join(','))]
      const ul = anchors.map((a) => a.closest('ul')).find((u) => u && u.querySelector('li'))
      const cards = ul
        ? [...ul.querySelectorAll('li')].map((li) => {
            const a = li.querySelector('a[href^="/negocio/"], a[href^="/vendedor/"]')
            if (!a) return null
            const fallback =
              li.querySelector('[data-slot="avatar-fallback"]') ||
              [...li.querySelectorAll('span')].find(
                (s) => s.children.length === 0 && /^[A-ZÁÉÍÓÚÑ]{1,3}$/.test(s.textContent.trim()),
              )
            const ratingDiv = [...li.querySelectorAll('div')].find((d) => d.querySelector('svg.lucide-star'))
            const starSvg = ratingDiv?.querySelector('svg.lucide-star')?.outerHTML || null
            return {
              key: decodeURIComponent((a.getAttribute('href') || '').split('/').pop()),
              fallbackClass: fallback?.getAttribute('class') || null,
              initials: fallback?.textContent.trim() || null,
              imgSrc: li.querySelector('img')?.getAttribute('src') || null,
              ratingHtml: starSvg
                ? `<div class="flex items-center gap-1 text-xs sm:text-sm">${starSvg}<span class="text-muted-foreground">${esc(ratingDiv.textContent.trim())}</span></div>`
                : null,
            }
          })
        : []
      return { payload, cards }
    },
    { apiPath, hrefSelectors },
  )

  const patches = []
  for (const live of data.cards.filter(Boolean)) {
    const row = data.payload.find((r) => keyOf(r) === live.key)
    if (row) patches.push({ key: live.key, html: cardBuilder(row, live) })
  }

  const html = await page.evaluate(
    async ({ hrefSelectors, patches, gridClasses, fallbackCss }) => {
      const clone = document.documentElement.cloneNode(true)
      clone.querySelectorAll('script, nextjs-portal').forEach((el) => el.remove())
      for (const link of [...clone.querySelectorAll('link[rel="stylesheet"]')]) {
        try {
          const css = await (await fetch(link.href)).text()
          const style = document.createElement('style')
          style.textContent = css
          link.replaceWith(style)
        } catch {
          link.remove()
        }
      }
      const body = clone.querySelector('body')
      const anchors = [...body.querySelectorAll(hrefSelectors.join(','))]
      const ul = anchors.map((a) => a.closest('ul')).find((u) => u && u.querySelector('li'))
      if (!ul) throw new Error('results ul not found')
      ul.setAttribute('class', gridClasses)
      for (const a of anchors) {
        const li = a.closest('li')
        const key = decodeURIComponent((a.getAttribute('href') || '').split('/').pop())
        const patch = patches.find((p) => p.key === key)
        if (li && patch) li.innerHTML = patch.html
      }
      const head = clone.querySelector('head')
      const base = document.createElement('base')
      base.setAttribute('href', location.origin + '/')
      head.insertBefore(base, head.firstChild)
      const fb = document.createElement('style')
      fb.textContent = fallbackCss
      head.appendChild(fb)
      return '<!doctype html>\n' + clone.outerHTML
    },
    { hrefSelectors, patches, gridClasses: GRID_CLASSES, fallbackCss: FALLBACK_CSS },
  )

  writeFileSync(DIR + outFile, html)
  await ctx.close()
  console.log(`${outFile}: rebuilt ${patches.length}/${data.payload.length} cards`)
  return html
}

const businessHtml = await buildMockup({
  url: '/buscar?type=negocios&q=electronica',
  apiPath: '/api/search-businesses?q=electronica&limit=24',
  hrefSelectors: ['a[href^="/negocio/"]'],
  keyOf: (r) => r.slug,
  cardBuilder: businessCard,
  outFile: 'mockup-negocios.html',
})

const personasHtml = await buildMockup({
  url: '/buscar?type=personas&q=electronica',
  apiPath: '/api/search-profiles?q=electronica&limit=24',
  hrefSelectors: ['a[href^="/vendedor/"]', 'a[href^="/negocio/"]'],
  keyOf: (r) => r.business_slug || r.id,
  cardBuilder: personCard,
  outFile: 'mockup-personas.html',
})

// renders: 3 viewports x both mockups (fullPage, dsf=2)
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}
for (const [name, viewport] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.setContent(businessHtml, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${DIR}render-${name}.png`, fullPage: true })
  await page.setContent(personasHtml, { waitUntil: 'networkidle', timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${DIR}render-personas-${name}.png`, fullPage: true })
  await ctx.close()
  console.log(`render ${name} done`)
}

await browser.close()
console.log('mockups + renders done')
