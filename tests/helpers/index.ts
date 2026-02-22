import { type Page, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const DEFAULT_EMAIL = 'dev@telopillo.test'
const DEFAULT_PASSWORD = 'DevTest123'

/**
 * Performs email/password login through the UI.
 * Navigates to /login, fills credentials, submits, and waits for redirect.
 */
export async function login(
  page: Page,
  email: string = DEFAULT_EMAIL,
  password: string = DEFAULT_PASSWORD
): Promise<void> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/contraseña/i).fill(password)
  await page.locator('#main-content button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  })
}

export interface AxeAuditOptions {
  tags?: string[]
  exclude?: string[]
  assertZeroCritical?: boolean
  assertZeroSerious?: boolean
}

export interface AxeAuditResult {
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']
  passes: Awaited<ReturnType<AxeBuilder['analyze']>>['passes']
  incomplete: Awaited<ReturnType<AxeBuilder['analyze']>>['incomplete']
}

/**
 * Runs axe-core accessibility scan with WCAG 2.2 AA tags.
 * Asserts zero critical/serious violations by default.
 */
export async function runAxeAudit(
  page: Page,
  options: AxeAuditOptions = {}
): Promise<AxeAuditResult> {
  const {
    tags = ['wcag2a', 'wcag2aa', 'wcag22aa'],
    exclude = [],
    assertZeroCritical = true,
    assertZeroSerious = true,
  } = options

  let builder = new AxeBuilder({ page }).withTags(tags)
  for (const selector of exclude) {
    builder = builder.exclude(selector)
  }

  const results = await builder.analyze()

  if (assertZeroCritical) {
    const critical = results.violations.filter((v) => v.impact === 'critical')
    if (critical.length > 0) logViolations('Critical violations', results)
    expect(critical.length, 'Expected zero critical a11y violations').toBe(0)
  }

  if (assertZeroSerious) {
    const serious = results.violations.filter((v) => v.impact === 'serious')
    if (serious.length > 0) logViolations('Serious violations', results)
    expect(serious.length, 'Expected zero serious a11y violations').toBe(0)
  }

  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
  }
}

/**
 * Verifies no horizontal scrollbar is present (5px tolerance).
 */
export async function assertNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(
    scrollWidth,
    `Horizontal overflow detected: scrollWidth=${scrollWidth} > clientWidth=${clientWidth}`
  ).toBeLessThanOrEqual(clientWidth + 5)
}

export interface TouchTargetFailure {
  selector: string
  html: string
  width: number
  height: number
}

/**
 * Verifies interactive elements meet the 44px minimum touch target (WCAG 2.2 AA).
 * Returns a list of elements that fail the check.
 */
export async function assertTouchTargets(
  page: Page,
  selector: string,
  minSize: number = 44
): Promise<TouchTargetFailure[]> {
  const failures = await page.evaluate(
    ({ sel, min }) => {
      const elements = document.querySelectorAll(sel)
      const fails: { selector: string; html: string; width: number; height: number }[] = []
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.width < min || rect.height < min) {
          fails.push({
            selector: sel,
            html: (el as HTMLElement).outerHTML.substring(0, 120),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          })
        }
      })
      return fails
    },
    { sel: selector, min: minSize }
  )

  expect(failures.length, `Touch targets below ${minSize}px: ${JSON.stringify(failures)}`).toBe(0)
  return failures
}

/**
 * Takes a screenshot with consistent naming.
 * Output: tests/screenshots/{folder}/{name}.png
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  folder: string = 'general'
): Promise<void> {
  await page.screenshot({
    path: `tests/screenshots/${folder}/${name}.png`,
    fullPage: true,
  })
}

/**
 * Waits for a page to be fully loaded and interactive.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

/**
 * Formats and logs axe-core violations for debugging.
 */
export function logViolations(
  label: string,
  results: Awaited<ReturnType<AxeBuilder['analyze']>>
): void {
  const critical = results.violations.filter((v) => v.impact === 'critical')
  const serious = results.violations.filter((v) => v.impact === 'serious')
  if (critical.length > 0 || serious.length > 0) {
    console.log(`\n=== ${label} ===`)
    console.log(`Violations: ${results.violations.length}`)
    ;[...critical, ...serious].forEach((v) => {
      console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`)
      v.nodes.slice(0, 3).forEach((n) => console.log(`    → ${n.html.substring(0, 80)}`))
    })
  }
}

/** Well-known test data used across specs */
export const TEST_DATA = {
  email: DEFAULT_EMAIL,
  password: DEFAULT_PASSWORD,
  businessSlug: 'usuario-de-desarrollo',
  businessSellerId: '9b8794bb-d357-499a-8c10-d5413b6a7ccb',
  personalSellerId: '09a4ef63-b8ec-4931-9885-e4d785e79643',
} as const
