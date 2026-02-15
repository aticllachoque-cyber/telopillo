# Shared Fixtures — Design Plan

> **Purpose:** Reusable Playwright fixtures to eliminate duplicated setup across test suites.

---

## Fixture: `authenticatedPage`

**Description:** Provides a Playwright `Page` with an active Supabase session.
**Used by:** All seller, business, account management tests.

```
Setup:
  1. Navigate to /login
  2. Fill email: dev@telopillo.test
  3. Fill password: DevTest123
  4. Submit login form
  5. Wait for redirect to /
  6. Verify session (user menu visible)
  7. Return authenticated page

Teardown:
  - None (session expires naturally)
```

**Optimization:** Use `storageState` to save session cookies after first login, reuse across tests in the same suite.

---

## Fixture: `sellerPage`

**Description:** Authenticated page for a seller who has at least 1 published product.
**Depends on:** `authenticatedPage`

```
Setup:
  1. Get authenticated page
  2. Verify user has at least 1 product (check /perfil/mis-productos)
  3. If no products, create one via direct Supabase insert
  4. Return { page, productId, productTitle }

Teardown:
  - Delete products created by fixture (if any)
```

---

## Fixture: `businessSellerPage`

**Description:** Authenticated page for a business seller with a storefront.
**Depends on:** `authenticatedPage`

```
Setup:
  1. Get authenticated page
  2. Verify user has business profile (check /negocio/ slug)
  3. If no business profile, create one via direct Supabase insert
  4. Return { page, businessSlug, businessName }

Teardown:
  - Delete business profile created by fixture (if any)
```

---

## Fixture: `testProduct`

**Description:** A published product available for buyer/search tests.
**Does not depend on a page** — creates data directly via Supabase client.

```
Setup:
  1. Connect to Supabase with service role key
  2. Insert product with known data:
     - title: "Test Product {timestamp}"
     - price: 100
     - category: "electronics"
     - status: "active"
     - user_id: test user ID
  3. Return { productId, productTitle, productSlug }

Teardown:
  - Delete the product from database
  - Delete associated images from storage
```

---

## Fixture: `freshUser`

**Description:** A brand-new user account created for registration/onboarding tests.

```
Setup:
  1. Generate unique email: `test-{timestamp}@telopillo.test`
  2. Do NOT create the account (registration test will do it)
  3. Return { email, password, name }

Teardown:
  1. Delete user from Supabase Auth
  2. Delete profile from profiles table
  3. Delete any associated products
  4. Delete any associated business profile
```

---

## Implementation Notes

- Use Playwright's `test.extend()` to define custom fixtures
- Export fixtures from `tests/fixtures/index.ts`
- Each test file imports from shared fixtures
- Use environment variables for Supabase service role key (test-only)
- Never use service role key in browser context — only for setup/teardown via Node.js
