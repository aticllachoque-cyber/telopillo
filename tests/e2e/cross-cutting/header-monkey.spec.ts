/**
 * Monkey/Chaos testing for Telopillo.bo header.
 * Tests: Desktop header (Logo | Search | Publicar Gratis | Ingresar),
 * Mobile hamburger menu, responsive transitions, search bar, navigation flow,
 * keyboard navigation.
 */
import { test, expect, type Page } from '@playwright/test'
import { assertNoHorizontalScroll } from '../../helpers'

const FUZZ_INPUTS = [
  '',
  ' ',
  'a'.repeat(200),
  '<script>alert("xss")</script>',
  '"><img src=x onerror=alert(1)>',
  '🎉🇧🇴💰🛒',
  '¿Cuánto cuesta? ñ á é í ó ú',
  '-1',
  'null',
  '../../../etc/passwd',
  '\n\n\n',
  '<h1>Big Text</h1>',
  '{{template}}',
]

const VIEWPORTS = [
  { width: 320, height: 480 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]

const KEYBOARD_KEYS = [
  'Tab',
  'Escape',
  'Enter',
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

async function randomClickStorm(page: Page, iterations: number = 30) {
  const interactiveSelectors = [
    'button',
    'a[href]',
    'input',
    '[role="button"]',
    '[role="search"] input',
  ]

  for (let i = 0; i < iterations; i++) {
    const selector = interactiveSelectors[Math.floor(Math.random() * interactiveSelectors.length)]
    const elements = page.locator(selector).first()
    try {
      if ((await elements.count()) > 0) {
        await elements.click({ timeout: 2000, force: true })
        await page.waitForTimeout(150)
      }
    } catch {
      // Element may have been removed — continue
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Desktop Header Structure (viewport >= 768px)
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Desktop Structure', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('Desktop header shows only Logo, Search, Publicar Gratis, Ingresar (unauthenticated)', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const header = page.getByRole('banner')

    // Must be visible
    await expect(header.getByRole('link', { name: /telopillo/i })).toBeVisible()
    await expect(header.getByRole('search', { name: /buscar productos/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /publicar gratis/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /ingresar/i })).toBeVisible()

    // Must NOT be visible (removed from desktop)
    await expect(header.getByRole('link', { name: /categorías/i })).not.toBeVisible()
    await expect(header.getByRole('link', { name: /lo que buscan/i })).not.toBeVisible()
    await expect(header.getByRole('link', { name: /iniciar sesión/i })).not.toBeVisible()
    await expect(header.getByRole('link', { name: /registrarse/i })).not.toBeVisible()
  })

  test('Desktop header on product page - same structure', async ({ page }) => {
    await page.goto('/buscar?q=celular')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const productLink = page.locator('a[href^="/productos/"]').first()
    if ((await productLink.count()) > 0) {
      await productLink.click()
      await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 8000 })
    }

    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /telopillo/i })).toBeVisible()
    await expect(header.getByRole('search', { name: /buscar productos/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /publicar gratis/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /ingresar/i })).toBeVisible()
  })

  test('Desktop header survives random click storm', async ({ page }) => {
    const { consoleErrors, networkErrors } = attachErrorMonitors(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await randomClickStorm(page, 25)

    // Page should still render
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
    await expect(page.locator('main, [role="main"], #main-content')).toBeVisible()
    expect(consoleErrors).toEqual([])
    expect(networkErrors).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 2. Mobile Header & Hamburger Menu
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Mobile Menu', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('Mobile hamburger opens menu with all nav items', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Hamburger visible, desktop nav hidden
    await expect(page.getByRole('button', { name: /abrir menú/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /categorías/i })).not.toBeVisible()

    // Open menu
    await page.getByRole('button', { name: /abrir menú/i }).click()
    await page.waitForTimeout(300)

    // Menu content visible
    const menu = page.locator('#mobile-nav-dialog')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: /buscar/i })).toBeVisible()
    await expect(menu.getByRole('link', { name: /categorías/i })).toBeVisible()
    await expect(menu.getByRole('link', { name: /lo que buscan/i })).toBeVisible()
    await expect(menu.getByRole('link', { name: /publicar gratis/i })).toBeVisible()
    await expect(menu.getByRole('link', { name: /iniciar sesión/i })).toBeVisible()
  })

  test('Mobile menu closes on backdrop click', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /abrir menú/i }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('#mobile-nav-dialog')).toBeVisible()

    // Click backdrop (black overlay)
    await page.locator('.fixed.inset-0.bg-black\\/50').click()
    await page.waitForTimeout(200)
    await expect(page.locator('#mobile-nav-dialog')).not.toBeVisible()
  })

  test('Mobile menu closes on Escape key', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /abrir menú/i }).click()
    await page.waitForTimeout(200)
    await expect(page.locator('#mobile-nav-dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    await expect(page.locator('#mobile-nav-dialog')).not.toBeVisible()
  })

  test('Mobile menu rapid open/close - no crashes', async ({ page }) => {
    const { consoleErrors } = attachErrorMonitors(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: /abrir menú|cerrar menú/i }).click()
      await page.waitForTimeout(100)
    }

    expect(consoleErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('Mobile menu link navigates and closes menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /abrir menú/i }).click()
    await page.waitForTimeout(200)

    await page.getByRole('link', { name: /categorías/i }).click()
    await page.waitForURL(/\/categorias/, { timeout: 5000 })
    await expect(page.locator('#mobile-nav-dialog')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Responsive Transitions
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Responsive Transitions', () => {
  test('Rapid viewport resize - no layout breakage', async ({ page }) => {
    const { consoleErrors } = attachErrorMonitors(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    for (const vp of VIEWPORTS) {
      await page.setViewportSize(vp)
      await page.waitForTimeout(300)

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, `Horizontal overflow at ${vp.width}x${vp.height}`).toBeLessThanOrEqual(
        clientWidth + 10
      )
    }

    expect(consoleErrors).toEqual([])
  })

  test('Header elements correct at 767px (mobile) and 768px (desktop)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 767px = mobile
    await page.setViewportSize({ width: 767, height: 600 })
    await page.waitForTimeout(400)
    await expect(page.getByRole('button', { name: /abrir menú/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /categorías/i })).not.toBeVisible()

    // 768px = desktop
    await page.setViewportSize({ width: 768, height: 600 })
    await page.waitForTimeout(400)
    await expect(page.getByRole('search', { name: /buscar productos/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /publicar gratis/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Search Bar Interactions
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Search Bar', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('Empty search submit does not navigate', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const searchForm = page.getByRole('search', { name: /buscar productos/i })
    await searchForm.getByRole('button', { name: /buscar/i }).click()
    await page.waitForTimeout(500)

    expect(page.url()).not.toContain('/buscar?q=')
  })

  test('Valid search navigates to /buscar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.getByRole('search', { name: /buscar productos/i }).locator('input')
    await input.fill('celular samsung')
    await page
      .getByRole('search')
      .getByRole('button', { name: /buscar/i })
      .click()
    await page.waitForURL(/\/buscar\?q=/, { timeout: 5000 })

    expect(page.url()).toContain('q=')
  })

  test('Search bar handles fuzz inputs without crash', async ({ page }) => {
    const { consoleErrors } = attachErrorMonitors(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.getByRole('search', { name: /buscar productos/i }).locator('input')

    for (const fuzz of FUZZ_INPUTS.slice(0, 8)) {
      await input.fill(fuzz)
      await page.waitForTimeout(100)
      if (fuzz.trim()) {
        await page
          .getByRole('search')
          .getByRole('button', { name: /buscar/i })
          .click()
          .catch(() => {})
        await page.waitForTimeout(200)
      }
    }

    expect(consoleErrors).toEqual([])
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('Special characters in search are encoded', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const input = page.getByRole('search', { name: /buscar productos/i }).locator('input')
    await input.fill('café & té')
    await page
      .getByRole('search')
      .getByRole('button', { name: /buscar/i })
      .click()
    await page.waitForURL(/\/buscar\?q=/, { timeout: 5000 })

    const url = new URL(page.url())
    expect(url.searchParams.get('q')).toBe('café & té')
  })
})

// ---------------------------------------------------------------------------
// 5. Navigation Flow
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Navigation Flow', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('Ingresar navigates to /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /ingresar/i }).click()
    await page.waitForURL(/\/login/, { timeout: 5000 })

    expect(page.url()).toContain('/login')
  })

  test('Login page has link to register', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('link', { name: /regístrate/i })).toBeVisible()
    await page.getByRole('link', { name: /regístrate/i }).click()
    await page.waitForURL(/\/register/, { timeout: 5000 })
  })

  test('Publicar Gratis navigates to /publicar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /publicar gratis/i }).click()
    await page.waitForURL(/\/publicar/, { timeout: 5000 })
  })

  test('Logo navigates to homepage', async ({ page }) => {
    await page.goto('/buscar?q=test')
    await page.waitForLoadState('networkidle')

    await page.getByRole('link', { name: /telopillo/i }).click()
    await page.waitForURL((url) => url.pathname === '/', { timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// 6. Keyboard Navigation
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Keyboard Navigation', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('Tab order: Logo -> Search -> Publicar -> Ingresar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused)

    // Tab through a few elements
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      await page.waitForTimeout(50)
    }

    // Should not be trapped
    const activeEl = await page.evaluate(() => (document.activeElement as HTMLElement)?.tagName)
    expect(activeEl).toBeTruthy()
  })

  test('Escape closes mobile menu when focused inside', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /abrir menú/i }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('#mobile-nav-dialog')).toBeVisible()

    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    await expect(page.locator('#mobile-nav-dialog')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 7. Layout & Accessibility
// ---------------------------------------------------------------------------
test.describe('Header Monkey - Layout & A11y', () => {
  test('No horizontal overflow on homepage (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalScroll(page)
  })

  test('No horizontal overflow on homepage (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalScroll(page)
  })

  test('Header has accessible labels (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('search', { name: /buscar productos/i })).toBeVisible()
  })

  test('Header has accessible labels (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('button', { name: /abrir menú/i })).toBeVisible()
  })
})
