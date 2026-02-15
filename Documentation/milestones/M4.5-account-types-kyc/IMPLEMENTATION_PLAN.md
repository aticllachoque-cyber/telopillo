# M4.5 Implementation Plan

**Milestone:** Account Types & Minimal KYC  
**Estimated Duration:** 4-6 days  
**Priority:** HIGH  
**KYC Scope:** Minimal (phone collection only, no document upload)

> **REFACTOR NOTICE:** Phases 1-3 were implemented with the original mutually-exclusive account type model. After PM review, a **"business as add-on" refactor** was applied. Key changes:
> - `handle_new_user()` always inserts `account_type = 'personal'`; optionally creates `business_profiles` if `business_name` metadata present
> - Registration is a single form with optional business section (no 3-step wizard)
> - `AccountTypeSelector.tsx` deleted; no account type switcher in profile edit
> - `VerificationBadge` uses `hasBusinessProfile: boolean` instead of `accountType`
> - Profile edit shows business section to all users (CTA to create, or form to edit)
> - `profileSchema` no longer includes `account_type`
> - Phases 4-7 below should follow the add-on model (check `business_profiles` row, not `account_type`)

---

## Phase 1: Database Schema & Types (Day 1)

**Estimated Duration:** 2-3 hours

### Tasks

1. Create migration: `add_account_types.sql`
   - Add `account_type` column to `profiles` (personal/business, default personal)
   - Add `verification_level` column to `profiles` (0-3, default 0)
   - Add `phone_verified` column to `profiles` (boolean, default false)
   - Create `business_profiles` table (see PRD Section 4.1.3 for full schema)
   - RLS for `business_profiles`: public SELECT, owner-only INSERT/UPDATE/DELETE
   - Create `business-logos` Storage bucket (public) with RLS
   - Create indexes: `idx_business_profiles_slug` (UNIQUE), `idx_profiles_account_type`
   - Create `generate_slug(input TEXT)` function (see PRD Section 7.2)
   - Create `update_verification_on_phone()` trigger (auto Level 1 when phone provided, revert to 0 when phone removed - see PRD Section 4.1.3)
   - Update `handle_new_user()` trigger: read `account_type` from `raw_user_meta_data`, auto-create `business_profiles` row with slug for business accounts (see PRD Section 7.1)
   - **NOT creating:** `verification_documents` table (deferred to Strong KYC)
   - **NOT creating:** `verification-documents` storage bucket (deferred to Strong KYC)

2. Update TypeScript types
   - Regenerate `types/database.ts` with new `business_profiles` table and updated `profiles` columns

3. Create Zod validation schemas
   - `lib/validations/business-profile.ts` (see PRD Section 4.1.7 for full schema)
   - Update `lib/validations/profile.ts` (add `account_type` field)

### Deliverables
- Migration SQL file (single file covering all schema changes, triggers, functions, RLS, indexes)
- Updated `types/database.ts`
- `lib/validations/business-profile.ts`
- Updated `lib/validations/profile.ts`

