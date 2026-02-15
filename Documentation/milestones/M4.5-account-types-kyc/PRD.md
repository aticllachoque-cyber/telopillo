# PRD - Milestone 4.5: Account Types & Minimal KYC

**Version:** 2.0  
**Date:** February 15, 2026  
**Author:** Alcides Cardenas  
**Status:** In Implementation (post-refactor)  
**Milestone Duration:** 4-6 working days  
**Priority:** P0 (Critical - Blocking for marketplace trust & quality)  
**KYC Scope:** Minimal (Strong KYC deferred to future milestone)

> **REFACTOR NOTICE (v2.0):** The original PRD described mutually exclusive account types (personal OR business) with a switching mechanism. Following PM review, this was refactored to a **"business as add-on"** model:
> - All users are personal by default
> - Business profile is an optional add-on (not a switch)
> - Source of truth: `business_profiles` row existence, not `account_type` column
> - Registration is a single form with optional business section
> - No `AccountTypeSelector` component; no account type switcher in profile edit
> - Sections marked **(REFACTORED)** reflect the new architecture

---

## 1. Executive Summary

This milestone introduces a **business-as-add-on** model with a **minimal KYC** (Know Your Customer) verification system for Telopillo.bo. All users start as personal accounts and can optionally add a business profile at any time - during registration or later. This gives businesses a dedicated storefront presence and establishes a lightweight trust framework based on email and phone collection.

**Success means:** Users register with a simple single form (optionally adding a business), businesses get a rich storefront page, descriptive trust badges ("Nuevo Vendedor", "Vendedor con Telefono") appear on profiles and product cards - all with zero onboarding friction and zero external service costs.

> **Note:** This milestone implements **Minimal KYC** only. Strong KYC (document upload, CI/NIT verification, admin review, feature gating) is deferred to a future milestone. The database schema includes a `verification_level` column (0-3) to support future expansion without migration.

---

## 2. Problem Statement

### 2.1 Current State
- All users have the same profile type (flat `profiles` table)
- No distinction between individual sellers and established businesses
- No identity verification beyond email confirmation
- No trust signals (badges, verification levels) for buyers to evaluate sellers
- Businesses cannot showcase their brand, hours, or contact information
- No legal compliance framework for Bolivia's Ley 453 (consumer protection)
- No foundation for future premium features or monetization

### 2.2 Desired State (REFACTORED)
- All users start as personal accounts with a clean, minimal seller profile (`/perfil/[id]`)
- Any user can optionally add a business profile to get a full storefront (`/negocio/[slug]`)
- Business profile is an add-on, not a mutually exclusive type switch
- Registration is a single form with an optional "I want a business" expandable section
- Minimal KYC: descriptive trust badges based on email + phone collection
- Trust badges ("Nuevo Vendedor", "Vendedor con Telefono") appear on profiles and product cards
- No feature gating - badges are informational only, everyone can publish and contact
- All features are free (premium tier deferred to future milestone)
- Database schema ready for future Strong KYC expansion (verification_level 0-3)

---

## 3. Goals & Objectives

### 3.1 Primary Goals
1. **Account Differentiation**: Clear separation between personal and business users
2. **Business Presence**: Rich storefront pages that give businesses a professional online presence
3. **Minimal Trust Framework**: Descriptive badges based on email + phone (no document upload)
4. **Zero Friction Onboarding**: No extra steps - phone collection happens in profile, not registration
5. **Future-Proof Schema**: `verification_level` column (0-3) ready for Strong KYC without migration
6. **Monetization Foundation**: Account type system enables future premium features

### 3.2 Success Metrics
- [ ] Users can register as personal or business account
- [ ] Business accounts have a storefront page at `/negocio/[slug]`
- [ ] Personal accounts have a public profile at `/perfil/[id]`
- [ ] Product cards show business badge/logo for business sellers
- [ ] Account type is switchable in profile settings
- [ ] Descriptive trust badges displayed on profiles and product cards
- [ ] Verification level auto-assigned: Level 0 (email), Level 1 (phone provided)
- [ ] No feature gating - all capabilities available to all users
- [ ] All new pages are mobile-responsive (375px+)
- [ ] WCAG 2.2 AA compliance on all new components

### 3.3 Key Performance Indicators (KPIs)
- Account type selection completion rate: >90%
- Business profile completion rate: >60% (of business accounts)
- Business storefront page engagement: >2 products viewed per visit
- Phone number collection rate: >50% (of active sellers)
- Account type switch rate: <10% (indicates good initial guidance)
- Mobile usability score: >90 (Lighthouse)

---

## 4. Scope

### 4.1 In Scope

#### 4.1.1 Account Types (REFACTORED - Business as Add-on)

