# Milestone 4.5: Account Types & Minimal KYC

**Priority:** HIGH (blocking for trust & marketplace quality)  
**Duration:** 4-6 days  
**Dependencies:** M1 (Authentication), M2 (Product Listings)  
**Status:** Not Started  
**KYC Scope:** Minimal (Strong KYC deferred to future milestone)

---

## Documentation

- **[PRD](./PRD.md)** - Complete requirements, user stories, technical design, and acceptance criteria
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Detailed step-by-step guide with code
- **[Progress](./PROGRESS.md)** - Progress report and task tracking

---

## Overview

Differentiate between **Personal** and **Business** accounts with **Minimal KYC** verification (email + phone collection). This is critical for marketplace trust, enabling future monetization, and providing businesses a professional storefront.

> **Minimal KYC:** Phone number collection only (no SMS verification, no document upload). Descriptive badges are informational - no feature gating. Strong KYC (CI/NIT document upload, SMS OTP, admin review) is deferred to a future milestone.

---

## Goals

1. Users choose account type (personal/business) during or after registration
2. Business accounts have a dedicated storefront page with rich information
3. Personal accounts have a clean, minimal seller profile
4. Minimal KYC: descriptive trust badges based on email + phone ("Nuevo Vendedor" / "Vendedor con Telefono")
5. Account type is switchable (personal <-> business)
6. No feature gating - all capabilities available to all users
7. Foundation for future premium features and Strong KYC

---

## Account Types

| Feature | Personal | Business |
|---|---|---|
| Profile page | Minimal (`/perfil/[id]`) | Full storefront (`/negocio/[slug]`) |
| Product listings | Unlimited (free) | Unlimited (free) |
| Display | Name, avatar, location | Logo, business name, hours, social links |
| Badge (Level 0) | "Nuevo Vendedor" | "Nuevo Negocio" |
| Badge (Level 1) | "Vendedor con Telefono" | "Negocio con Telefono" |
| Search appearance | Standard card | Card with business badge/logo |
| Switching | Can switch to business | Can switch to personal |

---

## Verification Levels (Minimal KYC)

Badges are **informational only** - no features are gated by verification level.

```
Level 0: Email verified (auto on registration)
  Badge: "Nuevo Vendedor" / "Nuevo Negocio"
  -> All features available (browse, search, publish, contact)

Level 1: Phone number provided (user fills phone in profile)
  Badge: "Vendedor con Telefono" / "Negocio con Telefono"
  -> All features available (same as Level 0)
  -> Auto-assigned when phone field is populated
```

### Deferred to Strong KYC Milestone

```
Level 2: CI (Carnet de Identidad) uploaded & approved
  Badge: "Vendedor Verificado"
  -> Requires document upload UI, private storage, admin review

Level 3: NIT certificate uploaded & approved (business only)
  Badge: "Negocio Verificado"
  -> Requires document upload UI, private storage, admin review
```

---

## Database Schema

### 1. Modify `profiles` table

```sql
ALTER TABLE profiles
  ADD COLUMN account_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'business')),
  ADD COLUMN verification_level INT NOT NULL DEFAULT 0
    CHECK (verification_level BETWEEN 0 AND 3),
  ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

### 2. New `business_profiles` table (1:0..1 with profiles)

```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,             -- URL-friendly: /negocio/[slug]
  business_description TEXT,
  business_category TEXT,
  nit TEXT,                              -- Bolivian tax ID (collected, not verified)
  business_logo_url TEXT,
  website_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_tiktok TEXT,
  social_whatsapp TEXT,
  business_hours JSONB,                  -- {"lun": "9:00-18:00", "mar": ...}
  business_address TEXT,
  business_department TEXT,
  business_city TEXT,
  is_nit_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3. Auto-verify trigger

```sql
-- Auto-set verification_level to 1 when phone is provided
CREATE TRIGGER auto_verify_phone
  BEFORE UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_on_phone();
```

> **Note:** `verification_documents` table is **deferred to Strong KYC milestone**.

---

## Implementation Phases (7 phases, down from 8)

### Phase 1: Database & Account Type (Day 1)
- [ ] Migration: add `account_type`, `verification_level`, `phone_verified` to profiles
- [ ] Migration: create `business_profiles` table with RLS
- [ ] Auto-verify trigger (phone -> Level 1)
- [ ] Update `types/database.ts` with new types
- [ ] Create validation schemas for business profiles

