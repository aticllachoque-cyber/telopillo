# Buyer Journey — E2E Test Plan

> **Plan ID:** E2E-BUYER-001
> **Priority:** Critical
> **Prerequisite Plans:** E2E-AUTH-001 (login must work)
> **Target Files:**
> - `tests/e2e/buyer-journey/homepage-to-search.spec.ts` (implemented)
> - `tests/e2e/buyer-journey/product-detail.spec.ts` (implemented)
> - `tests/e2e/buyer-journey/seller-profiles.spec.ts` (implemented)
> - `tests/e2e/buyer-journey/contact-seller.spec.ts` (implemented)
> - `tests/e2e/buyer-journey/complete-buyer-flow.spec.ts` (implemented)

---

## Complete Buyer Journey

```
Home → Search → Filter/Sort → View Product → View Seller → Contact Seller
```

---

## Flow 1: Homepage to Search

**User Story:** As a buyer, I want to search for products from the homepage so I can find what I need.
**Preconditions:** At least 1 product seeded in the database.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 1.1 | Navigate to homepage | `/` | `page.goto('/')` | Hero section with search bar visible | `buyer-01-home.png` |
| 1.2 | Verify hero and categories | `/` | `getByRole('heading')`, category buttons/links | Hero text, featured categories visible | — |
| 1.3 | Type search query in hero search bar | `/` | `getByPlaceholder(/buscar/i)` or `getByRole('searchbox')` | Search input accepts text | — |
| 1.4 | Submit search | `/` | Press Enter or click search button | Redirect to `/buscar?q=...` | `buyer-02-results.png` |
| 1.5 | Verify search results page | `/buscar?q=samsung` | `getByText(/resultado/i)` | Results count visible, product cards shown | — |

**Assertions:**
- [ ] `expect(page).toHaveURL(/\/buscar\?q=/)` — URL includes query
- [ ] At least 1 product card is visible (or empty state if no matches)
- [ ] Search input on results page retains the query text
- [ ] No console errors

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E1 | Submit empty search | Redirect to `/buscar` with empty state or all products |
| E2 | Search for non-existent product | "No results found" empty state with suggestions |
| E3 | Special characters in search | `<script>alert(1)</script>` — sanitized, no XSS |

---

## Flow 2: Search Filters and Sorting

**User Story:** As a buyer, I want to filter and sort search results to find the best product for me.
**Preconditions:** Multiple products seeded across different categories and prices.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 2.1 | Navigate to search results | `/buscar?q=samsung` | `page.goto(...)` | Results displayed | — |
| 2.2 | Apply category filter | `/buscar` | Category dropdown or filter UI | Results filtered by category | `buyer-03-filtered.png` |
| 2.3 | Verify URL updates with filter | `/buscar` | `page.url()` | URL includes `category=electronics` (or similar) | — |
| 2.4 | Clear category filter | `/buscar` | Clear/reset button | All results restored | — |
| 2.5 | Apply sort (price low to high) | `/buscar` | Sort dropdown | Results reordered by price ascending | `buyer-04-sorted.png` |
| 2.6 | Apply sort (newest first) | `/buscar` | Sort dropdown | Results reordered by date | — |

**Assertions:**
- [ ] Filter updates URL query params
- [ ] Filtered results only contain items matching the filter
- [ ] Sort order is correct (verify first/last card prices)
- [ ] Clear filter restores full results
- [ ] Results count updates after filtering

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E4 | Filter to category with no products | Empty state shown |
| E5 | Invalid category in URL | `/buscar?category=nonexistent` — graceful handling |

---

## Flow 3: Product Detail Page

**User Story:** As a buyer, I want to view product details so I can decide whether to buy.
**Preconditions:** At least 1 published product exists.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 3.1 | Click product card from search results | `/buscar` | Click first `ProductCard` link | Navigate to `/productos/[id]` | — |
| 3.2 | Verify product detail page | `/productos/[id]` | `getByRole('heading')` for title | Title, price, description, images, seller info visible | `buyer-05-detail.png` |
| 3.3 | Verify image gallery | `/productos/[id]` | Image elements | Product images displayed | — |
| 3.4 | Verify seller card | `/productos/[id]` | Seller name, rating, link | Seller info card visible with link to profile | — |
| 3.5 | Verify breadcrumb navigation | `/productos/[id]` | Breadcrumb links | Breadcrumb shows: Home > Category > Product | — |
| 3.6 | Click seller profile link | `/productos/[id]` | Link in seller card | Navigate to `/vendedor/[id]` or `/negocio/[slug]` | — |

