import { test as base } from '@playwright/test'

export const AUTH_STATE_PATH = 'tests/.auth/user.json'

/**
 * Extended test that runs with a pre-authenticated browser context.
 * Depends on the 'auth-setup' project running first.
 */
export const authenticatedTest = base.extend({
  storageState: AUTH_STATE_PATH,
})

export { expect } from '@playwright/test'
