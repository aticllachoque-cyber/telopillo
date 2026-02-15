# M4.5 Progress Report

**Milestone:** Account Types & Minimal KYC  
**Status:** COMPLETED  
**Last Updated:** February 15, 2026  
**KYC Scope:** Minimal (phone collection only, no document upload)

---

## Overall Progress

```
Phase 1: Database Schema & Types         ████████████████████  100%
Phase 2: Registration Flow               ████████████████████  100%
Phase 3: Profile Edit & Trust Badge      ████████████████████  100%
Refactor: Business as Add-on             ████████████████████  100%
Phase 4: Business Storefront Page        ████████████████████  100%
Phase 6a: Search RPC & API (seller info) ████████████████████  100%
Phase 5: Personal Seller Profile         ████████████████████  100%
Phase 6b: Product Cards & Seller UI      ████████████████████  100%
Phase 7: Testing & Polish                ████████████████████  100%

Overall: ████████████████████ 100%
```

## Phase 1: Database Schema & Types - COMPLETED

- Migration `20260215120000_add_account_types.sql` applied
- `profiles` table: added `account_type`, `verification_level`, `phone_verified`
- `business_profiles` table created with RLS
- `generate_slug()`, `update_verification_on_phone()` functions created
- `handle_new_user()` trigger updated for business account auto-creation
- `business-logos` storage bucket created
- TypeScript types and Zod schemas updated
- All database-level tests passed (11/11)

## Phase 2: Registration Flow - COMPLETED

- `registerSchema` updated with `accountType`, `businessName`, `businessCategory`
- `AccountTypeSelector.tsx` component created (card-based, `role="radiogroup"`, a11y)
- Registration page updated with 3-step wizard:
  - Step 1: Account type selection (Personal/Business)
  - Step 2: Credentials (name, email, password)
  - Step 3: Business info (business only - name, category)
- Step indicator dynamically shows 2/2 or 3/3 based on account type
- OAuth buttons shown only on step 1
- TypeScript and ESLint clean

## Phase 3: Profile Edit & Account Switching - COMPLETED

- `VerificationBadge.tsx`: descriptive badges (Nuevo Vendedor, Vendedor con Telefono, Nuevo Negocio, Negocio con Telefono) with tooltip, teaser text, green/neutral styling
- `BusinessHoursEditor.tsx`: day-by-day toggle with native time inputs, quick-fill buttons (Lun-Vie, Todos), JSONB serialization
- `BusinessProfileForm.tsx`: full form with logo upload, name/description/category/NIT, location selector, business hours, social links (FB/IG/TikTok/WhatsApp/website), Zod validation
- `profile/edit/page.tsx` updated:
  - Verification badge shown in header (auto-updates on phone change)
  - Account Type Switcher card with confirmation dialog (AlertDialog)
  - Business Profile form card appears only for business accounts
  - Switch personal->business creates business_profiles row with slug
  - Switch business->personal hides form, keeps data for re-switch
  - Toast notifications on success/error
- All TypeScript clean, no lint errors

## Refactor: Business as Add-on Architecture - COMPLETED

**Reason:** PM review identified mutually exclusive account types as misaligned with Bolivian market behavior (many sellers operate both personally and as a business). Refactored to "business as add-on" model per PM recommendation.

**Changes applied:**

- **Migration** `20260215140000_refactor_business_addon.sql`: Updated `handle_new_user()` to always insert `account_type = 'personal'`. Business profile creation driven by `business_name` metadata presence, not account type selection.
- **Source of truth:** `business_profiles` row existence = "has business" (not `account_type` column)
- **Registration page:** Replaced 3-step wizard with single form + optional expandable "También quiero crear un negocio" section (business name + category)
- **Deleted** `AccountTypeSelector.tsx` component (no longer needed)
- **`VerificationBadge.tsx`:** Changed prop from `accountType` to `hasBusinessProfile: boolean`
- **Profile edit page:** Removed Account Type Switcher card. Business Profile section now available to all users:
  - Users without business profile see a "¿Tienes un negocio?" CTA to create one
  - Users with business profile see the full `BusinessProfileForm`
- **`registerSchema`:** Removed required `accountType`, added optional `wantsBusiness` boolean
- **`profileSchema`:** Removed `account_type`, `ACCOUNT_TYPES`, `AccountType` exports
- **TypeScript:** Clean compilation (`npx tsc --noEmit` passes)
- **Browser tested:** Both registration and profile edit pages verified working

