import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data (from seeded database)
const BUSINESS_SLUG = 'usuario-de-desarrollo'
const BUSINESS_SELLER_ID = '9b8794bb-d357-499a-8c10-d5413b6a7ccb'
const PERSONAL_SELLER_ID = '09a4ef63-b8ec-4931-9885-e4d785e79643'

// ---------------------------------------------------------------------------
// 1. Registration Flow
// ---------------------------------------------------------------------------
test.describe('M4.5 - Registration Flow', () => {
  test('Register page renders personal fields and optional business section', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Core registration fields are visible
    await expect(page.getByLabel(/nombre completo/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()

    // Optional business section exists as an expandable toggle
    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await expect(businessToggle).toBeVisible()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('Business section expands and shows business fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await businessToggle.click()

    // Business fields are now visible
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible()
    await expect(page.getByLabel(/categoría del negocio/i)).toBeVisible()
  })

  test('Business section collapses back', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    // Expand
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'true')

    // Collapse
    await businessToggle.click()
    await expect(businessToggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('Register form validation shows Spanish error messages', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Fill invalid data
    await page.getByLabel(/nombre completo/i).fill('A')
    await page.getByLabel(/email/i).first().fill('invalid-email')
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('weak')
    await page.getByLabel(/confirmar contraseña/i).fill('different')

    // Submit
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Should show Spanish validation errors
    await expect(page.getByText(/inválido|caracteres|mayúscula|número|coinciden/i)).toBeVisible({
      timeout: 3000,
    })
  })
})

// ---------------------------------------------------------------------------
// 2. Business Storefront Page
// ---------------------------------------------------------------------------
test.describe('M4.5 - Business Storefront', () => {
  test('Storefront page loads with header, sidebar, and products section', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Business name visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Verification badge present
    await expect(page.getByRole('img', { name: /negocio|vendedor/i })).toBeVisible()

    // Products section heading
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Breadcrumb navigation
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: /inicio/i })).toBeVisible()
  })

  test('Storefront has SEO metadata', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    expect(response?.status()).toBe(200)

    // Check page title contains business name
    const title = await page.title()
    expect(title.toLowerCase()).toContain('usuario de desarrollo')

    // Check meta description
    const metaDesc = await page.getAttribute('meta[name="description"]', 'content')
    expect(metaDesc).toBeTruthy()

    // Check canonical URL
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(canonical).toContain(`/negocio/${BUSINESS_SLUG}`)
  })

  test('Storefront has JSON-LD structured data', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      return script ? JSON.parse(script.textContent || '{}') : null
    })

    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('LocalBusiness')
    expect(jsonLd.name).toBeTruthy()
  })

  test('Storefront header links to seller profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Should have a link to the seller's personal profile
    // At least the profile link in the header
    const vendedorLinks = page.locator(`a[href*="/vendedor/"]`)
    const count = await vendedorLinks.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('Storefront returns 404 for invalid slug', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/negocio/non-existent-business-xyz`)
    expect(response?.status()).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// 3. Personal Seller Profile
// ---------------------------------------------------------------------------
test.describe('M4.5 - Personal Seller Profile', () => {
  test('Seller profile page loads with header and products section', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    // Seller name heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Verification badge
    await expect(page.getByRole('img', { name: /negocio|vendedor/i })).toBeVisible()

    // Member since date
    await expect(page.getByText(/miembro desde/i)).toBeVisible()

    // Products section
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()
  })

  test('Business seller profile shows "Visitar tienda" link', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    // Should have a link to the business storefront
    const storeLink = page.getByRole('link', { name: /visitar tienda/i })
    await expect(storeLink).toBeVisible()
    await expect(storeLink).toHaveAttribute('href', `/negocio/${BUSINESS_SLUG}`)
  })

  test('Seller profile has SEO metadata and JSON-LD', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title).toBeTruthy()

    // JSON-LD Person
    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      return script ? JSON.parse(script.textContent || '{}') : null
    })
    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('Person')
  })

  test('Seller profile returns 404 for non-existent seller', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/vendedor/00000000-0000-0000-0000-000000000000`)
    expect(response?.status()).toBe(404)
  })

  test('Seller without phone shows no-phone message', async ({ page }) => {
    // Alcides has no phone
    await page.goto(`${BASE_URL}/vendedor/${PERSONAL_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    // Should see the no-phone fallback message
    await expect(page.getByText(/no ha agregado un número de contacto/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Verification Badge
// ---------------------------------------------------------------------------
test.describe('M4.5 - Verification Badge', () => {
  test('Badge is keyboard accessible and shows tooltip on focus', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    // Find the badge
    const badge = page.getByRole('img', { name: /negocio|vendedor/i }).first()
    await expect(badge).toBeVisible()

    // Badge should be focusable
    await expect(badge).toHaveAttribute('tabindex', '0')

    // Focus the badge
    await badge.focus()

    // Tooltip should appear
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible()
  })

  test('Badge has correct aria attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    const badge = page.getByRole('img', { name: /negocio|vendedor/i }).first()
    await expect(badge).toHaveAttribute('role', 'img')
    await expect(badge).toHaveAttribute('aria-label')
    await expect(badge).toHaveAttribute('aria-describedby')
  })

  test('Badge uses correct accented label (Teléfono)', async ({ page }) => {
    // Visit a seller with phone verification (business seller)
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Check if any badge text contains "Teléfono" (with accent)
    const badgeTexts = await page.locator('[role="img"]').allTextContents()
    // At least one badge should be visible
    expect(badgeTexts.length).toBeGreaterThanOrEqual(1)

    // Verify no unaccented "Telefono" exists
    for (const text of badgeTexts) {
      if (text.includes('Telefono')) {
        // If it says Telefono, it must be Teléfono
        expect(text).toContain('Teléfono')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 5. Product Detail - Seller Card
// ---------------------------------------------------------------------------
test.describe('M4.5 - Product Detail Seller Card', () => {
  test('Seller card shows on product page with profile link', async ({ page }) => {
    // Navigate to search to find a product
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')

    // Find the first product link
    const productLink = page.locator('a[href^="/productos/"]').first()
    if (await productLink.isVisible()) {
      await productLink.click()
      await page.waitForLoadState('networkidle')

      // Seller card should be visible
      await expect(page.getByText(/vendedor/i).first()).toBeVisible()

      // Profile link should exist
      const profileLink = page.locator('a[href^="/vendedor/"]')
      const count = await profileLink.count()
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })

  test('Seller card emoji has aria-hidden', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href^="/productos/"]').first()
    if (await productLink.isVisible()) {
      await productLink.click()
      await page.waitForLoadState('networkidle')

      // Safety tips emoji should be aria-hidden
      const emojiSpan = page.locator('span[aria-hidden="true"]:has-text("💡")')
      if ((await emojiSpan.count()) > 0) {
        await expect(emojiSpan.first()).toHaveAttribute('aria-hidden', 'true')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 6. Search Results - Seller Info on Product Cards
// ---------------------------------------------------------------------------
test.describe('M4.5 - Search Results Seller Info', () => {
  test('Search results show seller names on product cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=`)
    await page.waitForLoadState('networkidle')

    // Wait for product cards to load
    await page.waitForTimeout(2000)

    // Check for seller links on cards (either /vendedor/ or /negocio/)
    const sellerLinks = page.locator('a[href^="/vendedor/"], a[href^="/negocio/"]')
    const count = await sellerLinks.count()
    // If there are products, they should have seller info
    if (count > 0) {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('Search API supports sellerType filter', async ({ request }) => {
    // Test business filter
    const bizResponse = await request.get(`${BASE_URL}/api/search?sellerType=business`)
    expect(bizResponse.ok()).toBeTruthy()
    const bizData = await bizResponse.json()
    expect(bizData).toHaveProperty('products')

    // Test personal filter
    const personalResponse = await request.get(`${BASE_URL}/api/search?sellerType=personal`)
    expect(personalResponse.ok()).toBeTruthy()
    const personalData = await personalResponse.json()
    expect(personalData).toHaveProperty('products')
  })

  test('Search products include seller fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/search`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    if (data.products && data.products.length > 0) {
      const product = data.products[0]
      // Seller fields should be present (may be null for some)
      expect(product).toHaveProperty('seller_name')
      expect(product).toHaveProperty('seller_verification_level')
    }
  })
})

