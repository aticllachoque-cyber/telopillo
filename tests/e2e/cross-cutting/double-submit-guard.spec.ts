/**
 * Double-submit guard on publish wizards
 *
 * Both publish wizards (product `/publicar` and demand `/busco/publicar`) must not
 * create more than one record when the final "Publish" button receives a double
 * click. The protection is a synchronous `submitLockRef` inside `onSubmit`
 * (state-based `disabled` alone flushes too late for a same-frame double click).
 *
 * The race is reproduced by dispatching two `click` events synchronously inside a
 * single `page.evaluate` task, so both handlers run before React re-renders the
 * disabled button. The observable outcome is the number of server-action POSTs
 * (requests carrying the `next-action` header): exactly 1 must be sent.
 *
 * Run: npx playwright test tests/e2e/cross-cutting/double-submit-guard.spec.ts
 */
import { test, expect, type Page } from '@playwright/test'
import { login } from '../../helpers'

// Dev-mode on-demand compilation makes first renders slow; widen all waits.
const exp = expect.configure({ timeout: 20_000 })

/** Fires two synchronous click events on the element, bypassing actionability. */
async function doubleClickSync(page: Page, locator: ReturnType<Page['getByRole']>) {
  const handle = await locator.elementHandle()
  expect(handle).toBeTruthy()
  await page.evaluate((el) => {
    if (!el) throw new Error('element handle detached')
    for (let i = 0; i < 2; i++) {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    }
  }, handle)
}

/** Counts server-action POSTs (Next.js server actions carry the next-action header). */
function trackServerActionPosts(page: Page): () => number {
  let count = 0
  const listener = (request: { method(): string; headers(): Record<string, string> }) => {
    if (request.method() === 'POST' && request.headers()['next-action']) count++
  }
  page.on('request', listener)
  return () => {
    page.off('request', listener)
    return count
  }
}

test.describe('Double-submit guard', () => {
  // The lock under test is viewport-independent (same onSubmit code path), and
  // the mobile project crashes the dev-mode browser on these heavy wizard
  // flows (blank page, "browser has been closed") — desktop covers the race.
  test.skip(
    () => test.info().project.name === 'mobile',
    'mobile crashes the dev-mode browser on these heavy wizard flows (blank page); the lock is viewport-independent — desktop covers the race'
  )

  test.beforeEach(async ({ page }) => {
    // Draft autosave would restore a previous run's wizard state; start clean.
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await login(page)
  })

  test('product wizard publishes exactly one product on double click', async ({ page }) => {
    test.slow()
    const uniqueSuffix = Date.now()
    const title = `Producto double-click ${uniqueSuffix}`

    await page.goto('/publicar')
    // Wizard step order: 1 Fotos, 2 Información, 3 Detalles, 4 Revisar
    await exp(page.getByRole('heading', { name: /fotos del producto/i })).toBeVisible()
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
    await page
      .locator('input[type="file"][aria-label="Seleccionar imágenes de la galería"]')
      .setInputFiles({
        name: 'test.png',
        mimeType: 'image/png',
        buffer: png,
      })
    await page.waitForTimeout(2000) // allow upload to finish
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await exp(page.getByRole('heading', { name: /información básica/i })).toBeVisible()
    await page.getByRole('textbox', { name: /título del producto/i }).fill(title)
    await page
      .getByRole('textbox', { name: /descripción/i })
      .fill('Producto de prueba automatizada para verificar el guard de doble submit del wizard.')
    await page.getByRole('radio', { name: /electrónica/i }).click()
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await exp(page.getByRole('heading', { name: /detalles del producto/i })).toBeVisible()
    await page.locator('#price').fill('5000')
    await page.locator('#condition-new').click()
    await page.locator('#location_city').fill('La Paz')
    await page
      .getByRole('combobox')
      .filter({ hasText: /departamento|la paz/i })
      .click()
    await page.getByRole('option', { name: 'La Paz' }).click()
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await exp(page.getByRole('heading', { name: /revisar y publicar/i })).toBeVisible()

    const getActionCount = trackServerActionPosts(page)
    const publishButton = page.getByRole('button', { name: /publicar producto/i })
    await doubleClickSync(page, publishButton)

    await exp(page).toHaveURL(/\/productos\//, { timeout: 20_000 })
    await exp(page.getByRole('heading', { name: title })).toBeVisible()

    const actionPosts = getActionCount()
    expect(actionPosts, 'expected exactly 1 create server-action for a double click').toBe(1)
  })

  test('demand wizard publishes exactly one demand on double click', async ({ page }) => {
    test.slow()
    const uniqueSuffix = Date.now()
    const title = `Busco double-click ${uniqueSuffix}`

    await page.goto('/busco/publicar')
    // This suite publishes real records and the demand wizard enforces a
    // client-side 24h post limit (MAX_POSTS_PER_DAY); deleted posts still
    // count (soft delete), so once the dev user's quota is spent the wizard
    // shows the daily-limit banner and the race cannot be exercised. Skip
    // instead of failing — re-runs work again after a local DB reset.
    const rateLimited = await page
      .getByText(/alcanzaste el límite/i)
      .isVisible()
      .catch(() => false)
    test.skip(rateLimited, 'dev user hit the 24h demand-post limit; reset local DB to re-run')
    await exp(page.getByRole('heading', { name: /referencia de la solicitud/i })).toBeVisible()
    await page.getByLabel(/qué estás buscando/i).fill(title)
    await page.getByTestId('category-electronics').click()
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await exp(page.getByRole('heading', { name: /descripción de lo que buscás/i })).toBeVisible()
    await page
      .getByLabel(/detalles de la solicitud/i)
      .fill('Solicitud de prueba automatizada para verificar el guard de doble submit del wizard.')
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await exp(page.getByRole('heading', { name: /ubicación y presupuesto/i })).toBeVisible()
    await page.getByRole('spinbutton', { name: /desde bs\./i }).fill('2500')
    await page.getByRole('spinbutton', { name: /hasta bs\./i }).fill('3500')
    await page.getByRole('button', { name: /^siguiente$/i }).click()

    await exp(page.getByRole('heading', { name: /revisa tu solicitud/i })).toBeVisible()

    const getActionCount = trackServerActionPosts(page)
    const publishButton = page.getByRole('button', { name: /publicar solicitud/i })
    await doubleClickSync(page, publishButton)

    await exp(page).toHaveURL(/\/busco\/.+/, { timeout: 20_000 })
    await exp(page.getByRole('heading', { name: title })).toBeVisible()

    const actionPosts = getActionCount()
    expect(actionPosts, 'expected exactly 1 create server-action for a double click').toBe(1)
  })
})
