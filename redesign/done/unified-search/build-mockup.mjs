// Stage 6 fallback mockups for unified-search (stitch:fallback precedent
// buscar/storefront/publicar/busco-publicar): hydrated real DOM of /buscar and
// the Header with minimal DOM patches for F-1/F-3/F-4/F-5. States:
//   desktop-tabs-productos  — /buscar?q=samsung, tab Productos activa + tabs con conteos
//   desktop-tabs-negocios   — mismo page, tab Negocios activa (mock rows) + filtros adaptados
//   mobile-overlay-selector — overlay móvil con SearchBar unificado (selector incluido)
// Scripts + nextjs-portal stripped; built CSS inlined. New elements use inline
// styles resolved from live CSS custom properties (dev CSS may not contain the
// utility classes for markup that doesn't exist yet).
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

// F-5: voseo unification on /buscar (exact DOM strings)
const TEXT_PATCHES = [
  ['Buscar Productos', 'Buscar'],
  ['Intenta con otras palabras clave o ajusta los filtros', 'Intentá con otras palabras clave o ajustá los filtros'],
  ['Publica una solicitud y deja que los vendedores te contacten con ofertas.', 'Publicá una solicitud y dejá que los vendedores te contacten con ofertas.'],
  ['Publica una solicitud y deja que los vendedores te contacten.', 'Publicá una solicitud y dejá que los vendedores te contacten.'],
  ['Publicar lo que busco', 'Publicá lo que buscás'],
]

// Mock result rows for the Negocios tab (seeded local data)
const MOCK_BUSINESSES = [
  {
    name: 'Tienda Electrónica La Paz',
    initials: 'TE',
    meta: 'Electrónica · La Paz',
    count: 3,
    verified: true,
    owner: 'Diego Mamani',
  },
  {
    name: 'Casa Andina Hogar',
    initials: 'CA',
    meta: 'Hogar · Cochabamba',
    count: 1,
    verified: true,
    owner: 'Casa Andina Hogar',
  },
]

const browser = await chromium.launch()

// ---------- desktop states ----------
const desktop = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
})
const page = await desktop.newPage()

await page.goto(`${BASE}/buscar?q=samsung`, { waitUntil: 'load' })
// wait for real product cards (not skeletons) — dev compile + search latency
await page.waitForFunction(
  () => document.querySelectorAll('a[href^="/productos/"]').length > 0,
  { timeout: 90_000 }
).catch(() => {})
await page.waitForTimeout(1500)