**Assertions:**
- [ ] Product title, price (in BOB), description are visible
- [ ] At least 1 product image is rendered
- [ ] Seller card shows name and links to seller profile
- [ ] Breadcrumb links work
- [ ] Page has correct metadata (title, description)
- [ ] No console errors

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E6 | Navigate to non-existent product ID | `/productos/nonexistent-uuid` — 404 page or "Product not found" |
| E7 | Navigate to malformed ID | `/productos/not-a-uuid` — 404 or graceful error |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious
- [ ] Images have alt text
- [ ] Price is readable by screen readers
- [ ] Seller contact actions are keyboard-accessible

**Mobile (375px):**
- [ ] Image gallery adapts to mobile
- [ ] No horizontal scroll
- [ ] Seller card visible without excessive scrolling
- [ ] Touch targets >= 44px on action buttons

---

## Flow 4: Seller Profiles (Personal & Business)

**User Story:** As a buyer, I want to view a seller's profile and their other products.
**Preconditions:** At least 1 personal seller and 1 business seller exist with products.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 4.1 | Navigate to personal seller | `/vendedor/[id]` | `page.goto(...)` | Seller profile: name, avatar, rating, products | `buyer-06-seller.png` |
| 4.2 | Verify seller products listed | `/vendedor/[id]` | Product card grid | Seller's products displayed | — |
| 4.3 | Verify trust badge | `/vendedor/[id]` | Badge element | Appropriate trust badge visible | — |
| 4.4 | Navigate to business storefront | `/negocio/[slug]` | `page.goto(...)` | Business page: header, info, hours, products | `buyer-07-storefront.png` |
| 4.5 | Verify business info | `/negocio/[slug]` | Business name, category, description, hours | Business details visible | — |
| 4.6 | Verify business products | `/negocio/[slug]` | Product grid | Business products listed | — |
| 4.7 | Cross-navigate: storefront seller link | `/negocio/[slug]` | Seller profile link | Navigate to `/vendedor/[id]` | — |

**Assertions:**
- [ ] Personal seller: name, avatar, trust badge, products
- [ ] Business storefront: business name, category, description, hours, products
- [ ] Cross-navigation between `/vendedor/[id]` and `/negocio/[slug]` works
- [ ] SEO: JSON-LD structured data present (Person, LocalBusiness)
- [ ] Canonical URL set correctly

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E8 | Non-existent seller ID | `/vendedor/fake-uuid` — 404 page |
| E9 | Non-existent business slug | `/negocio/fake-slug` — 404 page |
| E10 | Seller with no products | Profile visible, empty products state |

---

## Flow 5: Complete Buyer Journey (End-to-End)

**User Story:** As a buyer, I want to complete the full journey from landing to contacting a seller.
**Preconditions:** Seeded products and sellers.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 5.1 | Land on homepage | `/` | `page.goto('/')` | Hero visible | `buyer-e2e-01.png` |
| 5.2 | Search for "celular" | `/` | Search bar | Redirect to `/buscar?q=celular` | `buyer-e2e-02.png` |
| 5.3 | Apply electronics filter | `/buscar` | Category filter | Filtered results | `buyer-e2e-03.png` |
| 5.4 | Click first product | `/buscar` | First ProductCard | Product detail page | `buyer-e2e-04.png` |
| 5.5 | View product details | `/productos/[id]` | Scroll and read | All details visible | `buyer-e2e-05.png` |
| 5.6 | Click seller profile | `/productos/[id]` | Seller card link | Seller profile page | `buyer-e2e-06.png` |
| 5.7 | Browse seller's other products | `/vendedor/[id]` | Product grid | Other products visible | `buyer-e2e-07.png` |

**Assertions:**
- [ ] Complete flow executes without errors
- [ ] Each navigation transition is smooth (no 500 errors, no blank screens)
- [ ] URLs update correctly at each step
- [ ] Back navigation works at each step

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Products | At least 3 products across 2 categories | Seeded before tests |
| Personal seller | User with at least 2 products | Seeded |
| Business seller | User with business profile and at least 1 product | Seeded |
