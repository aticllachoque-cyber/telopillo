// Stage 8 after-captures on branch code — mirrors current/ 1:1 (same routes,
// viewports, fullPage/dsf=2, auth states, seeded drafts). Emits manifest.txt,
// dom.txt (landmark "Este es tu producto"), http-status.txt (bare 200).
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./after/', import.meta.url).pathname
const OWNER_PRODUCT = `${BASE}/productos/b3bed804-7a25-40af-bc27-28e3746930b1`
const UID = 'dc7a90d3-046c-43c3-8e1d-60a4052fd5f1' // tests/.auth/logged-in.json user
const BIZ_UID = 'c3000001-0000-0000-0000-000000000002' // ivan.patino (business.json)

const draftEnv = (currentStep) => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  data: { currentStep, values: { __seed: 'after-capture' } },
})

const browser = await chromium.launch()
const lines = ['tinted-card-contrast-sweep after captures (branch) — 2026-09-17']
const hardFail = (msg) => {
  console.error(`AFTER FAIL: ${msg}`)
  process.exit(1)
}

// --- canonical: owner product page, 3 viewports (logged-in) ------------------
for (const [name, vp] of [
  ['desktop', { width: 1920, height: 1080 }],
  ['tablet', { width: 768, height: 1024 }],
  ['mobile', { width: 375, height: 812 }],
]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, storageState: 'tests/.auth/logged-in.json' })
  const p = await ctx.newPage()
  const resp = await p.goto(OWNER_PRODUCT, { waitUntil: 'load' })
  try {
    await p.waitForSelector('text=Este es tu producto', { timeout: 20_000 })
  } catch {
    hardFail(`landmark "Este es tu producto" no visible (${name})`)
  }
  await p.waitForTimeout(600)
  await p.screenshot({ path: `${DIR}${name}.png`, fullPage: true })
  if (name === 'desktop') {
    writeFileSync(`${DIR}dom.txt`, `# ${OWNER_PRODUCT} — ${name} (canonical)\n\n${await p.locator('main').ariaSnapshot()}\n`)
    writeFileSync(`${DIR}http-status.txt`, `${resp.status()}\n`)
  }
  lines.push(`${name}.png | /productos/b3bed804… | ${vp.width}x${vp.height} | fullPage dsf=2 | HTTP ${resp.status()} | logged-in owner`)
  await ctx.close()
}

// --- usermenu dropdown open (desktop) ----------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, storageState: 'tests/.auth/logged-in.json' })
  const p = await ctx.newPage()
  await p.goto(BASE, { waitUntil: 'load' })
  await p.waitForSelector('button[aria-label="Menú de usuario"]', { timeout: 20_000 })
  await p.click('button[aria-label="Menú de usuario"]')
  await p.waitForSelector('text=Publicaciones', { timeout: 10_000 })
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${DIR}usermenu-desktop.png`, fullPage: false })
  lines.push('usermenu-desktop.png | / | 1920x1080 | viewport dsf=2 | logged-in, dropdown abierto')
  await ctx.close()
}

// --- draft banners: demand (/busco/publicar), product (/publicar) -------------
for (const [name, route, key] of [
  ['draft-demand-desktop', '/busco/publicar', `draft:demand:create:${UID}`],
  ['draft-product-desktop', '/publicar', `draft:product:create:${UID}`],
]) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  await ctx.addInitScript(([k, env]) => window.localStorage.setItem(k, JSON.stringify(env)), [key, draftEnv(2)])
  const p = await ctx.newPage()
  await p.goto(`${BASE}${route}`, { waitUntil: 'load' })
  try {
    await p.waitForSelector('text=Encontramos un borrador guardado', { timeout: 20_000 })
  } catch {
    hardFail(`banner borrador no visible (${name})`)
  }
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${DIR}${name}.png`, fullPage: true })
  lines.push(`${name}.png | ${route} | 1920x1080 | fullPage dsf=2 | logged-in, draft seeded | banner: visible`)
  await ctx.close()
}

// --- draft banner: business (/profile/edit, ivan + business.json) -------------
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/business.json',
  })
  await ctx.addInitScript(
    ([k, env]) => window.localStorage.setItem(k, JSON.stringify(env)),
    [`draft:business-profile:${BIZ_UID}`, draftEnv(2)],
  )
  const p = await ctx.newPage()
  await p.goto(`${BASE}/profile/edit`, { waitUntil: 'load' })
  try {
    await p.waitForSelector('text=Encontramos un borrador guardado', { timeout: 20_000 })
  } catch {
    hardFail('banner borrador business no visible')
  }
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${DIR}draft-business-desktop.png`, fullPage: true })
  lines.push('draft-business-desktop.png | /profile/edit | 1920x1080 | fullPage dsf=2 | logged-in (ivan.patino negocio, tests/.auth/business.json), draft seeded | banner: visible')
  await ctx.close()
}

// --- drawer open (logged-out): mobile + tablet --------------------------------
for (const [name, vp] of [
  ['drawer-mobile', { width: 375, height: 812 }],
  ['drawer-tablet', { width: 768, height: 1024 }],
]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(BASE, { waitUntil: 'load' })
  await p.waitForSelector('button[aria-label="Abrir menú"]', { timeout: 20_000 })
  await p.click('button[aria-label="Abrir menú"]')
  await p.waitForSelector('text=Creá tu cuenta gratis', { timeout: 10_000 })
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${DIR}${name}.png`, fullPage: false })
  lines.push(`${name}.png | / | ${vp.width}x${vp.height} | viewport dsf=2 | logged-out, drawer abierto`)
  await ctx.close()
}

// --- busco (offline-banner surface, banner itself conditional) ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  const resp = await p.goto(`${BASE}/busco`, { waitUntil: 'load' })
  await p.waitForTimeout(1200)
  await p.screenshot({ path: `${DIR}busco-desktop.png`, fullPage: true })
  lines.push(`busco-desktop.png | /busco | 1920x1080 | fullPage dsf=2 | HTTP ${resp.status()} | logged-out (banner offline condicional — no visible sin falla de red)`)
  await ctx.close()
}

await browser.close()
writeFileSync(`${DIR}manifest.txt`, lines.join('\n') + '\n')
console.log('after captures done:', lines.length - 1)
