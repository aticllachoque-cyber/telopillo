import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE_URL = 'http://localhost:3000'

// Helper to login
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', 'dev@telopillo.test')
  await page.fill('input[type="password"]', 'DevTest123')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/**`, { timeout: 10000 })
}

test.describe('Accessibility Audit - M2 Product Listings', () => {
  test('Landing page accessibility', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    console.log(`\n=== Landing Page (/) ===`)
    console.log(`Violations: ${results.violations.length}`)
    for (const violation of results.violations) {
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`)
      console.log(`    Nodes affected: ${violation.nodes.length}`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`    - ${node.html.substring(0, 100)}`)
      }
    }
    console.log(`Passes: ${results.passes.length}`)

    // Allow minor violations but no critical/serious
    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Login page accessibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    console.log(`\n=== Login Page (/login) ===`)
    console.log(`Violations: ${results.violations.length}`)
    for (const violation of results.violations) {
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`)
      console.log(`    Nodes affected: ${violation.nodes.length}`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`    - ${node.html.substring(0, 100)}`)
      }
    }
    console.log(`Passes: ${results.passes.length}`)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Publicar page accessibility (wizard step 1)', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/publicar`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('h2:has-text("Información")', { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    console.log(`\n=== Publicar Page (/publicar) - Step 1 ===`)
    console.log(`Violations: ${results.violations.length}`)
    for (const violation of results.violations) {
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`)
      console.log(`    Nodes affected: ${violation.nodes.length}`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`    - ${node.html.substring(0, 100)}`)
      }
    }
    console.log(`Passes: ${results.passes.length}`)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })

  test('Mis Productos page accessibility', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE_URL}/perfil/mis-productos`)
    await page.waitForLoadState('networkidle')
    // Wait for products to load
    await page.waitForTimeout(3000)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze()

    console.log(`\n=== Mis Productos (/perfil/mis-productos) ===`)
    console.log(`Violations: ${results.violations.length}`)
    for (const violation of results.violations) {
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.description}`)
      console.log(`    Nodes affected: ${violation.nodes.length}`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`    - ${node.html.substring(0, 100)}`)
      }
    }
    console.log(`Passes: ${results.passes.length}`)

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(critical.length).toBe(0)
  })
})
