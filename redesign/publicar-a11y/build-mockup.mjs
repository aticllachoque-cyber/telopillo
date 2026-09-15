// Stage 6 fallback (stitch:fallback): faithful mockups of the publish flows with
// minimal inline patches for F-1 (single image error) and F-2 (centered demand
// layout). Patches are inline styles / DOM removals so the mock never depends on
// classes absent from the compiled CSS.
import { chromium } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

const browser = await chromium.launch()

// ---- Mock A: demanda centered (F-2) — desktop 1920 hydrated DOM ----
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    storageState: 'tests/.auth/logged-in.json',
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 30_000 })
  await page.waitForTimeout(1500)
  const html = await page.evaluate(async () => {
    document.querySelectorAll('script').forEach((s) => s.remove())
    document.querySelectorAll('nextjs-portal').forEach((n) => n.remove())
    for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
      const css = await fetch(link.href).then((r) => r.text())
      const style = document.createElement('style')
      style.textContent = css
      link.replaceWith(style)
    }
    // F-2: container max-w-2xl -> centered (mx-auto equivalent)
    for (const el of document.querySelectorAll('div.container.max-w-2xl')) {
      el.style.marginLeft = 'auto'
      el.style.marginRight = 'auto'
    }
    return document.documentElement.outerHTML
  })
  writeFileSync(DIR + 'mockup-demanda.html', html)
  console.log('mockup-demanda.html:', (html.length / 1024).toFixed(0), 'KB')
  await ctx.close()
}

// ---- Mock B: producto step1 error state with single error (F-1/F-4) ----
for (const [name, viewport] of Object.entries({
  desktop: { width: 1920, height: 1080 },
  mobile: { width: 375, height: 812 },
})) {
  const ctx = await browser.newContext({ viewport, storageState: 'tests/.auth/logged-in.json' })
  const page = await ctx.newPage()
  await page.goto(BASE + '/publicar', { waitUntil: 'load' })
  await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
  await page.waitForSelector('text=Fotos del Producto', { timeout: 30_000 })
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: /Siguiente/i }).click()
  await page.waitForTimeout(800)
  const html = await page.evaluate(async () => {
    document.querySelectorAll('script').forEach((s) => s.remove())
    document.querySelectorAll('nextjs-portal').forEach((n) => n.remove())
    for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
      const css = await fetch(link.href).then((r) => r.text())
      const style = document.createElement('style')
      style.textContent = css
      link.replaceWith(style)
    }
    // F-1: remove the wizard's own duplicate error <p> — the surviving copy is
    // ImageUpload's #image-upload-error (role="alert" aria-live="assertive", F-4)
    for (const p of document.querySelectorAll('p.text-destructive')) {
      if (p.id !== 'image-upload-error' && p.textContent.includes('Debes subir al menos 1 imagen')) {
        p.remove()
      }
    }
    return document.documentElement.outerHTML
  })
  writeFileSync(DIR + `mockup-error-${name}.html`, html)
  console.log(`mockup-error-${name}.html:`, (html.length / 1024).toFixed(0), 'KB')
  await ctx.close()
}
await browser.close()