**Personal Profile (All Users)**
- Default and permanent base for all users
- Minimal public profile (`/perfil/[id]`)
- Can browse, favorite, search, contact sellers, and publish products
- Displays: avatar, name, location, member since, rating, verification badge
- Descriptive badge: "Nuevo Vendedor" (no phone) or "Vendedor con Telefono" (phone provided)
- Future (Strong KYC): "Vendedor Verificado" badge (Level 2+ with CI)

**Business Profile (Optional Add-on)**
- Any user can create a business profile at any time (registration or profile edit)
- Adds a full storefront page (`/negocio/[slug]`) on top of the personal profile
- Business profile includes:
  - Business name, logo, and description
  - Business hours display
  - Social media links (Facebook, Instagram, TikTok, WhatsApp)
  - Website URL
  - Business address and location
  - NIT (Bolivian tax ID) - collected but not verified in Minimal KYC
- Descriptive badge changes to: "Nuevo Negocio" (no phone) or "Negocio con Telefono" (phone provided)
- Future (Strong KYC): "Negocio Verificado" badge (Level 3+ with NIT verified)
- SEO-optimized storefront with Schema.org LocalBusiness structured data

**No Account Switching**
- There is no account type switching mechanism
- Users create a business profile as an add-on; it does not replace their personal profile
- Once created, the business profile persists indefinitely
- Source of truth: `business_profiles` row existence, not `profiles.account_type`

#### 4.1.2 Minimal KYC Verification

The Minimal KYC system provides trust signals without adding onboarding friction or external service costs. **No feature gating** - badges are purely informational.

```
Level 0: Email Verified (auto on registration via Supabase Auth)
  Badge: "Nuevo Vendedor" (personal) / "Nuevo Negocio" (business)
  Capabilities: ALL features available (no gating)
  
Level 1: Phone Number Provided (user fills phone in profile)
  Badge: "Vendedor con Telefono" (personal) / "Negocio con Telefono" (business)
  Capabilities: ALL features available (no gating)
  How: Auto-assigned when profiles.phone is not null
  
Level 2: CI Verified (DEFERRED to Strong KYC milestone)
  Badge: "Vendedor Verificado"
  
Level 3: NIT Verified (DEFERRED to Strong KYC milestone)
  Badge: "Negocio Verificado"
```

**Minimal KYC Design Decisions:**
- **Phone collection only**: phone number is collected in profile form, NOT verified via SMS/OTP
- **Auto Level 1**: `verification_level` set to 1 automatically when `phone` field is populated
- **No feature gating**: all users can browse, search, publish, contact sellers regardless of level
- **Badges are informational only**: they indicate trust signals, not permissions
- **No document upload UI**: deferred entirely to Strong KYC milestone
- **No `verification_documents` table**: deferred entirely to Strong KYC milestone
- **No `verification-documents` storage bucket**: deferred entirely
- **Zero external costs**: no SMS provider, no verification APIs
- **Schema ready for expansion**: `verification_level` column supports 0-3 without future migration

**Strong KYC (Future Milestone) will add:**
- Real phone verification via SMS OTP (Twilio/Supabase Phone Auth)
- CI (Carnet de Identidad) document upload + admin review
- NIT certificate upload + admin review
- `verification_documents` table and private storage bucket
- Feature gating (e.g., require Level 2 to publish)
- Admin panel for document review
- "Pendiente de Verificacion" badge state

#### 4.1.3 Database Schema Changes

**Modify `profiles` table** (3 new columns)

```sql
ALTER TABLE profiles
  ADD COLUMN account_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'business')),
  ADD COLUMN verification_level INT NOT NULL DEFAULT 0
    CHECK (verification_level BETWEEN 0 AND 3),
  ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `account_type` | TEXT | `'personal'` | `'personal'` or `'business'` |
| `verification_level` | INT | `0` | 0-3, progressive KYC level |
| `phone_verified` | BOOLEAN | `FALSE` | Phone verification status |

**New `business_profiles` table** (1:0..1 relationship with `profiles`)

```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_description TEXT,
  business_category TEXT,
  nit TEXT,
  business_logo_url TEXT,
  website_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_tiktok TEXT,
  social_whatsapp TEXT,
  business_hours JSONB,
  business_address TEXT,
  business_department TEXT,
  business_city TEXT,
  is_nit_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK -> profiles(id) | Same as user's profile ID |
