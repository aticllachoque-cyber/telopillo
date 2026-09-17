// Stage 1 intake captures for tinted-card-contrast-sweep — the three
// hidden P1 sites (muted text on bg-primary/5) that axe misses because
// their containers are closed / owner-only:
//   1. OwnerListingNotice  — /productos/<id> as owner (logged-in)
//   2. UserMenu dropdown   — header, logged-in, desktop
//   3. MobileNavigationDrawer banner — mobile, logged-OUT (banner is
//      !isAuthenticated)
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./input/', import.meta.url).pathname
const OWNER_PRODUCT = `${BASE}/productos/b3bed804-7a25-40af-bc27-28e3746930b1`

const browser = await chromium.launch()
const lines = ['tinted-card-contrast-sweep intake captures — 2026-09-17']
const hardFail = (msg) => {
  console.error(`INTAKE FAIL: ${msg}`)
  process.exit(1)
}

// --- Context A: logged-in (storage state) ---------------------------------
const authCtx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  storageState: 'tests/.auth/logged-in.json',
})
const page = await authCtx.newPage()

// A1. OwnerListingNotice on own product page
await page.goto(OWNER_PRODUCT, { waitUntil: 'load' })
try {
  await page.waitForSelector('text=Este es tu producto', { timeout: 20_000 })
} catch {
  hardFail('OwnerListingNotice no visible — sesión logged-in inválida o producto no es del usuario')
}
await page.waitForTimeout(600)
await page.screenshot({ path: `${DIR}owner-notice-desktop.png`, fullPage: true })
lines.push(
  'owner-notice-desktop.png | /productos/b3bed804… | 1920x1080 | fullPage dsf=2 | logged-in (owner)',
)

// A2. UserMenu dropdown open (header, desktop)
await page.goto(BASE, { waitUntil: 'load' })
try {
  await page.waitForSelector('button[aria-label="Menú de usuario"]', { timeout: 20_000 })
} catch {
  hardFail('UserMenu trigger no visible — sesión logged-in inválida')
}
await page.click('button[aria-label="Menú de usuario"]')
await page.waitForSelector('text=Publicaciones', { timeout: 10_000 })
await page.waitForTimeout(400)
await page.screenshot({ path: `${DIR}usermenu-desktop.png`, fullPage: false })
lines.push('usermenu-desktop.png | / | 1920x1080 | viewport dsf=2 | logged-in, dropdown abierto')

await authCtx.close()

// --- Context B: logged-out mobile drawer -----------------------------------
const anonCtx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
})
const mobile = await anonCtx.newPage()
await mobile.goto(BASE, { waitUntil: 'load' })
try {
  await mobile.waitForSelector('button[aria-label="Abrir menú"]', { timeout: 20_000 })
} catch {
  hardFail('hamburger "Abrir menú" no visible en mobile')
}
await mobile.click('button[aria-label="Abrir menú"]')
await mobile.waitForSelector('text=Creá tu cuenta gratis', { timeout: 10_000 })
await mobile.waitForTimeout(400)
await mobile.screenshot({ path: `${DIR}drawer-mobile.png`, fullPage: false })
lines.push('drawer-mobile.png | / | 375x812 | viewport dsf=2 | logged-out, drawer abierto')

await anonCtx.close()
await browser.close()

writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
console.log('intake captures done:', lines.length - 1)
