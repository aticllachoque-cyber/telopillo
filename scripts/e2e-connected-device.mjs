#!/usr/bin/env node
import { execSync } from 'child_process'
import readline from 'readline'

/**
 * Run a short E2E flow on a connected Android device (USB + ADB).
 *
 * Prerequisites:
 *   - Android device with USB debugging enabled
 *   - Chrome 87+ on device; chrome://flags → "Enable command line on non-rooted devices"
 *   - ADB in PATH: adb devices (device authorized)
 *   - Dev server reachable from device: use your machine's LAN IP (e.g. http://192.168.1.12:3000)
 *
 * Usage (prefer HTTP so Chrome on device can load the page):
 *   npm run dev
 *   DEVICE_BASE_URL=http://192.168.1.12:3000 npm run test:device
 *
 * Optional: FLOW=visitor|buyer|demand (default: visitor). Matches existing test plans.
 *
 * If the page stays at about:blank, the script will print hints and can wait for you to fix or tap Proceed.
 */

const baseURL = process.env.DEVICE_BASE_URL || process.env.BASE_URL || 'http://192.168.1.12:3000'
const isHttps = baseURL.toLowerCase().startsWith('https:')
/** Flow to run: visitor (default), buyer, demand. Matches test plans in tests/playwright-cli/ and tests/e2e/. */
const flowName = (process.env.FLOW || 'visitor').toLowerCase()

function ensureAdbDaemon() {
  try {
    execSync('adb start-server', { stdio: 'ignore', timeout: 5000 })
  } catch {
    // adb not in PATH or failed; Playwright will fail with a clear error
  }
}

function waitForEnter(msg) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(msg, () => {
      rl.close()
      resolve()
    })
  })
}

