/**
 * Monkey/Chaos testing for Telopillo.bo welcome onboarding interstitial dialog.
 * Tests: rapid clicks, ESC spam, backdrop clicks, scroll, tab navigation,
 * viewport resize, navigation away, refresh, network failure simulation.
 */
import { test, expect, type Page } from '@playwright/test'

const PASSWORD = 'Bolivia2026!'

function attachErrorMonitors(page: Page) {
  const consoleErrors: string[] = []
  const networkErrors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[CONSOLE] ${msg.text()}`)
    }
  })

  page.on('pageerror', (error) => {
    consoleErrors.push(`[UNHANDLED] ${error.message}`)
  })

  page.on('response', (response) => {
    if (response.status() >= 500) {
      networkErrors.push(`[${response.status()}] ${response.url()}`)
    }
  })

  return { consoleErrors, networkErrors }
}

async function registerFreshUser(
  page: Page,
  index: number
): Promise<{ email: string; name: string }> {
  const timestamp = Date.now()
  const email = `monkey${index}-${timestamp}@telopillo.test`
  const name = `Monkey Test ${index}`
  await page.goto('/register')
  await page.waitForLoadState('domcontentloaded')

  await page.getByLabel(/nombre completo/i).fill(name)
  await page.getByLabel(/^email$/i).fill(email)
  await page
    .getByLabel(/^contraseña$/i)
    .first()
    .fill(PASSWORD)
  await page.getByLabel(/confirmar contraseña/i).fill(PASSWORD)
  await page.getByRole('button', { name: /crear cuenta/i }).click()

  await page.waitForURL((url) => url.pathname === '/', { timeout: 20_000 })
  return { email, name }
}

async function waitForOnboardingDialog(page: Page): Promise<void> {
  await page.waitForSelector('text=Bienvenido', { timeout: 10_000 })
  await page.waitForTimeout(300)
}

test.describe('Onboarding Monkey - Welcome Dialog Chaos', () => {
  test.setTimeout(60_000)
  test.use({ viewport: { width: 375, height: 812 } })

  test('1. Rapid clicking "Empezar a explorar" - no crash or double-submit', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 1)
    await waitForOnboardingDialog(page)

    const btn = page.getByRole('button', { name: /empezar a explorar/i })
    await expect(btn).toBeVisible()

    for (let i = 0; i < 15; i++) {
      await btn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(50)
    }

    await page.waitForTimeout(2000)

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('2. Rapid clicking "Completar perfil" - no crash or double-submit', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 2)
    await waitForOnboardingDialog(page)

    const btn = page.getByRole('button', { name: /completar perfil/i })
    await expect(btn).toBeVisible()

    for (let i = 0; i < 15; i++) {
      await btn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(50)
    }

    await page.waitForTimeout(2000)

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('3. Click both buttons alternately - no crash', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 3)
    await waitForOnboardingDialog(page)

    const exploreBtn = page.getByRole('button', { name: /empezar a explorar/i })
    const profileBtn = page.getByRole('button', { name: /completar perfil/i })

    for (let i = 0; i < 10; i++) {
      await exploreBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(80)
      await profileBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(80)
    }

    await page.waitForTimeout(2000)

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('4. ESC key spam - no crash', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 4)
    await waitForOnboardingDialog(page)

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(50)
    }

    await page.waitForTimeout(1000)

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('5. Click X button rapidly - no crash', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 5)
    await waitForOnboardingDialog(page)

    const closeBtn = page.getByRole('button', { name: /cerrar/i })
    await expect(closeBtn).toBeVisible()

    for (let i = 0; i < 15; i++) {
      await closeBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(50)
    }

    await page.waitForTimeout(2000)

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('6. Click outside dialog (backdrop) rapidly - no crash', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 6)
    await waitForOnboardingDialog(page)

    const overlay = page.locator('[data-slot="dialog-overlay"]')
    await expect(overlay).toBeVisible()

    for (let i = 0; i < 15; i++) {
      await overlay.click({ force: true, position: { x: 10, y: 10 } }).catch(() => {})
      await page.waitForTimeout(50)
    }

    await page.waitForTimeout(2000)

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('7. Scroll aggressively inside dialog - no crash', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 7)
    await waitForOnboardingDialog(page)

    const content = page.locator('[data-slot="dialog-content"]')
    await expect(content).toBeVisible()

    for (let i = 0; i < 20; i++) {
      await content.evaluate((el) => el.scrollBy(0, 50))
      await page.waitForTimeout(100)
    }
    for (let i = 0; i < 20; i++) {
      await content.evaluate((el) => el.scrollBy(0, -50))
      await page.waitForTimeout(100)
    }

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('8. Tab key navigation - focus stays trapped in dialog', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 8)
    await waitForOnboardingDialog(page)

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
    }

    const isInsideDialog = await page.evaluate(() => {
      const active = document.activeElement
      if (!active) return false
      return !!active.closest('[role="dialog"]')
    })
    expect(isInsideDialog, 'Focus should stay inside dialog').toBe(true)
    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
  })

  test('9. Resize viewport while dialog is open - no layout breakage', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 9)
    await waitForOnboardingDialog(page)

    const viewports = [
      { width: 320, height: 480 },
      { width: 1440, height: 900 },
      { width: 375, height: 812 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize(vp)
      await page.waitForTimeout(500)

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, `Horizontal overflow at ${vp.width}x${vp.height}`).toBeLessThanOrEqual(
        clientWidth + 10
      )
    }

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
  })

  test('10. Navigate away while dialog is open - no crash', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 10)
    await waitForOnboardingDialog(page)

    await page.goto('/categorias')
    await page.waitForLoadState('networkidle')

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('11. Refresh page with dialog open - dialog reappears correctly', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 11)
    await waitForOnboardingDialog(page)

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('text=Bienvenido', { timeout: 10_000 })

    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
    await expect(page.getByRole('button', { name: /empezar a explorar/i })).toBeVisible()
  })

  test('12. Network failure simulation - offline during Supabase update', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await registerFreshUser(page, 12)
    await waitForOnboardingDialog(page)

    await page.context().setOffline(true)
    await page.waitForTimeout(500)

    const btn = page.getByRole('button', { name: /empezar a explorar/i })
    await btn.click()
    await page.waitForTimeout(3000)

    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    expect(consoleErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })
})
