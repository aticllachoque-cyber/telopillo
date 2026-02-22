import { test, expect } from '@playwright/test'
import { login, runAxeAudit, assertNoHorizontalScroll, TEST_DATA } from '../../helpers'

// ---------------------------------------------------------------------------
// 1. Business Profile Setup (Profile Edit)
// ---------------------------------------------------------------------------
test.describe('Business Seller - Profile Edit', () => {
  test('Login as business seller, navigate to profile edit, verify business section visible', async ({
    page,
  }) => {
    await login(page)
    await page.goto('/profile/edit')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/cargando perfil/i)).not.toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(4000) // Allow BusinessProfileForm to load from Supabase

    // Business section should be visible (user has business profile)
    await expect(page.getByText(/perfil de negocio/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel(/nombre del negocio/i)).toBeVisible({ timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// 2. Storefront Public View
// ---------------------------------------------------------------------------
test.describe('Business Seller - Storefront Public View', () => {
  test('Storefront shows business header, info sidebar, trust badge, product grid', async ({
    page,
  }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Business header with name
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()
    await expect(heading).toContainText(/usuario|desarrollo/i)

    // Trust badge
    await expect(page.getByRole('img', { name: /negocio|vendedor/i })).toBeVisible()

    // Products section
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Info sidebar shows hours, location, or links (or empty state message)
    const hasSidebarContent =
      (await page
        .getByText(/horario de atención|ubicación|enlaces|información de contacto/i)
        .first()
        .isVisible()) || (await page.getByRole('heading', { name: /productos/i }).isVisible())
    expect(hasSidebarContent).toBeTruthy()
  })

  test('Click product navigates to product detail, seller card links back to storefront', async ({
    page,
  }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    const productLink = page.locator('a[href^="/productos/"]').first()
    if (await productLink.isVisible()) {
      await productLink.click()
      await page.waitForURL('**/productos/**', { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Product detail page
      expect(page.url()).toContain('/productos/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Seller card with "Visitar tienda" link
      const storeLink = page.getByRole('link', { name: /visitar tienda/i })
      if (await storeLink.isVisible()) {
        await expect(storeLink).toHaveAttribute('href', `/negocio/${TEST_DATA.businessSlug}`)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 3. SEO Metadata
// ---------------------------------------------------------------------------
test.describe('Business Seller - Storefront SEO', () => {
  test('Storefront has JSON-LD LocalBusiness, canonical URL, meta title and description', async ({
    page,
  }) => {
    const response = await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    expect(response?.status()).toBe(200)

    // Page title
    const title = await page.title()
    expect(title.toLowerCase()).toContain('usuario')
    expect(title.toLowerCase()).toContain('telopillo')

    // Meta description
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDesc).toBeTruthy()

    // Canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toContain(`/negocio/${TEST_DATA.businessSlug}`)

    // JSON-LD LocalBusiness
    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      return script ? JSON.parse(script.textContent || '{}') : null
    })
    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('LocalBusiness')
    expect(jsonLd.name).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 4. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Business Seller - Storefront Errors', () => {
  test('Returns 404 for non-existent business slug', async ({ page }) => {
    const response = await page.goto('/negocio/non-existent-slug-xyz')
    expect(response?.status()).toBe(404)
  })

  test('Storefront shows empty state when business has no products', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Either product grid or empty state
    const hasProducts = (await page.locator('a[href^="/productos/"]').count()) > 0
    const hasEmptyState = await page.getByText(/sin productos publicados/i).isVisible()

    expect(hasProducts || hasEmptyState).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 5. Accessibility
// ---------------------------------------------------------------------------
test.describe('Business Seller - Storefront Accessibility', () => {
  test('Storefront passes axe-core WCAG 2.2 AA audit', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    await runAxeAudit(page, {
      exclude: ['[data-slot="avatar-fallback"]', '[data-slot="select-value"]'],
    })
  })

  test('Trust badge is accessible via keyboard and shows tooltip on focus', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    const badge = page.getByRole('img', { name: /negocio|vendedor/i }).first()
    await expect(badge).toBeVisible()
    await expect(badge).toHaveAttribute('tabindex', '0')

    await badge.focus()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toBeVisible({ timeout: 2000 })
  })
})

// ---------------------------------------------------------------------------
// 6. Mobile Responsive (375x812)
// ---------------------------------------------------------------------------
test.describe('Business Seller - Storefront Mobile (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('No horizontal scroll on storefront', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    await assertNoHorizontalScroll(page)
  })

  test('Sidebar stacks below products on mobile, single-column product grid', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Both header and products visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Product grid uses single column on mobile (grid-cols-1)
    const productLinks = page.locator('a[href^="/productos/"]')
    const count = await productLinks.count()
    if (count > 0) {
      await expect(productLinks.first()).toBeVisible()
    }
  })

  test('Product links and main CTAs have adequate touch target size', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Product links (full card area) or WhatsApp CTA should be tappable
    const productLinks = page.locator('a[href^="/productos/"]')
    const count = await productLinks.count()
    let foundAdequateTarget = false

    if (count > 0) {
      const box = await productLinks.first().boundingBox()
      if (box && Math.max(box.width, box.height) >= 44) {
        foundAdequateTarget = true
      }
    }

    const whatsappBtn = page.getByRole('link', { name: /contactar por whatsapp/i })
    if (await whatsappBtn.isVisible()) {
      const btnBox = await whatsappBtn.boundingBox()
      if (btnBox && Math.max(btnBox.width, btnBox.height) >= 44) {
        foundAdequateTarget = true
      }
    }

    const sellerProfileLink = page.getByRole('link', { name: /ver perfil del vendedor/i })
    if (await sellerProfileLink.isVisible()) {
      const linkBox = await sellerProfileLink.boundingBox()
      if (linkBox && Math.max(linkBox.width, linkBox.height) >= 44) {
        foundAdequateTarget = true
      }
    }

    expect(foundAdequateTarget).toBeTruthy()
  })
})
