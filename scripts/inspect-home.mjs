/**
 * One-off script: open home page, capture console errors and screenshot.
 * Run: node scripts/inspect-home.mjs
 */
import { chromium } from 'playwright'

const baseURL = 'http://localhost:3000'
const consoleLogs = []
const consoleErrors = []

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()

page.on('console', (msg) => {
  const type = msg.type()
  const text = msg.text()
  if (type === 'error') consoleErrors.push(text)
  consoleLogs.push({ type, text })
})

let pageError = null
page.on('pageerror', (err) => {
  pageError = err.message
})

await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 15000 })

// Screenshot
await page.screenshot({ path: 'scripts/home-inspect-screenshot.png', fullPage: true })

// Basic page info
const title = await page.title()
const hasMain = (await page.locator('main').count()) > 0
const bodyText = await page.locator('body').innerText().catch(() => '')
const visibleErrors = await page.locator('[role="alert"], .error, [data-state="error"]').allTextContents().catch(() => [])

await browser.close()

// Report
console.log('=== HOME PAGE INSPECTION ===')
console.log('URL:', baseURL)
console.log('Title:', title)
console.log('Has <main>:', hasMain)
if (pageError) console.log('Page error:', pageError)
if (consoleErrors.length) {
  console.log('Console errors:', consoleErrors.length)
  consoleErrors.forEach((e, i) => console.log(`  [${i + 1}]`, e))
}
if (visibleErrors.length) console.log('Visible error elements:', visibleErrors)
console.log('Screenshot saved: scripts/home-inspect-screenshot.png')
console.log('Body text (first 800 chars):', bodyText.slice(0, 800))
