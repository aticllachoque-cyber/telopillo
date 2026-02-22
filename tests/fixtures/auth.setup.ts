import { test as setup } from '@playwright/test'
import { login } from '../helpers'

const AUTH_STATE_PATH = 'tests/.auth/user.json'

setup('authenticate test user', async ({ page }) => {
  await login(page)
  await page.context().storageState({ path: AUTH_STATE_PATH })
})
