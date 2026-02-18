# Milestone 4.6: Share Profile Link

**Priority:** MEDIUM-HIGH (organic growth via WhatsApp sharing)  
**Duration:** 1-2 days  
**Dependencies:** M1 (Authentication), M4.5 (Account Types)  
**Status:** Completed  
**Completed:** February 15, 2026

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Overview, user stories, success criteria |
| [PRD.md](./PRD.md) | Full product requirements document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture & design decisions |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Phased implementation plan with file-level tasks |

---

## Overview

Enable sellers to copy and share their public profile URL directly from their dashboard. On mobile, leverage the Web Share API for native sharing to WhatsApp, Facebook, and other apps -- the primary sharing channels for Bolivian users.

Public seller pages already exist (`/vendedor/[id]` and `/negocio/[slug]`), but sellers have no way to discover or share their public link from their dashboard.

---

## Goals

1. Sellers can copy their public profile URL from `/profile`
2. On mobile, sellers can use native share (WhatsApp, Facebook, etc.)
3. Business accounts share `/negocio/{slug}`, personal accounts share `/vendedor/{id}`
4. Share control also available on `/perfil/mis-productos`
5. Clipboard + toast feedback on copy
6. **Shared links are fully usable without authentication** — visitors can view the seller profile, browse their products, and contact them via WhatsApp without logging in

---

## User Stories

### US-4.6.1: Copy profile link
**As a** seller  
**I want to** copy my public profile link from my dashboard  
**So that** I can paste it in WhatsApp, Facebook, or anywhere I want to share

**Acceptance Criteria:**
- [x] "Compartir mi perfil" section visible on `/profile`
- [x] URL preview shows the correct public link
- [x] "Copiar enlace" copies URL to clipboard
- [x] Toast "Enlace copiado" confirms the action
- [x] Business accounts see `/negocio/{slug}` URL
- [x] Personal accounts see `/vendedor/{id}` URL

### US-4.6.2: Native share on mobile
**As a** seller on mobile  
**I want to** share my profile using WhatsApp or other apps directly  
**So that** I don't have to copy-paste manually

**Acceptance Criteria:**
- [x] "Compartir" button uses Web Share API when available
- [x] Share includes title ("Mi perfil en Telopillo.bo") and URL
- [x] Falls back to clipboard copy when Web Share API is not available
- [x] Works on Android and iOS browsers

### US-4.6.3: Share from product management
**As a** seller managing my listings  
**I want to** share my profile from the product management page too  
**So that** I can quickly share without navigating to my profile

**Acceptance Criteria:**
- [x] Compact share button on `/perfil/mis-productos`
- [x] Same URL logic (business vs personal)
- [x] Same copy/share behavior

---

## Technical Design

### New Component: `components/profile/ShareProfile.tsx`

Client component with two variants:

```typescript
interface ShareProfileProps {
  profileId: string
  businessSlug?: string | null
  variant?: 'card' | 'compact'
}
```

- **`card` variant** (for `/profile`): Full card with URL preview, "Compartir" button (native share with clipboard fallback), and "Copiar enlace" button
- **`compact` variant** (for `/perfil/mis-productos`): Single inline button that triggers native share or clipboard copy

### URL Logic

```
Business account:  {NEXT_PUBLIC_APP_URL}/negocio/{slug}
Personal account:  {NEXT_PUBLIC_APP_URL}/vendedor/{id}
```

### Browser APIs Used

- `navigator.clipboard.writeText()` -- Copy to clipboard
- `navigator.share()` -- Native share (mobile), with feature detection
- No external dependencies needed

### Changes Required

| File | Change |
|------|--------|
| `components/profile/ShareProfile.tsx` | **New** -- Reusable share component |
| `app/profile/page.tsx` | Add business slug fetch + ShareProfile card |
| `app/perfil/mis-productos/page.tsx` | Add compact ShareProfile button |

---

## Implementation Plan

### Phase 1: Core Component (0.5 day) -- COMPLETED
- [x] Create `ShareProfile.tsx` with `card` and `compact` variants
- [x] Implement clipboard copy with toast feedback
- [x] Implement Web Share API with fallback
- [x] URL computation logic (business vs personal)

### Phase 2: Profile Page Integration (0.5 day) -- COMPLETED
- [x] Fetch `business_profiles.slug` in `/profile` page
- [x] Add ShareProfile card between profile header and "Mis Publicaciones"
- [x] Test copy and share on desktop and mobile

### Phase 3: Product Management Integration (0.5 day) -- COMPLETED
- [x] Add compact ShareProfile to `/perfil/mis-productos`
- [x] Lint check and browser verification
- [x] E2E test considerations

---

## Success Criteria

- [x] Sellers can copy their public URL from `/profile`
- [x] Native share works on mobile (WhatsApp, etc.)
- [x] Business users see `/negocio/{slug}`; personal users see `/vendedor/{id}`
- [x] Toast confirms copy action
- [x] Share also available on `/perfil/mis-productos`
- [x] **Shared links work without login** — unauthenticated visitors can view profile, browse products, and contact seller via WhatsApp
- [x] No new dependencies added

---

## Extension: Product-Level Sharing (Delivered)

After completing the core M4.6 scope, product-level sharing was added to `ProductActions.tsx`:

- **Share individual products** from the dashboard dropdown menu and product detail page
- Uses the same Web Share API + clipboard fallback pattern as profile sharing
- Share data includes product title and URL (`/productos/{id}`)
- Accessible via the "Compartir" option in the product actions dropdown

### Files Changed

| File | Change |
|------|--------|
| `components/products/ProductActions.tsx` | Added `handleShareProduct()`, Share2 icon, "Compartir" dropdown item |
| `components/products/ProductCard.tsx` | Passes `productTitle` to ProductActions |
| `app/perfil/mis-productos/page.tsx` | Passes `productTitle` to ProductActions |
| `app/productos/[id]/page.tsx` | Passes `productTitle` to ProductActions (buttons variant) |

---

## Future Enhancements (Deferred)

- **QR code generation** -- For in-person sharing (requires `qrcode.react` dependency)
- **Username/slug for personal profiles** -- Cleaner URLs (`/vendedor/juan` vs `/vendedor/uuid`)
- **Share analytics** -- Track how often profiles are shared
- **Social preview cards** -- OG meta tags for rich previews (already exists on `/vendedor/[id]`)

---

## Dependencies

- M1: Authentication & Profiles (user must be logged in)
- M4.5: Account Types (business profiles with slugs)
- Existing: `/vendedor/[id]` and `/negocio/[slug]` public pages
- Existing: Toast system (`useToast`)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Web Share API not available on desktop | Fallback to clipboard copy |
| Clipboard API requires HTTPS | Works on localhost for dev; production uses HTTPS |
| UUID URLs are ugly for personal accounts | Functional for MVP; username/slug deferred |
| `NEXT_PUBLIC_APP_URL` not set in production | Runtime fallback to `https://telopillo.bo`; add to deployment checklist |
| Safari/iOS may drop `text` from Web Share payload | Acceptable — `url` is the critical field; `text` is supplementary |
| KPIs not measurable without analytics | KPIs are aspirational for MVP; share analytics deferred to future enhancement |