## Phase 4: Business Storefront Page - COMPLETED

- `app/negocio/[slug]/page.tsx`: SSR storefront page with `generateMetadata`
- `components/business/BusinessHeader.tsx`: Logo (or initials fallback), business name, description, VerificationBadge, location, member since
- `components/business/BusinessInfoSidebar.tsx`: WhatsApp CTA, phone, business hours (today highlighted, open/closed), location + address, social links (Facebook, Instagram, TikTok), website
- SEO: `<title>`, `<meta description>`, Open Graph, Twitter Card, canonical URL
- Schema.org `LocalBusiness` JSON-LD structured data
- Empty storefront UX: "Proximamente" message when 0 products
- 404 for invalid slugs via `notFound()`
- Reuses `ProductGrid` with `showActions={false}`
- TypeScript clean, no lint errors
- Browser tested: header, sidebar, hours, social links, empty state, 404, JSON-LD all verified

## Phase 6a: Search RPC & API – Seller Info - COMPLETED

- Migration `20260215160000_search_add_seller_info.sql`: Drops old function signatures, creates new ones with seller info
- `search_products()`: LEFT JOINs `profiles` and `business_profiles` on `p.user_id`. Returns 6 new seller fields: `seller_name`, `seller_avatar_url`, `seller_verification_level`, `seller_business_name`, `seller_business_slug`, `seller_business_logo`
- `search_products_semantic()`: Same seller info JOINs in hybrid RRF path. Delegation to keyword-only path passes `seller_type_filter` through
- New parameter `seller_type_filter` (`'business'` | `'personal'` | NULL): Filters by business_profiles row existence (add-on model source of truth)
- API route `app/api/search/route.ts`: Added `sellerType` query param → `seller_type_filter` RPC param
- TypeScript types updated: `SearchProduct` interface in `types/database.ts`, RPC Args updated with `seller_type_filter`
- Search page `app/buscar/page.tsx`: Product interface updated with seller fields
- Tested: seller info returned correctly, `seller_type_filter` works (business=13, personal=1), semantic fallback path verified
- TypeScript clean, no lint errors

## Phase 5: Personal Seller Profile - COMPLETED

- Route: `/vendedor/[id]` (public, not behind auth middleware — moved from initial `/perfil/[id]` to avoid middleware protection conflict)
- `components/profile/SellerProfileHeader.tsx`: Avatar (with initials fallback), full name, VerificationBadge, star rating (or "Sin reseñas aún"), location, member since, product count, WhatsApp CTA (visible only if phone available), "Visitar tienda" link (visible only if user has business profile)
- `app/vendedor/[id]/page.tsx`: SSR page with `generateMetadata` (title, description, OG profile, Twitter, canonical URL), JSON-LD Person structured data, parallel data fetching (profile + business slug + products), `ProductGrid` with `showActions={false}`, empty state with Package icon, 404 for non-existent sellers
- `components/products/SellerCard.tsx`: Added "Ver perfil del vendedor" link button pointing to `/vendedor/{id}` from product detail pages
- Business profile link: Fetches `business_profiles.slug` via LEFT JOIN, shows "Visitar tienda" button when slug exists → `/negocio/[slug]`
- Tested: Business seller page (200, all badges + store link + products), personal seller (200, no store link, products visible), non-existent (404), product detail page "Ver perfil del vendedor" link present
- TypeScript clean, no lint errors

## Phase 6b: Product Cards & Seller Card UI - COMPLETED

- `components/products/ProductCard.tsx`: Extended product interface with optional seller fields (`user_id`, `seller_name`, `seller_business_name`, `seller_business_slug`, `seller_verification_level`). Added seller info row below price:
  - Business sellers: Store icon + business name linking to `/negocio/[slug]`
  - Personal sellers: User icon + seller name linking to `/vendedor/[user_id]`
  - Graceful degradation: no seller row when fields not present (backward compatible)
- `components/products/ProductGrid.tsx`: Extended Product interface to pass through seller fields
- `components/products/SellerCard.tsx`: Added `VerificationBadge` next to seller name, new `business` prop (`{ business_name, slug }`), business info section with Store icon + "Visitar tienda" link when business profile exists
- `app/productos/[id]/page.tsx`: Separate query to fetch `business_profiles` by `user_id` (no direct FK from products table), passes `businessProfile` to SellerCard
- Tested: Business seller product page (badge + store link + vendor link), personal seller product page (badge + vendor link, no store), search API seller data flows to product cards, all routes return 200/404 correctly
- TypeScript clean, no lint errors

