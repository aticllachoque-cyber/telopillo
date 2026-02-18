# WCAG 2.2 AA Accessibility Audit: Product Publishing Flow

**Date:** February 17, 2026  
**Scope:** `/publicar` page, ProductFormWizard, ProductForm, ImageUpload, validation schemas  
**Standard:** WCAG 2.2 Level AA

---

## Executive Summary

The product publishing flow has a solid accessibility foundation with proper form structure, error association, and keyboard support. However, several **critical** and **high** issues must be addressed for full WCAG 2.2 AA compliance, particularly around required field announcements, status messages for async operations, and the ImageUpload component's label association.

---

## CRITICAL Violations (WCAG Level A Failures)

### C1. Required fields lack `aria-required` (1.3.1 Info and Relationships, 3.3.2 Labels or Instructions)

**WCAG:** 1.3.1, 3.3.2  
**Impact:** Screen readers do not announce required status; users may submit incomplete forms.

**Location:** 
- `components/products/ProductFormWizard.tsx` (lines 356–600)
- `components/products/ProductForm.tsx` (lines 163–390)

**Current code (ProductFormWizard.tsx:356-368):**
```tsx
<Label htmlFor="title">
  Título del Producto <span className="text-destructive">*</span>
</Label>
<Input
  id="title"
  {...register('title')}
  placeholder="Ej: iPhone 13 Pro Max 256GB"
  // Missing: aria-required="true"
```

**Fix:**
```tsx
<Input
  id="title"
  {...register('title')}
  placeholder="Ej: iPhone 13 Pro Max 256GB"
  aria-required="true"
  aria-invalid={errors.title ? 'true' : 'false'}
  aria-describedby={errors.title ? 'title-error' : 'title-help'}
/>
```

**Fields to update:** title, description, category, price, condition, location_department, location_city. For Select components, add `required` or `aria-required="true"` to SelectTrigger. For RadioGroup, add `aria-required="true"` to the RadioGroup root. For ImageUpload, pass `aria-required="true"` to the upload zone when `error` indicates it's required.

---

### C2. ImageUpload label not programmatically associated (1.3.1 Info and Relationships)

**WCAG:** 1.3.1  
**Impact:** Screen readers cannot associate "Imágenes del Producto" with the upload control.

**Location:** `components/products/ImageUpload.tsx` (lines 248–276), `ProductFormWizard.tsx` (lines 428–432)

**Current code:** The Label wraps text but has no `htmlFor`; the upload zone uses `aria-label="Zona de carga de imágenes"` which is generic and doesn't include "required."

**Fix:** Add `id="images-label"` to the parent Label and pass it to ImageUpload:

```tsx
// ProductFormWizard.tsx
<div className="space-y-2">
  <Label id="images-label">
    Imágenes del Producto <span className="text-destructive">*</span>
  </Label>
  <ImageUpload
    id="images-upload"
    labelledBy="images-label"
    ariaRequired={!!errors.images}
    ...
  />
</div>
```

```tsx
// ImageUpload.tsx - update the upload zone
<div
  id={id}
  aria-labelledby={labelledBy}
  aria-required={ariaRequired}
  aria-invalid={!!error}
  aria-describedby={error ? 'images-error' : undefined}
  ...
>
```

And add `id="images-error"` to the error element when present.

---

### C3. Image upload status messages not announced (4.1.3 Status Messages)

**WCAG:** 4.1.3  
**Impact:** Screen reader users are not informed of upload progress or per-image errors.

**Location:** `components/products/ImageUpload.tsx` (lines 354–368, 363–368)

**Current code:**
```tsx
{preview.uploading && (
  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" aria-hidden />
      <p className="text-xs text-muted-foreground">Subiendo...</p>
    </div>
  </div>
)}
{preview.error && (
  <div className="absolute inset-0 bg-destructive/10 ...">
    <p className="text-xs text-destructive text-center">{preview.error}</p>
  </div>
)}
```

