// Canonical gate captures: desktop.png, mobile.png, dom.txt, http-status.txt
import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = process.argv[2]
const browser = await chromium.launch()
const domTexts = []

// desktop
let ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
let page = await ctx.newPage()
const resp = await page.goto(`${BASE}/buscar?q=samsung`, { waitUntil: 'load' })
await page.waitForSelector('a[href^="/productos/"], text=/no se encontraron/i', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(1500)
await page.screenshot({ path: `${DIR}desktop.png` })
domTexts.push(await page.evaluate(() => document.body.innerText + '\n' + Array.from(document.querySelectorAll('input[placeholder]')).map((el) => el.getAttribute('placeholder')).join('\n')))
writeFileSync(`${DIR}http-status.txt`, String(resp.status()) + '\n')
await ctx.close()

// mobile
ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 })
page = await ctx.newPage()
await page.goto(`${BASE}/buscar?q=samsung`, { waitUntil: 'load' })
await page.waitForSelector('a[href^="/productos/"], text=/no se encontraron/i', { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(1500)
await page.screenshot({ path: `${DIR}mobile.png` })
domTexts.push(await page.evaluate(() => document.body.innerText + '\n' + Array.from(document.querySelectorAll('input[placeholder]')).map((el) => el.getAttribute('placeholder')).join('\n')))
await ctx.close()

writeFileSync(`${DIR}dom.txt`, domTexts.join('\n---\n') + '\n')
await browser.close()
console.log('canonical captures done ->', DIR)
