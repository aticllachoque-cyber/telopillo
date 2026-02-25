# Telopillo.bo - Playwright CLI Test Plans

Manual test plans designed for execution with [Playwright CLI](https://github.com/microsoft/playwright-cli).
Each file documents a user flow with step-by-step `playwright-cli` commands.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running (for auth flows; typically via Docker: `npx supabase start`)
- Test user credentials available (see [Local test credentials](#local-test-credentials))

### Local test credentials (Docker / local Supabase)

When running Supabase locally (Docker), use a **standard test password** so all test accounts can log in reliably:

| Item | Value |
|------|--------|
| **Standard test password** | `TestPassword123` (for all local test accounts: seller, buyer, etc.) |
| **API (Auth, PostgREST)** | `http://127.0.0.1:54321` → set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` |
| **Database (direct)** | `127.0.0.1:54322` (user `postgres`) for SQL scripts / seeds |

To set the standard password for test users (e.g. seller1@test.com) **via Supabase Auth Admin API** (recommended so login works with GoTrue in Docker):

```bash
node scripts/set-test-passwords.mjs
```

Requires Supabase running locally (e.g. `npx supabase start`) and `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` pointing to it (e.g. `http://127.0.0.1:54321`; see `npx supabase status`).  
Alternative: run `scripts/set-seller-password.sql` with psql; if login returns 500, use the script above or set the password in Supabase Dashboard → Auth → Users.

## Quick Start

```bash
# Start a session
playwright-cli open http://localhost:3000 --session=test

# Follow the steps in any test plan file
# Each command is prefixed with `playwright-cli` and uses element refs from snapshots
```

## Test Plan Index

### Visitor Flows (unauthenticated)

| # | File | Flow | Priority |
|---|------|------|----------|
| 01 | [visitor/01-homepage.md](visitor/01-homepage.md) | Home page load, hero, search, categories | P0 |
| 02 | [visitor/02-product-search.md](visitor/02-product-search.md) | Search products, filters, sort, pagination | P0 |
| 03 | [visitor/03-categories.md](visitor/03-categories.md) | Browse categories, navigate to filtered search | P1 |
| 04 | [visitor/04-product-detail.md](visitor/04-product-detail.md) | View product, gallery, seller info, share | P0 |
| 05 | [visitor/05-seller-profile.md](visitor/05-seller-profile.md) | View seller profile, product listings | P1 |
| 06 | [visitor/06-business-storefront.md](visitor/06-business-storefront.md) | View business storefront page | P2 |
| 07 | [visitor/07-browse-demands.md](visitor/07-browse-demands.md) | Browse demand posts, filters, sort | P1 |
| 08 | [visitor/08-demand-detail.md](visitor/08-demand-detail.md) | View demand post detail, offers | P1 |
| 09 | [visitor/09-static-pages.md](visitor/09-static-pages.md) | Static pages (terms, privacy, help, about, contact) | P2 |

### Account Flows (auth)

| # | File | Flow | Priority |
|---|------|------|----------|
| 10 | [account/10-registration.md](account/10-registration.md) | User registration (personal + business) | P0 |
| 11 | [account/11-login-logout.md](account/11-login-logout.md) | Login, session, logout | P0 |
| 12 | [account/12-forgot-password.md](account/12-forgot-password.md) | Password reset flow | P1 |
| 13 | [account/13-profile-management.md](account/13-profile-management.md) | View, edit profile, avatar upload | P1 |

### Buyer Flows (authenticated)

| # | File | Flow | Priority |
|---|------|------|----------|
| 14 | [buyer/14-create-demand.md](buyer/14-create-demand.md) | Create a demand post ("Busco/Necesito") | P0 |
| 15 | [buyer/15-manage-demands.md](buyer/15-manage-demands.md) | View, filter, mark found, delete demands | P1 |

### Seller Flows (authenticated)

| # | File | Flow | Priority |
|---|------|------|----------|
| 16 | [seller/16-create-product.md](seller/16-create-product.md) | Publish a product (full wizard) | P0 |
| 17 | [seller/17-manage-products.md](seller/17-manage-products.md) | View, pause, reactivate, delete products | P1 |
| 18 | [seller/18-edit-product.md](seller/18-edit-product.md) | Edit an existing product | P1 |
| 19 | [seller/19-offer-to-demand.md](seller/19-offer-to-demand.md) | Submit an offer on a demand post | P1 |

### Cross-Cutting Flows

| # | File | Flow | Priority |
|---|------|------|----------|
| 20 | [cross-cutting/20-navigation.md](cross-cutting/20-navigation.md) | Header, mobile menu, search overlay | P0 |
| 21 | [cross-cutting/21-protected-routes.md](cross-cutting/21-protected-routes.md) | Auth redirects for protected pages | P1 |
| 22 | [cross-cutting/22-mobile-responsive.md](cross-cutting/22-mobile-responsive.md) | Responsive layout on mobile viewport | P1 |

## Priority Legend

- **P0**: Critical path - must pass before any release
- **P1**: Important - should pass for a quality release
- **P2**: Nice to have - test when time permits

## Conventions

- Each test plan starts with `playwright-cli open` or assumes an active session
- `snapshot` commands are used to capture the current page state and obtain element refs
- Element refs (e.g., `e12`, `s5`) come from `playwright-cli snapshot` output
- `[ref]` placeholders mean "take a snapshot and use the actual ref for that element"
- `{VALUE}` placeholders mean "replace with test data"
- Expected results are documented after each action step

## Session Management

```bash
# Create a named session for a test suite
playwright-cli open http://localhost:3000 --session=visitor-tests

# Save auth state after login for reuse
playwright-cli state-save --name=logged-in-user

# Restore auth state in another session
playwright-cli state-load --name=logged-in-user
```
