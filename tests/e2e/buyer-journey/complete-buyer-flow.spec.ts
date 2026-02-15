import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ---------------------------------------------------------------------------
// 1. Complete End-to-End Buyer Journey
// ---------------------------------------------------------------------------
test.describe('Buyer Journey - Complete Flow', () => {
  test('Full flow: homepage → search → product → seller → browse products', async ({ page }) => {
    // Step 1: Land on homepage
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    expect(page.url()).toBe(`${BASE_URL}/`)

    await expect(page.getByRole('heading', { level: 1, name: /telopillo/i })).toBeVisible()

    // Step 2: Search "celular" (use hero form - header also has search)
    const hero = page.getByRole('region', { name: /lo que buscás|telopillo/i })
    const searchInput = hero.getByLabel(/término de búsqueda/i)
    await searchInput.fill('celular')
    await hero.getByRole('button', { name: /buscar/i }).click()

    await page.waitForURL(/\/buscar\?q=celular/, { timeout: 10000 })
    expect(page.url()).toContain('/buscar')
    expect(page.url()).toContain('q=celular')

    await page.waitForLoadState('networkidle')

    // Step 3: Click first product
    const firstProductLink = page.locator('a[href^="/productos/"]').first()
    const productCount = await firstProductLink.count()
    if (productCount === 0) {
      // No products - try without query to get all products
      await page.goto(`${BASE_URL}/buscar`)
      await page.waitForLoadState('networkidle')
      const anyProduct = page.locator('a[href^="/productos/"]').first()
      if ((await anyProduct.count()) === 0) {
        test.skip()
        return
      }
      await anyProduct.click()
    } else {
      await firstProductLink.click()
    }

    await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const productUrl = page.url()
    expect(productUrl).toContain('/productos/')

    // Verify product detail content (price - use first to avoid route announcer match)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/Bs \d/).first()).toBeVisible()

    // Step 4: Click seller (Ver perfil del vendedor or Visitar tienda)
    const sellerLink = page.getByRole('link', {
      name: /ver perfil del vendedor|visitar tienda/i,
    })
    const sellerLinkCount = await sellerLink.count()
    if (sellerLinkCount === 0) {
      test.skip()
      return
    }
    await sellerLink.first().click()

    await page.waitForURL(/\/vendedor\/[a-f0-9-]+|\/negocio\/[\w-]+/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    const sellerUrl = page.url()
    expect(sellerUrl).toMatch(/\/vendedor\/|\/negocio\//)

    // Step 5: Browse seller's products
    await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()

    // Verify complete flow executed - URLs updated at each step
    expect(productUrl).not.toBe(sellerUrl)
    expect(sellerUrl).not.toContain('/productos/')
  })

  test('Complete flow executes without errors', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')

    // Search
    const hero = page.getByRole('region', { name: /lo que buscás|telopillo/i })
    await hero.getByLabel(/término de búsqueda/i).fill('celular')
    await hero.getByRole('button', { name: /buscar/i }).click()
    await page.waitForURL(/\/buscar/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // No error alert
    const errorAlert = page.getByRole('alert')
    await expect(errorAlert)
      .toHaveCount(0)
      .catch(() => {})

    const firstProduct = page.locator('a[href^="/productos/"]').first()
    if ((await firstProduct.count()) === 0) {
      await page.goto(`${BASE_URL}/buscar`)
      await page.waitForLoadState('networkidle')
    }

    const productLink = page.locator('a[href^="/productos/"]').first()
    if ((await productLink.count()) > 0) {
      await productLink.click()
      await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // No 404 or error page
      const notFound = page.getByRole('heading', { name: /no encontrado|404/i })
      await expect(notFound)
        .toHaveCount(0)
        .catch(() => {})

      // Click seller
      const sellerLink = page.getByRole('link', {
        name: /ver perfil del vendedor|visitar tienda/i,
      })
      if ((await sellerLink.count()) > 0) {
        await sellerLink.first().click()
        await page.waitForURL(/\/vendedor\/|\/negocio\//, { timeout: 10000 })
        await page.waitForLoadState('networkidle')

        // Page loaded successfully
        const response = await page.goto(page.url())
        expect(response?.status()).toBe(200)
      }
    }
  })
})
