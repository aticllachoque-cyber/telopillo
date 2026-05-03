import { test, expect } from '@playwright/test'
import { gotoReady, login } from '../../helpers'

test.describe('Profile — share vs copy', () => {
  test('Compartir calls navigator.share; Copiar enlace copies URL (no extra share calls)', async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      let shareCalls = 0
      type Win = Window & { __shareCalls?: number; __lastShareUrl?: string }
      const w = window as Win
      w.__shareCalls = 0
      navigator.share = async (data?: { url?: string }) => {
        shareCalls += 1
        w.__shareCalls = shareCalls
        if (data?.url) w.__lastShareUrl = data.url
      }
    })

    // WebKit (mobile project) does not support clipboard permission grants like Chromium.
    if (testInfo.project.name === 'chromium') {
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    }

    await login(page)
    await gotoReady(page, '/profile')
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /compartir mi perfil/i })
    ).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Compartir$/ }).click()
    await expect
      .poll(() => page.evaluate(() => (window as Window & { __shareCalls?: number }).__shareCalls))
      .toBe(1)

    const shareUrl = await page.evaluate(
      () => (window as Window & { __lastShareUrl?: string }).__lastShareUrl
    )
    expect(shareUrl ?? '').toMatch(/\/(vendedor|negocio)\//)

    await page.getByRole('button', { name: /Copiar enlace/i }).click()
    await expect(page.getByRole('status').filter({ hasText: /enlace copiado/i })).toBeVisible({
      timeout: 5000,
    })

    if (testInfo.project.name === 'chromium') {
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboardText).toBe(shareUrl)
    }

    await expect
      .poll(() => page.evaluate(() => (window as Window & { __shareCalls?: number }).__shareCalls))
      .toBe(1)
  })
})
