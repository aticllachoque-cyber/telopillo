# Profile Page Mobile UX Review — Telopillo.bo

**Review Date:** February 17, 2026  
**Scope:** Profile pages (`/profile`, `/profile/edit`, `/perfil/mis-productos`), related components, UserMenu, Header  
**Reference:** WCAG 2.2 AA, mobile-first design, MercadoLibre/OLX/Facebook Marketplace patterns

---

## Executive Summary

The profile experience is generally usable on mobile, but several touch targets fall below the 44×44px minimum, and there are inconsistencies in routes, loading/error states, and information architecture. The Select component and BusinessHoursEditor already meet touch-target guidelines; the Button component and several profile-specific controls do not.

---

## CRITICAL Issues (Blocks Mobile Usage)

### C1. ProductActions Dropdown Trigger Too Small on Mobile

**File:** `components/products/ProductActions.tsx` (lines 188–192)

**Issue:** The three-dot menu on each product card is `h-8 w-8` (32×32px), below the 44×44px WCAG minimum. On touch devices this causes frequent mis-taps and frustration.

**Current code:**
```tsx
<Button
  variant="secondary"
  size="icon"
  className="h-8 w-8 shadow-md"
  ...
>
```

**Recommendation:** Use responsive sizing like ImageUpload:
```tsx
className="min-h-[44px] min-w-[44px] h-11 w-11 md:h-8 md:w-8 md:min-h-0 md:min-w-0 shadow-md touch-manipulation"
```

---

### C2. UserMenu Avatar Trigger Below 44px

**File:** `components/layout/UserMenu.tsx` (lines 68–84)

**Issue:** The avatar button that opens the user menu is `size-10` (40×40px). On mobile this is the primary way to access profile, mis-productos, and logout.

**Current code:**
```tsx
<Button
  variant="ghost"
  className="relative size-10 rounded-full"
  aria-label="Menú de usuario"
>
  <Avatar className="size-9">
```

**Recommendation:**
```tsx
className="relative size-11 rounded-full min-h-[44px] min-w-[44px] md:size-10 md:min-h-0 md:min-w-0 touch-manipulation"
```
And increase Avatar to `size-10` inside on mobile.

---

### C3. Header Mobile Avatar Link Too Small

**File:** `components/layout/Header.tsx` (lines 99–115)

**Issue:** The profile avatar link on mobile is `size-8` (32×32px). It competes with the hamburger and is hard to tap.

**Current code:**
```tsx
<Avatar className="size-8">
```

**Recommendation:**
```tsx
<Avatar className="size-11 min-h-[44px] min-w-[44px] md:size-8 md:min-h-0 md:min-w-0">
```
Ensure the wrapping `Link` has `min-h-[44px] min-w-[44px]` for the tap area.

---

## HIGH Issues (Significantly Degrades Mobile UX)

### H1. Profile Page Action Buttons Below 44px

**File:** `app/profile/page.tsx` (lines 194–205)

**Issue:** "Editar" and "Salir" use `size="sm"` (h-8 = 32px). These are primary actions on the profile.

**Current code:**
```tsx
<Button variant="outline" size="sm" asChild>
  <Link href="/profile/edit">...</Link>
</Button>
<Button variant="outline" size="sm" onClick={handleSignOut}>...</Button>
```

**Recommendation:** Use `size="default"` or add a mobile-specific size:
```tsx
<Button variant="outline" size="default" className="min-h-[44px] md:min-h-0" asChild>
```
Or introduce `size="touch"` in the Button component: `h-11 min-h-[44px]` for mobile-first.

---

### H2. AvatarUpload Buttons Too Small

**File:** `components/profile/AvatarUpload.tsx` (lines 136–167)

**Issue:** "Cambiar Foto" and "Eliminar" use `size="sm"` (h-8). Avatar editing is a core profile task.

**Recommendation:** Use `size="default"` or add `min-h-[44px]`:
```tsx
<Button
  type="button"
  variant="outline"
  size="default"
  className="min-h-[44px] md:min-h-0"
  ...
>
```

---

### H3. DropdownMenuItem Touch Targets

**File:** `components/ui/dropdown-menu.tsx` (lines 60–68)

**Issue:** `DropdownMenuItem` uses `py-1.5` (6px vertical padding). With text, total height is ~32px, below 44px. Affects UserMenu items (Mi Perfil, Mis Publicaciones, Editar Perfil, Cerrar Sesión).

**Recommendation:** Add mobile-friendly padding:
```tsx
className={cn(
  "...",
  "py-3 min-h-[44px] sm:py-1.5 sm:min-h-0",
  className
)}
```

---

### H4. ShareProfile Compact Button Too Small

**File:** `components/profile/ShareProfile.tsx` (lines 51–57)

**Issue:** On mis-productos, the "Compartir perfil" button uses `size="sm"`.

**Recommendation:** Use `size="default"` or `min-h-[44px]` for the compact variant on mobile.

---

### H5. No Skeleton Loading for Profile

**Files:** `app/profile/page.tsx` (lines 124–132), `app/profile/edit/page.tsx` (lines 178–186), `app/perfil/mis-productos/page.tsx` (lines 126–136)

**Issue:** Loading states use a simple spinner and text. MercadoLibre/OLX use skeleton placeholders for profile and product lists, which improves perceived performance and reduces layout shift.

**Recommendation:** Add skeleton components:
- Profile: Skeleton for avatar, name, and card placeholders
- Mis productos: Skeleton grid matching ProductCard layout
- Profile edit: Skeleton for form fields

---

### H6. Route Inconsistency: /profile vs /perfil

**Files:** Multiple