### Files
| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_add_account_types.sql` | Create |
| `types/database.ts` | Regenerate |
| `lib/validations/business-profile.ts` | Create |
| `lib/validations/profile.ts` | Modify |

---

## Phase 2: Registration Flow (Day 1-2) - REFACTORED

**Estimated Duration:** 3-4 hours

### Tasks (Post-Refactor)

1. ~~Account type selector component~~ **DELETED** - No longer needed

2. Update registration page (`app/(auth)/register/page.tsx`)
   - Single form: Name, Email, Password, Confirm Password
   - Optional expandable section: "También quiero crear un negocio"
     - Expands to show Business Name + Business Category fields
   - Pass `full_name` and optionally `business_name`, `business_category` in `signUp` metadata
   - No `account_type` in metadata (trigger always inserts personal)
   - `registerSchema` uses `wantsBusiness: boolean` (optional) to conditionally validate business fields

### Deliverables
- ~~`components/profile/AccountTypeSelector.tsx`~~ **DELETED**
- Updated `app/(auth)/register/page.tsx`
- Updated `lib/validations/auth.ts` (`wantsBusiness` replaces `accountType`)

### Files
| File | Action |
|------|--------|
| ~~`components/profile/AccountTypeSelector.tsx`~~ | **DELETED** |
| `app/(auth)/register/page.tsx` | Rewritten (single form) |
| `lib/validations/auth.ts` | Modified (wantsBusiness) |

### User Stories Covered
- US-4.5.1 (single form registration with optional business)

---

## Phase 3: Profile Edit & Business Profile (Day 2-3) - REFACTORED

**Estimated Duration:** 4-5 hours

### Tasks (Post-Refactor)

1. ~~Account type switcher~~ **REMOVED** - Replaced with business profile CTA
   - Business profile section available to ALL users in `/profile/edit`
   - If no `business_profiles` row: show "¿Tienes un negocio?" CTA with "Crear Perfil de Negocio" button
   - If `business_profiles` row exists: show `BusinessProfileForm` in edit mode
   - CTA creates `business_profiles` row with `generate_slug` and shows success toast

2. Business profile form
   - `components/profile/BusinessProfileForm.tsx`
   - Fields: business_name (required), business_description, business_category, nit (optional), website_url
   - Social links: facebook, instagram, tiktok, whatsapp
   - Business logo upload (reuse avatar upload pattern: max 5MB, JPG/PNG/WebP, auto-resize to 400x400)
   - Location: business_department + business_city (reuse existing LocationSelector)
   - Business address (text field)
   - Form validation using `businessProfileSchema` from Phase 1
   - Explicit save button with loading state

3. Business hours editor
   - `components/profile/BusinessHoursEditor.tsx`
   - Day-by-day toggle (Lun-Dom)
   - Open/close time pickers per day (native `<input type="time">` for a11y - PRD Section 8.2)
   - "Closed" toggle per day with descriptive `aria-label`
   - Store as JSONB: `{"lun": "9:00-18:00", "mar": "9:00-18:00", "sab": "9:00-13:00"}`
   - Keyboard accessible day toggles

4. Trust badge display (REFACTORED)
   - `components/ui/VerificationBadge.tsx`
   - Descriptive badges based on `hasBusinessProfile: boolean` + `verification_level`:
     - No business profile, Level 0: "Nuevo Vendedor" (neutral style)
     - No business profile, Level 1: "Vendedor con Telefono" (positive/green style)
     - Has business profile, Level 0: "Nuevo Negocio" (neutral style)
     - Has business profile, Level 1: "Negocio con Telefono" (positive/green style)
   - Show on profile edit page (current user's own badge)
   - Tooltip/title attribute explaining what the badge means
   - Accessible: text + icon, not color alone (PRD Section 8.3)
   - Teaser text: "Want to increase your trust level? Full verification coming soon!"
   - No progress indicator or upload CTA (deferred to Strong KYC)

### Deliverables
- Business profile CTA and form integration (in `app/profile/edit/page.tsx`)
- `components/profile/BusinessProfileForm.tsx`
- `components/profile/BusinessHoursEditor.tsx`
- `components/ui/VerificationBadge.tsx`

### Files
| File | Action |
|------|--------|
| `app/profile/edit/page.tsx` | Modify (add business CTA, business form, badge) |
| `components/profile/BusinessProfileForm.tsx` | Create |
| `components/profile/BusinessHoursEditor.tsx` | Create |
| `components/ui/VerificationBadge.tsx` | Create |

### User Stories Covered
- US-4.5.2 (create business profile from profile edit)
- ~~US-4.5.3~~ (REMOVED - no switching in add-on model)
- US-4.5.4 (business details: name, hours, social, logo)
- US-4.5.10 (trust badge display using hasBusinessProfile)
- US-4.5.11 (auto badge on phone)

---

## Phase 4: Business Storefront Page (Day 3-4)

**Estimated Duration:** 4-5 hours

> **PM Review Note:** Phase order validated. Phase 6 split into 6a (data layer) and 6b (UI). New order: 4 → 6a → 5 → 6b → 7 (incremental testing after each phase).

### Tasks

1. Storefront page: `/negocio/[slug]/page.tsx`
   - Fetch business_profiles + profiles by slug
   - Fetch all products by user_id
   - SSR with Next.js metadata for SEO
   - Edge case: if no `business_profiles` row found for slug, show 404 (in add-on model, row existence = active storefront)
   - Empty storefront UX: show friendly message when business has 0 products ("Próximamente" / "Este negocio aún no tiene productos")
   - Page loads in < 3 seconds (PRD US-4.5.6)

2. Business header component
   - `components/business/BusinessHeader.tsx`
   - Logo (or fallback avatar), business name, description
   - Trust badge: reuse `VerificationBadge` from Phase 3
     - "Nuevo Negocio" (Level 0, neutral) or "Negocio con Telefono" (Level 1, positive)
   - Location, member since

3. Business info sidebar
   - `components/business/BusinessInfoSidebar.tsx`
   - Business hours (today's day highlighted, open/closed status)
   - Contact: phone, WhatsApp button (links to `https://wa.me/{number}`)
   - Social links: icons with links (Facebook, Instagram, TikTok)
   - Website link
   - Location with department
   - Mobile: sidebar renders below header (not side-by-side)

