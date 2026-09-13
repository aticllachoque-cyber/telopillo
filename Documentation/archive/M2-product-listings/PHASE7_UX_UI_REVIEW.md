# M2 Phase 7: UX/UI Design Review

**Date:** February 13, 2026  
**Reviewer:** UX/UI Design Assessment  
**Scope:** Product Listings pages and components (M2)

---

## 1. Overall UX Assessment

### Summary

The M2 Product Listings implementation demonstrates **solid UX foundations** with clear information architecture, consistent use of the design system, and thoughtful user flows. The experience is generally intuitive and accessible. Several areas require attention—notably navigation consistency, mobile touch targets, and the SellerCard contact flow—but the overall quality is good and aligns with modern marketplace patterns.

### Strengths

- **Clear user flows** for create → view → edit product lifecycle
- **Consistent visual language** (Cards, Badges, Buttons from shadcn/ui)
- **Helpful contextual guidance** (tips on publicar page, safety tips on product detail)
- **Robust form validation** with inline feedback and character counters
- **Accessible patterns** (ARIA attributes, semantic HTML, keyboard support)
- **Loading and error states** implemented across pages

### Areas for Improvement

- Navigation route inconsistency (`/profile` vs `/perfil`)
- SellerCard contact flow (WhatsApp link without phone number)
- ProductGallery navigation visibility on touch devices
- ProductCard hover-only actions on mobile
- ImageUpload error feedback (use of `alert()`)

---

## 2. Specific Issues Found

### 2.1 Critical Issues

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| C1 | `SellerCard.tsx` | WhatsApp link uses `wa.me/?text=...` without seller phone number. The "Contactar Vendedor" button opens WhatsApp with only a pre-filled message but no recipient—user cannot actually contact the seller. | **High** – Core marketplace functionality broken |
| C2 | `mis-productos/page.tsx` | "Volver al perfil" links to `/profile` while Header uses `/perfil`. Route inconsistency may confuse users; `/perfil` may 404 if no `app/perfil/page.tsx` exists. | **Medium** – Navigation confusion, possible 404 |

### 2.2 Usability Issues

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| U1 | `ProductGallery.tsx` | Navigation arrows (prev/next) use `opacity-0 group-hover:opacity-100`—invisible on touch devices where hover doesn't exist. Users with multiple images cannot navigate on mobile. | **High** – Mobile users cannot browse gallery |
| U2 | `ProductCard.tsx` | ProductActions dropdown uses `opacity-0 group-hover:opacity-100`—actions (Edit, Mark sold, Delete) are hidden on touch devices. | **High** – Mobile users cannot manage products |
| U3 | `ImageUpload.tsx` | Uses `alert()` for validation errors (lines 61–72). Blocks UI, poor UX, not accessible. | **Medium** – Disruptive, non-accessible feedback |
| U4 | `ProductActions.tsx` | Uses `alert()` for update errors (line 89). Same concerns as U3. | **Medium** – Disruptive error feedback |
| U5 | `ProductForm.tsx` | Edit page wraps form in a Card on publicar but not on editar—inconsistent layout between create and edit. | **Low** – Visual inconsistency |

### 2.3 Accessibility Issues

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| A1 | `ProductGallery.tsx` | Image counter (`1/5`) has low contrast (white on `bg-black/70`)—may fail WCAG AA in some contexts. | **Low** |
| A2 | `ProductCard.tsx` | Quick actions button has `sr-only` "Acciones" but the dropdown trigger is 32px (8×8)—below 44×44px minimum for touch. | **Medium** – Small touch target |
| A3 | `ImageUpload.tsx` | Drag zone has `tabIndex={0}` but no visible focus ring when focused via keyboard. | **Low** |
| A4 | `ProductDetail` (productos/[id]) | Report button has no confirmation or feedback—users may accidentally report. | **Low** |

### 2.4 Visual Hierarchy & Consistency

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| V1 | `editar/page.tsx` | Form is not wrapped in a Card (unlike publicar). Edit page feels less structured. | **Low** |
| V2 | `ProductDetail` | Breadcrumbs and "Volver" link are redundant—both provide back navigation. | **Low** |
| V3 | `ProductCard` | Status badge (Activo/Vendido) uses color only—consider adding icon for colorblind users. | **Low** |