**Issue:** Profile uses `/profile` (English) while product management uses `/perfil/mis-productos` (Spanish). Users and links mix both, which is confusing and hurts SEO.

**Locations:**
- `UserMenu.tsx`: `/profile`, `/perfil/mis-productos`, `/profile/edit`
- `Header.tsx`: `/profile`, `/perfil/mis-productos`
- `app/profile/page.tsx`: Links to `/perfil/mis-productos`
- `app/perfil/mis-productos/page.tsx`: Links to `/profile`

**Recommendation:** Standardize on one pattern. Options:
1. All Spanish: `/perfil`, `/perfil/editar`, `/perfil/mis-productos`
2. All English: `/profile`, `/profile/edit`, `/profile/products`
3. Redirects: Keep both and redirect for backward compatibility

---

## MEDIUM Issues (Noticeable but Usable)

### M1. Profile Page: No Quick Avatar Edit from View

**File:** `app/profile/page.tsx`

**Issue:** Avatar is display-only. To change it, users must go to Edit. OLX/MercadoLibre often allow tap-to-edit on the avatar.

**Recommendation:** Make the avatar a link to `/profile/edit#avatar` or add a small overlay "Cambiar foto" on tap/long-press.

---

### M2. Mis Productos: Filters Card Layout on 375px

**File:** `app/perfil/mis-productos/page.tsx` (lines 172–219)

**Issue:** Two Selects stack vertically. On 375px the filter card can feel tall. Some marketplaces use horizontal chips or a single "Filtros" sheet on mobile.

**Recommendation:** Consider a bottom sheet or horizontal scroll for filters on mobile, or collapse to "Filtros" with a modal.

---

### M3. Error State Lacks Recovery Options

**Files:** `app/profile/page.tsx` (lines 135–147), `app/perfil/mis-productos/page.tsx` (lines 223–229)

**Issue:** Error states show a message and "Volver al inicio" (profile) or no retry (mis-productos). No explicit retry.

**Recommendation:** Add "Reintentar" next to the error message and wire it to reload data.

---

### M4. Empty State Copy Could Be Clearer

**File:** `app/perfil/mis-productos/page.tsx` (lines 241–256)

**Issue:** Empty state is good, but when filters are applied the message could be more specific (e.g., "No tienes productos vendidos" vs "No tienes productos").

**Current:** Generic message based on `statusFilter`.

**Recommendation:** Refine copy per filter and add a "Limpiar filtros" link when filtered.

---

### M5. Profile Edit: Back Link Touch Target

**File:** `app/profile/edit/page.tsx` (lines 219–227)

**Issue:** "Volver al perfil" link has no explicit min-height. It’s a text link that may be hard to tap.

**Recommendation:** Add `min-h-[44px] inline-flex items-center` to the Link, similar to mis-productos.

---

### M6. BusinessProfileForm Logo Buttons

**File:** `components/profile/BusinessProfileForm.tsx` (lines 238–268)

**Issue:** "Cambiar Logo" and "Eliminar" use `size="sm"`.

**Recommendation:** Use `min-h-[44px]` on mobile for these buttons.

---

## LOW Issues (Nice-to-Have)

### L1. Profile Page Card Density

**File:** `app/profile/page.tsx`

**Issue:** Many cards (Profile Header, Share, Business, Mis Publicaciones). On 375px this creates long scrolling. Consider tabs or a more compact layout.

---

### L2. Success State on Profile Edit

**File:** `app/profile/edit/page.tsx` (lines 189–215)

**Issue:** Success state is full-screen with a 2s delay before redirect. No option to stay or go back manually.

**Recommendation:** Add "Ver perfil" and "Seguir editando" buttons.

---

### L3. Header Mobile Menu Close Button

**File:** `components/layout/Header.tsx` (lines 184–209)

**Issue:** Close button is `size-8` (32px). Less critical because the menu is large and backdrop is tappable.

**Recommendation:** Use `min-h-[44px] min-w-[44px]` for the close button.

---

### L4. DropdownMenuContent for UserMenu

**File:** `components/ui/dropdown-menu.tsx`

**Issue:** On mobile, dropdowns can be awkward. Consider a bottom sheet for UserMenu on small screens (similar to mobile menu pattern).

---

## Summary Table

| Severity | Count | Focus Areas |
|----------|-------|-------------|
| CRITICAL | 3     | ProductActions, UserMenu, Header avatar |
| HIGH     | 6     | Profile buttons, AvatarUpload, DropdownMenuItem, ShareProfile, loading, routes |
| MEDIUM   | 6     | Avatar edit, filters, error recovery, empty state, back link, BusinessProfileForm |
| LOW      | 4     | Card density, success state, close button, dropdown vs sheet |

---

## Implementation Priority

1. **Phase 1 (Critical):** Fix ProductActions, UserMenu trigger, Header avatar touch targets.
2. **Phase 2 (High):** Profile action buttons, AvatarUpload, DropdownMenuItem, ShareProfile, route consistency.
3. **Phase 3 (Medium):** Skeleton loading, error retry, filter UX, back link.
4. **Phase 4 (Low):** Success state, close button, optional bottom sheet for UserMenu.

---

## Button Component Enhancement Suggestion

To avoid repeating `min-h-[44px]` everywhere, add a mobile touch-friendly size:

**File:** `components/ui/button.tsx`

```tsx
size: {
  // ... existing
  touch: 'min-h-[44px] min-w-[44px] h-11 px-4 py-2 md:min-h-0 md:min-w-0 md:h-9', // Mobile-first 44px
}
```

Then use `size="touch"` for primary mobile actions. Alternatively, use a CSS approach:

```css
@media (pointer: coarse) {
  [data-slot="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

This would apply 44px minimum to all buttons on touch devices without per-component changes.
