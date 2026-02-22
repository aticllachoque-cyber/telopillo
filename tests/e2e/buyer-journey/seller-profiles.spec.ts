import { test, expect } from '@playwright/test'
import { TEST_DATA } from '../../helpers'

const { businessSlug, businessSellerId, personalSellerId } = TEST_DATA

// ---------------------------------------------------------------------------
// 1. Personal Seller Profile
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Seller Profiles', () => {
  test('Personal seller profile shows name, products, and badge', async ({ page }) => {
    await page.goto(`/vendedor/${personalSellerId}`)
    await page.waitForLoadState('networkidle')

    // Seller name in heading
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Products section
    await expect(page.getByRole('heading', { name: /productos de/i })).toBeVisible()

    // Verification badge (may be present for verified sellers)
    const verificationBadge = page.getByRole('img', { name: /verificado|negocio|vendedor/i })
    const badgeCount = await verificationBadge.count()
    if (badgeCount > 0) {
      await expect(verificationBadge.first()).toBeVisible()
    }

    // Back link
    await expect(page.getByRole('link', { name: /volver/i })).toBeVisible()
  })

  test('Business seller profile shows Visitar tienda link', async ({ page }) => {
    await page.goto(`/vendedor/${businessSellerId}`)
    await page.waitForLoadState('networkidle')

    const visitStoreLink = page.getByRole('link', { name: /visitar tienda/i })
    await expect(visitStoreLink).toBeVisible()
    expect(await visitStoreLink.getAttribute('href')).toContain(`/negocio/${businessSlug}`)
  })
})

// ---------------------------------------------------------------------------
// 2. Business Storefront
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Business Storefront', () => {
  test('Business storefront shows header, info, hours, and products', async ({ page }) => {
    await page.goto(`/negocio/${businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Business name in header
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Products section
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Breadcrumb
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    await expect(breadcrumb).toBeVisible()

    // Sidebar may have Horario, Ubicación, Enlaces, or empty state message
    const sidebarContent = page.getByText(
      /horario de atención|ubicación|enlaces|información de contacto/i
    )
    await expect(sidebarContent.first()).toBeVisible({ timeout: 3000 })
  })
})

// ---------------------------------------------------------------------------
// 3. Cross-Navigation
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Seller Cross-Navigation', () => {
  test('Storefront to seller profile and back', async ({ page }) => {
    await page.goto(`/negocio/${businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Click seller profile link in header (shows full name or "Ver vendedor")
    const sellerLink = page.locator('a[href^="/vendedor/"]').first()
    await expect(sellerLink).toBeVisible({ timeout: 3000 })
    await sellerLink.click()

    await page.waitForURL(/\/vendedor\/[a-f0-9-]+/, { timeout: 10000 })
    expect(page.url()).toContain('/vendedor/')

    // From seller profile, click "Visitar tienda"
    const visitStoreLink = page.getByRole('link', { name: /visitar tienda/i })
    await expect(visitStoreLink).toBeVisible()
    await visitStoreLink.click()

    await page.waitForURL(new RegExp(`/negocio/${businessSlug}`), { timeout: 10000 })
    expect(page.url()).toContain(`/negocio/${businessSlug}`)
  })
})

// ---------------------------------------------------------------------------
// 4. SEO - JSON-LD Structured Data
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Seller SEO', () => {
  test('Seller profile has Person JSON-LD structured data', async ({ page }) => {
    await page.goto(`/vendedor/${personalSellerId}`)
    await page.waitForLoadState('networkidle')

    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      return script ? JSON.parse(script.textContent || '{}') : null
    })

    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('Person')
    expect(jsonLd['@context']).toBe('https://schema.org')
  })

  test('Business storefront has LocalBusiness JSON-LD structured data', async ({ page }) => {
    await page.goto(`/negocio/${businessSlug}`)
    await page.waitForLoadState('networkidle')

    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      return script ? JSON.parse(script.textContent || '{}') : null
    })

    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('LocalBusiness')
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd.name).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// 5. Error Scenarios
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Seller Profile Errors', () => {
  test('Returns 404 for non-existent seller', async ({ page }) => {
    const response = await page.goto('/vendedor/00000000-0000-0000-0000-000000000000')
    expect(response?.status()).toBe(404)
  })

  test('Returns 404 for non-existent business slug', async ({ page }) => {
    const response = await page.goto('/negocio/non-existent-slug-xyz-123')
    expect(response?.status()).toBe(404)
  })
})
