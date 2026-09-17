// Stage 3 current captures for tinted-card-contrast-sweep.
// Canonical landmark page: /productos/<owner product> logged-in (3 viewports,
// fullPage dsf=2). Hidden states: UserMenu dropdown open (desktop+tablet),
// MobileNavigationDrawer banner open (mobile, logged-out), pendingDraft amber
// banners on the three draft-bearing forms (localStorage seeded via
// addInitScript).
// All logged-in work shares ONE browser context: concurrent contexts replay
// the same storageState and fight over Supabase refresh-token rotation, which
// leaves the header auth skeleton stuck (observed: trigger resolves hidden).
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./current/', import.meta.url).pathname
const OWNER_PRODUCT = `${BASE}/productos/b3bed804-7a25-40af-bc27-28e3746930b1`
const UID = 'dc7a90d3-046c-43c3-8e1d-60a4052fd5f1'

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

// desktop-sized page used for the menu/draft states; the canonical trio below
// uses per-viewport contexts but reuses this same storageState sequentially.
const seedDraft = (key) => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  data: { currentStep: 2, values: { __seed: 'tinted-sweep-capture' } },
})

const browser = await chromium.launch()
const lines = ['tinted-card-contrast-sweep current captures — 2026-09-17']

const authedPage = async (viewport) => {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const pg = await ctx.newPage()
  pg._ctx = ctx
  return pg
}

// --- canonical page: owner product detail (logged-in) -----------------------
{
  const p = await authedPage(VIEWPORTS.desktop)
  const res = await p.goto(OWNER_PRODUCT, { waitUntil: 'load' })
  await p.waitForSelector('text=Este es tu producto', { timeout: 30_000 })
  await p.waitForTimeout(800)
  await p.screenshot({ path: `${DIR}desktop.png`, fullPage: true })
  writeFileSync(`${DIR}http-status.txt`, `${res?.status() ?? 0}\n`)
  const aria = await p.locator('main').first().ariaSnapshot()
  writeFileSync(`${DIR}dom.txt`, `# ${OWNER_PRODUCT} — desktop (canonical)\n\n${aria}\n`)
  lines.push(`desktop.png | /productos/b3bed804… | 1920x1080 | fullPage dsf=2 | HTTP ${res?.status()} | logged-in owner`)
  await p._ctx.close()

  for (const name of ['tablet', 'mobile']) {
    const pg = await authedPage(VIEWPORTS[name])
    await pg.goto(OWNER_PRODUCT, { waitUntil: 'load' })
    await pg.waitForSelector('text=Este es tu producto', { timeout: 30_000 })
    await pg.waitForTimeout(800)
    await pg.screenshot({ path: `${DIR}${name}.png`, fullPage: true })
    lines.push(`${name}.png | /productos/b3bed804… | ${VIEWPORTS[name].width}x${VIEWPORTS[name].height} | fullPage dsf=2 | logged-in owner`)
    await pg._ctx.close()
  }
}

// --- UserMenu dropdown open (desktop only: trigger lives in `hidden lg:flex`)
for (const name of ['desktop']) {
  const pg = await authedPage(VIEWPORTS[name])
  await pg.goto(BASE, { waitUntil: 'networkidle' })
  const btn = pg.locator('button[aria-label="Menú de usuario"]')
  await btn.waitFor({ state: 'visible', timeout: 45_000 })
  await btn.click()
  await pg.waitForSelector('#user-menu-publicaciones-label', { timeout: 15_000 })
  await pg.waitForTimeout(400)
  await pg.screenshot({ path: `${DIR}usermenu-${name}.png`, fullPage: false })
  lines.push(`usermenu-${name}.png | / | ${VIEWPORTS[name].width}x${VIEWPORTS[name].height} | viewport dsf=2 | logged-in, dropdown abierto`)
  await pg._ctx.close()
}

// --- pendingDraft amber banners (3 forms) -----------------------------------
const DRAFT_ROUTES = [
  ['draft-demand-desktop', '/busco/publicar', `draft:demand:create:${UID}`],
  ['draft-product-desktop', '/publicar', `draft:product:create:${UID}`],
  ['draft-business-desktop', '/profile/edit', `draft:business-profile:${UID}`],
]
for (const [file, route, key] of DRAFT_ROUTES) {
  const ctx = await browser.newContext({
    viewport: VIEWPORTS.desktop,
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  await ctx.addInitScript(([k, envelope]) => {
    window.localStorage.setItem(k, JSON.stringify(envelope))
  }, [key, seedDraft(key)])
  const pg = await ctx.newPage()
  await pg.goto(`${BASE}${route}`, { waitUntil: 'load' })
  const found = await pg
    .waitForSelector('text=Encontramos un borrador guardado', { timeout: 30_000 })
    .then(() => true)
    .catch(() => false)
  await pg.waitForTimeout(600)
  await pg.screenshot({ path: `${DIR}${file}.png`, fullPage: true })
  lines.push(`${file}.png | ${route} | 1920x1080 | fullPage dsf=2 | logged-in, draft seeded | banner: ${found ? 'visible' : 'NOT FOUND'}`)
  await ctx.close()
}

// --- drawer banner (logged-out; hamburger is lg:hidden → mobile + tablet) ---
for (const name of ['mobile', 'tablet']) {
  const anonCtx = await browser.newContext({ viewport: VIEWPORTS[name], deviceScaleFactor: 2 })
  const m = await anonCtx.newPage()
  await m.goto(BASE, { waitUntil: 'load' })
  await m.waitForSelector('button[aria-label="Abrir menú"]', { timeout: 30_000 })
  await m.click('button[aria-label="Abrir menú"]')
  await m.waitForSelector('text=Creá tu cuenta gratis', { timeout: 15_000 })
  await m.waitForTimeout(400)
  await m.screenshot({ path: `${DIR}drawer-${name}.png`, fullPage: false })
  lines.push(`drawer-${name}.png | / | ${VIEWPORTS[name].width}x${VIEWPORTS[name].height} | viewport dsf=2 | logged-out, drawer abierto`)
  await anonCtx.close()
}

await browser.close()
writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
console.log(lines.join('\n'))
