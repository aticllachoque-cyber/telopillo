/**
 * Search & Discovery — Unified search (F-1/F-3/F-4/F-5)
 *
 * /buscar now searches productos, negocios, solicitudes and personas:
 * - Tab switch updates the `type` URL param and strips non-applicable filters
 * - Seed business `tienda-electronica-la-paz` appears under Negocios
 * - Its owner (business_slug link rule) appears under Personas
 * - Tablist accessibility: role=tab, aria-selected, arrow-key roving focus
 * - Header type selector round-trip (desktop)
 * - API privacy: /api/search-businesses and /api/search-profiles never
 *   return phone fields (TELO-003)
 * - search_profiles only surfaces sellers with active listings
 *
 * Run: npx playwright test tests/e2e/search-discovery/unified-search.spec.ts
 */
import { test, expect } from '@playwright/test'

const SEARCH_TERM = 'electronica'

// ---------------------------------------------------------------------------
// 1. API — shape and privacy (TELO-003: never expose phone)
// ---------------------------------------------------------------------------
test.describe('Unified search APIs', () => {
  test('GET /api/search-businesses?q=electronica returns the seed business', async ({
    request,
  }) => {
    const response = await request.get(`/api/search-businesses?q=${SEARCH_TERM}`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('businesses')
    expect(Array.isArray(data.businesses)).toBeTruthy()
    expect(data).toHaveProperty('totalCount')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('totalPages')
    expect(data).toHaveProperty('hasMore')

    const business = data.businesses.find(
      (b: { slug: string }) => b.slug === 'tienda-electronica-la-paz'
    )
    expect(business).toBeTruthy()
    expect(business.business_name).toBe('Tienda Electronica La Paz')
    expect(business.active_listings_count).toBeGreaterThan(0)

    // Hybrid pipeline reports its mode ('hybrid' when semantic flag is on and
    // the query embedding succeeds; 'keyword' fallback must always work).
    expect(['keyword', 'hybrid']).toContain(data.searchMode)
  })

  test('GET /api/search-profiles returns sellers with active listings only', async ({
    request,
  }) => {
    const response = await request.get('/api/search-profiles?limit=50')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('profiles')
    expect(Array.isArray(data.profiles)).toBeTruthy()
    expect(data.totalCount).toBeGreaterThan(0)

    // search_profiles INNER JOINs active products: every returned seller has
    // at least one active listing (inactive-only sellers never leak).
    for (const profile of data.profiles) {
      expect(profile.active_listings_count).toBeGreaterThanOrEqual(1)
    }
  })

  test('business and profile results never contain phone fields (TELO-003)', async ({
    request,
  }) => {
    const businessResponse = await request.get(`/api/search-businesses?q=${SEARCH_TERM}`)
    const profileResponse = await request.get('/api/search-profiles?limit=50')
    expect(businessResponse.ok()).toBeTruthy()
    expect(profileResponse.ok()).toBeTruthy()

    const checkNoPhone = (rows: Record<string, unknown>[]) => {
      for (const row of rows) {
        for (const key of Object.keys(row)) {
          expect(key.toLowerCase()).not.toContain('phone')
        }
      }
    }
    checkNoPhone((await businessResponse.json()).businesses)
    checkNoPhone((await profileResponse.json()).profiles)
  })
})

// ---------------------------------------------------------------------------
// 2. /buscar — tabs, results, param handling
// ---------------------------------------------------------------------------
test.describe('Unified /buscar page', () => {
  test('negocios tab shows seed business linking to its storefront', async ({ page }) => {
    await page.goto(`/buscar?q=${SEARCH_TERM}&type=negocios`)

    const activeTab = page.getByRole('tab', { selected: true })
    await expect(activeTab).toHaveAccessibleName(/Negocios/)

    const businessLink = page.getByRole('link', { name: /Ver negocio Tienda Electronica La Paz/ })
    await expect(businessLink).toBeVisible()
    await expect(businessLink).toHaveAttribute('href', '/negocio/tienda-electronica-la-paz')
  })

  test('tab switch updates the type URL param', async ({ page }) => {
    await page.goto(`/buscar?q=${SEARCH_TERM}`)

    await expect(page.getByRole('tab', { selected: true })).toHaveAccessibleName(/Productos/)

    await page.getByRole('tab', { name: /Personas/ }).click()
    await expect(page).toHaveURL(new RegExp(`type=personas&q=${SEARCH_TERM}`))
    await expect(page.getByRole('tab', { selected: true })).toHaveAccessibleName(/Personas/)
  })

  test('tablist supports aria-selected and arrow-key navigation', async ({ page }) => {
    await page.goto(`/buscar?q=${SEARCH_TERM}`)

    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveCount(4)
    await expect(page.getByRole('tablist')).toBeVisible()

    // Only the active tab is in the tab order (roving tabindex)
    await expect(page.getByRole('tab', { name: /Productos/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    for (const name of ['Negocios', 'Solicitudes', 'Personas']) {
      await expect(page.getByRole('tab', { name: new RegExp(name) })).toHaveAttribute(
        'tabindex',
        '-1'
      )
    }

    // ArrowRight moves selection to the next entity (and commits the URL)
    await page.getByRole('tab', { name: /Productos/ }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page).toHaveURL(new RegExp(`type=negocios&q=${SEARCH_TERM}`))
    await expect(page.getByRole('tab', { name: /Negocios/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  test('personas results link via business_slug when a business exists', async ({ page }) => {
    // Seed: Ana Pereira owns tienda-electronica-la-paz → card links to the
    // storefront, not /vendedor/<id> (same rule as SellerCard).
    await page.goto('/buscar?q=Ana&type=personas')

    const personLink = page.getByRole('link', { name: /Ver perfil de Ana Pereira/ })
    await expect(personLink).toBeVisible()
    await expect(personLink).toHaveAttribute('href', '/negocio/tienda-electronica-la-paz')

    // TELO-003: no Bolivian phone number ever rendered in results
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('+591')
  })

  test('tab switch strips non-applicable filter params (F-4)', async ({ page }) => {
    // priceMin only applies to productos; switching to negocios drops it.
    await page.goto(`/buscar?q=${SEARCH_TERM}&priceMin=100`)

    await page.getByRole('tab', { name: /Negocios/ }).click()
    await expect(page).toHaveURL(new RegExp(`type=negocios&q=${SEARCH_TERM}`))
    expect(await page.url()).not.toContain('priceMin')
  })
})

// ---------------------------------------------------------------------------
// 3. Header — type selector round-trip (desktop; mobile uses the overlay)
// ---------------------------------------------------------------------------
test.describe('Header search type selector', () => {
  test('selecting Negocios in the header lands on the negocios tab', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Header search form (withTypeSelector): selector chip before the input
    const headerForm = page.getByRole('search', { name: 'Buscar en Telopillo' })
    await expect(headerForm).toBeVisible()

    await headerForm.getByRole('button', { name: 'Buscar en todo Telopillo' }).click()
    await page.getByRole('menuitem', { name: 'Negocios' }).click()

    await headerForm.getByRole('textbox').fill(SEARCH_TERM)
    await headerForm.getByRole('button', { name: 'Buscar', exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`/buscar\\?q=${SEARCH_TERM}&type=negocios`))
    await expect(page.getByRole('tab', { selected: true })).toHaveAccessibleName(/Negocios/)
  })
})
