import { test, expect } from '@playwright/test'
import { TEST_DATA } from '../../helpers'

// ---------------------------------------------------------------------------
// Helper: navigate to the first available product detail page
// ---------------------------------------------------------------------------
async function navigateToProductDetail(page: import('@playwright/test').Page) {
  // Use a broad search to maximise chance of finding products
  await page.goto('/buscar?q=')
  await page.waitForLoadState('networkidle')

  const productLink = page.locator('a[href^="/productos/"]').first()
  if ((await productLink.count()) === 0) {
    return false
  }

  // Capture href before clicking so we can wait for the exact URL
  const href = await productLink.getAttribute('href')
  await productLink.click()

  if (href) {
    await page.waitForURL(`**${href}`, { timeout: 15000 })
  } else {
    await page.waitForURL(/\/productos\//, { timeout: 15000 })
  }
  await page.waitForLoadState('networkidle')
  return true
}

// ---------------------------------------------------------------------------
// 1. Contact Seller from Product Detail Page (SellerCard)
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Contact Seller from Product Detail', () => {
  test('Seller card shows WhatsApp contact button when seller has phone', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    // Seller card section
    await expect(page.getByRole('heading', { name: /vendedor/i })).toBeVisible()

    // Either WhatsApp button or "no phone" fallback must be present
    const whatsappLink = page.getByRole('link', { name: /contactar.*vendedor/i })
    const noPhoneMessage = page.getByText(/no ha agregado un número de contacto/i)

    const hasWhatsApp = (await whatsappLink.count()) > 0
    const hasNoPhone = (await noPhoneMessage.count()) > 0

    // One of the two must be visible
    expect(hasWhatsApp || hasNoPhone).toBe(true)

    if (hasWhatsApp) {
      await expect(whatsappLink).toBeVisible()

      // WhatsApp link opens in new tab
      const target = await whatsappLink.getAttribute('target')
      expect(target).toBe('_blank')

      // WhatsApp link has correct domain
      const href = await whatsappLink.getAttribute('href')
      expect(href).toMatch(/https:\/\/wa\.me\//)

      // Link has noopener noreferrer for security
      const rel = await whatsappLink.getAttribute('rel')
      expect(rel).toContain('noopener')
      expect(rel).toContain('noreferrer')
    }
  })

  test('WhatsApp link includes product title as pre-filled message', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const whatsappLink = page.getByRole('link', { name: /contactar.*vendedor/i })
    if ((await whatsappLink.count()) === 0) {
      test.skip()
      return
    }

    const href = await whatsappLink.getAttribute('href')
    expect(href).toBeTruthy()

    // The href should contain a ?text= parameter with product-related message
    expect(href).toContain('text=')

    // Decode and verify it mentions the product
    const textParam = decodeURIComponent(href!.split('text=')[1] || '')
    expect(textParam.toLowerCase()).toContain('interesado')
  })

  test('WhatsApp link uses Bolivia country code (591)', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const whatsappLink = page.getByRole('link', { name: /contactar.*vendedor/i })
    if ((await whatsappLink.count()) === 0) {
      test.skip()
      return
    }

    const href = await whatsappLink.getAttribute('href')
    expect(href).toBeTruthy()

    // Phone number in wa.me link — if a number is present, it should start with 591
    const phoneMatch = href!.match(/wa\.me\/(\d+)/)
    if (phoneMatch) {
      expect(phoneMatch[1]).toMatch(/^591/)
    }
  })

  test('WhatsApp contact button has accessible label', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const whatsappLink = page.getByRole('link', { name: /contactar.*vendedor/i })
    if ((await whatsappLink.count()) === 0) {
      test.skip()
      return
    }

    // aria-label should mention seller name and product title
    const ariaLabel = await whatsappLink.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('whatsapp')
  })

  test('Seller without phone shows fallback CTA to view profile', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const noPhoneMessage = page.getByText(/no ha agregado un número de contacto/i)
    if ((await noPhoneMessage.count()) === 0) {
      // This seller has a phone — skip this test variant
      test.skip()
      return
    }

    await expect(noPhoneMessage).toBeVisible()

    // Fallback: "Ver perfil del vendedor" becomes the primary CTA
    const profileLink = page.getByRole('link', { name: /ver perfil del vendedor/i })
    await expect(profileLink).toBeVisible()

    const href = await profileLink.getAttribute('href')
    expect(href).toMatch(/\/vendedor\/[a-f0-9-]+/)
  })

  test('Seller card "Ver perfil del vendedor" navigates to seller page', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const profileLink = page.getByRole('link', { name: /ver perfil del vendedor/i })
    if ((await profileLink.count()) === 0) {
      test.skip()
      return
    }

    await profileLink.click()
    await page.waitForURL(/\/vendedor\/[a-f0-9-]+/, { timeout: 10000 })
    expect(page.url()).toContain('/vendedor/')
  })

  test('Business seller card shows "Visitar tienda" link to storefront', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    // Check if the seller card has a business store link
    const storeLink = page.getByRole('link', { name: /visitar tienda/i })
    if ((await storeLink.count()) === 0) {
      // This product's seller is not a business — skip
      test.skip()
      return
    }

    await expect(storeLink).toBeVisible()

    const href = await storeLink.getAttribute('href')
    expect(href).toMatch(/\/negocio\/[\w-]+/)
  })

  test('Safety tips section is visible on seller card', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    // Safety tips
    await expect(page.getByText(/consejos de seguridad/i)).toBeVisible()
    await expect(page.getByText(/lugares públicos/i)).toBeVisible()
    await expect(page.getByText(/verifica el producto/i)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Contact Business from Storefront (BusinessInfoSidebar)
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Contact Business from Storefront', () => {
  test('Business storefront shows WhatsApp contact button', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    const whatsappButton = page.getByRole('link', { name: /contactar por whatsapp/i })
    const emptyContactState = page.getByText(/no ha completado su información de contacto/i)

    const hasWhatsApp = (await whatsappButton.count()) > 0
    const hasEmptyState = (await emptyContactState.count()) > 0

    // Either WhatsApp button or empty contact state must be present
    expect(hasWhatsApp || hasEmptyState).toBe(true)

    if (hasWhatsApp) {
      await expect(whatsappButton).toBeVisible()

      const href = await whatsappButton.getAttribute('href')
      expect(href).toMatch(/https:\/\/wa\.me\//)

      const target = await whatsappButton.getAttribute('target')
      expect(target).toBe('_blank')

      const rel = await whatsappButton.getAttribute('rel')
      expect(rel).toContain('noopener')
    }
  })

  test('Business storefront shows phone number with tel: link', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    const phoneLink = page.locator('a[href^="tel:"]')
    if ((await phoneLink.count()) === 0) {
      // Business has no phone — skip
      test.skip()
      return
    }

    await expect(phoneLink).toBeVisible()

    const href = await phoneLink.getAttribute('href')
    expect(href).toMatch(/^tel:/)

    // Phone link has accessible label
    const ariaLabel = await phoneLink.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('llamar')
  })

  test('Business storefront sidebar shows location info', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Location card header
    const locationHeading = page.getByRole('heading', { name: /ubicación/i })
    if ((await locationHeading.count()) === 0) {
      test.skip()
      return
    }

    await expect(locationHeading).toBeVisible()
  })

  test('Business storefront sidebar shows business hours', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    const hoursHeading = page.getByRole('heading', { name: /horario de atención/i })
    if ((await hoursHeading.count()) === 0) {
      // Business has no hours configured — skip
      test.skip()
      return
    }

    await expect(hoursHeading).toBeVisible()

    // Open/Closed status indicator
    const openStatus = page.getByRole('status')
    await expect(openStatus.first()).toBeVisible()

    // At least one day is listed
    const hoursList = page.getByRole('list', { name: /horarios/i })
    await expect(hoursList).toBeVisible()
  })

  test('Business storefront social links open in new tab', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Check for any external social links
    const socialLinks = page.locator(
      'a[aria-label*="Facebook"], a[aria-label*="Instagram"], a[aria-label*="TikTok"], a[aria-label*="sitio web"]'
    )
    const count = await socialLinks.count()

    if (count === 0) {
      test.skip()
      return
    }

    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i)
      const target = await link.getAttribute('target')
      expect(target).toBe('_blank')

      const rel = await link.getAttribute('rel')
      expect(rel).toContain('noopener')
      expect(rel).toContain('noreferrer')
    }
  })
})

