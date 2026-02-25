# Seller Flows on Mobile – Run Report

## Script

`scripts/playwright-cli-seller-mobile.sh` runs seller flows 16–19 on a **mobile viewport (375×812)** with a visible browser.

## How to run

```bash
./scripts/playwright-cli-seller-mobile.sh
```

1. Browser opens at http://localhost:3000, resized to 375×812.
2. Script tries `state-load --name=logged-in`. If that fails, it goes to `/login`.
3. **Manual step:** If you see the login page, sign in as seller1@test.com / TestPassword123, then press Enter in the terminal to continue.
4. Script runs:
   - **Flow 16:** goto `/publicar` → snapshot
   - **Flow 17:** goto `/perfil/mis-productos` → snapshot
   - **Flow 18:** click first "Editar" link (on my products) → snapshot
   - **Flow 19:** goto `/busco` → click second demand link → snapshot → click "Ofrecer mi producto" → snapshot
5. Browser stays open. Close with: `playwright-cli -s=seller-mobile close`

## Prerequisites

- Dev server at http://localhost:3000
- Supabase local (Docker) with seller1 password set (e.g. `TestPassword123` via Studio or `node scripts/set-test-passwords.mjs`)
- Optional: save auth state once after login: `playwright-cli -s=seller-mobile state-save --name=logged-in` so next runs skip login

## Notes

- Login via `run-code` (fill + click) was failing with Playwright CLI (`TypeError: (intermediate value) is not a function`), so the script uses manual login + Enter to continue.
- Flow 19 uses the second link to `/busco/...` to skip the "Publicar" button; if there is only one link, the click may time out.
