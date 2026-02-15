# E2E Test Plan — Telopillo.bo

> **Plan ID:** E2E-MASTER-001
> **Created:** 2026-02-15
> **Status:** PLAN (not yet automated)
> **Framework:** Playwright (`@playwright/test`) + axe-core
> **Base URL:** `http://localhost:3000`

---

## Folder Structure

```
tests/
├── e2e/
│   ├── TEST_PLAN.md              ← This file (master plan)
│   ├── auth/                     ← Authentication & registration flows
│   │   └── PLAN.md
│   ├── buyer-journey/            ← Complete buyer flow (search → view → contact)
│   │   └── PLAN.md
│   ├── seller-journey/           ← Personal seller flow (list → manage → sell)
│   │   └── PLAN.md
│   ├── business-seller/          ← Business seller flow (upgrade → storefront → list)
│   │   └── PLAN.md
│   ├── search-discovery/         ← Search, filters, categories, semantic
│   │   └── PLAN.md
│   ├── account-management/       ← Profile edit, settings, product management
│   │   └── PLAN.md
│   └── cross-cutting/            ← Accessibility, mobile, performance
│       └── PLAN.md
├── fixtures/                     ← Shared Playwright fixtures (auth, test data)
└── helpers/                      ← Shared utilities (login, data factories)
```

---

## Business Flows Overview

| # | Flow | Folder | Priority | Personas | Routes Covered |
|---|------|--------|----------|----------|----------------|
| 1 | Authentication | `auth/` | Critical | All | `/register`, `/login`, `/forgot-password`, `/reset-password`, `/auth/callback` |
| 2 | Buyer Journey | `buyer-journey/` | Critical | Buyer | `/`, `/buscar`, `/categorias`, `/productos/[id]`, `/vendedor/[id]`, `/negocio/[slug]` |
| 3 | Seller Journey | `seller-journey/` | Critical | Personal Seller | `/publicar`, `/perfil/mis-productos`, `/productos/[id]/editar`, `/vendedor/[id]` |
| 4 | Business Seller | `business-seller/` | High | Business Seller | `/register` (business), `/profile/edit`, `/negocio/[slug]`, `/publicar` |
| 5 | Search & Discovery | `search-discovery/` | High | Buyer | `/buscar`, `/categorias`, `/api/search` |
| 6 | Account Management | `account-management/` | High | All | `/profile`, `/profile/edit`, `/perfil/mis-productos` |
| 7 | Cross-Cutting | `cross-cutting/` | High | All | All routes — a11y, mobile, performance |

---

## Execution Order (Dependencies)

```
auth/                           ← Run FIRST (creates sessions used by all others)
  ├─► buyer-journey/            ← Needs: seeded products, optional auth
  ├─► seller-journey/           ← Needs: authenticated user
  ├─► business-seller/          ← Needs: authenticated user with business profile
  ├─► search-discovery/         ← Needs: seeded products
  ├─► account-management/       ← Needs: authenticated user with products
  └─► cross-cutting/            ← Runs last, audits all pages
```

---

## Shared Test Data

| Entity | Data | Notes |
|--------|------|-------|
| Existing test user | `dev@telopillo.test` / `DevTest123` | Pre-seeded, use for read-only tests |
| Dynamic user | `buyer-{timestamp}@telopillo.test` | Created per suite run, cleaned up after |
| Dynamic seller | `seller-{timestamp}@telopillo.test` | Created per suite run |
| Business seller | `biz-{timestamp}@telopillo.test` | Created with business profile |
| Test product | Title: "Samsung Galaxy S24 Ultra", Price: 2500 BOB, Category: electronics | Standard product |
| Business slug | `test-tienda-{timestamp}` | Dynamic per run |

---

## Shared Fixtures (to build in `tests/fixtures/`)

| Fixture | Purpose | Setup |
|---------|---------|-------|
| `authenticatedPage` | Page with logged-in session | Login via Supabase, store cookie state |
| `sellerPage` | Authenticated page for a seller with at least 1 product | Login + ensure product exists |
| `businessSellerPage` | Authenticated page for business seller | Login + ensure business profile exists |
| `testProduct` | A published product available for buyer tests | Create via direct Supabase insert or API |
| `cleanup` | Teardown test data after suite | Delete created users/products/profiles |

---

## Shared Helpers (to build in `tests/helpers/`)

| Helper | Purpose |
|--------|---------|
| `login(page, email, password)` | Reusable login sequence |
| `createProduct(supabase, data)` | Seed a product via Supabase client |
| `createBusinessProfile(supabase, userId, data)` | Seed a business profile |
| `runAxeAudit(page, options?)` | Run axe-core and assert zero critical/serious violations |
| `assertNoHorizontalScroll(page)` | Check `scrollWidth <= clientWidth + 5` |
| `assertTouchTargets(page, selector)` | Check elements are >= 44px touch targets |

---

## Coverage Gap Analysis (Current → Planned)

| Route | Happy Path | Error Cases | Mobile | A11y | Current State | This Plan |
|-------|------------|-------------|--------|------|---------------|-----------|
| `/` | Partial | No | No | Partial | m3-search, accessibility-audit | buyer-journey, cross-cutting |
| `/register` | No (only form visibility) | Partial | Yes | Yes | auth-pages, m4.5-* | auth/ full flow |
| `/login` | No (only form visibility) | Partial | No | No | auth-pages | auth/ full flow |
| `/forgot-password` | No | Partial | No | No | auth-pages | auth/ full flow |
| `/reset-password` | No | No | No | No | — | auth/ full flow |
| `/buscar` | Yes | Partial | Partial | Partial | m3-*, m4-*, bug-fixes | search-discovery/ |
| `/categorias` | Partial | No | No | No | bug-fixes, m3-search-visual | search-discovery/ |
| `/productos/[id]` | Partial | No | No | No | manual-wizard, m4.5 (indirect) | buyer-journey/ |
| `/productos/[id]/editar` | No | No | No | No | — | seller-journey/ |
| `/publicar` | Partial (no submit) | Partial | Partial | Yes | product-wizard, manual-wizard | seller-journey/ |
| `/profile` | No | No | No | No | — | account-management/ |
| `/profile/edit` | No | No | No | Partial | m4.5-accessibility | account-management/ |
| `/perfil/mis-productos` | Partial | No | Partial | Yes | manual-wizard, accessibility | account-management/ |
| `/vendedor/[id]` | Yes | Yes (404) | Yes | Yes | m4.5-* | buyer-journey/ |
| `/negocio/[slug]` | Yes | Yes (404) | Yes | Yes | m4.5-* | business-seller/ |

---

## Success Criteria

A flow is **fully covered** when it has:

- [ ] Happy path test (complete user journey from start to finish)
- [ ] Error/edge-case tests (validation, 404, empty states, expired sessions)
- [ ] Mobile test at 375x812 (no horizontal scroll, touch targets >= 44px)
- [ ] Accessibility audit (axe-core WCAG 2.2 AA, zero critical/serious)
- [ ] Screenshots at key checkpoints
- [ ] Independent execution (no dependency on other test files)
- [ ] Cleanup of created test data