| `business_name` | TEXT | NOT NULL | Display name for the business |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-friendly identifier: `/negocio/[slug]` |
| `business_description` | TEXT | - | About the business (max 500 chars) |
| `business_category` | TEXT | - | Business sector (e.g., "Tecnologia", "Ropa") |
| `nit` | TEXT | - | Bolivian tax ID (optional until Level 3) |
| `business_logo_url` | TEXT | - | URL to logo in Supabase Storage |
| `website_url` | TEXT | - | Business website |
| `social_facebook` | TEXT | - | Facebook page URL |
| `social_instagram` | TEXT | - | Instagram handle |
| `social_tiktok` | TEXT | - | TikTok handle |
| `social_whatsapp` | TEXT | - | WhatsApp business number |
| `business_hours` | JSONB | - | `{"lun":"9:00-18:00","mar":"9:00-18:00",...}` |
| `business_address` | TEXT | - | Street address |
| `business_department` | TEXT | - | Department (e.g., "Santa Cruz") |
| `business_city` | TEXT | - | City (e.g., "Santa Cruz de la Sierra") |
| `is_nit_verified` | BOOLEAN | DEFAULT FALSE | NIT document approved by admin |

> **Note:** `verification_documents` table and `verification-documents` storage bucket are **deferred to Strong KYC milestone**.

**Storage Buckets**

| Bucket | Access | Purpose |
|--------|--------|---------|
| `business-logos` | Public | Business logo images (resized on upload) |

**Row Level Security (RLS)**

```sql
-- business_profiles: anyone can view, owner can insert/update/delete
CREATE POLICY "view_business_profiles" ON business_profiles
  FOR SELECT USING (true);
CREATE POLICY "manage_own_business_profile" ON business_profiles
  FOR ALL USING (auth.uid() = id);
```

**Indexes**

```sql
CREATE UNIQUE INDEX idx_business_profiles_slug ON business_profiles(slug);
CREATE INDEX idx_profiles_account_type ON profiles(account_type);
```

**Auto Verification Level Trigger**

When a user updates their phone number, `verification_level` is automatically set to 1:

```sql
CREATE OR REPLACE FUNCTION update_verification_on_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND OLD.verification_level < 1 THEN
    NEW.verification_level := 1;
    NEW.phone_verified := TRUE;
  END IF;
  IF (NEW.phone IS NULL OR NEW.phone = '') AND OLD.verification_level = 1 THEN
    NEW.verification_level := 0;
    NEW.phone_verified := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_verify_phone
  BEFORE UPDATE OF phone ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_on_phone();
```

#### 4.1.4 Frontend Pages & Components

**New Pages**

| Page | Route | Description |
|------|-------|-------------|
| Business Storefront | `/negocio/[slug]` | Public storefront with business info + product catalog |
| Personal Profile | `/perfil/[id]` | Public minimal seller profile with products |

**New Components (REFACTORED)**

| Component | Path | Description |
|-----------|------|-------------|
| ~~`AccountTypeSelector`~~ | ~~`components/profile/AccountTypeSelector.tsx`~~ | **DELETED** - Not needed in add-on model |
| `BusinessProfileForm` | `components/profile/BusinessProfileForm.tsx` | Business profile edit form (available to all users) |
| `BusinessHoursEditor` | `components/profile/BusinessHoursEditor.tsx` | Day-by-day hours picker |
| `VerificationBadge` | `components/ui/VerificationBadge.tsx` | Reusable badge (`hasBusinessProfile` + level) |
| `BusinessHeader` | `components/business/BusinessHeader.tsx` | Storefront header (logo, name, badge) |
| `BusinessInfoSidebar` | `components/business/BusinessInfoSidebar.tsx` | Hours, contact, social links |

**Modified Pages (REFACTORED)**

| Page | Route | Changes |
|------|-------|---------|
| Registration | `/register` | Single form with optional business expand section |
| Profile Edit | `/profile/edit` | Business profile CTA or form (available to all users) |

**Modified Components**

| Component | Changes |
|-----------|---------|
| `ProductCard` | Show business badge/mini logo for business sellers |
| `SellerCard` | Adapt layout for personal vs business sellers |

#### 4.1.5 User Flows (REFACTORED)

**Registration Flow (Single Form)**
```
1. User visits /register
2. Single form: Name, Email, Password, Confirm Password
3. Optional: User expands "También quiero crear un negocio" section
   -> Fills Business Name, Business Category
4. Supabase creates auth.users record with metadata:
   { full_name: '...', business_name?: '...', business_category?: '...' }
5. handle_new_user() trigger:
   a. ALWAYS creates profiles record with account_type='personal'
   b. IF business_name in metadata: creates business_profiles record with generated slug
6. Verification email sent
7. User redirected to /profile/edit
8. User fills location, avatar (optional), business details if applicable
9. Redirected to home page
```