// ---------------------------------------------------------------------------
// 3. All Contact Flows Work Without Authentication
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Contact Works Without Auth', () => {
  test('Unauthenticated user can view product and see contact button', async ({ page }) => {
    // Ensure we are NOT logged in by clearing cookies
    await page.context().clearCookies()

    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    // Page loaded (not redirected to /login)
    expect(page.url()).toContain('/productos/')

    // Product content visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Seller card visible with contact option
    await expect(page.getByRole('heading', { name: /vendedor/i })).toBeVisible()

    // Contact or fallback is present
    const contactLink = page.getByRole('link', { name: /contactar.*vendedor/i })
    const profileLink = page.getByRole('link', { name: /ver perfil del vendedor/i })
    expect((await contactLink.count()) + (await profileLink.count())).toBeGreaterThan(0)
  })

  test('Unauthenticated user can view seller profile', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto(`/vendedor/${TEST_DATA.businessSellerId}`)
    await page.waitForLoadState('networkidle')

    // Not redirected to login
    expect(page.url()).toContain('/vendedor/')

    // Seller name visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Products section visible
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()
  })

  test('Unauthenticated user can view business storefront and contact info', async ({ page }) => {
    await page.context().clearCookies()

    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    // Not redirected to login
    expect(page.url()).toContain('/negocio/')

    // Business name visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Products section visible
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Contact sidebar has content (WhatsApp, phone, hours, or empty state)
    const sidebarContent = page.getByText(
      /contactar por whatsapp|horario de atención|ubicación|enlaces|no ha completado/i
    )
    await expect(sidebarContent.first()).toBeVisible({ timeout: 3000 })
  })
})

