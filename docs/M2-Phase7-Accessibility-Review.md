# M2 Product Listings — WCAG 2.2 AA Accessibility Review

**Review Date:** February 13, 2025  
**Scope:** Product creation, detail, edit, and listing pages and components  
**Standard:** WCAG 2.2 Level AA

---

## 1. Overall Accessibility Assessment

The M2 Product Listings implementation shows **solid accessibility foundations** with good use of semantic HTML, ARIA attributes, form labels, and keyboard support. Several areas need improvement to achieve full WCAG 2.2 AA compliance, particularly around focus management, interactive element visibility, error handling, and some missing ARIA patterns.

**Summary:**  
- **Strengths:** Semantic structure, skip link, form labels, image alt text, role="alert" for errors  
- **Gaps:** ProductGallery hover-only controls, ProductCard dropdown hover-only, ImageUpload drag-only reorder, error announcements, some touch targets, loading state announcements

---

## 2. Critical Issues (WCAG Level A Failures)

### 2.1 ProductGallery — Navigation controls hidden until hover (2.1.1 Keyboard)

**Location:** `components/products/ProductGallery.tsx` (lines 51–67)

**Issue:** Previous/Next buttons use `opacity-0 group-hover:opacity-100`, so they are invisible and unreachable for keyboard users until the gallery receives hover focus.

**WCAG Criterion:** 2.1.1 Keyboard (Level A)

**Current code:**
```tsx
<Button
  variant="secondary"
  size="icon"
  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
  onClick={handlePrevious}
  aria-label="Imagen anterior"
>
```

**Recommendation:** Always show controls for keyboard users, or ensure they are focusable and visible on focus:

```tsx
<Button
  variant="secondary"
  size="icon"
  className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
  onClick={handlePrevious}
  aria-label="Imagen anterior"
>
```

Or use `focus-visible:opacity-100` so controls appear when any element in the gallery receives focus.

---

### 2.2 ProductCard — ProductActions dropdown only on hover (2.1.1 Keyboard)

**Location:** `components/products/ProductCard.tsx` (lines 58–70)

**Issue:** The actions menu is inside a `Link` and uses `opacity-0 group-hover:opacity-100`. It is not keyboard accessible and can trap focus.

**WCAG Criterion:** 2.1.1 Keyboard (Level A)

**Current code:**
```tsx
<div
  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
  onClick={(e) => e.preventDefault()}
>
  <ProductActions ... variant="dropdown" />
</div>
```

**Recommendation:**  
- Move the actions trigger outside the link or make it a separate focusable control.  
- Ensure the dropdown is reachable via Tab and visible on focus.  
- Use `group-focus-within:opacity-100` or always show the trigger for cards with actions.

---

### 2.3 ImageUpload — Reorder only via drag (2.5.7 Dragging Movements)

**Location:** `components/products/ImageUpload.tsx` (lines 186–209, 274–348)

**Issue:** Reordering is only possible by dragging. WCAG 2.2 2.5.7 requires a single-pointer alternative (e.g. move up/down buttons).

**WCAG Criterion:** 2.5.7 Dragging Movements (Level AA)

**Recommendation:** Add move up/down buttons for each image:

```tsx
<Button
  type="button"
  variant="ghost"
  size="icon"
  onClick={() => handleMoveUp(index)}
  disabled={index === 0}
  aria-label={`Mover imagen ${index + 1} hacia arriba`}
>
  <ChevronUp className="h-4 w-4" aria-hidden />
</Button>
<Button
  type="button"
  variant="ghost"
  size="icon"
  onClick={() => handleMoveDown(index)}
  disabled={index === previews.length - 1}
  aria-label={`Mover imagen ${index + 1} hacia abajo`}
>
  <ChevronDown className="h-4 w-4" aria-hidden />
</Button>
```

---

### 2.4 ProductActions — Error feedback via `alert()` (4.1.3 Status Messages)

**Location:** `components/products/ProductActions.tsx` (line 89)

**Issue:** Errors are shown with `alert()`, which is not announced as a status message by assistive technologies in a consistent way.

**WCAG Criterion:** 4.1.3 Status Messages (Level AA)

**Current code:**
```tsx
} catch (err) {
  console.error('Error updating product:', err)
  alert('Error al actualizar el producto')
}
```

**Recommendation:** Use an `aria-live` region and render the error in the DOM:

```tsx
const [error, setError] = useState<string | null>(null)
// In catch:
setError('Error al actualizar el producto')

// In JSX:
{error && (
  <div role="alert" aria-live="assertive" className="...">
    {error}
  </div>
)}
```