**Business Profile Creation (from Profile Edit)**
```
1. User navigates to /profile/edit
2. Sees "¿Tienes un negocio?" CTA card (if no business profile exists)
3. Clicks "Crear Perfil de Negocio"
4. business_profiles row created with generated slug
5. BusinessProfileForm appears in edit mode
6. User fills business details (name, logo, hours, social - all optional except name)
7. Success toast notification
```

**Minimal KYC Flow (Phone Collection)**
```
1. User navigates to /profile/edit
2. Sees phone field (already exists in profile form)
3. Fills in phone number
4. On save: database trigger auto-sets verification_level = 1, phone_verified = true
5. Badge updates from "Nuevo Vendedor" to "Vendedor con Telefono"
6. Badge appears on their profile page and product cards
```

> **Note:** Verification Flows for Level 2 (CI upload) and Level 3 (NIT upload) are **deferred to Strong KYC milestone**. No `/profile/verificacion` page is built in this milestone.

#### 4.1.6 Slug Generation

Business storefronts use URL-friendly slugs for SEO and shareability.

**Algorithm:**
```
1. Take business_name input
2. Normalize: lowercase, trim whitespace
3. Transliterate: replace accented chars (a -> a, n -> n)
4. Replace non-alphanumeric with hyphens
5. Remove consecutive hyphens
6. Trim leading/trailing hyphens
7. Check uniqueness in business_profiles table
8. If collision: append random 4-char suffix (e.g., "techstore-a3b2")
```

**Examples:**
- "TechStore Bolivia" -> `techstore-bolivia`
- "La Casa del Celular" -> `la-casa-del-celular`
- "Maria's Boutique" -> `marias-boutique`
- Collision: "TechStore" (already exists) -> `techstore-x9k4`

#### 4.1.7 Validation Schemas

**Business Profile Schema (Zod)**
```typescript
import { z } from 'zod'

export const businessProfileSchema = z.object({
  business_name: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be at most 100 characters'),
  business_description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  business_category: z.string().optional().nullable(),
  nit: z.string()
    .regex(/^\d{1,15}$/, 'NIT must contain only digits')
    .optional()
    .nullable(),
  website_url: z.string().url('Must be a valid URL').optional().nullable(),
  social_facebook: z.string().url().optional().nullable(),
  social_instagram: z.string().max(50).optional().nullable(),
  social_tiktok: z.string().max(50).optional().nullable(),
  social_whatsapp: z.string()
    .regex(/^\+?[0-9\s-]{7,15}$/, 'Must be a valid phone number')
    .optional()
    .nullable(),
  business_hours: z.record(z.string()).optional().nullable(),
  business_address: z.string().max(200).optional().nullable(),
  business_department: z.string().optional().nullable(),
  business_city: z.string().optional().nullable(),
})

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>
```

**Updated Profile Schema (REFACTORED)**
```typescript
// account_type removed - no longer part of profile form
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  location_department: z.string().min(1, 'Select a department'),
  location_city: z.string().min(1, 'Select a city'),
})
```

#### 4.1.8 SEO & Structured Data

**Business Storefront Meta Tags**
```html
<title>{businessName} - Telopillo.bo</title>
<meta name="description" content="{businessDescription}" />
<meta property="og:title" content="{businessName} - Telopillo.bo" />
<meta property="og:description" content="{businessDescription}" />
<meta property="og:image" content="{businessLogoUrl}" />
<meta property="og:type" content="business.business" />
<link rel="canonical" href="https://telopillo.bo/negocio/{slug}" />
```