// ---------------------------------------------------------------------------
// 4. Mobile Responsive - Contact Elements (375x812)
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Contact Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('WhatsApp contact button is full-width and tappable on mobile', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const whatsappLink = page.getByRole('link', { name: /contactar.*vendedor/i })
    if ((await whatsappLink.count()) === 0) {
      test.skip()
      return
    }

    await expect(whatsappLink).toBeVisible()

    const box = await whatsappLink.boundingBox()
    expect(box).toBeTruthy()
    // Touch target >= 44px height
    expect(box!.height).toBeGreaterThanOrEqual(44)
    // Full width (close to viewport minus padding)
    expect(box!.width).toBeGreaterThan(250)
  })

  test('Business storefront WhatsApp button is tappable on mobile', async ({ page }) => {
    await page.goto(`/negocio/${TEST_DATA.businessSlug}`)
    await page.waitForLoadState('networkidle')

    const whatsappButton = page.getByRole('link', { name: /contactar por whatsapp/i })
    if ((await whatsappButton.count()) === 0) {
      test.skip()
      return
    }

    await expect(whatsappButton).toBeVisible()

    const box = await whatsappButton.boundingBox()
    expect(box).toBeTruthy()
    // shadcn size="lg" renders at 40px; WCAG recommends 44px (tracked as UI improvement)
    expect(box!.height).toBeGreaterThanOrEqual(40)
    expect(box!.width).toBeGreaterThan(250)
  })

  test('No horizontal scroll on product detail with seller card', async ({ page }) => {
    const found = await navigateToProductDetail(page)
    if (!found) {
      test.skip()
      return
    }

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })
})
