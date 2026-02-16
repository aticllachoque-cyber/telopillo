# M4.6 - Share Profile Link: Architecture Document

**Version:** 1.0  
**Date:** February 15, 2026  
**Author:** Alcides Cardenas  
**Status:** Design Document  
**Milestone:** M4.6 - Share Profile Link

---

## 1. Executive Summary

### 1.1 Overview

Milestone 4.6 adds a shareable profile link feature to the seller dashboard. The architecture is entirely client-side -- no new API routes, database changes, or server-side logic required. It leverages existing browser APIs (Clipboard, Web Share) and the existing toast notification system.

**Key architectural characteristics:**

- **Zero backend changes:** No new tables, migrations, API routes, or RLS policies
- **Client-side only:** Uses browser Clipboard API and Web Share API
- **Reusable component:** Single `ShareProfile` component with `card` and `compact` variants
- **Progressive enhancement:** Web Share API on mobile, clipboard fallback on desktop

### 1.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Client component only | No server logic needed; share is a browser action |
| Single component with variants | Reusable across `/profile` and `/perfil/mis-productos` |
| Web Share API with fallback | Native share on mobile; clipboard copy on desktop |
| Props-based URL computation | Parent pages pass `profileId` and `businessSlug`; component computes URL |
| No new dependencies | Browser APIs are sufficient; no need for `react-share` or similar |

---

## 2. Component Architecture

### 2.1 Component Tree

```
app/profile/page.tsx (existing)
  └── ShareProfile variant="card"
        ├── URL preview (text)
        ├── CopyButton (clipboard)
        └── ShareButton (Web Share API)

app/perfil/mis-productos/page.tsx (existing)
  └── ShareProfile variant="compact"
        └── Single button (share or copy)
```

### 2.2 ShareProfile Component

```
components/profile/ShareProfile.tsx (new, client component)

Props:
  profileId: string           — User's profile UUID
  businessSlug?: string|null  — Business slug if available
  variant: 'card' | 'compact' — Display mode

Internal state:
  shareUrl: string            — Computed from props + env
  canShare: boolean           — navigator.share availability
  copied: boolean             — Brief state for copy feedback

Dependencies:
  useToast()                  — From components/ui/toast
  navigator.clipboard         — Browser API
  navigator.share             — Browser API (optional)
```

### 2.3 URL Computation

```
baseUrl = process.env.NEXT_PUBLIC_APP_URL
        || process.env.NEXT_PUBLIC_BASE_URL
        || 'https://telopillo.bo'

if (businessSlug):
  shareUrl = `${baseUrl}/negocio/${businessSlug}`
else:
  shareUrl = `${baseUrl}/vendedor/${profileId}`
```

---

## 3. Data Flow

### 3.1 Profile Page (`/profile`)

```
1. Page loads → fetches profile (existing)
2. Page fetches business_profiles.slug (new query)
3. Renders ShareProfile with profileId + businessSlug
4. User taps "Copiar":
   → navigator.clipboard.writeText(shareUrl)
   → showToast("Enlace copiado", "success")
5. User taps "Compartir" (mobile):
   → navigator.share({ title, text, url })
   → Native share sheet opens
```

### 3.2 Product Management (`/perfil/mis-productos`)

```
1. Page loads → fetches products (existing)
2. Page already has user context
3. Fetches business_profiles.slug (new query)
4. Renders ShareProfile variant="compact"
5. Same copy/share behavior
```

---

## 4. Integration Points

### 4.1 Existing Systems Used

| System | Usage |
|--------|-------|
| `useToast()` | Copy confirmation feedback |
| `createClient()` | Supabase client for business slug fetch |
| `NEXT_PUBLIC_APP_URL` | Base URL for share links |
| Existing public pages | `/vendedor/[id]`, `/negocio/[slug]` |

### 4.2 No Changes To

| System | Reason |
|--------|--------|
| Database schema | No new tables or columns |
| RLS policies | No new data access patterns |
| API routes | No server-side logic needed |
| Middleware | No auth changes |
| Supabase Edge Functions | No backend processing |

---

## 5. Browser API Usage

### 5.1 Clipboard API

```typescript
await navigator.clipboard.writeText(url)
```

- **Support:** Chrome 66+, Firefox 63+, Safari 13.1+, Edge 79+
- **Requirement:** Secure context (HTTPS or localhost)
- **Error handling:** Try-catch with error toast fallback

### 5.2 Web Share API

```typescript
await navigator.share({
  title: 'Mi perfil en Telopillo.bo',
  text: 'Mira mis productos en Telopillo.bo',
  url: shareUrl,
})
```

- **Support:** Mobile Chrome 61+, Safari 12.2+, Samsung Internet 8+
- **Detection:** `typeof navigator !== 'undefined' && typeof navigator.share === 'function'`
- **Error handling:** `AbortError` (user cancelled) is silently ignored; other errors fall back to clipboard

---

## 6. UI Specifications

### 6.1 Card Variant (for `/profile`)

```
┌─────────────────────────────────────────────┐
│  Compartir mi perfil                        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ telopillo.bo/negocio/mi-tienda      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [ 📋 Copiar enlace ]  [ 📤 Compartir ]    │
└─────────────────────────────────────────────┘
```

- Card component from shadcn/ui
- URL in a styled code/preview block
- Two buttons side by side
- "Compartir" hidden when Web Share API is unavailable

### 6.2 Compact Variant (for `/perfil/mis-productos`)

```
[ 📤 Compartir perfil ]
```

- Single button, ghost or outline variant
- Uses share icon
- On click: native share if available, else clipboard copy

---

## 7. Error Handling

| Scenario | Handling |
|----------|----------|
| Clipboard write fails | Toast: "No se pudo copiar el enlace" (error) |
| Web Share cancelled by user | Silent (no toast) |
| Web Share fails (other error) | Fall back to clipboard copy |
| No business slug, no profile ID | Component not rendered (guard) |

---

## 8. Performance Considerations

- **No additional API calls** for the share component itself
- **One additional query** on `/profile` page: `business_profiles.slug` (single row, indexed)
- **No bundle size impact:** Browser APIs only, no new npm packages
- **No SSR impact:** Client component, renders after hydration

---

## 9. Security Considerations

- Public URLs only -- no sensitive data exposed
- Share URLs point to existing public pages with proper SEO metadata
- No new data access patterns; business slug is already public (used in `/negocio/[slug]`)
- Clipboard API requires secure context (HTTPS) -- handled by production environment

---

## 10. Future Architecture Considerations

| Enhancement | Architecture Impact |
|-------------|-------------------|
| QR code generation | Add `qrcode.react` dependency; render in card variant |
| Personal profile slugs | New `profiles.username` column + migration + uniqueness validation |
| Share analytics | New Supabase table `share_events` or analytics service integration |
| Social preview customization | Update OG meta tags on public pages (already partially implemented) |