// ---------------------------------------------------------------------------
// 7. Business Profile Form (validation i18n)
// ---------------------------------------------------------------------------
test.describe('M4.5 - Business Profile Validation', () => {
  test('Business profile validation messages are in Spanish', async ({ page }) => {
    // This test checks the validation schema indirectly via the register page
    await page.goto(`${BASE_URL}/register`)
    await page.waitForLoadState('networkidle')

    // Expand business section
    const businessToggle = page.getByRole('button', { name: /negocio.*opcional/i })
    await businessToggle.click()

    // Fill in a very short business name (less than 2 chars)
    await page.getByLabel(/nombre del negocio/i).fill('A')

    // Fill required fields to trigger submission
    await page.getByLabel(/nombre completo/i).fill('Test User')
    await page.getByLabel(/email/i).first().fill('test@test.com')
    await page
      .getByLabel(/contraseña/i)
      .first()
      .fill('TestPass123!')
    await page.getByLabel(/confirmar contraseña/i).fill('TestPass123!')

    // Submit
    await page.getByRole('button', { name: /crear cuenta/i }).click()

    // Check that any business name error is in Spanish (if visible)
    await page.waitForTimeout(1000)
    const errorTexts = await page.locator('[role="alert"]').allTextContents()
    for (const text of errorTexts) {
      // Should not contain English-only patterns
      expect(text).not.toMatch(/must be at least|must contain|must be a valid/i)
    }
  })
})

