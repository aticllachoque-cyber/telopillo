import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const slowMoMs = Number(process.env.PW_SLOW_MO ?? '400')

/**
 * Headed runs with optional slowMo + longer per-test timeout for local visual debugging.
 *
 * Examples:
 *   PW_SLOW_MO=600 npx playwright test tests/e2e/auth/ -c playwright.visual.config.ts --project=chromium --headed
 *   PW_SLOW_MO=0 npx playwright test tests/e2e/auth/ -c playwright.visual.config.ts --project=chromium --headed
 */
export default defineConfig({
  ...base,
  timeout: 120_000,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...base.use,
    launchOptions: {
      slowMo: Number.isFinite(slowMoMs) && slowMoMs >= 0 ? slowMoMs : 400,
    },
  },
})
