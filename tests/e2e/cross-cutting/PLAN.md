# Cross-Cutting Concerns — E2E Test Plan

> **Plan ID:** E2E-CROSS-001
> **Priority:** High
> **Prerequisite Plans:** All other plans (runs last as audit)
> **Target Files:**
> - `tests/e2e/cross-cutting/accessibility-audit.spec.ts`
> - `tests/e2e/cross-cutting/mobile-responsive.spec.ts`
> - `tests/e2e/cross-cutting/navigation-layout.spec.ts`
> - `tests/e2e/cross-cutting/seo-metadata.spec.ts`
> - `tests/e2e/cross-cutting/error-pages.spec.ts`

---

## Flow 1: Accessibility Audit (All Pages)

**User Story:** As a user with disabilities, I want to use Telopillo.bo with assistive technology.
**Standard:** WCAG 2.2 AA
**Tool:** axe-core (`@axe-core/playwright`)

### Pages to Audit

| # | Page | Route | Auth Required | Notes |
|---|------|-------|---------------|-------|
| A1 | Homepage | `/` | No | Hero, categories, CTA |
| A2 | Login | `/login` | No | Form, OAuth buttons |
| A3 | Register | `/register` | No | Form + business toggle |
| A4 | Register (business expanded) | `/register` | No | Additional business fields |
| A5 | Forgot Password | `/forgot-password` | No | Single-field form |
| A6 | Search Results | `/buscar?q=samsung` | No | Results grid, filters, sort |
| A7 | Search Empty State | `/buscar?q=nonexistent` | No | Empty state messaging |
| A8 | Categories | `/categorias` | No | Category grid |
| A9 | Product Detail | `/productos/[id]` | No | Gallery, seller card, details |
| A10 | Seller Profile | `/vendedor/[id]` | No | Profile, products, badge |
| A11 | Business Storefront | `/negocio/[slug]` | No | Header, sidebar, products |
| A12 | Profile | `/profile` | Yes | User info, sign out |
| A13 | Profile Edit | `/profile/edit` | Yes | Form, avatar upload |
| A14 | My Products | `/perfil/mis-productos` | Yes | Product list, filters |
| A15 | Publish (Step 1) | `/publicar` | Yes | Wizard form |

### Test Structure Per Page

| Step | Action | Selector Strategy | Expected Result |
|------|--------|-------------------|-----------------|
| 1 | Navigate to page | `page.goto(route)` | Page loaded |
| 2 | Wait for content to load | `waitForSelector` or `waitForLoadState` | Content visible |
| 3 | Run axe-core scan | `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()` | Results object |
| 4 | Assert zero critical violations | `expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0)` | No critical violations |
| 5 | Assert zero serious violations | `expect(results.violations.filter(v => v.impact === 'serious')).toHaveLength(0)` | No serious violations |
| 6 | Log minor/moderate for review | Console output | Informational |

**Known Exclusions:**
- shadcn Select placeholder contrast (document and exclude if needed)
- Avatar fallback component (document and exclude if needed)

**Assertions:**
- [ ] Zero critical axe violations on every page
- [ ] Zero serious axe violations on every page
- [ ] Minor/moderate violations logged but not blocking

---

## Flow 2: Keyboard Navigation (Forms)

**User Story:** As a keyboard-only user, I want to navigate all forms without a mouse.

### Forms to Test

| # | Form | Route | Tab Order |
|---|------|-------|-----------|
| K1 | Login | `/login` | Email → Password → Submit → Forgot link → Register link |
| K2 | Register | `/register` | Name → Email → Password → Confirm → Business toggle → Submit |
| K3 | Forgot Password | `/forgot-password` | Email → Submit → Back link |
| K4 | Profile Edit | `/profile/edit` | Name → Location → Phone → Avatar → Save |
| K5 | Product Wizard (Step 1) | `/publicar` | Title → Description → Category → Next |
| K6 | Search Bar | `/` | Search input → Submit (Enter) |

### Test Structure Per Form

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to page | Page loaded |
| 2 | Press Tab through all interactive elements | Focus moves in logical order |
| 3 | Verify focus indicator visible on each element | Visible focus ring/outline |
| 4 | Press Enter/Space on buttons | Button activates |
| 5 | Verify no focus traps | Tab eventually leaves the form |

**Assertions:**
- [ ] Tab order matches visual order
- [ ] All interactive elements receive focus
- [ ] Focus indicator is visible (not hidden)
- [ ] No keyboard traps
- [ ] Escape closes dropdowns/modals

---

## Flow 3: Mobile Responsive (All Pages at 375px)

**User Story:** As a mobile user, I want to use Telopillo.bo on my phone without horizontal scrolling.
**Viewport:** 375 x 812 (iPhone SE / small Android)

### Pages to Test

| # | Page | Route | Auth Required |
|---|------|-------|---------------|
| M1 | Homepage | `/` | No |
| M2 | Login | `/login` | No |
| M3 | Register | `/register` | No |
| M4 | Search Results | `/buscar?q=samsung` | No |
| M5 | Categories | `/categorias` | No |
| M6 | Product Detail | `/productos/[id]` | No |
| M7 | Seller Profile | `/vendedor/[id]` | No |
| M8 | Business Storefront | `/negocio/[slug]` | No |
| M9 | Profile Edit | `/profile/edit` | Yes |
| M10 | My Products | `/perfil/mis-productos` | Yes |
| M11 | Publish Wizard | `/publicar` | Yes |

