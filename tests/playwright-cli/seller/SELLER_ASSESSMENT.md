# Seller Flows – Account Assessment

## Current state (local DB)

| User | Has profile | Has products | Password known |
|------|-------------|--------------|----------------|
| seller1@test.com | Yes (Vendedor Uno) | Yes | **No** → set via script below |
| seller2@test.com | Yes (Vendedor Dos) | Yes | No |
| maria.demo.*@telopillo.test | Yes | Unknown | No |
| dev@telopillo.test | — | — | **Not in DB** (create-dev-user.sql not run) |

Seller flows **require** a logged-in user and (for 17, 18, 19) at least one product. Flow 19 also needs demand posts from **another** user (e.g. dev or a different account).

## Do we need a new account?

**No.** Use the existing **seller1@test.com** account and give it a **known password** for testing.

1. Run `node scripts/set-test-passwords.mjs` to set the standard test password for seller1 (and seller2) via Auth Admin API. Standard password: **TestPassword123** (see tests/playwright-cli/README.md).
2. In Playwright CLI: open app → go to `/login` → log in as seller1@test.com / TestPassword123 → save state as `logged-in`.
3. Run seller flows with `playwright-cli state-load --name=logged-in` before each flow.

**Optional:** If you prefer a dedicated seller that is not used elsewhere, run `scripts/seed-seller-test-account.sql` to create `seller@telopillo.test` with one product (see below).

## 1. Set known password for seller1 (recommended)

Run once (local Supabase / Docker). Prefer the Auth Admin script so login works with GoTrue:

```bash
node scripts/set-test-passwords.mjs
```

(Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` pointing to local Supabase, e.g. `http://127.0.0.1:54321`.)

Alternatively, set password via SQL (if login still fails, use the script above):

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/set-seller-password.sql
```

Then log in via UI or Playwright CLI as:

- **Email:** seller1@test.com  
- **Password:** TestPassword123 (standard test password)  

Save auth state:

```bash
playwright-cli open http://localhost:3000 --session=seller
# Manually or via run-code: go to /login, fill seller1@test.com, TestPassword123, submit
playwright-cli -s=seller state-save --name=logged-in
```

## 2. Optional: dedicated seller test account

If you prefer a separate user `seller@telopillo.test` with one product, run:

```bash
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/seed-seller-test-account.sql
```

Then set its password with `node scripts/set-test-passwords.mjs` (add seller@telopillo.test to the script’s list if needed) or Dashboard, and use **seller@telopillo.test** / **TestPassword123** for login and state-save.

## Running seller flows after state is saved

- **16 – Create product:** `state-load --name=logged-in` then goto `/publicar`, complete wizard (need test image).
- **17 – Manage products:** `state-load --name=logged-in` then goto `/perfil/mis-productos` (seller1 already has products).
- **18 – Edit product:** same; open edit from “Mis productos”.
- **19 – Offer to demand:** same; seller1 has products; demands are from dev (or seed-demand-posts). Use a demand **not** created by the logged-in user.

## Summary

| Question | Answer |
|----------|--------|
| Need new account? | No. Use seller1@test.com with password set by script. |
| Script to run | `node scripts/set-test-passwords.mjs` (then login once and state-save). |
| Credentials for seller | seller1@test.com / TestPassword123 (standard test password). |

## If login returns 500 or "Error al iniciar sesión"

If login fails after running the SQL script (direct `auth.users` update), use one of these:

1. **Auth Admin script (recommended):** `node scripts/set-test-passwords.mjs` — sets password via GoTrue so it is accepted.
2. **Supabase Dashboard (local):** Auth → Users → seller1@test.com → set password to `TestPassword123`.
3. **Or register in the app:** Sign up a new user, then add one product via `/publicar` and use that account + `state-save --name=logged-in` for seller flows.