**Schema.org LocalBusiness (JSON-LD)**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{businessName}",
  "description": "{businessDescription}",
  "image": "{businessLogoUrl}",
  "url": "https://telopillo.bo/negocio/{slug}",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{businessCity}",
    "addressRegion": "{businessDepartment}",
    "addressCountry": "BO"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Monday",
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "sameAs": [
    "{socialFacebook}",
    "{socialInstagram}"
  ]
}
```

### 4.2 Out of Scope

The following are explicitly **not** part of this milestone:

| Feature | Reason | Future Milestone |
|---------|--------|-----------------|
| **Strong KYC: CI/NIT document upload** | Requires document upload UI, private storage, admin review | Strong KYC milestone |
| **Strong KYC: SMS/OTP phone verification** | Requires external provider (Twilio), costs ~$0.05/user | Strong KYC milestone |
| **Strong KYC: `verification_documents` table** | No document upload in Minimal KYC | Strong KYC milestone |
| **Strong KYC: `/profile/verificacion` page** | No document upload in Minimal KYC | Strong KYC milestone |
| **Strong KYC: Feature gating by verification level** | All features available to all users in Minimal KYC | Strong KYC milestone |
| **Strong KYC: "Pendiente de Verificacion" badge state** | No pending review state without document upload | Strong KYC milestone |
| Admin panel for document review | Requires admin dashboard infrastructure | M6+ |
| Automated NIT validation (IMPUESTOS API) | External API integration, regulatory | M8+ |
| Automated CI verification (facial recognition) | ML infrastructure required | M8+ |
| Premium subscription tiers | Monetization deferred per business decision | M7+ |
| Business analytics dashboard | Requires data pipeline | M7+ |
| Bulk product upload | Feature scoped to business premium | M7+ |
| Promoted/featured listings | Monetization feature | M7+ |
| Payment processing | Not needed for verification | M6+ |

---

## 5. User Stories

### 5.1 Account Type Selection

**US-4.5.1** (REFACTORED): As a new user, I want to register quickly and optionally add a business profile, so that I can start using the marketplace without friction.

**Acceptance Criteria:**
- [ ] Registration page is a single form: name, email, password, confirm password
- [ ] Optional expandable section: "También quiero crear un negocio" with business name and category
- [ ] Expanding the business section does not force a multi-step flow
- [ ] Touch targets >= 44px on mobile
- [ ] Business fields validation: name required (min 2 chars) if section is expanded

**US-4.5.2** (REFACTORED): As an existing user, I want to create a business profile from my profile settings, so that I can have a storefront.

**Acceptance Criteria:**
- [ ] "¿Tienes un negocio?" CTA visible in `/profile/edit` (if no business profile exists)
- [ ] Clicking "Crear Perfil de Negocio" creates a `business_profiles` row with auto-generated slug
- [ ] BusinessProfileForm appears in edit mode after creation
- [ ] Success notification shown
- [ ] VerificationBadge updates to reflect business profile

**US-4.5.3** (REFACTORED): ~~As a business user, I want to switch back to personal~~ **REMOVED** - No switching mechanism in the add-on model. Business profiles, once created, persist.

### 5.2 Business Profile

**US-4.5.4**: As a business owner, I want to fill in my business details (name, description, hours, social links), so that customers can find and trust my business.

**Acceptance Criteria:**
- [ ] Business profile form accessible from `/profile/edit`
- [ ] Fields: business name, description, category, NIT (optional), website
- [ ] Social links: Facebook, Instagram, TikTok, WhatsApp
- [ ] Business hours editor: day-by-day toggle with open/close times
- [ ] Business logo upload (max 5MB, JPG/PNG/WebP, auto-resized)
- [ ] Location: department + city selectors (reuse existing LocationSelector)
- [ ] Form validation with clear error messages
- [ ] Auto-save or explicit save button with loading state

**US-4.5.5**: As a business owner, I want my storefront to be accessible at a clean URL like `/negocio/mi-tienda`, so that I can share it on social media and business cards.

**Acceptance Criteria:**
- [ ] Storefront URL: `/negocio/{slug}` where slug is derived from business name
- [ ] Slug is URL-friendly (lowercase, hyphens, no special chars)
- [ ] Slug is unique; collisions resolved with random suffix
- [ ] Page loads with SSR for SEO
- [ ] Schema.org LocalBusiness JSON-LD included
- [ ] Open Graph meta tags for social sharing

### 5.3 Storefront & Profile Pages

**US-4.5.6**: As a buyer, I want to visit a business storefront and see their info, products, and hours, so that I can decide if I want to buy from them.

**Acceptance Criteria:**
- [ ] Business header: logo, name, description, verification badge
- [ ] Info sidebar: business hours (today highlighted), location, contact, social links
- [ ] WhatsApp button links to business WhatsApp
- [ ] Product grid showing all products from this business
- [ ] Product count displayed
- [ ] Mobile-responsive layout (sidebar below header on mobile)
- [ ] Page loads in < 3 seconds

**US-4.5.7**: As a buyer, I want to see a personal seller's profile with their products and rating, so that I can evaluate their trustworthiness.

**Acceptance Criteria:**
- [ ] Personal profile page at `/perfil/{id}`
- [ ] Shows: avatar, name, location, member since, rating (stars + count)
- [ ] Descriptive badge: "Nuevo Vendedor" (Level 0) or "Vendedor con Telefono" (Level 1)
- [ ] Product grid showing all products from this seller
- [ ] WhatsApp contact button (if phone available)
- [ ] If user is a business account: show link to their storefront
- [ ] Mobile-responsive

### 5.4 Product Cards & Search

**US-4.5.8**: As a buyer browsing products, I want to see which products come from verified businesses, so that I can make informed purchasing decisions.

**Acceptance Criteria:**
- [ ] Product cards for business sellers show mini business badge (small icon + business name)
- [ ] Product cards for personal sellers show seller name (existing behavior)
- [ ] Badge is visually distinct but not overwhelming
- [ ] Clicking business name on card navigates to storefront

**US-4.5.9**: As a buyer, I want to filter search results to show only products from businesses (optional), so that I can find professional sellers.

**Acceptance Criteria:**
- [ ] Optional toggle/filter: "Only from businesses" in search filters
- [ ] Filter updates search results via `seller_type=business` parameter
- [ ] Product count updates to reflect filter
- [ ] Filter state preserved in URL query params

### 5.5 Minimal KYC / Trust Badges

**US-4.5.10** (REFACTORED): As a seller, I want to see a trust badge on my profile that reflects my verification status, so that buyers can see I'm trustworthy.

**Acceptance Criteria:**
- [ ] Badge displayed on profile page and product cards
- [ ] Users without business profile: "Nuevo Vendedor" (Level 0) or "Vendedor con Telefono" (Level 1)
- [ ] Users with business profile: "Nuevo Negocio" (Level 0) or "Negocio con Telefono" (Level 1)
- [ ] Badge auto-updates when user adds/removes phone number
- [ ] Badge is visually clear: icon + text, not color-only
- [ ] Tooltip explains what the badge means
- [ ] Badge uses `hasBusinessProfile` boolean prop (not `accountType`)

**US-4.5.11**: As a seller, I want my trust badge to automatically upgrade when I provide my phone number, without extra steps.

**Acceptance Criteria:**
- [ ] When user saves profile with phone number, `verification_level` auto-updates to 1
- [ ] Badge changes from "Nuevo Vendedor" to "Vendedor con Telefono" immediately
- [ ] If user removes phone number, badge reverts to "Nuevo Vendedor"
- [ ] No separate verification page needed (phone is in existing profile form)

> **Note:** User stories for document upload (CI, NIT) are deferred to the Strong KYC milestone.

---

## 6. UI/UX Design

### 6.1 Registration: Account Type Selection

```
+----------------------------------------------+
|  How do you want to use Telopillo?           |
|                                              |
|  +-------------+  +---------------------+   |
|  |  Personal   |  |  Business           |   |
|  |             |  |                     |   |
|  |  Buy and    |  |  Create your online |   |
|  |  sell your  |  |  store and reach    |   |
|  |  stuff      |  |  more customers     |   |
|  |             |  |                     |   |
|  |  [Select]   |  |  [Select]           |   |
|  +-------------+  +---------------------+   |
|                                              |
|  You can change your account type anytime    |
+----------------------------------------------+
```

**Design Notes:**
- Cards use the existing design system (Tailwind + shadcn/ui)
- Selected card has primary color border + checkmark icon
- Unselected card has neutral border
- Mobile: cards stack vertically (full width)
- Desktop: cards side by side (50% width each)

### 6.2 Business Storefront Header

```
+----------------------------------------------------+
|  [Logo]  TechStore Bolivia  (Verified Business)    |
|          Sales of technology and accessories        |
|          Location: La Paz, Bolivia                  |
|          Hours: Mon-Fri 9:00-18:00, Sat 9:00-13:00 |
|                                                    |
|  [WhatsApp]  [Facebook]  [Instagram]  [Website]    |
+----------------------------------------------------+
|  Products (24)                                     |
|  +------+ +------+ +------+ +------+              |
|  |      | |      | |      | |      |              |
|  +------+ +------+ +------+ +------+              |
+----------------------------------------------------+
```

**Design Notes:**
- Header uses a hero-like layout with logo on left, info on right
- Social links use recognizable icons (lucide-react)
- Product grid reuses existing `ProductGrid` component
- Mobile: logo centered above text, social links wrap

### 6.3 Product Card with Business Badge

```
+------------------+
|  [Product Image] |
|                  |
|  iPhone 13 Pro   |
|  Bs 4,500        |
|  [store] TechStore  <-- mini business badge with logo
|  Location: La Paz|
+------------------+
```

### 6.4 Trust Badge Display (in Profile)

```
+------------------------------------------+
|  Your Trust Level                        |
|                                          |
|  [Vendedor con Telefono]  (green badge)  |
|                                          |
|  [x] Email verified                     |
|  [x] Phone number provided              |
|                                          |
|  Want to increase your trust level?      |
|  Full verification coming soon!          |
+------------------------------------------+
```

**Design Notes:**
- Badge is shown in the profile edit page sidebar or header
- Simple display - no complex progress bar (only 2 levels for now)
- Teaser text about future verification to set expectations

---

## 7. Technical Design

### 7.1 Auth Trigger Update (REFACTORED)

The `handle_new_user()` trigger always creates a personal profile. If `business_name` is in metadata, it also creates a `business_profiles` row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_name TEXT;
  v_business_category TEXT;
  v_slug TEXT;
BEGIN
  -- Always create profile as personal
  INSERT INTO public.profiles (id, full_name, is_verified, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email_confirmed_at IS NOT NULL,
    'personal'
  );

  -- Optionally create business_profiles if business_name provided in metadata
  v_business_name := NEW.raw_user_meta_data->>'business_name';
  v_business_category := NEW.raw_user_meta_data->>'business_category';

  v_business_name := trim(v_business_name);

  IF v_business_name IS NOT NULL AND v_business_name != '' THEN
    v_slug := public.generate_slug(v_business_name);

    INSERT INTO public.business_profiles (id, business_name, slug, business_category)
    VALUES (NEW.id, v_business_name, v_slug, v_business_category);
  END IF;

  RETURN NEW;
END;
$$;
```

