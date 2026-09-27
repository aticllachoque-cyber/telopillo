// Stage 4 contrast probe — computed styles on live DOM, both themes.
// Converts any CSS color (lab/oklab/rgb) to sRGB via canvas before math.
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const PRIMARY_ID = '679962b7-ddfd-4a65-ab27-50d0b47d1859'
const OFFERS_ID = 'f8609770-80c1-441f-8c37-9729816ef450'

const PROBES_PRIMARY = [
  ['avatar-fallback (Comprador UD)', '[data-slot="avatar-fallback"]'],
  ['meta-row bajo H1 (muted)', 'h1 + div.text-muted-foreground'],
  ['meta-label Resumen (Ubicación·)', '[aria-label="Resumen"] span.text-muted-foreground.shrink-0'],
  ['meta-value Resumen (font-medium)', '[aria-label="Resumen"] span.font-medium'],
  ['empty-state Ofertas', 'div.rounded-lg.border p.text-muted-foreground'],
  ['CTA card copy (¿Tienes...?)', 'p.text-muted-foreground.text-pretty.mb-3'],
  ['back-link Volver', 'a[href="/busco"]'],
  ['Comprador subtitle', 'h2.text-lg + p.text-muted-foreground'],
  ['poster name + location muted', 'p.truncate.text-lg + div.text-muted-foreground'],
]

const PROBES_OFFERS = [
  ['OfferCard seller meta muted', 'div.flex-1 > div.text-muted-foreground'],
  ['OfferCard quote italic', 'p.italic.text-muted-foreground'],
  ['OfferCard mini avatar fallback', 'h2 ~ div span[data-slot="avatar-fallback"]'],
]

const browser = await chromium.launch()
const out = []

async function probePage(page, probes, label) {
  out.push(`## ${label}`)
  for (const [name, selector] of probes) {
    const r = await page.evaluate(
      ([sel]) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const toRgb = (color) => {
          const ctx = document.createElement('canvas').getContext('2d')
          ctx.fillStyle = color
          ctx.fillRect(0, 0, 1, 1)
          return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3))
        }
        const lum = (rgb) => {
          const [r, g, b] = rgb.map((c) => {
            c /= 255
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
          })
          return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const ratio = (a, b) => {
          const l1 = lum(a)
          const l2 = lum(b)
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
        }
        const cs = getComputedStyle(el)
        let node = el
        let bg = cs.backgroundColor
        let alpha = 1
        while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
          node = node.parentElement
          bg = node ? getComputedStyle(node).backgroundColor : bg
        }
        // blend alpha over the effective solid ancestor bg for /alpha colors
        const m = bg.match(/\/\s*([\d.]+)\)$/)
        if (m) {
          alpha = parseFloat(m[1])
          const solid = bg.replace(/\/\s*[\d.]+\)$/, ')')
          let ancestor = node?.parentElement ?? null
          let parentBg = 'rgb(255, 255, 255)'
          while (ancestor) {
            const c = getComputedStyle(ancestor).backgroundColor
            if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' && !c.includes('/')) {
              parentBg = c
              break
            }
            ancestor = ancestor.parentElement
          }
          const fgRgb = toRgb(solid)
          const bgRgb = toRgb(parentBg)
          const blended = fgRgb.map((c, i) => Math.round(c * alpha + bgRgb[i] * (1 - alpha)))
          return {
            ratio: ratio(toRgb(cs.color), blended),
            color: cs.color,
            bg: `${solid} a=${alpha} over ${parentBg}`,
            font: `${cs.fontSize}/${cs.fontWeight}`,
          }
        }
        return {
          ratio: ratio(toRgb(cs.color), toRgb(bg)),
          color: cs.color,
          bg,
          font: `${cs.fontSize}/${cs.fontWeight}`,
        }
      },
      [selector],
    )
    if (r) out.push(`- ${name}: ${r.color} on ${r.bg} = ${r.ratio.toFixed(2)}:1 (${r.font})`)
    else out.push(`- ${name}: NOT FOUND (${selector})`)
  }
}

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
  const page = await ctx.newPage()
  if (theme === 'dark') {
    await page.goto(`${BASE}/busco/${PRIMARY_ID}`, { waitUntil: 'load' })
    await page.waitForTimeout(800)
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.waitForTimeout(300)
  } else {
    await page.goto(`${BASE}/busco/${PRIMARY_ID}`, { waitUntil: 'load' })
    await page.waitForTimeout(800)
  }
  await probePage(page, PROBES_PRIMARY, `primary / ${theme}`)
  await page.goto(`${BASE}/busco/${OFFERS_ID}`, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  if (theme === 'dark') {
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.waitForTimeout(300)
  }
  await probePage(page, PROBES_OFFERS, `ofertas / ${theme}`)
  await ctx.close()
}

writeFileSync('redesign/busco-detalle/contrast-probe.txt', out.join('\n') + '\n')
await browser.close()
console.log('contrast probe done')