4. Product catalog
   - Reuse existing `ProductGrid` component with `showActions={false}`
   - Show total product count: "Productos (24)"

5. SEO (PRD Section 4.1.8)
   - `<title>`: `{businessName} - Telopillo.bo`
   - `<meta name="description">`: business description
   - Open Graph meta tags: `og:title`, `og:description`, `og:image` (logo), `og:type`
   - `<link rel="canonical">`: `https://telopillo.bo/negocio/{slug}`
   - Schema.org LocalBusiness JSON-LD structured data

### Deliverables
- `app/negocio/[slug]/page.tsx`
- `components/business/BusinessHeader.tsx`
- `components/business/BusinessInfoSidebar.tsx`
- SEO metadata + JSON-LD

### Files
| File | Action |
|------|--------|
| `app/negocio/[slug]/page.tsx` | Create |
| `components/business/BusinessHeader.tsx` | Create |
| `components/business/BusinessInfoSidebar.tsx` | Create |

### User Stories Covered
- US-4.5.5 (storefront URL with slug, SEO)
- US-4.5.6 (buyer visits storefront: info, products, hours)

---

## Phase 6a: Search RPC & API – Seller Info (Day 4)

**Estimated Duration:** 1.5-2 hours

> **PM Split:** Extracted data-layer work from original Phase 6. Must complete before Phase 6b (UI) so components have seller data to consume.

### Tasks

1. Update search_products RPC (both keyword and semantic)
   - JOIN `profiles` to get `full_name`, `verification_level`
   - LEFT JOIN `business_profiles` to get `business_name`, `slug`, `business_logo_url`
   - Use `business_profiles.slug IS NOT NULL` as "has business" indicator (not `account_type`)
   - Include in result:
     - `seller_name` (profiles.full_name)
     - `seller_verification_level` (profiles.verification_level)
     - `seller_business_name` (business_profiles.business_name or null)
     - `seller_business_slug` (business_profiles.slug or null)
     - `seller_business_logo` (business_profiles.business_logo_url or null)

2. Update search API (`app/api/search/route.ts`)
   - Pass seller fields through to frontend
   - Optional filter: `seller_type=business` (has `business_profiles` row) or `seller_type=personal` (no row)
   - Filter state preserved in URL query params

### Deliverables
- Updated search RPC (migration)
- Updated `app/api/search/route.ts`

