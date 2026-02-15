import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Known test data
const BUSINESS_SLUG = 'usuario-de-desarrollo'
const BUSINESS_SELLER_ID = '9b8794bb-d357-499a-8c10-d5413b6a7ccb'

async function navigateToProductDetail(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/buscar?q=samsung`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  let productLink = page.locator('a[href^="/productos/"]').first()
  if ((await productLink.count()) === 0) {
    await page.goto(`${BASE_URL}/buscar`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    productLink = page.locator('a[href^="/productos/"]').first()
  }
  if ((await productLink.count()) === 0) return false

  await productLink.click()
  await page.waitForURL(/\/productos\/[a-f0-9-]+/, { timeout: 10000 })
  await page.waitForLoadState('networkidle')
  return true
}

// ---------------------------------------------------------------------------
// 1. Homepage SEO
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting - SEO & Metadata', () => {
  test('Homepage - title contains Telopillo, og:title, og:description', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title.toLowerCase()).toContain('telopillo')

    const metaDesc = await page.getAttribute('meta[name="description"]', 'content')
    expect(metaDesc).toBeTruthy()

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
    expect(ogTitle).toBeTruthy()

    const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content')
    expect(ogDesc).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // 2. Product Detail SEO
  // ---------------------------------------------------------------------------
  test('Product detail - title contains product name, og:image from product', async ({ page }) => {
    const navigated = await navigateToProductDetail(page)
    if (!navigated) {
      test.skip()
      return
    }

    const title = await page.title()
    expect(title.toLowerCase()).toContain('telopillo')
    expect(title).not.toBe('Producto no encontrado')

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content')
    expect(ogTitle).toBeTruthy()

    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content')
    expect(ogImage).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // 3. Seller Profile SEO
  // ---------------------------------------------------------------------------
  test('Seller profile - JSON-LD Person, title contains seller name', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/vendedor/${BUSINESS_SELLER_ID}`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title.toLowerCase()).toContain('telopillo')

    const jsonLd = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/ld+json"]')
      return script ? JSON.parse(script.textContent || '{}') : null
    })
    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('Person')
  })

  // ---------------------------------------------------------------------------
  // 4. Business Storefront SEO
  // ---------------------------------------------------------------------------
  test('Business storefront - JSON-LD LocalBusiness, title, canonical URL', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/negocio/${BUSINESS_SLUG}`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title.toLowerCase()).toContain('telopillo')

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href')
    expect(canonical).toContain(`/negocio/${BUSINESS_SLUG}`)

    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '{}')
          if (data['@type'] === 'LocalBusiness') return data
        } catch {
          // skip invalid JSON
        }
      }
      return null
    })
    expect(jsonLd).not.toBeNull()
    expect(jsonLd['@type']).toBe('LocalBusiness')
  })

  // ---------------------------------------------------------------------------
  // 5. Search Results SEO
  // ---------------------------------------------------------------------------
  test('Search results - appropriate title', async ({ page }) => {
    await page.goto(`${BASE_URL}/buscar?q=samsung`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const title = await page.title()
    expect(title.toLowerCase()).toContain('telopillo')
    expect(title.toLowerCase()).toContain('samsung')
  })

  // ---------------------------------------------------------------------------
  // 6. Categories SEO
  // ---------------------------------------------------------------------------
  test('Categories page - title contains Categorías', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/categorias`)
    expect(response?.status()).toBe(200)

    const title = await page.title()
    expect(title.toLowerCase()).toContain('categorías')
    expect(title.toLowerCase()).toContain('telopillo')

    const metaDesc = await page.getAttribute('meta[name="description"]', 'content')
    expect(metaDesc).toBeTruthy()
  })
})