### 2.5 Empty States & Loading

| ID | Location | Issue | Impact |
|----|----------|-------|--------|
| E1 | `mis-productos` | Empty state message changes correctly by filter (Todos/Activos/Vendidos/Inactivos) but could be more actionable when filter returns no results. | **Low** |
| E2 | `ProductGallery` | "Sin imágenes" is minimal—could add illustration or guidance. | **Low** |
| E3 | All pages | Loading states use spinner + text—good. No skeleton loaders for content-heavy pages (product detail). | **Low** – Skeleton would improve perceived performance |

---

## 3. Recommendations for Improvements

### 3.1 Critical Fixes

**C1 – SellerCard WhatsApp Link**

- Fetch seller `phone` from `profiles` in the product query.
- Use `https://wa.me/591{phone}?text={message}` (591 = Bolivia country code) when phone exists.
- When phone is missing: show "Contactar" that links to seller's profile page, or display "Número no disponible" with a note to complete profile.

**C2 – Navigation Route Consistency**

- Standardize: use either `/profile` or `/perfil` across the app.
- If `/perfil` is preferred: add `app/perfil/page.tsx` that redirects to `/profile` (or duplicate profile content).
- Update `mis-productos` "Volver al perfil" to match Header (e.g. both use `/profile` or both use `/perfil`).

### 3.2 Usability Improvements

**U1 – ProductGallery Mobile Navigation**

- Always show prev/next arrows on mobile (remove hover-only).
- Or: use `opacity-70` by default, `opacity-100` on hover.
- Add swipe gestures for mobile (optional, higher effort).

**U2 – ProductCard Actions on Mobile**

- Always show the actions menu icon (remove `opacity-0 group-hover`).
- Or: add a visible "⋮" button that's always shown on small screens.

**U3 & U4 – Replace alert() with Inline Feedback**

- Use toast notifications (e.g. sonner, react-hot-toast) or inline error banners.
- ImageUpload: show validation errors below the drop zone.
- ProductActions: show error in a non-blocking toast.

**U5 – Edit Page Layout**

- Wrap ProductForm in a Card on the edit page, matching publicar for consistency.

### 3.3 Accessibility Improvements

**A2 – Touch Target Size**

- Increase ProductActions trigger to at least 44×44px on touch devices.
- Use `min-h-[44px] min-w-[44px]` or `touch-manipulation` for tap targets.

**A3 – ImageUpload Focus**

- Add `focus-visible:ring-2 focus-visible:ring-primary` to the drop zone for keyboard users.

**A4 – Report Button**

- Add confirmation dialog before submitting report.
- Provide success feedback after report.

### 3.4 Nice-to-Have Enhancements

- **Skeleton loaders** for product detail and gallery while loading.
- **Swipe gestures** in ProductGallery on mobile.
- **Keyboard shortcuts** in ProductGallery (arrow keys to navigate images).
- **Progress indicator** on publicar page for long forms (e.g. "Step 3 of 6").
- **Link to seller profile** from SellerCard (e.g. `/profile/[id]`).

---

## 4. Best Practices Being Followed

### 4.1 User Flow & Navigation

- Clear back links ("Volver al inicio", "Volver al producto", "Volver al perfil").
- Breadcrumbs on product detail (Inicio > Categoría > Producto).
- Logical flow: Create → View → Edit with consistent entry/exit points.
- Redirect after login with `?redirect=` for protected routes.

### 4.2 Form Usability

- Required fields marked with `*` and explained in CardDescription.
- Inline validation with `aria-invalid` and `aria-describedby`.
- Character counters (title 0/100, description 0/5000).
- Help text for constraints (e.g. "Mínimo 10 caracteres").
- Disabled state on submit to prevent double submission.
- Sensible defaults (e.g. subcategory resets when category changes).

### 4.3 Visual Hierarchy

- Clear heading structure (h1 for page title, h2 for sections).
- Price emphasized with `text-4xl` and `text-primary`.
- Card-based layout for scannable content.
- Consistent spacing (`space-y-6`, `gap-4`, `p-6`).
- Status badges with distinct variants (default, secondary, outline, destructive).

### 4.4 Mobile Responsiveness

- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for ProductGrid.
- Stacked layout on mobile for product detail (gallery + info, then seller card).
- Sticky seller card on desktop (`sticky top-8`).
- Touch-friendly buttons (most use `size="lg"` or adequate padding).
- Container max-widths (`max-w-4xl`, `max-w-7xl`) for readability.

### 4.5 Loading & Error States

- Full-page loading with spinner and descriptive text ("Cargando...", "Cargando producto...").
- Error state on edit page with recovery actions (Mis Productos, Ir al Inicio).
- Form-level error banner with icon and message.
- ImageUpload: per-image loading overlay and error overlay.
- ProductActions: loading state on buttons during processing.

### 4.6 Empty States

- Mis productos: Illustration (Package icon), clear message, CTA ("Publicar Producto").
- Context-aware message when filter returns no results.
- ProductGallery: "Sin imágenes" fallback when no images.

### 4.7 Call-to-Action Placement

- Primary CTA prominent ("Publicar Producto", "Guardar Cambios", "Contactar Vendedor").
- Secondary actions available (Cancelar, Compartir, Reportar).
- "Publicar Nuevo" in header of mis-productos for quick access.
- Empty state CTA leads directly to create flow.

### 4.8 Consistency with Design System

- shadcn/ui components used throughout (Card, Button, Input, Select, Badge, etc.).
- Lucide icons for visual consistency.
- Tailwind utility classes aligned with design tokens.
- Gradient background (`bg-gradient-to-b from-background to-muted/20`) consistent across pages.
- Consistent typography (font-bold, font-semibold, text-muted-foreground).

### 4.9 Accessibility

- `aria-label` on icon-only buttons (e.g. "Imagen anterior", "Acciones").
- `aria-hidden` on decorative icons.
- `role="alert"` on error messages.
- `aria-invalid` and `aria-describedby` on form fields.
- Semantic HTML (form, label, button, nav).
- Focus management in modals (AlertDialog from Radix).

### 4.10 Confirmation Dialogs

- Destructive actions (Delete, Mark sold, Mark inactive) use AlertDialog.
- Clear titles and descriptions.
- Cancel and Confirm options.
- Disabled state during processing.

---

## 5. Testing Recommendations

### 5.1 Usability Testing Scenarios

1. **Create product flow** – New user completes form from start to finish on mobile.
2. **Edit product** – User finds their product, edits, and verifies changes.
3. **Manage products** – User filters, sorts, and performs actions (sold, inactive, delete) on mobile.
4. **View product** – User browses gallery, reads description, attempts to contact seller.
5. **Empty states** – New user with no products; user with filter returning no results.

### 5.2 Accessibility Testing Checklist

- [ ] Keyboard-only navigation through all product flows.
- [ ] Screen reader (NVDA/VoiceOver) on product detail and form.
- [ ] Color contrast (axe DevTools or WAVE) on all product pages.
- [ ] Touch target size (44×44px minimum) on mobile.
- [ ] Focus visible on all interactive elements.

### 5.3 Cross-Device Testing

- [ ] Mobile (375px): Gallery nav, ProductCard actions, form layout.
- [ ] Tablet (768px): Grid columns, sticky seller card.
- [ ] Desktop (1280px+): Full layout, hover states.

### 5.4 Success Metrics to Track

- Form completion rate (publicar).
- Time to complete product creation.
- Error rate on form submission.
- Contact button click-through (when phone is available).
- Product action success rate (edit, mark sold, delete).

---

## 6. Appendix: File Reference

| File | Purpose |
|------|---------|
| `app/publicar/page.tsx` | Product creation page |
| `app/productos/[id]/page.tsx` | Product detail page |
| `app/productos/[id]/editar/page.tsx` | Product edit page |
| `app/perfil/mis-productos/page.tsx` | My products listing |
| `components/products/ProductForm.tsx` | Create/edit form |
| `components/products/ProductCard.tsx` | Product card in grid |
| `components/products/ProductGallery.tsx` | Image gallery |
| `components/products/SellerCard.tsx` | Seller info & contact |
| `components/products/ProductActions.tsx` | Edit/sold/delete actions |
| `components/products/ImageUpload.tsx` | Image upload with drag-drop |
| `components/products/ProductGrid.tsx` | Grid layout for cards |
| `components/products/ShareButton.tsx` | Share via WhatsApp |