### 7.2 Slug Generation Function

```sql
CREATE OR REPLACE FUNCTION generate_slug(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug TEXT;
  v_suffix TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Normalize: lowercase, replace non-alphanumeric with hyphens
  v_slug := lower(trim(input));
  v_slug := translate(v_slug, 'aeiounAEIOUN', 'aeiounAEIOUN');
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  v_slug := regexp_replace(v_slug, '^-|-$', '', 'g');
  
  -- Check uniqueness
  SELECT EXISTS(
    SELECT 1 FROM business_profiles WHERE slug = v_slug
  ) INTO v_exists;
  
  IF v_exists THEN
    v_suffix := substr(md5(random()::text), 1, 4);
    v_slug := v_slug || '-' || v_suffix;
  END IF;
  
  RETURN v_slug;
END;
$$;
```

### 7.3 Updated Search RPC

The `search_products_semantic` (and keyword search) RPC must be updated to JOIN `profiles` and `business_profiles`:

```sql
-- In the product result, include:
p.user_id,
prof.full_name AS seller_name,
prof.account_type AS seller_account_type,
prof.verification_level AS seller_verification_level,
bp.business_name AS seller_business_name,
bp.slug AS seller_business_slug,
bp.business_logo_url AS seller_business_logo
```

### 7.4 Image Processing