**Fix:**
```tsx
{preview.uploading && (
  <div className="absolute inset-0 ..." role="status" aria-live="polite" aria-busy="true">
    <p className="text-xs text-muted-foreground">Subiendo imagen {index + 1}...</p>
  </div>
)}
{preview.error && (
  <div className="absolute inset-0 ..." role="alert" aria-live="assertive">
    <p className="text-xs text-destructive text-center">{preview.error}</p>
  </div>
)}
```

---

## HIGH Issues (WCAG Level AA Failures / Significant Barriers)

### H1. Duplicate image validation error (3.3.1 Error Identification)

**WCAG:** 3.3.1  
**Impact:** Redundant error text; possible confusion and duplicate announcements.

**Location:** `components/products/ProductFormWizard.tsx` (lines 428–432)

**Current code:**
```tsx
<ImageUpload error={errors.images?.message} ... />
{errors.images && <p className="text-sm text-destructive">{errors.images.message}</p>}
```

**Fix:** Remove the duplicate. ImageUpload already displays the error. Ensure ImageUpload's error has `id="images-error"` and the upload zone has `aria-describedby="images-error"` when `error` is present.

---

### H2. ImageUpload upload zone missing `aria-disabled` when disabled (4.1.2 Name, Role, Value)

**WCAG:** 4.1.2  
**Impact:** Screen readers may not announce disabled state.

**Location:** `components/products/ImageUpload.tsx` (lines 248–276)

**Fix:**
```tsx
<div
  ...
  aria-disabled={disabled}
  ...
>
```

---

### H3. Progress bar missing `aria-valuetext` (1.3.1 Info and Relationships)

**WCAG:** 1.3.1  
**Impact:** Step progress is less clear for screen reader users.

**Location:** `components/products/ProductFormWizard.tsx` (lines 294–306)

**Current code:**
```tsx
<div
  role="progressbar"
  aria-valuenow={currentStep}
  aria-valuemin={1}
  aria-valuemax={4}
>
```

**Fix:**
```tsx
<div
  role="progressbar"
  aria-valuenow={currentStep}
  aria-valuemin={1}
  aria-valuemax={4}
  aria-valuetext={`Paso ${currentStep} de ${STEPS.length}`}
>
```

---

### H4. No focus management on validation failure (2.4.3 Focus Order)

**WCAG:** 2.4.3  
**Impact:** Keyboard users may not be directed to the first invalid field.

**Location:** `components/products/ProductFormWizard.tsx` (lines 118–125, 133–154)

**Fix:** After `trigger()` returns invalid, focus the first field with an error:

```tsx
const handleNext = async () => {
  const fieldsToValidate = STEP_FIELDS[currentStep] ?? []
  if (fieldsToValidate.length > 0) {
    const isValid = await trigger(fieldsToValidate)
    if (!isValid) {
      const firstError = Object.keys(errors)[0]
      if (firstError) {
        const el = document.getElementById(firstError)
        el?.focus()
      }
      return
    }
  }
  ...
}
```

Note: `errors` from `formState` updates asynchronously; consider using `trigger`'s result to get the first invalid field and its associated element.

---

### H5. Reorder/remove buttons below 24px on desktop (2.5.8 Target Size)

**WCAG:** 2.5.8  
**Impact:** Touch targets may be too small on desktop.

**Location:** `components/products/ImageUpload.tsx` (lines 377–419)

**Current code:** `md:h-8 md:w-8` = 32px, which meets 24px. However, `md:min-h-0 md:min-w-0` overrides the 44px mobile size to 32px on desktop. 32px ≥ 24px, so this meets AA. Re-check: the classes are `min-h-[44px] min-w-[44px] h-11 w-11 md:h-8 md:w-8 md:min-h-0 md:min-w-0`. So on desktop we get h-8 w-8 = 32px. **Meets 24px minimum.** Downgrade to MEDIUM: consider 44px for AAA.

---

### H6. Form error alert not focused on submission failure (2.4.3, 3.3.1)

**WCAG:** 2.4.3, 3.3.1  
**Impact:** Users may miss the error after submit.

**Location:** `components/products/ProductFormWizard.tsx` (lines 328–339, 205–211)