---

### 2.5 ImageUpload — Remove button hidden until hover (2.1.1 Keyboard)

**Location:** `components/products/ImageUpload.tsx` (lines 329–343)

**Issue:** Remove button uses `opacity-0 group-hover:opacity-100`, so it is not visible when focused via keyboard.

**WCAG Criterion:** 2.1.1 Keyboard (Level A)

**Recommendation:** Make the remove button visible on focus:

```tsx
className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
```

---

## 3. Important Issues (WCAG Level AA Failures)

### 3.1 Loading states not announced (4.1.3 Status Messages)

**Locations:**  
- `app/publicar/page.tsx` (lines 46–55)  
- `app/productos/[id]/editar/page.tsx` (lines 88–96)  
- `app/perfil/mis-productos/page.tsx` (lines 111–119)

**Issue:** Loading spinners have no `aria-live` region or `aria-busy`, so screen reader users are not informed that content is loading.

**WCAG Criterion:** 4.1.3 Status Messages (Level AA)

**Recommendation:**

```tsx
<div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite" aria-busy="true">
  <div className="text-center">
    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" aria-hidden />
    <p className="text-muted-foreground mt-4" id="loading-message">Cargando...</p>
  </div>
</div>
```

---

### 3.2 ProductGallery — Image counter not announced (1.1.1 Non-text Content)

**Location:** `components/products/ProductGallery.tsx` (lines 70–72)

**Issue:** The image counter (`1 / 5`) is visual only. Screen reader users may not know which image is shown or how many there are.

**Recommendation:** Add `aria-label` to the main image or a live region:

```tsx
<div
  className="absolute bottom-4 right-4 ..."
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Imagen {selectedIndex + 1} de {images.length}
</div>
```

---

### 3.3 Breadcrumbs — Missing semantic structure (1.3.1 Info and Relationships)

**Location:** `app/productos/[id]/page.tsx` (lines 116–126)

**Issue:** Breadcrumbs are implemented as plain `Link` and `span` elements without `nav` or `aria-label`.

**WCAG Criterion:** 1.3.1 Info and Relationships (Level A)

**Recommendation:**

```tsx
<nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
  <ol className="flex items-center gap-2">
    <li><Link href="/">Inicio</Link></li>
    <li><span aria-hidden>/</span></li>
    <li><Link href={`/categorias/${product.category}`}>{categoryName}</Link></li>
    <li><span aria-hidden>/</span></li>
    <li aria-current="page"><span className="text-foreground truncate">{product.title}</span></li>
  </ol>
</nav>
```

---

### 3.4 Product detail — Report button has no handler (2.1.1 Keyboard)

**Location:** `app/productos/[id]/page.tsx` (lines 216–219)

**Issue:** The "Reportar" button has no `onClick` or `href`, so it does nothing. This can confuse users and assistive technologies.

**Recommendation:** Either implement the report flow or remove the button until it is functional.

---

### 3.5 ShareButton — No accessible name for icon-only context (2.4.4 Link Purpose)

**Location:** `components/products/ShareButton.tsx`

**Issue:** The button includes both icon and text, so it is acceptable. If it were icon-only, it would need an `aria-label`. Current implementation is fine; ensure the button text "Compartir" is visible and not truncated.

---

### 3.6 ProductForm — ImageUpload label association (3.3.2 Labels or Instructions)

**Location:** `components/products/ProductForm.tsx` (lines 374–386)

**Issue:** The Images label is not associated with the `ImageUpload` component via `htmlFor`/`id` or `aria-labelledby`.

**Recommendation:** Add an `id` to the upload zone and associate the label:

```tsx
<Label id="images-label">Imágenes del Producto <span className="text-destructive">*</span></Label>
<ImageUpload
  id="images"
  aria-labelledby="images-label"
  aria-describedby={errors.images ? "images-error" : undefined}
  ...
/>
```

---

### 3.7 Touch target size (2.5.8 Target Size — Minimum)

**Locations:**  
- ProductGallery prev/next buttons: `size="icon"` (typically 36px) — acceptable  
- ProductActions dropdown trigger: `h-8 w-8` (32px) — slightly below 24×24 CSS px minimum; 24×24 is the minimum, so 32px is acceptable  
- ImageUpload remove button: `h-8 w-8` (32px) — acceptable  

**Recommendation:** Verify all interactive elements meet at least 24×24 CSS pixels. Current sizes appear compliant; document in testing.