### Test Structure Per Page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set viewport to 375x812 | Viewport resized |
| 2 | Navigate to page | Page loaded |
| 3 | Assert no horizontal scroll | `scrollWidth <= clientWidth + 5` |
| 4 | Assert key elements visible | Primary content in viewport |
| 5 | Assert touch targets >= 44px | Buttons and links meet minimum size |
| 6 | Take screenshot | Visual record |

**Assertions (per page):**
- [ ] `document.documentElement.scrollWidth <= document.documentElement.clientWidth + 5`
- [ ] No content hidden or cut off
- [ ] Interactive elements >= 44px touch targets
- [ ] Text is readable without zooming (>= 16px body)
- [ ] Forms are full-width
- [ ] Navigation menu adapts (hamburger or stacked)

---

## Flow 4: Navigation & Layout

**User Story:** As a user, I want consistent navigation and layout across all pages.
**Preconditions:** None (public pages) + authenticated user for protected pages.

| Step | Action | Page/Route | Expected Result | Screenshot |
|------|--------|------------|-----------------|------------|
| 4.1 | Verify header on homepage | `/` | Logo, search bar, nav links, login/register | `nav-01-header.png` |
| 4.2 | Verify footer on homepage | `/` | Footer links, copyright | — |
| 4.3 | Verify header on search | `/buscar` | Same header consistency | — |
| 4.4 | Verify skip link | Any page | "Skip to main content" link visible on Tab | — |
| 4.5 | Verify authenticated header | `/` (logged in) | Avatar/user menu replaces login/register | `nav-02-auth-header.png` |
| 4.6 | Verify breadcrumbs on product detail | `/productos/[id]` | Home > Category > Product | — |
| 4.7 | Test 404 page | `/nonexistent-page` | 404 page with back link | `nav-03-404.png` |

**Assertions:**
- [ ] Header is consistent across all pages
- [ ] Footer is consistent across all pages
- [ ] Skip link works (focuses on main content)
- [ ] Logo links to homepage
- [ ] Auth state reflected in header (guest vs logged-in)

---

## Flow 5: SEO & Metadata

**User Story:** As a search engine, I want correct metadata to index Telopillo.bo properly.

### Pages to Verify

| # | Page | Route | Expected Title | Expected OG/Meta |
|---|------|-------|----------------|------------------|
| S1 | Homepage | `/` | Contains "Telopillo" | og:title, og:description, og:image |
| S2 | Product Detail | `/productos/[id]` | Product title + "Telopillo" | og:title = product name, og:image = product image |
| S3 | Seller Profile | `/vendedor/[id]` | Seller name | JSON-LD: Person |
| S4 | Business Storefront | `/negocio/[slug]` | Business name | JSON-LD: LocalBusiness |
| S5 | Search Results | `/buscar?q=samsung` | "samsung" + "Telopillo" | noindex or appropriate meta |
| S6 | Categories | `/categorias` | "Categorías" + "Telopillo" | og:title, og:description |

### Test Structure Per Page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to page | Page loaded |
| 2 | Check `<title>` tag | Contains expected text |
| 3 | Check `<meta name="description">` | Non-empty, relevant |
| 4 | Check `<meta property="og:title">` | Present and correct |
| 5 | Check `<link rel="canonical">` | Present and correct URL |
| 6 | Check JSON-LD (where applicable) | Valid schema.org data |

**Assertions:**
- [ ] Every page has a unique `<title>`
- [ ] Every page has a meta description
- [ ] Product pages have OG image from product
- [ ] Business storefronts have LocalBusiness JSON-LD
- [ ] Seller profiles have Person JSON-LD
- [ ] Canonical URLs are correct (no duplicates)

---

## Flow 6: Error Pages

**User Story:** As a user, I want to see helpful error pages when something goes wrong.

| Step | Action | Route | Expected Result | Screenshot |
|------|--------|-------|-----------------|------------|
| 6.1 | Visit non-existent page | `/this-page-does-not-exist` | 404 page with navigation | `error-01-404.png` |
| 6.2 | Visit non-existent product | `/productos/00000000-0000-0000-0000-000000000000` | Product not found | `error-02-product-404.png` |
| 6.3 | Visit non-existent seller | `/vendedor/00000000-0000-0000-0000-000000000000` | Seller not found | `error-03-seller-404.png` |
| 6.4 | Visit non-existent business | `/negocio/this-slug-does-not-exist` | Business not found | `error-04-biz-404.png` |

**Assertions:**
- [ ] Error pages show helpful message
- [ ] Navigation (header/footer) still present
- [ ] Link to homepage or search available
- [ ] No raw error messages or stack traces
- [ ] HTTP status code is 404 (not 200 with error content)

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Test user | `dev@telopillo.test` / `DevTest123` | For authenticated pages |
| Test product | Any published product | For product detail audit |
| Personal seller | Any user with products | For seller profile audit |
| Business seller | Any business with storefront | For storefront audit |
