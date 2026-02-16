# PRD - Milestone 4.6: Share Profile Link

**Version:** 1.0  
**Date:** February 15, 2026  
**Author:** Alcides Cardenas  
**Status:** Not Started  
**Milestone Duration:** 1-2 working days  
**Priority:** P1 (Medium-High - Organic growth via social sharing)

---

## 1. Executive Summary

This milestone enables sellers to discover and share their public profile URL directly from their dashboard. On mobile, the Web Share API provides native sharing to WhatsApp, Facebook, and other apps -- the primary channels Bolivian users rely on for commerce.

Public seller pages already exist (`/vendedor/[id]` for personal accounts, `/negocio/[slug]` for business accounts), but sellers currently have no way to find or share these links from their authenticated dashboard.

**Success means:** A seller can open their profile, tap "Compartir", and send their public listing page via WhatsApp in under 5 seconds.

---

## 2. Problem Statement

### 2.1 Current State
- Public seller pages exist at `/vendedor/[id]` and `/negocio/[slug]`
- Both pages display seller info and active products publicly
- Sellers have no way to discover their public URL from `/profile` or `/perfil/mis-productos`
- No copy-to-clipboard or native share functionality exists
- Sellers must manually construct URLs to share their profiles

### 2.2 Desired State
- Sellers see their shareable public URL on their dashboard
- One-tap copy to clipboard with visual confirmation
- Native share on mobile (WhatsApp, Facebook, SMS, etc.)
- Business accounts share their clean slug URL (`/negocio/mi-tienda`)
- Personal accounts share their UUID-based URL (`/vendedor/{id}`)
- Share available on both `/profile` and `/perfil/mis-productos`
- **Shared links are fully public** — recipients can view the seller profile, browse products, and contact the seller via WhatsApp without creating an account or logging in

---

## 3. Goals & Objectives

### 3.1 Primary Goals
1. **Discoverability**: Sellers can find their public profile URL easily
2. **Frictionless Sharing**: One-tap share to WhatsApp and other apps
3. **Consistent URLs**: Business accounts get slug URLs, personal accounts get UUID URLs
4. **Cross-page Access**: Share available on profile dashboard and product management

### 3.2 Success Metrics
- [ ] Sellers can copy their public URL from `/profile`
- [ ] Native share works on mobile browsers (Android + iOS)
- [ ] Business users see `/negocio/{slug}` URL
- [ ] Personal users see `/vendedor/{id}` URL
- [ ] Toast confirms copy action
- [ ] Share also available on `/perfil/mis-productos`
- [ ] No new external dependencies added
- [ ] WCAG 2.2 AA compliance on share controls

### 3.3 Key Performance Indicators (KPIs)
- Share button usage rate: >20% of active sellers
- WhatsApp shares: primary channel (>60% of shares)
- Profile page views from shared links: measurable increase

> **Note:** These KPIs are aspirational targets for MVP. Measuring them requires share event tracking (deferred to share analytics enhancement). For now, success is validated by manual testing and qualitative seller feedback.

---

## 4. Functional Requirements

### 4.1 Share Profile Component

#### 4.1.1 Card Variant (for `/profile`)
- Displayed as a Card section between profile header and "Mis Publicaciones"
- Shows:
  - Section title: "Compartir mi perfil"
  - URL preview (truncated, readable)
  - "Copiar enlace" button (clipboard icon)
  - "Compartir" button (share icon, visible when Web Share API is available)
- URL preview uses monospace or code-style font for clarity

#### 4.1.2 Compact Variant (for `/perfil/mis-productos`)
- Single button in the page header area
- Icon + "Compartir perfil" text
- Same copy/share behavior as card variant

#### 4.1.3 URL Logic
```
IF user has business_profiles.slug:
  shareUrl = {baseUrl}/negocio/{slug}
ELSE:
  shareUrl = {baseUrl}/vendedor/{profile.id}
```

Base URL: `process.env.NEXT_PUBLIC_APP_URL` or fallback `https://telopillo.bo`

#### 4.1.4 Copy to Clipboard
- Uses `navigator.clipboard.writeText()`
- On success: toast "Enlace copiado" (success type)
- On failure: toast "No se pudo copiar el enlace" (error type)

#### 4.1.5 Native Share (Web Share API)
- Feature detection: `typeof navigator.share === 'function'`
- Share data:
  - `title`: "Mi perfil en Telopillo.bo"
  - `text`: "Mira mis productos en Telopillo.bo"
  - `url`: the computed share URL
- On error/cancel: silent (no error toast for user cancellation)
- Fallback: copy to clipboard when Web Share API is not available

---

## 5. User Stories

### US-4.6.1: Copy Profile Link
**As a** seller  
**I want to** copy my public profile link from my dashboard  
**So that** I can paste it in WhatsApp, Facebook, or anywhere I want to share

**Acceptance Criteria:**
- "Compartir mi perfil" section visible on `/profile`
- URL preview shows the correct public link
- "Copiar enlace" copies URL to clipboard
- Toast "Enlace copiado" confirms the action
- Business accounts see `/negocio/{slug}` URL
- Personal accounts see `/vendedor/{id}` URL

### US-4.6.2: Native Share on Mobile
**As a** seller on mobile  
**I want to** share my profile using WhatsApp or other apps directly  
**So that** I don't have to copy-paste manually

**Acceptance Criteria:**
- "Compartir" button visible on mobile (when Web Share API available)
- Native share sheet opens with title, text, and URL
- Falls back to clipboard copy on desktop
- Works on Android Chrome and iOS Safari

### US-4.6.3: Share from Product Management
**As a** seller managing my listings  
**I want to** share my profile from the product management page  
**So that** I can quickly share without navigating to my profile

**Acceptance Criteria:**
- Compact share button on `/perfil/mis-productos`
- Same URL logic and behavior as profile page
- Does not take excessive space in the UI

---

## 6. Non-Functional Requirements

### 6.1 Performance
- No additional network requests for share functionality
- Clipboard and share APIs are synchronous/near-instant

### 6.2 Accessibility
- All buttons have accessible labels (`aria-label`)
- Toast uses `aria-live="polite"` (already implemented)
- Keyboard navigable (focusable buttons)

### 6.3 Browser Support
- Clipboard API: All modern browsers (Chrome 66+, Firefox 63+, Safari 13.1+)
- Web Share API: Mobile Chrome 61+, Safari 12.2+, Firefox (limited)
- Graceful degradation: copy-only on unsupported browsers

### 6.4 Security
- No sensitive data exposed (public URLs only)
- No server-side changes required
- HTTPS required for clipboard API (handled by production environment)

---

## 7. Out of Scope

- QR code generation (future enhancement)
- Username/slug for personal profiles (future enhancement)
- Share analytics tracking (future enhancement)
- Deep link for mobile app (no mobile app yet)
- Social preview card customization (OG tags already exist on public pages)

---

## 8. Dependencies

| Dependency | Status | Required For |
|------------|--------|--------------|
| M1: Authentication | Completed | User must be logged in |
| M4.5: Account Types | Completed | Business profiles with slugs |
| `/vendedor/[id]` page | Exists | Personal public profile |
| `/negocio/[slug]` page | Exists | Business public profile |
| Toast system | Exists | Copy confirmation feedback |