---

## 4. Enhancements (Best Practices / AAA)

### 4.1 Product detail — Landmark structure

**Recommendation:** Wrap the main content in `<article>` and use `aria-label` for the product section:

```tsx
<article aria-label={`Producto: ${product.title}`}>
  ...
</article>
```

---

### 4.2 ProductGrid — List semantics

**Location:** `components/products/ProductGrid.tsx`

**Recommendation:** Use a list for the product grid:

```tsx
<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
  {products.map((product) => (
    <li key={product.id}>
      <ProductCard ... />
    </li>
  ))}
</ul>
```

---

### 4.3 Focus management after form submit

**Location:** `components/products/ProductForm.tsx`

**Recommendation:** After successful submit/redirect, ensure focus moves to the new page’s main heading or a success message. Next.js navigation handles this; verify no focus trap remains.

---

### 4.4 SellerCard — WhatsApp link context

**Location:** `components/products/SellerCard.tsx` (lines 65–74)

**Recommendation:** Add `rel="noopener noreferrer"` (already present) and consider `aria-label` for clarity:

```tsx
<a
  href={getWhatsAppLink()}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`Contactar a ${seller.full_name || 'vendedor'} por WhatsApp sobre ${productTitle}`}
  className="..."
>
```

---

## 5. Best Practices Being Followed

| Practice | Implementation |
|----------|----------------|
| **Skip link** | `Saltar al contenido principal` in root layout |
| **Page language** | `lang="es"` on `<html>` |
| **Main landmark** | `<main id="main-content">` |
| **Form labels** | `Label` with `htmlFor` for inputs in ProductForm |
| **Error association** | `aria-invalid`, `aria-describedby`, `id` on error messages |
| **Required fields** | Visual `*` and `aria-required` where applicable |
| **Decorative icons** | `aria-hidden` on Lucide icons |
| **Image alt text** | Product title in ProductCard, descriptive alt in ProductGallery |
| **Button labels** | Descriptive text or `aria-label` (e.g. ProductActions dropdown) |
| **Alert dialogs** | Radix AlertDialog with proper roles and focus management |
| **Error alerts** | `role="alert"` on ProductForm error block |
| **Focus styles** | Button/Input use `focus-visible:ring` |
| **Select components** | Radix Select with keyboard support |
| **Radio groups** | Proper `RadioGroupItem` + `Label` association |

---

## 6. Testing Recommendations

### 6.1 Keyboard testing

1. Tab through all pages and confirm logical order.  
2. Use only keyboard to: create product, edit product, open ProductActions, navigate gallery.  
3. Confirm no keyboard traps in modals or dropdowns.  
4. Confirm Escape closes dialogs and menus.

### 6.2 Screen reader testing

- **NVDA (Windows):** Forms, errors, loading states, gallery navigation.  
- **VoiceOver (macOS/iOS):** Product cards, actions menu, image upload.  
- **TalkBack (Android):** Touch targets and gestures.

### 6.3 Automated tools

- **axe DevTools:** Run on `/publicar`, `/productos/[id]`, `/productos/[id]/editar`, `/perfil/mis-productos`.  
- **Lighthouse:** Accessibility audit.  
- **WAVE:** Structural and contrast checks.

### 6.4 Manual checks

- Zoom to 200% and verify layout and functionality.  
- Check color contrast (e.g. `text-muted-foreground` on background).  
- Verify focus indicators (min 2px, 3:1 contrast).

---

## 7. Priority Fix Order

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | ProductGallery controls visible on focus | Low |
| P0 | ProductCard actions keyboard accessible | Medium |
| P0 | ImageUpload remove button visible on focus | Low |
| P1 | ImageUpload reorder buttons (2.5.7) | Medium |
| P1 | ProductActions error via aria-live | Low |
| P1 | Loading state announcements | Low |
| P2 | Breadcrumb semantics | Low |
| P2 | ProductForm ImageUpload label association | Low |
| P2 | Report button implementation or removal | Medium |

---

## 8. Compliance Summary

| WCAG Principle | Status | Notes |
|----------------|--------|-------|
| **1. Perceivable** | Partial | Alt text good; some status info not announced |
| **2. Operable** | Partial | Hover-only controls block keyboard use |
| **3. Understandable** | Good | Labels, errors, language set |
| **4. Robust** | Partial | Some status messages and semantics missing |

**Estimated compliance:** ~75% WCAG 2.2 AA. Addressing P0 and P1 items should bring the product listings flow to full AA compliance.