### Files
| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_update_search_rpc_seller_info.sql` | Create |
| `app/api/search/route.ts` | Modify |

### User Stories Covered
- US-4.5.9 (filter search results by seller type) – data layer

---

## Phase 5: Personal Seller Profile (Day 4-5)

**Estimated Duration:** 2-3 hours

### Tasks

1. Public profile page: `/vendedor/[id]/page.tsx` (moved from `/perfil/[id]` to avoid auth middleware conflict)
   - Fetch profile + products by user_id
   - Minimal design: avatar, name, location, member since
   - Rating display: show stars + count when `rating_count > 0`; show "Sin reseñas" when `rating_count === 0`
   - Product grid showing all products from this seller (`showActions={false}`)
   - WhatsApp contact button (visible only if phone available)
   - Mobile-responsive layout

2. Trust badge (reuse `VerificationBadge` from Phase 3)
   - "Vendedor con Telefono" (positive) for Level 1+
   - "Nuevo Vendedor" (neutral) for Level 0

3. Business profile link logic
   - If user has a `business_profiles` row: show "Visitar tienda" link -> `/negocio/[slug]`
   - Fetch `business_profiles.slug` via LEFT JOIN (source of truth: row existence)

### Deliverables
- `app/vendedor/[id]/page.tsx`
- `components/profile/SellerProfileHeader.tsx`
- "Ver perfil del vendedor" link on product detail page SellerCard
- "Visitar tienda" link for users with business profiles

### Files
| File | Action |
|------|--------|
| `app/vendedor/[id]/page.tsx` | Create |
| `components/profile/SellerProfileHeader.tsx` | Create |
| `components/products/SellerCard.tsx` | Modify (add profile link) |

### User Stories Covered
- US-4.5.7 (buyer views personal profile: avatar, name, rating, products, badge, WhatsApp)

---

## Phase 6b: Product Cards & Seller Card UI (Day 5)

**Estimated Duration:** 2-2.5 hours

> **PM Split:** UI work from original Phase 6. Depends on Phase 4 (storefront exists), Phase 5 (personal profile exists), and Phase 6a (search returns seller data).

### Tasks

1. Update ProductCard component (`components/products/ProductCard.tsx`)
   - Accept optional seller info props (business_name, slug, verification_level)
   - If seller has business: show mini business badge (small icon + business name)
   - If seller is personal: show seller name (existing behavior)
   - Clicking business name on card navigates to `/negocio/[slug]`
   - Badge is visually distinct but not overwhelming

2. Update SellerCard component (`components/products/SellerCard.tsx`)
   - Personal: existing layout (avatar, name, location, contact)
   - Business: logo, business name, "Visitar tienda" link -> `/negocio/[slug]`, hours summary, trust badge
   - Add "Ver perfil del vendedor" link -> `/perfil/[id]`

3. Update product page query (`app/productos/[id]/page.tsx`)
   - Extend query to LEFT JOIN `business_profiles` for the seller
   - Pass business info to SellerCard

### Deliverables
- Updated `components/products/ProductCard.tsx`
- Updated `components/products/SellerCard.tsx`
- Updated `app/productos/[id]/page.tsx` (seller query)

### Files
| File | Action |
|------|--------|
| `components/products/ProductCard.tsx` | Modify |
| `components/products/SellerCard.tsx` | Modify |
| `app/productos/[id]/page.tsx` | Modify |

### User Stories Covered
- US-4.5.8 (product cards show business badge, click navigates to storefront)
- US-4.5.9 (filter search results by seller type) – UI layer

---

## Phase 7: Testing & Polish (Day 5-6)

**Estimated Duration:** 3-4 hours

### Tasks

1. Playwright E2E tests (`tests/m4.5-account-types-e2e.spec.ts`) (REFACTORED)
   - Register without business -> verify profiles row created, no business_profiles row
   - Register with business option checked -> verify profiles + business_profiles rows created
   - Create business profile from profile edit CTA -> verify business_profiles row, slug generated
   - Edit business profile (name, hours, logo, social links)
   - View business storefront: header, sidebar, product grid, SEO tags
   - View personal profile: avatar, name, badge, products
   - Product cards show business badge for users with business_profiles
   - Trust badge updates when phone is added (Level 0 -> 1)
   - Trust badge reverts when phone is removed (Level 1 -> 0)
   - Badge shows "Negocio" variant when user has business_profiles
   - Search filter: "Only from businesses" returns correct results

2. Accessibility (PRD Section 8)
   - axe-core audit on: registration, profile edit, storefront, personal profile
   - Keyboard navigation: account type selector (`radiogroup`), business hours editor, forms
   - Screen reader: `aria-selected` on cards, `aria-label` on toggles, badge announcements
   - Touch targets >= 44px on mobile
   - Color contrast >= 4.5:1 for text, >= 3:1 for large text
   - Form errors associated via `aria-describedby`

3. Mobile testing (375px viewport)
   - Registration flow: account type cards stack vertically
   - Business storefront: sidebar below header, social links wrap
   - Business hours editor: usable on small screens
   - Personal profile: responsive layout
   - Product cards: badge readable on mobile

### Deliverables
- `tests/m4.5-account-types-e2e.spec.ts`
- Accessibility compliance verified
- Mobile-responsive layouts verified

### Files
| File | Action |
|------|--------|
| `tests/m4.5-account-types-e2e.spec.ts` | Create |

### User Stories Covered
- All US-4.5.1 through US-4.5.11 (validation of acceptance criteria)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Slug collision (2 businesses same name) | Medium | Low | `generate_slug()` auto-appends random 4-char suffix on collision |
| Complex business hours UI | Medium | Medium | Start with simple text input, upgrade to time picker if needed |
| Large logo uploads slowing pages | Low | Medium | Auto-resize/compress on upload (same pattern as avatars) |
| Users provide fake phone numbers | High | Low | Minimal KYC - badges are informational only, no feature gating. Strong KYC will add SMS OTP |
| Migration on existing users | Low | Low | Default all existing to personal/level 0, non-breaking |
| Users confused by badge meanings | Medium | Low | Clear tooltip on badge explaining what it means |
| Slug guessing / enumeration | Low | Low | Slugs are public (same as product URLs); no sensitive data exposed |

---

## Non-Goals (Future milestones)

- **Strong KYC**: CI/NIT document upload, SMS/OTP phone verification, feature gating, admin review
- **`verification_documents` table and `verification-documents` storage bucket** - deferred to Strong KYC
- **`/profile/verificacion` page** - deferred to Strong KYC
- **`DocumentUpload.tsx` and `VerificationStatus.tsx` components** - deferred to Strong KYC
- **"Pendiente de Verificacion" badge state** - deferred to Strong KYC
- Admin panel for document review
- Automated NIT/CI verification
- Premium subscription tiers
- Business analytics dashboard
- Bulk product upload
- Promoted/featured listings
- Payment processing

---

## Summary: PRD Cross-Reference

| PRD Section | Implementation Phase |
|-------------|---------------------|
| 4.1.1 Account Types | Phase 1 (schema), Phase 2 (registration), Phase 3 (switching) |
| 4.1.2 Minimal KYC | Phase 1 (trigger), Phase 3 (badge component) |
| 4.1.3 Database Schema | Phase 1 |
| 4.1.4 Pages & Components | Phase 2-6 |
| 4.1.5 User Flows | Phase 2 (registration), Phase 3 (switch, KYC), Phase 4-5 (pages) |
| 4.1.6 Slug Generation | Phase 1 (`generate_slug` function) |
| 4.1.7 Validation Schemas | Phase 1 |
| 4.1.8 SEO & Structured Data | Phase 4 |
| Section 5 User Stories | US-4.5.1: Phase 2, US-4.5.2/3: Phase 3, US-4.5.4/5: Phase 3/4, US-4.5.6: Phase 4, US-4.5.7: Phase 5, US-4.5.8/9: Phase 6, US-4.5.10/11: Phase 3 |
| Section 7 Technical Design | Phase 1 (triggers, functions), Phase 6 (search RPC) |
| Section 8 Accessibility | Phase 2 (selector), Phase 3 (hours, badge), Phase 7 (audit) |

### Files Summary (all phases)

**New Files (11, post-refactor: 10 + 1 migration):**
| File | Phase | Status |
|------|-------|--------|
| `supabase/migrations/YYYYMMDD_add_account_types.sql` | 1 | Created |
| `supabase/migrations/YYYYMMDD_refactor_business_addon.sql` | Refactor | Created |
| `lib/validations/business-profile.ts` | 1 | Created |
| ~~`components/profile/AccountTypeSelector.tsx`~~ | ~~2~~ | **DELETED** |
| `components/profile/BusinessProfileForm.tsx` | 3 | Created |
| `components/profile/BusinessHoursEditor.tsx` | 3 | Created |
| `components/ui/VerificationBadge.tsx` | 3 | Created (refactored) |
| `app/negocio/[slug]/page.tsx` | 4 | Pending |
| `components/business/BusinessHeader.tsx` | 4 | Pending |
| `components/business/BusinessInfoSidebar.tsx` | 4 | Pending |
| `supabase/migrations/YYYYMMDD_update_search_rpc_seller_info.sql` | 6a | Pending |
| `app/perfil/[id]/page.tsx` | 5 | Pending |
| `tests/m4.5-account-types-e2e.spec.ts` | 7 | Pending |

**Modified Files (9):**
| File | Phase |
|------|-------|
| `types/database.ts` | 1 |
| `lib/validations/profile.ts` | 1 |
| `app/(auth)/register/page.tsx` | 2 |
| `app/profile/edit/page.tsx` | 3 |
| `app/api/search/route.ts` | 6a |
| `components/products/ProductCard.tsx` | 6b |
| `components/products/SellerCard.tsx` | 6b |
| `app/productos/[id]/page.tsx` | 6b |