Business logos follow the same pattern as avatar uploads:
- Max size: 5MB
- Accepted formats: JPG, PNG, WebP
- Auto-resize to 400x400px max (maintain aspect ratio)
- Stored in `business-logos` bucket
- Path: `{user_id}/logo.{ext}`

> **Note:** Verification document image processing is deferred to Strong KYC milestone.

---

## 8. Accessibility Requirements (WCAG 2.2 AA)

### 8.1 Account Type Selector
- Cards are keyboard navigable (Tab, Enter/Space to select)
- Selected state announced via `aria-selected` and `role="radio"`
- Group has `role="radiogroup"` with `aria-label`
- Focus ring visible on keyboard focus
- Color is not the only indicator of selection (checkmark icon + border)

### 8.2 Business Hours Editor
- Day toggles are keyboard accessible
- Time inputs use native `<input type="time">` for screen reader support
- "Closed" toggle has descriptive `aria-label`
- Error messages associated via `aria-describedby`

### 8.3 Verification Badge
- Badge text readable by screen readers
- Not conveyed by color alone (includes text + icon)
- Tooltip/title attribute with full description

### 8.4 General
- All interactive elements have visible focus indicators
- Touch targets >= 44x44px on mobile
- Color contrast ratio >= 4.5:1 for normal text, >= 3:1 for large text
- Form errors associated with inputs via `aria-describedby`
- Page structure uses semantic HTML (`<main>`, `<nav>`, `<section>`, `<h1>`-`<h6>`)

---

## 9. Legal & Compliance Considerations

### 9.1 Bolivia - Ley 453 (Consumer Protection)
- Seller identity information must be available to buyers
- Business sellers should display NIT when verified
- Product listings must be associated with identifiable sellers
- The verification system supports progressive compliance

### 9.2 Data Privacy (Minimal KYC)
- Only email and phone number are collected (standard profile data)
- No sensitive identity documents stored in this milestone
- Business logos are stored in a public bucket (intentional - they are display assets)
- Phone numbers are visible only to the profile owner (not exposed in public API responses)

### 9.3 Document Types (Deferred to Strong KYC)

The following document types will be defined in the Strong KYC milestone:

