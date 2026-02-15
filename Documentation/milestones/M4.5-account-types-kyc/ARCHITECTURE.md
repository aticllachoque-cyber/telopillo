# M4.5 - Account Types & Minimal KYC: Architecture Document

**Version:** 2.0  
**Date:** February 15, 2026  
**Author:** Alcides Cardenas  
**Status:** Design Document (Updated post-refactor)  
**Milestone:** M4.5 - Account Types & Minimal KYC  
**KYC Scope:** Minimal (phone collection only; Strong KYC deferred)

> **ARCHITECTURE REFACTOR (v2.0):** The original design used mutually exclusive account types (personal OR business). After PM review, this was refactored to a **"business as add-on"** model:
> - All users are **personal by default**
> - Any user can **optionally create a business profile** (add-on, not a switch)
> - Source of truth for "has business" = **existence of `business_profiles` row**, not `profiles.account_type`
> - `account_type` column is retained in schema but no longer drives app logic
> - `AccountTypeSelector` component has been **deleted**
> - Registration is a **single-step form** with an optional business section
> - Profile edit shows business profile section to **all users** (create CTA or edit form)
> - `VerificationBadge` uses `hasBusinessProfile: boolean` instead of `accountType`
>
> Sections below marked with **(REFACTORED)** have been updated. Unmarked sections reflect the original design for historical reference.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Context](#2-system-context)
3. [Component Architecture](#3-component-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Database Schema Details](#5-database-schema-details)
6. [User Flows Architecture](#6-user-flows-architecture)
7. [URL Routing Architecture](#7-url-routing-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Search Integration](#9-search-integration)
10. [Trust Badge System](#10-trust-badge-system)
11. [Storage Architecture](#11-storage-architecture)
12. [Performance Considerations](#12-performance-considerations)
13. [Scalability Considerations](#13-scalability-considerations)
14. [Migration Strategy](#14-migration-strategy)
15. [Future Architecture (Strong KYC Preview)](#15-future-architecture-strong-kyc-preview)

---

## 1. Executive Summary

### 1.1 Overview

Milestone 4.5 introduces **differentiated account types** (Personal and Business) and a **minimal KYC** verification framework for Telopillo.bo. The architecture extends the existing Supabase-based BaaS platform with new database tables, triggers, storage buckets, and frontend components—all designed for zero onboarding friction and zero external service costs.

**Key architectural characteristics:**

- **Non-breaking extension:** All changes are additive; existing users default to `personal` / `verification_level 0`
- **Trigger-driven verification:** Phone collection auto-updates `verification_level` via database trigger (no application logic)
- **Slug-based storefronts:** Business profiles use URL-friendly slugs (`/negocio/[slug]`) for SEO and shareability
- **Future-proof schema:** `verification_level` (0-3) and `phone_verified` support Strong KYC without migration
- **Informational badges only:** No feature gating; all users retain full capabilities regardless of verification level

### 1.2 Key Architectural Decisions (REFACTORED)

| Decision | Rationale |
|----------|-----------|
| **Minimal KYC only** | No document upload, no SMS OTP—reduces friction and cost; Strong KYC deferred |
| **Auto Level 1 on phone** | Database trigger ensures consistency; no race conditions between app and DB |
| **Business as add-on, not switch** | Any user can optionally add a business profile; no mutually exclusive types. Reflects Bolivian market where sellers operate both personally and as businesses |
| **`business_profiles` row = source of truth** | Existence of row determines "has business", not `profiles.account_type`. Simpler logic, stable storefront URLs |
| **Slug in database, not derived** | Stored slug allows edits without URL changes; collision handling at insert time |
| **Public business-logos bucket** | Logos are display assets; no sensitive data; CDN delivery for performance |
| **Badges informational only** | No feature gating in Minimal KYC; trust signals without restricting capabilities |
| **Single-step registration** | Simpler UX; optional business fields expand on demand, no forced multi-step wizard |

### 1.3 Integration with Existing System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    M4.5 INTEGRATION POINTS                                  │
│                                                                             │
│  M0 (Infrastructure)  ──► Supabase Auth, Storage, PostgreSQL               │
│  M1 (Profiles)        ──► profiles table (extended), handle_new_user()      │
│  M2 (Products)        ──► products.user_id → profiles; ProductCard updates   │
│  M4 (Search)          ──► search_products_semantic() JOIN profiles + bp      │
│                                                                             │
│  NEW: business_profiles, account_type, verification_level, trust badges    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Context

### 2.1 M4.5 in Overall Telopillo.bo Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TELOPILLO.BO PLATFORM                                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    Frontend (Next.js 14)                               │ │
│  │                                                                        │ │
│  │  M4.5 NEW:                    M4.5 MODIFIED:                          │ │
│  │  - /negocio/[slug]            - /register (optional biz section)      │ │
│  │  - /perfil/[id]               - /profile/edit (business add-on)       │ │
│  │  - BusinessProfileForm       - ProductCard (business badge)           │ │
│  │  - VerificationBadge         - SellerCard (personal vs business)       │ │
│  │  - BusinessHeader/Sidebar    - Search filters (seller_type)           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    Supabase (BaaS)                                     │ │
│  │                                                                        │ │
│  │  M4.5 NEW:                    M4.5 MODIFIED:                          │ │
│  │  - business_profiles table     - profiles (3 new columns)              │ │
│  │  - business-logos bucket      - handle_new_user() trigger             │ │
│  │  - generate_slug()            - auto_verify_phone trigger             │ │
│  │  - RLS for business_profiles  - search RPC (seller JOINs)            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Dependencies

| Milestone | Dependency | Usage |
|-----------|------------|-------|
| **M0** | Supabase Auth, Storage, PostgreSQL | Core infrastructure |
| **M1** | `profiles` table, `handle_new_user()` | Extended with account_type, verification_level; trigger updated |
| **M2** | `products` table, ProductCard, ProductGrid | Product listings; ProductCard shows seller type |
| **M4** | `search_products_semantic()` RPC | Extended with profiles + business_profiles JOIN |

### 2.3 New Components Introduced (REFACTORED)

| Layer | Component | Purpose |
|-------|-----------|---------|
| **Database** | `business_profiles` table | Business storefront data (name, slug, logo, hours, social) |
| **Database** | `generate_slug()` function | URL-friendly slug generation with collision handling |
| **Database** | `update_verification_on_phone()` trigger | Auto Level 1 when phone provided; revert to 0 when removed |
| **Storage** | `business-logos` bucket | Business logo images (public, CDN) |
| **Frontend** | ~~`AccountTypeSelector`~~ | **DELETED** - No longer needed in add-on model |
| **Frontend** | `BusinessProfileForm` | Business details edit form (available to all users) |
| **Frontend** | `VerificationBadge` | Trust badge display using `hasBusinessProfile` boolean |
| **Frontend** | `BusinessHeader`, `BusinessInfoSidebar` | Storefront layout components (Phase 4) |

---

## 3. Component Architecture

### 3.1 Frontend Components (REFACTORED)

```
components/
├── profile/
│   ├── BusinessProfileForm.tsx    # Business name, description, hours, social
│   └── BusinessHoursEditor.tsx    # Day-by-day open/close times
│   # AccountTypeSelector.tsx - DELETED (no longer needed)
│
├── business/
│   ├── BusinessHeader.tsx         # Logo, name, description, badge, location
│   └── BusinessInfoSidebar.tsx    # Hours, contact, social links, address
│
├── ui/
│   └── VerificationBadge.tsx      # Reusable badge (hasBusinessProfile + level)
│
└── products/
    ├── ProductCard.tsx            # MODIFIED: business badge for business sellers
    └── SellerCard.tsx             # MODIFIED: personal vs business layout
```

### 3.2 Component Interaction: Registration Flow (REFACTORED)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Single Registration Form                                            │
│                                                                     │
│ - Full Name, Email, Password, Confirm Password                     │
│ - Optional: "También quiero crear un negocio" (expandable)         │
│   └─ Business Name, Business Category (when expanded)              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           │ signUp(metadata: full_name,
                           │   optionally: business_name, business_category)
                           ▼
                  ┌─────────────────────────────────────────────┐
                  │           Supabase Auth                       │
                  │  raw_user_meta_data: full_name,              │
                  │  business_name? business_category?            │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         │ on_auth_user_created
                                         ▼
                  ┌─────────────────────────────────────────────┐
                  │         handle_new_user() trigger            │
                  │  - ALWAYS INSERT profiles (personal)        │
                  │  - IF business_name: INSERT business_profiles│
                  └─────────────────────────────────────────────┘
```

### 3.3 Component Interaction: Profile Edit & Storefront (REFACTORED)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  /profile/edit                                                              │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                              │
│  │ Personal Profile │  │ VerificationBadge│                              │
│  │ Card             │  │ (hasBusinessProfile│                             │
│  │ name, phone, loc │  │  + level)         │                              │
│  └──────────────────┘  └──────────────────┘                              │
│                                                                             │
│  ┌──────────────────────────────────────────────┐                         │
│  │ Business Profile Section (visible to ALL)    │                         │
│  │                                               │                         │
│  │ IF no business_profiles row:                  │                         │
│  │   "¿Tienes un negocio?" CTA button           │                         │
│  │   → Click creates business_profiles row       │                         │
│  │                                               │                         │
│  │ IF business_profiles row exists:              │                         │
│  │   BusinessProfileForm (edit mode)             │                         │
│  │   - name, logo, hours, social, etc.           │                         │
│  └──────────────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  /negocio/[slug]                                                            │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ BusinessHeader   │  │ BusinessInfo      │  │ ProductGrid       │      │
│  │ - logo, name     │  │ Sidebar           │  │ (products by       │      │
│  │ - badge, location│  │ - hours, contact  │  │  user_id)         │      │
│  └──────────────────┘  │ - social links   │  └──────────────────┘      │
│                         └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Backend Components

```
supabase/
├── migrations/
│   └── YYYYMMDD_add_account_types.sql
│       ├── ALTER profiles (account_type, verification_level, phone_verified)
│       ├── CREATE business_profiles
│       ├── CREATE business-logos bucket
│       ├── RLS policies
│       ├── generate_slug() function
│       ├── update_verification_on_phone() trigger
│       ├── handle_new_user() update
│       └── indexes
│
└── (optional) YYYYMMDD_update_search_rpc_seller_info.sql
    └── search_products_semantic() + search_products() JOIN profiles, business_profiles
```

---

## 4. Data Architecture

### 4.1 Enhanced Entity Relationship Diagram

```
┌─────────────────────┐
│     auth.users      │ (Supabase Auth - managed)
│                     │
│ - id (UUID)         │
│ - email             │
│ - raw_user_meta_data│◄── account_type, business_name, business_category
│ - email_confirmed_at│
└──────────┬──────────┘
           │
           │ 1:1
           │
           ▼
┌─────────────────────┐
│      profiles       │  M4.5: +account_type, +verification_level, +phone_verified
│                     │
│ - id (FK)           │◄─────────────────────────────────────┐
│ - full_name         │                                      │
│ - avatar_url        │                                      │
│ - phone             │──► TRIGGER: auto verification_level   │
│ - location_city     │                                      │
│ - location_dept     │                                      │
│ - account_type      │  'personal' | 'business'             │
│ - verification_level│  0 | 1 | 2 | 3 (2,3 deferred)        │
│ - phone_verified    │  BOOLEAN                              │
│ - is_verified       │  (email confirmed)                    │
└──────────┬──────────┘                                      │
           │                                                 │
           │ 1:0..1 (business only)                           │
           │                                                 │
           ▼                                                 │
┌─────────────────────┐                                      │
│  business_profiles  │  M4.5 NEW                            │
│                     │                                      │
│ - id (PK, FK)       │──────────────────────────────────────┘
│ - business_name     │
│ - slug (UNIQUE)     │  /negocio/[slug]
│ - business_logo_url│  → business-logos bucket
│ - business_hours    │  JSONB
│ - social_*          │  Facebook, Instagram, TikTok, WhatsApp
│ - nit               │  (collected, not verified in M4.5)
│ - ...               │
└──────────┬──────────┘
           │
           │ products.user_id → profiles.id
           │
           ▼
┌─────────────────────┐
│      products      │
│ - user_id (FK)      │
│ - ...               │
└─────────────────────┘
```

### 4.2 Data Flow: Business Profile Creation (REFACTORED)

```
Creating a Business Profile (add-on, not a switch):

Option A: During Registration (optional checkbox)
┌─────────────────────────┐     ┌─────────────────────┐
│ User checks "También    │────►│ signUp with metadata │
│ quiero crear un negocio"│     │ business_name,       │
│ + fills business name   │     │ business_category    │
└─────────────────────────┘     └──────────┬──────────┘
                                            │
                                            │ handle_new_user() trigger
                                            ▼
                                  ┌─────────────────────┐
                                  │ profiles (personal)  │
                                  │ + business_profiles  │
                                  │ row auto-created     │
                                  └─────────────────────┘

Option B: From Profile Edit (any time)
┌─────────────────────────┐     ┌─────────────────────┐
│ User clicks "Crear      │────►│ INSERT business_     │
│ Perfil de Negocio" CTA  │     │ profiles             │
│                         │     │ (generate_slug)      │
└─────────────────────────┘     └──────────┬──────────┘
                                            │
                                            ▼
                                  ┌─────────────────────┐
                                  │ business_profiles   │
                                  │ row created          │
                                  │ BusinessProfileForm  │
                                  │ now shows edit mode  │
                                  └─────────────────────┘

Note: No "switching" or "deleting" business profiles. Once created, the
business profile persists. account_type column is always 'personal'.
```

### 4.3 Data Flow: Verification Level Update

```
Phone field change (profile edit):
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ User saves  │────►│ PATCH profiles     │────►│ BEFORE UPDATE       │
│ profile with│     │ SET phone='+591...' │     │ trigger fires       │
│ phone number│     └─────────────────────┘     │ update_verification │
└─────────────┘                                  │ _on_phone()         │
                                                 └──────────┬──────────┘
                                                            │
                    ┌───────────────────────────────────────┴───────────────────┐
                    │                                                             │
                    ▼                                                             ▼
         phone IS NOT NULL              phone IS NULL/empty
         AND OLD.level < 1              AND OLD.level = 1
                    │                                                             │
                    ▼                                                             ▼
         NEW.verification_level := 1    NEW.verification_level := 0
         NEW.phone_verified := TRUE    NEW.phone_verified := FALSE
                    │                                                             │
                    └───────────────────────────────────────┬───────────────────┘
                                                            │
                                                            ▼
                                                 ┌─────────────────────┐
                                                 │ Badge updates on    │
                                                 │ next page load      │
                                                 │ (VerificationBadge  │
                                                 │  reads level)       │
                                                 └─────────────────────┘
```

---

## 5. Database Schema Details

### 5.1 profiles Table Modifications

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'business')),
  ADD COLUMN IF NOT EXISTS verification_level INT NOT NULL DEFAULT 0
    CHECK (verification_level BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

| Column | Type | Default | Description |
|--------|------|---------|--------------|
| `account_type` | TEXT | `'personal'` | `'personal'` or `'business'` |
| `verification_level` | INT | `0` | 0=email only, 1=phone provided, 2=CI (deferred), 3=NIT (deferred) |
| `phone_verified` | BOOLEAN | `FALSE` | True when Level 1+ (phone in profile) |

### 5.2 business_profiles Table (Full Schema)

```sql
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- updated_at trigger
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 5.3 Indexes Strategy

```sql
-- Slug lookup (storefront page load)
CREATE UNIQUE INDEX idx_business_profiles_slug
  ON public.business_profiles(slug);

-- Filter by account type (search: seller_type=business)
CREATE INDEX idx_profiles_account_type
  ON public.profiles(account_type);

-- Optional: verification level filter (future)
CREATE INDEX idx_profiles_verification_level
  ON public.profiles(verification_level);
```

### 5.4 RLS Policies

```sql
-- business_profiles: anyone can view (public storefronts)
CREATE POLICY "view_business_profiles"
  ON public.business_profiles
  FOR SELECT
  USING (true);

-- business_profiles: owner can insert/update/delete
CREATE POLICY "manage_own_business_profile"
  ON public.business_profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 5.5 Triggers

#### Auto-Verify on Phone (update_verification_on_phone)

```sql
CREATE OR REPLACE FUNCTION public.update_verification_on_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Phone added: upgrade to Level 1
  IF NEW.phone IS NOT NULL AND trim(NEW.phone) != '' AND OLD.verification_level < 1 THEN
    NEW.verification_level := 1;
    NEW.phone_verified := TRUE;
  END IF;
  -- Phone removed: revert to Level 0
  IF (NEW.phone IS NULL OR trim(NEW.phone) = '') AND OLD.verification_level = 1 THEN
    NEW.verification_level := 0;
    NEW.phone_verified := FALSE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_verify_phone
  BEFORE UPDATE OF phone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_on_phone();
```

#### Slug Generation (generate_slug)

```sql
CREATE OR REPLACE FUNCTION public.generate_slug(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug TEXT;
  v_suffix TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Normalize: lowercase, trim
  v_slug := lower(trim(input));
  -- Transliterate accented chars (Bolivian Spanish)
  v_slug := translate(v_slug, 'áéíóúñÁÉÍÓÚÑ', 'aeiounAEIOUN');
  -- Replace non-alphanumeric with hyphens
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens, collapse consecutive
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');

  -- Check uniqueness
  SELECT EXISTS(SELECT 1 FROM public.business_profiles WHERE slug = v_slug)
  INTO v_exists;

  IF v_exists THEN
    v_suffix := substr(md5(random()::text), 1, 4);
    v_slug := v_slug || '-' || v_suffix;
  END IF;

  RETURN v_slug;
END;
$$;
```

#### Updated handle_new_user() (REFACTORED)

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

---

## 6. User Flows Architecture

### 6.1 Registration Flow (REFACTORED - Single Form)

```
┌──────────┐   ┌────────────────────────────────────────┐   ┌──────────────┐
│ /register│──►│ Single Form:                           │──►│ Auth creates │
│          │   │ - Name, Email, Password                │   │ user +       │
│          │   │ - Optional: "I want a business" expand │   │ handle_new_  │
│          │   │   └─ Business Name, Category           │   │ user()       │
└──────────┘   └────────────────────────────────────────┘   └──────┬───────┘
                                                                    │
                                                                    ▼
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ /        │◄──│ /profile/edit│◄──│ Email verify │◄──│ profiles (always │
│ (home)   │   │ (optional    │   │ (if required)│   │ personal) +      │
│          │   │  location,   │   │              │   │ business_profiles│
│          │   │  avatar)     │   │              │   │ (if biz checked) │
└──────────┘   └──────────────┘   └──────────────┘   └──────────────────┘
```

### 6.3 Storefront Access Flow (REFACTORED)

```
┌─────────────┐
│ User visits │
│ /negocio/   │
│ techstore   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ SELECT bp.*, p.* FROM business_profiles │
│ bp JOIN profiles p ON p.id = bp.id      │
│ WHERE bp.slug = 'techstore'             │
└──────┬──────────────────────────────────┘
       │
       ├─── NOT FOUND ──► 404 (no business_profiles row with this slug)
       │
       └─── FOUND ──► Render storefront (business_profiles row = active)
            │
            ▼
       ┌─────────────────────────────────────────┐
       │ SELECT * FROM products                  │
       │ WHERE user_id = bp.id AND status='active'│
       └─────────────────────────────────────────┘

Note: In the add-on model, business_profiles row existence is the source
of truth. No need to check account_type. If the row exists, the store
is active.
```

---

## 7. URL Routing Architecture

### 7.1 New Routes

| Route | Purpose | SSR | Auth Required |
|-------|---------|-----|----------------|
| `/negocio/[slug]` | Business storefront | Yes | No (public) |
| `/perfil/[id]` | Personal seller profile | Yes | No (public) |

### 7.2 Slug Generation Algorithm

```
Input: business_name (e.g., "TechStore Bolivia")

1. Normalize: lowercase, trim
   → "techstore bolivia"

2. Transliterate: á→a, é→e, í→i, ó→o, ú→u, ñ→n
   → "techstore bolivia" (unchanged)

3. Replace non-alphanumeric with hyphens
   → "techstore-bolivia"

4. Collapse consecutive hyphens
   → "techstore-bolivia"

5. Trim leading/trailing hyphens
   → "techstore-bolivia"

6. Check uniqueness in business_profiles
   - If unique: return "techstore-bolivia"
   - If collision: append "-" + 4-char hex → "techstore-bolivia-a3b2"
```

### 7.3 Collision Handling

```sql
-- In generate_slug(): if slug exists, append random suffix
v_suffix := substr(md5(random()::text), 1, 4);
v_slug := v_slug || '-' || v_suffix;
```

**Examples:**
- "TechStore Bolivia" → `techstore-bolivia`
- "La Casa del Celular" → `la-casa-del-celular`
- "TechStore" (exists) → `techstore-x9k4`

### 7.4 SEO Considerations

- **Canonical URL:** `https://telopillo.bo/negocio/{slug}`
- **Meta tags:** title, description, og:*, Twitter cards
- **Schema.org:** LocalBusiness JSON-LD (name, description, address, hours, sameAs)
- **Slug stability:** Slug is set at creation; business name edits do not change URL (avoids redirect churn)

---

## 8. Security Architecture

### 8.1 RLS Policies Summary

| Table | Policy | Effect |
|-------|--------|--------|
| `business_profiles` | `view_business_profiles` | SELECT: anyone (public storefronts) |
| `business_profiles` | `manage_own_business_profile` | INSERT/UPDATE/DELETE: `auth.uid() = id` |

### 8.2 Storage Bucket Security (business-logos)

```sql
-- Bucket: business-logos (public)
-- Path: {user_id}/logo.{ext}

-- Policy: Authenticated users can upload to own folder
CREATE POLICY "users_upload_own_business_logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update/delete own logo
CREATE POLICY "users_manage_own_business_logo"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 8.3 Business Profile Creation Authorization (REFACTORED)

- **Create business profile:** User must be authenticated; `business_profiles.id = auth.uid()`; RLS enforces
- **Edit business profile:** Same; RLS `manage_own_business_profile` ensures only owner can update
- **No "switching" flow:** Business profiles are additive. Once created, they persist.

### 8.4 Data Persistence (REFACTORED)

- `business_profiles` row, once created, is **never deleted** by the app
- Storefront `/negocio/[slug]` is accessible as long as the `business_profiles` row exists
- `profiles.account_type` is always `'personal'` and not used for access control

---

## 9. Search Integration

### 9.1 Updates to Search RPC Functions

Both `search_products` and `search_products_semantic` must JOIN `profiles` and `business_profiles` to include seller info in results.

**New columns in product result JSONB:**

| Key | Source | Description |
|-----|--------|-------------|
| `seller_name` | profiles.full_name | Seller display name |
| `seller_account_type` | profiles.account_type | 'personal' or 'business' |
| `seller_verification_level` | profiles.verification_level | 0-3 |
| `seller_business_name` | business_profiles.business_name | Null for personal |
| `seller_business_slug` | business_profiles.slug | For link to storefront |
| `seller_business_logo` | business_profiles.business_logo_url | For product card |

### 9.2 SQL Pattern for Search RPC Update

```sql
-- In the base_filter or equivalent CTE, add JOINs:
FROM public.products p
LEFT JOIN public.profiles prof ON prof.id = p.user_id
LEFT JOIN public.business_profiles bp ON bp.id = p.user_id
WHERE ...

-- In jsonb_build_object, add:
'seller_name', prof.full_name,
'seller_account_type', prof.account_type,
'seller_verification_level', prof.verification_level,
'seller_business_name', bp.business_name,
'seller_business_slug', bp.slug,
'seller_business_logo', bp.business_logo_url
```

### 9.3 Filter by Seller Type (REFACTORED)

Add optional parameter to search RPC. Uses `business_profiles` existence, not `account_type`:

```sql
seller_type_filter TEXT DEFAULT NULL  -- 'business' | NULL (all)

-- In WHERE clause:
AND (seller_type_filter IS NULL
  OR (seller_type_filter = 'business' AND bp.id IS NOT NULL))
```

### 9.4 Product Card Display Logic (REFACTORED)

```typescript
// Pseudocode for ProductCard - uses business_profiles JOIN, not account_type
if (product.seller_business_slug) {
  return (
    <Link href={`/negocio/${product.seller_business_slug}`}>
      <img src={product.seller_business_logo} alt="" />
      {product.seller_business_name}
    </Link>
  );
} else {
  return <span>{product.seller_name}</span>;
}
```

---

## 10. Trust Badge System

### 10.1 Badge Determination Logic (REFACTORED)

```typescript
// components/ui/VerificationBadge.tsx
interface VerificationBadgeProps {
  hasBusinessProfile: boolean;  // was: accountType: 'personal' | 'business'
  verificationLevel: number;
  size?: 'sm' | 'default';
  showTeaser?: boolean;
}

function getBadgeConfig(hasBusinessProfile: boolean, verificationLevel: number) {
  const hasPhone = verificationLevel >= 1;

  if (hasBusinessProfile && hasPhone) return { label: 'Negocio con Telefono', variant: 'positive' };
  if (hasBusinessProfile && !hasPhone) return { label: 'Nuevo Negocio', variant: 'neutral' };
  if (!hasBusinessProfile && hasPhone) return { label: 'Vendedor con Telefono', variant: 'positive' };
  return { label: 'Nuevo Vendedor', variant: 'neutral' };
}
```

### 10.2 Badge Matrix (REFACTORED)

| hasBusinessProfile | verification_level | Badge |
|--------------------|-------------------|-------|
| false | 0 | Nuevo Vendedor |
| false | 1 | Vendedor con Telefono |
| true | 0 | Nuevo Negocio |
| true | 1 | Negocio con Telefono |
| false | 2 | Vendedor Verificado (deferred) |
| true | 3 | Negocio Verificado (deferred) |

### 10.3 Auto-Update on Phone Field Change

- Trigger `update_verification_on_phone` runs on `profiles` UPDATE when `phone` changes
- Frontend: after successful profile save, refetch profile or invalidate cache
- `VerificationBadge` component reads `verification_level` from profile; re-renders with new badge

### 10.4 Display Locations

| Location | Component | Notes |
|----------|-----------|-------|
| Profile edit page | VerificationBadge | Current user's badge |
| Personal profile `/perfil/[id]` | VerificationBadge | Seller's badge |
| Business storefront `/negocio/[slug]` | BusinessHeader | In header |
| Product cards | Mini badge or business name | Business: logo + name link |
| SellerCard | VerificationBadge | In seller info |

### 10.5 Future Extensibility (Level 2, 3 Placeholders)

- Schema: `verification_level` already supports 0-3
- Badge logic: add cases for level 2, 3 in `getVerificationBadge()` when Strong KYC ships
- No UI for document upload in M4.5; placeholder text: "Full verification coming soon!"

---

## 11. Storage Architecture

### 11.1 business-logos Bucket

| Property | Value |
|----------|-------|
| Bucket name | `business-logos` |
| Access | Public (read) |
| Path pattern | `{user_id}/logo.{ext}` |
| Max file size | 5MB |
| Allowed types | image/jpeg, image/png, image/webp |

### 11.2 Image Processing Pipeline

```
Upload flow:
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ User selects│────►│ Client: validate    │────►│ Supabase Storage    │
│ image file  │     │ type, size (5MB)    │     │ .upload()           │
└─────────────┘     └─────────────────────┘     └──────────┬──────────┘
                                                             │
                                                             ▼
┌─────────────────────┐     ┌─────────────────────┐
│ Optional: Edge      │     │ PATCH business_     │
│ Function resize     │     │ profiles            │
│ (400x400 max)       │     │ business_logo_url   │
│ or client-side      │     │ = public URL        │
│ before upload       │     └─────────────────────┘
└─────────────────────┘
```

**Recommendation:** Resize on client before upload (same pattern as avatar) to avoid Edge Function cost. Use `browser-image-compression` or similar.

### 11.3 CDN Delivery

- Supabase Storage serves via CDN by default
- Public URLs: `https://{project}.supabase.co/storage/v1/object/public/business-logos/{user_id}/logo.webp`
- Next.js `Image` component: use `remotePatterns` for Supabase domain

### 11.4 RLS Policies (Storage)

- INSERT: authenticated, path must start with `auth.uid()`
- UPDATE/DELETE: same
- SELECT: public (bucket is public)

---

## 12. Performance Considerations

### 12.1 Indexing Strategy for New Columns

| Index | Purpose |
|-------|---------|
| `idx_business_profiles_slug` | O(1) lookup for storefront by slug |
| `idx_profiles_account_type` | Filter search by seller type |
| `idx_profiles_verification_level` | Optional filter by verification |

### 12.2 Query Optimization for Seller Info Joins

- Search RPC: `LEFT JOIN profiles` and `LEFT JOIN business_profiles` on `user_id`
- Products already filtered by status; JOINs are on primary/foreign keys (indexed)
- Single round-trip: no N+1; all seller info in one RPC response

### 12.3 Caching Strategy for Business Profiles

- **Storefront page:** Next.js `generateMetadata` + `fetch` with `revalidate` (e.g., 60s) for ISR
- **Product cards:** Seller info comes from search result; no extra fetch
- **Profile edit:** Fetch on load; no aggressive cache (user expects fresh data)

### 12.4 Image Optimization

- Logo: max 400x400, WebP preferred
- Lazy load below fold
- `next/image` with `sizes` for responsive

---

## 13. Scalability Considerations

### 13.1 Business Profile Growth

- `business_profiles` grows with business accounts (~10-30% of users)
- Index on `slug` keeps lookup O(log n) with B-tree
- No full-table scans in hot paths

### 13.2 Slug Uniqueness at Scale

- 4-char hex suffix: 65K combinations per base slug
- Collision probability low; if needed, extend to 6 chars
- `generate_slug()` runs at insert time only (no background job)

### 13.3 Verification Level Updates

- Trigger runs per-row on `profiles` UPDATE; negligible overhead
- No batch jobs; updates are user-driven

### 13.4 Storage Growth (Logos)

- ~100KB per logo (resized); 10K businesses = ~1GB
- Supabase free tier: 1GB; Pro: 100GB
- Lifecycle: delete logo on business_profiles DELETE (CASCADE from profiles)

---

## 14. Migration Strategy

### 14.1 Existing Users Default

```sql
-- Migration adds columns with DEFAULTs
ALTER TABLE profiles ADD COLUMN account_type TEXT NOT NULL DEFAULT 'personal';
ALTER TABLE profiles ADD COLUMN verification_level INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing rows automatically get:
-- account_type = 'personal'
-- verification_level = 0
-- phone_verified = false
```

### 14.2 Non-Breaking Changes

- No removal of columns or tables
- No change to existing RLS that would restrict current access
- New routes are additive
- Search RPC: additive JOINs; existing clients ignore new keys if not used

### 14.3 Rollback Plan

1. **Database:** New migration to drop `business_profiles`, remove new columns from `profiles`, drop triggers
2. **Frontend:** Revert to previous deploy (Vercel)
3. **Data:** `business_profiles` has no dependencies from other tables; safe to drop
4. **Storage:** `business-logos` bucket can be emptied; URLs in `business_logo_url` would 404

---

## 15. Future Architecture (Strong KYC Preview)

### 15.1 Schema Ready for Level 2, 3

- `verification_level` already supports 0-3
- `phone_verified` exists; Strong KYC adds `ci_verified`, `nit_verified` (or similar)
- `business_profiles.is_nit_verified` already present

### 15.2 verification_documents Table (Deferred)

```sql
-- NOT created in M4.5; for Strong KYC milestone
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  document_type TEXT NOT NULL,  -- 'ci_front', 'ci_back', 'nit_cert', etc.
  file_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 15.3 Document Storage Bucket (Deferred)

- Bucket: `verification-documents` (private)
- Path: `{user_id}/{document_type}.{ext}`
- RLS: user can upload; only service_role/admin can read

### 15.4 Admin Review Workflow (Deferred)

- Admin dashboard: list pending documents
- Approve/reject → update `verification_documents.status`
- On approve: update `profiles.verification_level` (2 or 3)
- "Pendiente de Verificacion" badge for pending state

---

## Conclusion

M4.5 extends Telopillo.bo with a business-as-add-on model and minimal KYC through additive, non-breaking changes. The architecture prioritizes:

1. **Zero friction:** Single registration form; optional business add-on; phone in profile form
2. **Business as add-on:** Any user can create a business profile at any time, no mutually exclusive types
3. **Trigger-driven consistency:** Verification level updated at database level
4. **Future-proof schema:** Ready for Strong KYC (Level 2, 3) without migration
5. **Informational trust:** Badges guide buyers without restricting sellers
6. **SEO-friendly storefronts:** Slug-based URLs, Schema.org, Open Graph

**References:**
- [PRD](./PRD.md) - Product requirements and user stories
- [IMPLEMENTATION_PLAN](./IMPLEMENTATION_PLAN.md) - Phase-by-phase task breakdown
- [Main ARCHITECTURE](../../ARCHITECTURE.md) - System-wide architecture

---

**Document Version:** 2.0 (post business-as-add-on refactor)  
**Last Updated:** February 15, 2026  
**Maintained By:** Alcides Cardenas