async function serialize({ activeTab }) {
  return await page.evaluate(
    async ({ activeTab, patches, businesses }) => {
      const clone = document.documentElement.cloneNode(true)
      clone.querySelectorAll('script, nextjs-portal').forEach((el) => el.remove())

      // inline built stylesheets (file:// render would otherwise be unstyled)
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
      const css = getComputedStyle(document.documentElement)
      const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback

      // --- F-5 text patches (voseo + h1) via TreeWalker
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
      const nodes = []
      while (walker.nextNode()) nodes.push(walker.currentNode)
      for (const node of nodes) {
        for (const [from, to] of patches) {
          if (node.textContent.includes(from)) node.textContent = node.textContent.replaceAll(from, to)
        }
      }

      // --- F-1: type selector mock in every SearchBar (header + page).
      // Injected as a flex item before the input inside the search form.
      const dropdown = document.createElement('button')
      dropdown.type = 'button'
      dropdown.setAttribute('aria-haspopup', 'menu')
      dropdown.setAttribute('aria-expanded', 'false')
      dropdown.textContent = 'Todo ▾'
      dropdown.setAttribute('style', [
        'display:inline-flex', 'align-items:center', 'gap:4px',
        'height:40px', 'padding:0 12px', 'white-space:nowrap',
        `border-right:1px solid ${token('--border', '#e5e7eb')}`,
        `color:${token('--muted-foreground', '#6b7280')}`,
        'background:transparent', 'font-size:14px', 'font-weight:500',
      ].join(';'))
      for (const form of body.querySelectorAll('form')) {
        const input = form.querySelector('input[aria-label="Buscar productos"]')
        if (!input) continue
        const wrapper = input.closest('div.relative')
        if (wrapper && wrapper.parentElement === form) {
          wrapper.style.flex = '1'
          form.insertBefore(dropdown.cloneNode(true), wrapper)
        }
      }

      // --- F-1: tabs markup injected after the page header block (mb-8 div
      // that contains the h1 inside the /buscar container)
      const TABS = [
        { id: 'productos', label: 'Productos', count: '2' },
        { id: 'negocios', label: 'Negocios', count: '1' },
        { id: 'solicitudes', label: 'Solicitudes', count: '0' },
        { id: 'personas', label: 'Personas', count: '1' },
      ]
      const tabsHtml = TABS.map((t) => {
        const active = t.id === activeTab
        return `<button role="tab" aria-selected="${active}" tabindex="${active ? 0 : -1}" style="
display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;margin-right:8px;
border-radius:9999px;border:1px solid ${active ? 'transparent' : token('--border', '#e5e7eb')};
background:${active ? token('--primary', '#111827') : 'transparent'};
color:${active ? token('--primary-foreground', '#ffffff') : token('--foreground', '#111827')};
font-size:14px;font-weight:500;cursor:pointer;">
${t.label}<span aria-hidden style="
display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;
border-radius:9999px;font-size:12px;
background:${active ? 'rgba(255,255,255,.2)' : token('--muted', '#f3f4f6')};
color:${active ? token('--primary-foreground', '#fff') : token('--muted-foreground', '#6b7280')};">${t.count}</span>
</button>`
      }).join('')
      const tabsWrap = document.createElement('div')
      tabsWrap.setAttribute('role', 'tablist')
      tabsWrap.setAttribute('aria-label', 'Tipo de búsqueda')
      tabsWrap.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:0;margin-bottom:24px;')
      tabsWrap.innerHTML = tabsHtml

      for (const h1 of body.querySelectorAll('h1')) {
        if (h1.textContent.trim() === 'Buscar' && h1.parentElement.className.includes('mb-8')) {
          h1.parentElement.insertAdjacentElement('afterend', tabsWrap)
          break
        }
      }

      if (activeTab === 'negocios') {
        // --- F-4: filters card reduced to business filters (categoría negocio + departamento)
        const filterCard = body.querySelector('.lg\\:w-64')
        if (filterCard) {
          filterCard.querySelector('.p-4, .p-5')?.replaceChildren()
          const reduced = document.createElement('div')
          reduced.setAttribute('style', 'padding:20px;display:flex;flex-direction:column;gap:16px;')
          const label = (txt) => `<p style="font-size:14px;font-weight:600;margin:0 0 6px;">${txt}</p>`
          const select = (txt) => `<div style="height:40px;border:1px solid ${token('--border', '#e5e7eb')};border-radius:8px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:14px;color:${token('--muted-foreground', '#6b7280')};">${txt}<span aria-hidden>▾</span></div>`
          reduced.innerHTML = `${label('Categoría')}${select('Todas las categorías')}${label('Departamento')}${select('Todos los departamentos')}`
          filterCard.querySelector('.p-4, .p-5')?.appendChild(reduced)
        }

        // --- results column: mock business rows (F-2 backend assumed working)
        const filterCol = body.querySelector('.lg\\:w-64')
        const results = filterCol?.nextElementSibling
        if (results) {
          results.replaceChildren()
          const ul = document.createElement('ul')
          ul.setAttribute('role', 'list')
          ul.setAttribute('style', 'display:flex;flex-direction:column;gap:12px;list-style:none;margin:0;padding:0;')
          for (const b of businesses) {
            const li = document.createElement('li')
            li.innerHTML = `<a href="/negocio/tienda-electronica-la-paz" style="
display:flex;align-items:center;gap:16px;padding:16px;
border:1px solid ${token('--border', '#e5e7eb')};border-radius:12px;background:${token('--card', '#fff')};text-decoration:none;">
<span aria-hidden style="display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:9999px;flex-shrink:0;background:${token('--muted', '#f3f4f6')};font-weight:700;color:${token('--muted-foreground', '#6b7280')};">${b.initials}</span>
<span style="display:flex;flex-direction:column;gap:4px;min-width:0;">
<span style="display:flex;align-items:center;gap:6px;font-weight:600;color:${token('--foreground', '#111827')};font-size:15px;">${b.name}
<span style="display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:600;color:#15803d;">✓ Verificado</span></span>
<span style="font-size:13px;color:${token('--muted-foreground', '#6b7280')};">${b.meta}</span>
<span style="font-size:13px;color:${token('--muted-foreground', '#6b7280')};">${b.count} productos activos · Vendedor: ${b.owner}</span>
</span>
<span aria-hidden style="margin-left:auto;color:${token('--muted-foreground', '#6b7280')};">›</span>
</a>`
            ul.appendChild(li)
          }
          const heading = document.createElement('p')
          heading.setAttribute('style', `font-size:14px;color:${token('--muted-foreground', '#6b7280')};margin:0 0 12px;`)
          heading.textContent = '1 resultado para samsung'
          results.appendChild(heading)
          results.appendChild(ul)
        }
      }

      return '<!doctype html>' + clone.outerHTML
    },
    { activeTab, patches: TEXT_PATCHES, businesses: MOCK_BUSINESSES }
  )
}

