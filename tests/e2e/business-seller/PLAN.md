# Business Seller — E2E Test Plan

> **Plan ID:** E2E-BIZ-001
> **Priority:** High
> **Prerequisite Plans:** E2E-AUTH-001, E2E-SELLER-001
> **Target Files:**
> - `tests/e2e/business-seller/register-business.spec.ts`
> - `tests/e2e/business-seller/storefront.spec.ts`
> - `tests/e2e/business-seller/complete-business-flow.spec.ts`

---

## Complete Business Seller Journey

```
Register with Business → Setup Business Profile → Configure Storefront
→ List Products → Verify Storefront Public View → Manage Business
```

---

## Flow 1: Register with Business Profile

**User Story:** As a business owner, I want to register and set up my business in one step so I can start selling quickly.
**Preconditions:** No existing account.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 1.1 | Navigate to registration | `/register` | `page.goto('/register')` | Registration form visible | `biz-01-register.png` |
| 1.2 | Fill personal fields | `/register` | `getByLabel('Nombre completo')`, `getByLabel('Email')`, etc. | Fields filled | — |
| 1.3 | Expand business section | `/register` | Business toggle/checkbox | Business fields appear | `biz-02-business-expand.png` |
| 1.4 | Fill business name | `/register` | `getByLabel(/nombre del negocio/i)` | Business name entered | — |
| 1.5 | Select business category | `/register` | Business category select | Category selected | — |
| 1.6 | Submit registration | `/register` | Submit button | Account created with business profile | `biz-03-registered.png` |

**Assertions:**
- [ ] Business section toggles visibility on click
- [ ] Business fields have proper validation
- [ ] After registration, business profile exists in database
- [ ] Business slug is auto-generated from business name
- [ ] User can access `/negocio/[slug]` storefront

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E1 | Expand business, leave business name empty | Business name required error |
| E2 | Duplicate business slug | Error or auto-append number to slug |
| E3 | Expand business, collapse, submit | Personal-only registration succeeds |

---

## Flow 2: Business Profile Setup via Profile Edit

**User Story:** As a business seller, I want to complete my business profile with description, hours, and contact info.
**Preconditions:** Authenticated user with business profile.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 2.1 | Navigate to profile edit | `/profile/edit` | `page.goto('/profile/edit')` | Edit form with business section | `biz-04-edit.png` |
| 2.2 | Fill business description | `/profile/edit` | Business description textarea | Description entered | — |
| 2.3 | Set business hours | `/profile/edit` | Business hours editor | Hours configured | — |
| 2.4 | Add phone number | `/profile/edit` | Phone input | Phone entered (KYC Level 1) | — |
| 2.5 | Save profile | `/profile/edit` | Save button | Changes saved, success feedback | `biz-05-saved.png` |

**Assertions:**
- [ ] Business section visible in profile edit for business users
- [ ] Business description saves and persists
- [ ] Phone number triggers KYC level upgrade
- [ ] Trust badge updates: "Nuevo Negocio" → "Negocio con Teléfono"

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E4 | Invalid phone number format | Validation error |
| E5 | Business description too long | Character limit error or truncation |

---

## Flow 3: Business Storefront Public View

**User Story:** As a buyer, I want to view a business storefront to see their products and info.
**Preconditions:** Business profile exists with products.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 3.1 | Navigate to business storefront | `/negocio/[slug]` | `page.goto(...)` | Storefront page loads | `biz-06-storefront.png` |
| 3.2 | Verify business header | `/negocio/[slug]` | Business name heading, logo/avatar | Business name and branding visible | — |
| 3.3 | Verify business info sidebar | `/negocio/[slug]` | Description, category, hours, contact | Business details visible | — |
| 3.4 | Verify business hours display | `/negocio/[slug]` | Hours section | Business hours shown correctly | — |
| 3.5 | Verify trust badge | `/negocio/[slug]` | Badge element | Appropriate badge visible ("Negocio con Teléfono" etc.) | — |
| 3.6 | Verify product grid | `/negocio/[slug]` | Product cards | Business's products displayed | `biz-07-products.png` |
| 3.7 | Click a product | `/negocio/[slug]` | First product card | Navigate to product detail | — |
| 3.8 | Verify product links back to storefront | `/productos/[id]` | Seller card link | Link navigates to `/negocio/[slug]` | — |

**Assertions:**
- [ ] Storefront displays: business name, description, category, hours, products
- [ ] Trust badge reflects KYC level
- [ ] Product cards link to product detail pages
- [ ] Product detail pages link back to business storefront (not `/vendedor/[id]`)
- [ ] SEO: JSON-LD `LocalBusiness` structured data
- [ ] Canonical URL: `/negocio/[slug]`
- [ ] Meta title and description include business name

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E6 | Non-existent slug | `/negocio/fake-slug` — 404 page |
| E7 | Business with no products | Storefront visible, empty product state |
| E8 | Business with no description | Storefront renders, no empty section |

**Accessibility:**
- [ ] axe-core scan: zero critical/serious
- [ ] Badge tooltip accessible via keyboard (Enter/Space)
- [ ] Badge has `aria-label` or descriptive text
- [ ] Business hours readable by screen readers

**Mobile (375px):**
- [ ] Sidebar collapses to top of page on mobile
- [ ] No horizontal scroll
- [ ] Product grid is single-column
- [ ] Touch targets >= 44px
- [ ] Badge visible and within viewport

---

## Flow 4: Complete Business Seller Flow (End-to-End)

**User Story:** As a business owner, I register, set up my storefront, list products, and see everything live.
**Preconditions:** None (starts from scratch).

| Step | Action | Expected Result | Screenshot |
|------|--------|-----------------|------------|
| 4.1 | Register with business profile | Account created, business profile exists | `biz-e2e-01.png` |
| 4.2 | Complete business profile (description, hours, phone) | Profile saved with all business info | `biz-e2e-02.png` |
| 4.3 | Create a product via wizard | Product published | `biz-e2e-03.png` |
| 4.4 | Visit own storefront `/negocio/[slug]` | Storefront shows business info + product | `biz-e2e-04.png` |
| 4.5 | Search for the product | Product appears in search results | `biz-e2e-05.png` |
| 4.6 | View product detail, verify seller card links to storefront | Seller card links to `/negocio/[slug]` | `biz-e2e-06.png` |
| 4.7 | Verify trust badge on storefront | Badge shows current KYC level | `biz-e2e-07.png` |

**Assertions:**
- [ ] Complete business lifecycle from registration to public-facing storefront
- [ ] Business profile, storefront, products, and search are all consistent
- [ ] Trust badge correctly reflects KYC status

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Business seller | `biz-{timestamp}@telopillo.test` | Dynamic per run |
| Business name | `Test Tienda {timestamp}` | Generates unique slug |
| Business category | `electronics` or `clothing` | Standard categories |
| Phone | `+591 70000000` | For KYC Level 1 |
| Product | Standard test product | Created during flow |