**Fix:** After `setError()`, focus the alert and ensure it has `tabIndex={-1}` so it can receive focus:

```tsx
{error && (
  <div
    ref={errorAlertRef}
    tabIndex={-1}
    role="alert"
    className="..."
    aria-live="assertive"
  >
```

Then in the catch block: `errorAlertRef.current?.focus()`.

---

## MEDIUM Issues (Degraded Experience)

### M1. Missing `autocomplete` on location fields (1.3.5 Identify Input Purpose)

**WCAG:** 1.3.5 (Level AA)  
**Impact:** Minor; mainly applies to user address. Product location is product data, not user data, so autocomplete may not apply. Optional improvement.

**Location:** `components/products/ProductFormWizard.tsx` (line 592)

**Optional fix:**
```tsx
<Input
  id="location_city"
  {...register('location_city')}
  autoComplete="address-level2"
  ...
/>
```

---

### M2. Help text excluded when error is shown (1.3.1)

**WCAG:** 1.3.1  
**Impact:** When `aria-describedby` switches to the error ID only, help text is no longer announced. Error takes priority; acceptable but could be improved.

**Location:** Multiple fields in ProductFormWizard

**Optional fix:** Include both when there is an error:
```tsx
aria-describedby={errors.title ? 'title-error title-help' : 'title-help'}
```

---

### M3. Toast close button size (2.5.8)

**Location:** `components/ui/toast.tsx` (line 70)

**Current:** `size-6` = 24px. Meets 24px minimum. No change needed for AA.

---

### M4. Emoji in category/tips (1.1.1)

**Location:** `ProductFormWizard.tsx` (lines 406–407, 437–442)

**Current:** `{cat.icon} {cat.name}` uses emoji. Emoji may be read by screen readers. Consider `aria-hidden` on the emoji span if decorative, or ensure the name is sufficient.

**Fix:** Wrap emoji in `<span aria-hidden="true">` if decorative:
```tsx
<span aria-hidden="true">{cat.icon}</span> {cat.name}
```

---

### M5. Image preview alt text could be more descriptive (1.1.1)

**Location:** `components/products/ImageUpload.tsx` (line 349)

**Current:** `alt={`Imagen ${index + 1}`}`

**Enhancement:** Include product context when available, e.g. `Imagen ${index + 1} del producto`.

---

## LOW Issues (Best Practice Improvements)

### L1. Character count not in live region

**Impact:** Screen readers do not hear live updates of character count. Not required by WCAG.

**Optional:** Add `aria-live="polite"` to the character count element if you want it announced.

---

### L2. `lang` attribute on page

**Location:** `app/layout.tsx`  
**Current:** `lang="es"` on `<html>`. Correct for Spanish content.

---

### L3. Skip link present

**Location:** `app/layout.tsx` (lines 26–30)  
**Current:** Skip link to `#main-content` with focus styles. Good.

---

## Summary of Required Fixes

| Priority | Count | Action |
|----------|-------|--------|
| CRITICAL | 3 | Add aria-required, fix ImageUpload label/association, add status announcements |
| HIGH | 5 | Remove duplicate error, aria-disabled, aria-valuetext, focus management, error focus |
| MEDIUM | 4 | Optional autocomplete, help+error describedby, emoji handling, alt text |
| LOW | 2 | Optional enhancements |

---

## Testing Recommendations

1. **Keyboard:** Tab through the entire flow; use Enter/Space on the upload zone; use reorder buttons.
2. **Screen reader:** NVDA/JAWS (Windows) or VoiceOver (macOS) on all steps, including upload and validation.
3. **axe DevTools:** Run on `/publicar` at each step.
4. **Zoom:** Test at 200% zoom for 1.4.4 Resize Text.
5. **Touch:** Verify 24px minimum touch targets on mobile.

---

## Files to Modify

1. `components/products/ProductFormWizard.tsx` – aria-required, focus management, progress bar, error focus, ImageUpload props
2. `components/products/ProductForm.tsx` – aria-required (if used)
3. `components/products/ImageUpload.tsx` – label association, status announcements, aria-disabled, error ID