const htmlP = await serialize({ activeTab: 'productos' })
writeFileSync(`${DIR}mockup-tabs-productos.html`, htmlP)
const htmlN = await serialize({ activeTab: 'negocios' })
writeFileSync(`${DIR}mockup-tabs-negocios.html`, htmlN)

await desktop.close()

// ---------- mobile overlay state (F-3: SearchBar unificado con selector) ----------
const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
})
const mpage = await mobile.newPage()
await mpage.goto(BASE + '/', { waitUntil: 'load' })
await mpage.waitForTimeout(1200)
const toggle = mpage.getByRole('button', { name: /buscar/i })
if (await toggle.count()) {
  await toggle.first().click()
  await mpage.waitForTimeout(800)
}
const htmlM = await mpage.evaluate(async (patches) => {
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
  const live = getComputedStyle(document.documentElement)
  const token = (name, fallback) => live.getPropertyValue(name).trim() || fallback

  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    for (const [from, to] of patches) {
      if (node.textContent.includes(from)) node.textContent = node.textContent.replaceAll(from, to)
    }
  }

  // F-3: overlay form gains the type selector (same SearchBar as desktop).
  // Chip goes INSIDE the form, before the relative wrapper (never inside it —
  // the absolute left-3 search icon would render on top of the chip).
  for (const form of body.querySelectorAll('form')) {
    const input = form.querySelector('input[aria-label="Buscar productos"]')
    if (!input) continue
    const wrapper = input.closest('div.relative')
    if (wrapper && wrapper.parentElement === form && !form.querySelector('button[aria-haspopup="menu"]')) {
      wrapper.style.flex = '1'
      const dd = document.createElement('button')
      dd.type = 'button'
      dd.setAttribute('aria-haspopup', 'menu')
      dd.textContent = 'Todo ▾'
      dd.setAttribute('style', [
        'display:inline-flex', 'align-items:center', 'gap:4px',
        'height:44px', 'padding:0 10px', 'white-space:nowrap',
        `border-right:1px solid ${token('--border', '#e5e7eb')}`,
        `color:${token('--muted-foreground', '#6b7280')}`,
        'background:transparent', 'font-size:14px', 'font-weight:500',
      ].join(';'))
      form.insertBefore(dd, wrapper)
    }
  }
  return '<!doctype html>' + clone.outerHTML
}, TEXT_PATCHES)
writeFileSync(`${DIR}mockup-mobile-overlay.html`, htmlM)

await mobile.close()
await browser.close()
console.log('mockups built (proposal/mockup-{tabs-productos,tabs-negocios,mobile-overlay}.html)')
