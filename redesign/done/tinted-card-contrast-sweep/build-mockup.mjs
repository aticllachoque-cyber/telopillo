// Stage 6 fallback proposal: faithful-DOM mockups per surface.
// Recipe (5th use): hydrate the real page in the exact finding state ->
// patch ONLY the finding classes (muted -> foreground/80; amber -> neutral
// tokens) -> strip scripts/nextjs-portal -> inline the built stylesheet ->
// save self-contained HTML. Conditional banners not present in the live DOM
// (muted/30 status, offline-cached) are injected as demo copies of the real
// markup with the proposed classes (transparency note in comparison.html).
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
const UID = 'dc7a90d3-046c-43c3-8e1d-60a4052fd5f1'
const OWNER_PRODUCT = `${BASE}/productos/b3bed804-7a25-40af-bc27-28e3746930b1`

const SWAP = {
  // class-level swap applied to every node inside a root selector
  swapMuted: (rootSel) => {
    document.querySelectorAll(`${rootSel} .text-muted-foreground`).forEach((n) => {
      n.classList.replace('text-muted-foreground', 'text-foreground/80')
    })
  },
}

const browser = await chromium.launch()

async function extract(page, { patch, name }) {
  await patch()
  await page.waitForTimeout(300)
  const css = await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')]
    const texts = await Promise.all(links.map((l) => fetch(l.href).then((r) => r.text()).catch(() => '')))
    return texts.join('\n')
  })
  const html = await page.evaluate(() => {
    document.querySelectorAll('script').forEach((n) => n.remove())
    document.querySelectorAll('nextjs-portal').forEach((n) => n.remove())
    document.querySelectorAll('link[rel="stylesheet"]').forEach((n) => n.remove())
    return { head: document.head.innerHTML, body: document.body.outerHTML }
  })
  const doc = `<!DOCTYPE html>\n<html lang="es" data-mockup="tinted-card-contrast-sweep">\n<head>${html.head}<style>\n${css}\n</style></head>\n${html.body}\n</html>`
  writeFileSync(`${DIR}${name}.html`, doc)
}

// --- A: owner notice (logged-in, canonical page) -----------------------------
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const p = await ctx.newPage()
  await p.goto(OWNER_PRODUCT, { waitUntil: 'load' })
  await p.waitForSelector('text=Este es tu producto', { timeout: 30_000 })
  await extract(p, {
    name: 'mockup-owner-notice',
    patch: async () => {
      await p.evaluate(SWAP.swapMuted, 'div.space-y-2')
    },
  })
  await ctx.close()
}

// --- B: usermenu open (desktop) ----------------------------------------------
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  const p = await ctx.newPage()
  await p.goto(BASE, { waitUntil: 'networkidle' })
  const btn = p.locator('button[aria-label="Menú de usuario"]')
  await btn.waitFor({ state: 'visible', timeout: 45_000 })
  await btn.click()
  await p.waitForSelector('#user-menu-publicaciones-label', { timeout: 15_000 })
  await extract(p, {
    name: 'mockup-usermenu',
    patch: async () => {
      await p.evaluate(() => {
        document.querySelectorAll('#user-menu-publicaciones-label, #user-menu-cuenta-label').forEach((n) => {
          n.classList.replace('text-muted-foreground', 'text-foreground/80')
        })
      })
    },
  })
  await ctx.close()
}

// --- C: drawer open (mobile, logged-out) --------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(BASE, { waitUntil: 'load' })
  await p.waitForSelector('button[aria-label="Abrir menú"]', { timeout: 30_000 })
  await p.click('button[aria-label="Abrir menú"]')
  await p.waitForSelector('text=Creá tu cuenta gratis', { timeout: 15_000 })
  await extract(p, {
    name: 'mockup-drawer',
    patch: async () => {
      await p.evaluate(SWAP.swapMuted, 'div.bg-primary\\/5')
    },
  })
  await ctx.close()
}

// --- D: draft banners (demand wizard, amber + injected muted/30 demo) ---------
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
    storageState: 'tests/.auth/logged-in.json',
  })
  await ctx.addInitScript(([k, env]) => {
    window.localStorage.setItem(k, JSON.stringify(env))
  }, [`draft:demand:create:${UID}`, { version: 1, updatedAt: new Date().toISOString(), data: { currentStep: 2, values: { __seed: 'sweep' } } }])
  const p = await ctx.newPage()
  await p.goto(`${BASE}/busco/publicar`, { waitUntil: 'load' })
  await p.waitForSelector('text=Encontramos un borrador guardado', { timeout: 30_000 })
  await extract(p, {
    name: 'mockup-draft',
    patch: async () => {
      await p.evaluate(() => {
        // amber pendingDraft subtitle + muted/30 demo of the status banner
        document.querySelectorAll('.bg-amber-500\\/10 .text-muted-foreground').forEach((n) => {
          n.classList.replace('text-muted-foreground', 'text-foreground/80')
        })
        const demo = document.createElement('div')
        demo.setAttribute('data-demo-injected', 'muted-30-status-banner')
        demo.className = 'rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground/80'
        demo.textContent = 'Estás trabajando sobre un borrador recuperado.'
        const amber = document.querySelector('.bg-amber-500\\/10')
        amber?.insertAdjacentElement('afterend', demo)
      })
    },
  })
  await ctx.close()
}

// --- E: offline-cached banner (busco page, injected demo, neutralized) --------
{
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/busco`, { waitUntil: 'load' })
  await p.waitForTimeout(1200)
  await extract(p, {
    name: 'mockup-offline',
    patch: async () => {
      await p.evaluate(() => {
        // demo copy of app/busco/page.tsx:411 banner with the proposed tokens
        const demo = document.createElement('div')
        demo.setAttribute('data-demo-injected', 'offline-cached-banner-neutral')
        demo.className = 'mb-4 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-foreground/80'
        demo.textContent = 'Mostrando solicitudes guardadas por una falla de conexión. Última actualización: 17/09/2026, 15:30.'
        const main = document.querySelector('main')
        main?.prepend(demo)
      })
    },
  })
  await ctx.close()
}

await browser.close()
console.log('mockups written to proposal/')
