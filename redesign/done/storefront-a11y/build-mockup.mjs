// Stage 6 fallback (stitch:fallback): faithful mockup of the live storefront DOM
// with minimal inline patches for F-1/F-2 (badge contrast), F-3 (banner tokens),
// F-5 (banner description contrast). Patches are applied as inline styles so the
// mockup never depends on Tailwind classes absent from the compiled CSS.
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const PAGE_URL = '/negocio/tienda-electronica-la-paz'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(BASE + PAGE_URL, { waitUntil: 'networkidle' })
await page.waitForSelector('h1', { timeout: 15_000 })
await page.waitForTimeout(500)

const html = await page.evaluate(async () => {
  // 1. strip scripts
  document.querySelectorAll('script').forEach((s) => s.remove())
  // 2. inline stylesheets
  for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
    const css = await fetch(link.href).then((r) => r.text())
    const style = document.createElement('style')
    style.textContent = css
    link.replaceWith(style)
  }
  // 3. inline patch map (F-1/F-2, F-3, F-5) — hex values documented in stitch-brief
  // F-1: Cerrado badge text red-600 -> red-700 (#b91c1c, 5.87:1 over red-50)
  for (const el of document.querySelectorAll('span[role="status"].text-red-600')) {
    el.style.color = '#b91c1c'
  }
  // F-2: Abierto badge text green-600 -> green-800 (#166534, 6.27:1 over green-50)
  //      (not rendered today — patch is best-effort for the mock)
  for (const el of document.querySelectorAll('span[role="status"].text-green-600')) {
    el.style.color = '#166534'
  }
  // F-3: construction banner gradient (from-primary/12 via-primary/5 to-amber-500/10)
  //      -> semantic flat muted tint (#f4f4f4 = muted/40 over white)
  for (const el of document.querySelectorAll('[role="status"][aria-live="polite"]')) {
    if (el.className.includes('from-primary/12')) {
      el.style.backgroundImage = 'none'
      el.style.backgroundColor = '#f4f4f4'
    }
  }
  // F-5: banner description text-muted-foreground -> foreground/80 (#474747 ≈8.5:1)
  for (const el of document.querySelectorAll('[role="status"][aria-live="polite"] p')) {
    if (el.className.includes('text-muted-foreground')) {
      el.style.color = '#474747'
    }
  }
  // freeze layout bits that depend on JS (dev indicator etc.)
  document.querySelectorAll('nextjs-portal').forEach((n) => n.remove())
  return document.documentElement.outerHTML
})

writeFileSync(DIR + 'mockup.html', html)
console.log('mockup.html written:', (html.length / 1024).toFixed(0), 'KB')
await browser.close()