| Document | Purpose | Required For |
|----------|---------|-------------|
| CI Front | Identity verification | Level 2 |
| CI Back | Identity verification | Level 2 |
| Selfie with CI | Liveness check | Level 2 |
| NIT Certificate | Business tax registration | Level 3 |
| FUNDEMPRESA | Business registration (optional) | Level 3 (optional) |
| Address Proof | Business location verification (optional) | Level 3 (optional) |

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Slug collision (same business name) | Medium | Low | Auto-append random 4-char suffix on collision |
| Complex business hours UI | Medium | Medium | Start with simple text input, upgrade to picker if needed |
| Large logo uploads slowing pages | Low | Medium | Auto-resize/compress on upload (same as avatars) |
| Users provide fake phone numbers | High | Low | Minimal KYC - badges are informational only, no feature gating. Strong KYC will add SMS OTP |
| Migration on existing users | Low | Low | Default all existing to personal/level 0 (non-breaking) |
| Users confused by badge meanings | Medium | Low | Clear tooltip on badge explaining what it means |
| Slug guessing / enumeration | Low | Low | Slugs are public (same as product URLs); no sensitive data exposed |

---

## 11. Implementation Phases

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|-------------|
| 1 | Database Schema & Types (incl. auto-verify trigger) | Day 1 (2-3h) | None |
| 2 | Registration Flow | Day 1-2 (3-4h) | Phase 1 |
| 3 | Profile Edit & Account Switching (incl. badge display) | Day 2-3 (4-5h) | Phase 1 |
| 4 | Business Storefront Page | Day 3-4 (4-5h) | Phase 1, 3 |
| 5 | Personal Seller Profile | Day 4 (2-3h) | Phase 1 |
| 6 | Product Cards & Search Integration | Day 4-5 (3-4h) | Phase 1, 4, 5 |
| 7 | Testing & Polish | Day 5-6 (3-4h) | All phases |

**Total Estimated Effort:** 21-28 hours across 4-6 days

> **Note:** Phase 7 (Verification Documents UI) from the original plan has been removed. Document upload is deferred to Strong KYC milestone, saving ~3-4 hours.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed task breakdown per phase.

---

## 12. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_add_account_types.sql` | Schema: account_type, business_profiles, RLS, indexes, auto-verify trigger |
| `lib/validations/business-profile.ts` | Zod schema for business profile |
| `app/negocio/[slug]/page.tsx` | Business storefront page (SSR) |
| `app/perfil/[id]/page.tsx` | Public personal seller profile |
| ~~`components/profile/AccountTypeSelector.tsx`~~ | **DELETED** - Not needed in add-on model |
| `components/profile/BusinessProfileForm.tsx` | Business profile edit form |
| `components/profile/BusinessHoursEditor.tsx` | Day-by-day hours picker |
| `components/business/BusinessHeader.tsx` | Storefront header component |
| `components/business/BusinessInfoSidebar.tsx` | Hours, contact, social sidebar |
| `components/ui/VerificationBadge.tsx` | Reusable descriptive badge ("Nuevo Vendedor", "Vendedor con Telefono") |
| `tests/m4.5-account-types-e2e.spec.ts` | Playwright E2E tests |

### Modified Files

| File | Changes |
|------|---------|
| `supabase/migrations/20260213111133_create_profiles_table.sql` | Reference only (no change; new migration adds columns) |
| `app/(auth)/register/page.tsx` | Single form with optional business expand, pass metadata to signUp |
| `app/profile/edit/page.tsx` | Business profile CTA or form (available to all users) |
| `components/products/ProductCard.tsx` | Show business badge for business sellers |
| `components/products/SellerCard.tsx` | Adapt to personal vs business |
| `types/database.ts` | Regenerate with new tables and columns |
| `lib/validations/profile.ts` | Removed `account_type` field (no longer in profile form) |
| `app/api/search/route.ts` | Include seller type in response, add filter |

---

## 13. Dependencies

### Internal Dependencies
- **M1 (Authentication & Profiles)**: Provides `profiles` table, auth system, avatar upload
- **M2 (Product Listings)**: Provides `products` table, ProductCard, ProductGrid components
- **M4 (Semantic Search)**: Provides search RPC that needs updating for seller info

### External Dependencies
- **Supabase Storage**: For business logos only (no verification documents in Minimal KYC)
- **Next.js**: SSR for storefront pages (SEO)
- **Zod**: Validation schemas
- **shadcn/ui + Tailwind**: UI components
- **lucide-react**: Icons (social media, verification badges)
- **No SMS/OTP provider needed** (phone is collected, not verified)

---

## 14. Glossary

| Term | Definition |
|------|-----------|
| CI | Carnet de Identidad - Bolivian national ID card |
| NIT | Numero de Identificacion Tributaria - Bolivian tax identification number |
| KYC | Know Your Customer - identity verification process |
| FUNDEMPRESA | Bolivian business registration entity |
| Ley 453 | Bolivian General Law of the Rights of Users and Consumers |
| RLS | Row Level Security - PostgreSQL access control at row level |
| Slug | URL-friendly text identifier (e.g., `mi-tienda-tech`) |
| Storefront | Public business page displaying business info and products |