## Phase 7: Testing & Polish - COMPLETED

### UX & Accessibility Fixes Applied
- **Validation i18n**: All business profile Zod validation messages translated to Spanish
- **VerificationBadge**: Replaced `title` with accessible tooltip (focus + hover), added `role="img"`, `aria-label`, `aria-describedby`, `tabIndex={0}`, fixed "Telefono" → "Teléfono" typo
- **BusinessHoursEditor**: Increased day toggle height from `h-9` to `h-11` (≥44px touch target), quick-fill buttons from `size="xs"` to `size="sm"` with `min-h-[44px]` on mobile
- **BusinessInfoSidebar**: Added `role="status"` + visual dot indicator alongside text for open/closed status (no longer color-only), added empty state when no contact info, added `aria-label` to all social links
- **SellerCard**: Restructured no-phone fallback to promote "Ver perfil" as primary CTA, added `aria-hidden="true"` to safety tips emoji
- **BusinessProfileForm**: Passed LocationSelector errors, added `aria-describedby` and error `id` to `social_facebook` input
- **ProductCard**: Added `focus-within:shadow-lg` for keyboard accessibility
- **Registration**: Improved business section discoverability with `bg-primary/5` background, primary border, clearer CTA label, 44px min touch target
- **Empty states**: Added `role="status"` to storefront and seller profile empty states, added "Ver perfil del vendedor" link to empty storefront
- **SellerProfileHeader**: Added no-phone fallback message
- **BusinessHeader**: Added link to seller's personal profile (`/vendedor/[id]`)
- **Storefront**: Removed duplicate back nav (breadcrumb sufficient), removed unused `ArrowLeft` import
- **Color contrast**: Fixed WhatsApp CTA button from `bg-green-600` to `bg-green-700`, fixed day toggle text from `text-muted-foreground` to `text-foreground/70`

### E2E Tests (28/28 passing)
- `tests/m4.5-account-types-e2e.spec.ts`: 28 Playwright tests covering:
  - Registration flow (4 tests): fields, business toggle expand/collapse, Spanish validation
  - Business storefront (5 tests): header, SEO meta, JSON-LD, seller profile link, 404
  - Personal seller profile (5 tests): header, "Visitar tienda" link, SEO/JSON-LD, 404, no-phone fallback
  - Verification badge (3 tests): keyboard tooltip, aria attributes, accented label
  - Product detail seller card (2 tests): profile link, emoji aria-hidden
  - Search results seller info (3 tests): seller names on cards, sellerType filter API, seller fields
  - Business profile validation (1 test): Spanish error messages
  - Business info sidebar (2 tests): status indicator, social aria-labels
  - Business hours editor (1 test): 44px touch target height
  - Cross-navigation (2 tests): storefront↔seller profile

### Accessibility Audit (7/7 passing)
- `tests/m4.5-accessibility.spec.ts`: axe-core WCAG 2.2 AA audit on 7 pages:
  - Register (collapsed), Register (business expanded), Storefront, Seller profile (business), Seller profile (personal), Search results, Profile edit
  - Zero critical/serious violations (2 known library-level contrast exclusions: shadcn/ui Select placeholder, Avatar fallback)

### Mobile Responsive Tests (7/7 passing)
- `tests/m4.5-mobile.spec.ts`: 375px viewport tests covering:
  - Register, storefront, seller profile (business + personal), search results
  - No horizontal overflow on any page
  - Badge readability, 44px touch targets verified

## Scope Changes

- **Removed Phase 7 (Verification Documents UI)** - deferred to Strong KYC milestone
- **Original Phase 8 (Testing) renumbered to Phase 7**
- **Added Refactor: Business as Add-on** - architectural change before continuing to Phase 4
- **Phase 6 split into 6a (Search RPC/API) and 6b (ProductCard/SellerCard UI)** per PM recommendation
- **Phase order updated:** 4 → 6a → 5 → 6b → 7 (incremental testing)
- **Estimated duration reduced:** 5-7 days -> 4-6 days
- **Estimated effort reduced:** 25-32 hours -> 21-28 hours