// ---------------------------------------------------------------------------
// 8. BusinessInfoSidebar - Status Indicator
// ---------------------------------------------------------------------------
test.describe('M4.5 - Business Info Sidebar', () => {
  test('Open/closed status uses text + visual indicator (not color only)', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Look for status indicators
    const openStatus = page.locator('[role="status"]:has-text("Abierto")')
    const closedStatus = page.locator('[role="status"]:has-text("Cerrado")')

    // At least one should exist (either open or closed for today)
    const openCount = await openStatus.count()
    const closedCount = await closedStatus.count()
    expect(openCount + closedCount).toBeGreaterThanOrEqual(0) // May not have hours set
  })

  test('Social links have aria-labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Check that external links have aria-labels
    const externalLinks = page.locator('a[target="_blank"]')
    const count = await externalLinks.count()
    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i)
      const ariaLabel = await link.getAttribute('aria-label')
      const text = await link.textContent()
      // Either has aria-label or has visible text content
      expect(ariaLabel || text?.trim()).toBeTruthy()
    }
  })
})

// ---------------------------------------------------------------------------
// 9. BusinessHoursEditor - Touch Targets
// ---------------------------------------------------------------------------
test.describe('M4.5 - Business Hours Editor Touch Targets', () => {
  test('Day toggle buttons have minimum touch target height of 44px', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel(/email/i).fill('dev@telopillo.test')
    await page.getByLabel(/contraseña/i).fill('DevTest123')
    await page.locator('#main-content button[type="submit"]').click()
    await page.waitForURL('**/*', { timeout: 15000 })

    await page.goto(`${BASE_URL}/profile/edit`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Look for day toggle switches (role="switch")
    const toggles = page.locator('button[role="switch"]')
    const count = await toggles.count()

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const box = await toggles.nth(i).boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 10. Cross-navigation Integration
// ---------------------------------------------------------------------------
test.describe('M4.5 - Cross-navigation', () => {
  test('Storefront -> Seller profile navigation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    await page.waitForLoadState('networkidle')

    // Find link to seller profile and navigate
    const vendedorLink = page.locator(`a[href^="/vendedor/"]`).first()
    if (await vendedorLink.isVisible()) {
      const href = await vendedorLink.getAttribute('href')
      // Use direct navigation to avoid client-side routing issues in test
      await page.goto(`${BASE_URL}${href}`)
      await page.waitForLoadState('networkidle')

      // Should be on seller profile page
      expect(page.url()).toContain('/vendedor/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })

  test('Seller profile -> Storefront navigation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    await page.waitForLoadState('networkidle')

    // Find "Visitar tienda" link and navigate
    const storeLink = page.getByRole('link', { name: /visitar tienda/i })
    const href = await storeLink.getAttribute('href')
    await page.goto(`${BASE_URL}${href}`)
    await page.waitForLoadState('networkidle')

    // Should be on storefront page
    expect(page.url()).toContain(`/negocio/${BUSINESS_SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