async function main() {
  const playwright = await import('playwright')
  const android = playwright.default._android
  if (!android) {
    console.error('Playwright Android support not available. Run: npx playwright install android')
    process.exit(1)
  }

  console.log('Connecting to Android device (ADB)...')
  ensureAdbDaemon()
  const devices = await android.devices()
  if (!devices.length) {
    console.error('No Android device found. Connect device via USB, enable USB debugging, run: adb devices')
    process.exit(1)
  }

  const device = devices[0]
  console.log('Device:', device.model(), device.serial())
  const launchTimeoutMs = 60000
  console.log('Launching Chrome on device (timeout', launchTimeoutMs / 1000, 's)...')
  let context
  try {
    const skipArgs = process.env.SKIP_CHROME_LAUNCH_ARGS === '1'
    const launchPromise = device.launchBrowser(
      skipArgs ? undefined : { args: ['--ignore-certificate-errors'] }
    )
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Launch timeout: Chrome did not start in time')), launchTimeoutMs)
    )
    try {
      context = await Promise.race([launchPromise, timeoutPromise])
    } catch (err) {
      console.error('')
      console.error('Could not launch Chrome on the device:', err.message)
      console.error('On the phone: open Chrome → address bar type chrome://flags')
      console.error('  → search "command line" → enable "Enable command line on non-rooted devices"')
      console.error('  → restart Chrome, then run this script again.')
      console.error('Also ensure Chrome 87+ is installed and the device is unlocked.')
      console.error('If it always times out, try: SKIP_CHROME_LAUNCH_ARGS=1 DEVICE_BASE_URL=... npm run test:device')
      const serial = device.serial()
      console.error('')
      console.error('Workaround: open the app on the phone from this PC with:')
      console.error('  adb -s ' + serial + ' shell am start -a android.intent.action.VIEW -d "' + baseURL + '" com.android.chrome')
      throw err
    }
    // On some devices newPage() hangs; use the page Chrome already opened (Android is single-context).
    let page = context.pages().find(Boolean) || null
    if (!page) {
      console.log('Getting new page...')
      page = await context.newPage()
    }
    console.log('Chrome ready. Flow:', flowName, '| Navigating to', baseURL, '...')

    let gotoError = null
    page.on('requestfailed', (req) => {
      const failure = req.failure()
      if (failure) gotoError = failure
    })
    console.log('(If the phone shows a security warning, tap Advanced → Proceed.)')
    if (isHttps) {
      console.log('(Using HTTPS: Chrome may show a cert warning. Prefer HTTP: npm run dev + DEVICE_BASE_URL=http://YOUR_IP:3000)')
    }
    try {
      await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 45000 })
    } catch (err) {
      console.error('Navigation failed:', err.message)
      if (gotoError) console.error('Request failure:', gotoError)
      console.error('Check: same Wi-Fi, npm run dev running, firewall allows port 3000.')
      throw err
    }

    let url = page.url()
    if (url === 'about:blank' || !url.startsWith('http')) {
      console.log('Page at', url, '- trying Chrome bypass (type "thisisunsafe" on the page)...')
      try {
        await page.mouse.click(200, 300)
        await new Promise((r) => setTimeout(r, 300))
        await page.keyboard.type('thisisunsafe', { delay: 80 })
        await new Promise((r) => setTimeout(r, 3000))
        url = page.url()
      } catch {
        // ignore
      }
    }
    if (url === 'about:blank' || !url.startsWith('http')) {
      console.log('')
      console.log('Bypass did not work. On the phone:')
      console.log('  - If you see a security warning, tap the page (so focus is on it), then type: thisisunsafe')
      console.log('  - Or try opening this URL manually in Chrome: ' + baseURL)
      console.log('')
      await waitForEnter('After the app loads on the phone, press Enter here to continue... ')
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 1000))
        url = page.url()
        if (url.startsWith('http')) break
      }
    }

    if (url === 'about:blank' || !url.startsWith('http')) {
      console.error('Page still at', url)
      if (isHttps) {
        console.error('Use HTTP for this test: npm run dev and DEVICE_BASE_URL=http://YOUR_IP:3000')
      } else {
        console.error('Ensure npm run dev is running and the device can reach', baseURL)
      }
      process.exit(1)
    }
    console.log('URL:', url)
    const title = await page.title()
    console.log('Title:', title)

    const heading = page.getByRole('heading', { level: 1 })
    await heading.waitFor({ state: 'visible', timeout: 10000 })
    console.log('Step 1: Home – heading visible')

    await page.screenshot({ path: 'test-results/device-home.png' })
    console.log('Screenshot: test-results/device-home.png')

    const stepDelay = (ms) => new Promise((r) => setTimeout(r, ms))

    const searchForm = page.getByRole('search', { name: /buscar productos/i })
    const searchbox = page.getByRole('searchbox', { name: /término de búsqueda/i })

    if (flowName === 'demand') {
      console.log('Flow: demand (Busco + demand detail). Step 2: Go to Busco...')
      await page.goto(baseURL + '/busco', { waitUntil: 'domcontentloaded', timeout: 20000 })
      await stepDelay(1500)
      await page.screenshot({ path: 'test-results/device-busco.png' })
      console.log('Screenshot: test-results/device-busco.png')
      console.log('Step 3: Open first demand (if any)...')
      const demandLink = page.locator('a[href^="/busco/"]').first()
      await demandLink.waitFor({ state: 'visible', timeout: 8000 }).catch(() => null)
      if (await demandLink.isVisible()) {
        await demandLink.click()
        await stepDelay(2000)
        await page.screenshot({ path: 'test-results/device-demand.png' })
        console.log('Screenshot: test-results/device-demand.png')
      } else {
        console.log('No demand links found; skipping demand detail.')
      }
    } else if (flowName === 'buyer') {
      console.log('Flow: buyer (search + product detail). Step 2: Search "celular"...')
      await searchbox.waitFor({ state: 'visible', timeout: 10000 })
      await searchbox.fill('celular')
      await stepDelay(500)
      await searchForm.getByRole('button', { name: 'Buscar' }).click()
      await stepDelay(2000)
      await page.screenshot({ path: 'test-results/device-search.png' })
      console.log('Screenshot: test-results/device-search.png')
      console.log('Step 3: Open first product...')
      const productLink = page.locator('a[href^="/productos/"]').first()
      await productLink.waitFor({ state: 'visible', timeout: 8000 }).catch(() => null)
      if (await productLink.isVisible()) {
        await productLink.click()
        await page.waitForURL(/\/productos\//, { timeout: 15000 }).catch(() => null)
        await stepDelay(2000)
        await page.screenshot({ path: 'test-results/device-product.png' })
        console.log('Screenshot: test-results/device-product.png')
      } else {
        console.log('No product links found; skipping product detail.')
      }
    } else {
      console.log('Flow: visitor (home + search + busco + demand). Step 2: Search "celular"...')
      await searchbox.waitFor({ state: 'visible', timeout: 10000 })
      await searchbox.fill('celular')
      await stepDelay(500)
      await searchForm.getByRole('button', { name: 'Buscar' }).click()
      await stepDelay(2000)
      await page.screenshot({ path: 'test-results/device-search.png' })
      console.log('Screenshot: test-results/device-search.png')
      console.log('Step 3: Go to Busco (demands)...')
      await page.goto(baseURL + '/busco', { waitUntil: 'domcontentloaded', timeout: 20000 })
      await stepDelay(1500)
      await page.screenshot({ path: 'test-results/device-busco.png' })
      console.log('Screenshot: test-results/device-busco.png')
      console.log('Step 4: Open first demand (if any)...')
      const demandLink = page.locator('a[href^="/busco/"]').first()
      await demandLink.waitFor({ state: 'visible', timeout: 8000 }).catch(() => null)
      if (await demandLink.isVisible()) {
        await demandLink.click()
        await stepDelay(2000)
        await page.screenshot({ path: 'test-results/device-demand.png' })
        console.log('Screenshot: test-results/device-demand.png')
      } else {
        console.log('No demand links found; skipping demand detail.')
      }
    }

    console.log('')
    console.log('Flow "' + flowName + '" on device: OK')
  } finally {
    if (context) await context.close()
    await device.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