### Phase 2: Registration Flow (Day 1-2)
- [ ] Add account type selector to registration page (Personal / Business)
- [ ] If business: show additional fields (business name, category)
- [ ] Auto-create `business_profiles` row for business accounts
- [ ] Handle slug generation from business name (URL-friendly, unique)
- [ ] Update auth trigger to support account type from `raw_user_meta_data`

### Phase 3: Profile Edit & Trust Badge (Day 2-3)
- [ ] Account type switcher in profile settings
- [ ] Business profile edit form (business name, description, logo, hours, social links)
- [ ] Business logo upload to Supabase Storage
- [ ] Business hours editor component (day picker + time ranges)
- [ ] VerificationBadge component (descriptive badges)
- [ ] Badge auto-updates when phone is added/removed

### Phase 4: Business Storefront Page (Day 3-4)
- [ ] `/negocio/[slug]` page with business info
- [ ] Business header: logo, name, description, trust badge
- [ ] Business info sidebar: hours, location, contact, social links
- [ ] Product catalog grid (all products from this business)
- [ ] SEO: meta tags, structured data (LocalBusiness schema.org)
- [ ] Mobile-responsive layout

### Phase 5: Personal Seller Profile (Day 4)
- [ ] `/perfil/[id]` public profile page (minimal)
- [ ] Avatar, name, location, member since, rating
- [ ] Product grid
- [ ] Contact button (WhatsApp)
- [ ] Trust badge

### Phase 6: Product Cards & Search Integration (Day 4-5)
- [ ] Product cards show business badge/logo for business sellers
- [ ] Seller info on product detail page adapts to account type
- [ ] Search filter: "Solo negocios" toggle (optional)
- [ ] SellerCard component: conditional rendering for personal vs business

### Phase 7: Testing & Polish (Day 5-6)
- [ ] Playwright E2E: registration as personal, registration as business
- [ ] Playwright E2E: switch account type, edit business profile
- [ ] Playwright E2E: business storefront page, product cards with badges
- [ ] Playwright E2E: trust badge updates when phone added/removed
- [ ] Accessibility review (WCAG 2.2 AA)
- [ ] Mobile testing

---

## Trust Badges (Minimal KYC)

| Account Type | Level 0 (no phone) | Level 1 (phone provided) |
|---|---|---|
| Personal | "Nuevo Vendedor" (neutral) | "Vendedor con Telefono" (positive) |
| Business | "Nuevo Negocio" (neutral) | "Negocio con Telefono" (positive) |

---

## Future Enhancements (Not in this milestone)

**Strong KYC (next priority):**
- CI/NIT document upload UI and private storage
- SMS OTP phone verification
- Feature gating by verification level
- `/profile/verificacion` page
- Admin panel for document review
- "Vendedor Verificado" / "Negocio Verificado" badges

**Other:**
- Premium tier with analytics, promoted listings, bulk upload
- Automated NIT validation via IMPUESTOS API
- CI verification via facial recognition
- Business analytics dashboard
- Subscription management

---

## Success Criteria

- [ ] Users can register as personal or business
- [ ] Business accounts have a storefront page at `/negocio/[slug]`
- [ ] Product cards show business badge for business sellers
- [ ] Account type is switchable in profile settings
- [ ] Trust badges displayed on profiles and product cards
- [ ] Badge auto-updates when phone is provided (Level 0 -> 1)
- [ ] No feature gating - all users can publish and contact
- [ ] Mobile-responsive for all new pages
- [ ] WCAG 2.2 AA compliance

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_add_account_types.sql` | account_type, business_profiles, auto-verify trigger |
| `lib/validations/business-profile.ts` | Zod schema for business profile |
| `app/negocio/[slug]/page.tsx` | Business storefront page |
| `app/perfil/[id]/page.tsx` | Public personal seller profile |
| `components/profile/AccountTypeSelector.tsx` | Personal/Business toggle |
| `components/profile/BusinessProfileForm.tsx` | Business profile edit form |
| `components/profile/BusinessHoursEditor.tsx` | Business hours component |
| `components/ui/VerificationBadge.tsx` | Descriptive trust badge |
| `components/business/BusinessHeader.tsx` | Storefront header |
| `components/business/BusinessInfoSidebar.tsx` | Hours, contact, social |

### Modified Files

| File | Changes |
|------|---------|
| `app/(auth)/register/page.tsx` | Add account type selection step |
| `app/profile/edit/page.tsx` | Add business profile fields, account type switch, badge display |
| `components/products/ProductCard.tsx` | Show business badge |
| `components/products/SellerCard.tsx` | Adapt to personal vs business |
| `types/database.ts` | Regenerate with new tables |
| `lib/validations/profile.ts` | Add account_type field |
