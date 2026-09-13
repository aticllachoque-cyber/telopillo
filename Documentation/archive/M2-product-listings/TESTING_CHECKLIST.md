# M2 Product Listings - Manual Testing Checklist

**Milestone:** M2 - Product Listings  
**Version:** 1.0  
**Last Updated:** February 14, 2026  
**Status:** Ready for Testing

---

## Overview

This document provides a comprehensive manual testing checklist for M2: Product Listings. All tests should be performed on both desktop and mobile viewports.

**Test Environment:**
- **Browser:** Chrome, Firefox, Safari
- **Viewports:** 
  - Mobile: 375×667 (iPhone SE)
  - Tablet: 768×1024 (iPad)
  - Desktop: 1920×1080
- **Auth:** Use dev test account (`dev@telopillo.test` / `DevTest123`)

---

## 1. Product Creation Flow

### 1.1 Happy Path - Create Product

**Preconditions:** User is logged in

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1.1.1 | Navigate to `/publicar` | Page loads, form is visible | ⬜ |
| 1.1.2 | Fill title: "iPhone 13 Pro 128GB" | Title field shows text, character counter updates | ⬜ |
| 1.1.3 | Fill description (50+ chars) | Description field shows text, counter updates | ⬜ |
| 1.1.4 | Select category: "Electrónica y Tecnología" | Category selected, subcategory dropdown enabled | ⬜ |
| 1.1.5 | Select subcategory: "Celulares y Smartphones" | Subcategory selected | ⬜ |
| 1.1.6 | Enter price: 4500 | Price field shows 4500 | ⬜ |
| 1.1.7 | Select condition: "Usado - Como nuevo" | Radio button selected | ⬜ |
| 1.1.8 | Select department: "Santa Cruz" | Department selected | ⬜ |
| 1.1.9 | Enter city: "Santa Cruz de la Sierra" | City field shows text | ⬜ |
| 1.1.10 | Upload 3 images (valid JPG/PNG) | Images upload, previews show, progress visible | ⬜ |
| 1.1.11 | Click "Publicar Producto" | Product created, redirected to product detail page | ⬜ |
| 1.1.12 | Verify product appears in `/perfil/mis-productos` | Product listed with correct data | ⬜ |

### 1.2 Image Upload - Multiple Images

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1.2.1 | Upload 1 image | Image uploads, preview shows, "1/5 imágenes" | ⬜ |
| 1.2.2 | Upload 4 more images (total 5) | All 5 images show, "5/5 imágenes" | ⬜ |
| 1.2.3 | Try to upload 6th image | Toast warning: "Solo puedes subir 0 imagen(es) más" | ⬜ |
| 1.2.4 | Remove 2nd image | Image removed, "4/5 imágenes" | ⬜ |
| 1.2.5 | Reorder: Move 1st image right | Images reorder correctly | ⬜ |
| 1.2.6 | Reorder: Drag 3rd image to 1st position | Images reorder correctly | ⬜ |

### 1.3 Image Upload - Validation Errors

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1.3.1 | Upload file > 5MB | Toast error: "La imagen es muy grande..." | ⬜ |
| 1.3.2 | Upload .txt file | Toast error: "Tipo de archivo no permitido..." | ⬜ |
| 1.3.3 | Upload .gif file | Toast error: "Tipo de archivo no permitido..." | ⬜ |
| 1.3.4 | Upload 1×1px image | Toast error: "La imagen es muy pequeña..." | ⬜ |

### 1.4 Form Validation

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1.4.1 | Submit with empty title | Error: "El título debe tener al menos 10 caracteres" | ⬜ |
| 1.4.2 | Submit with title < 10 chars | Error: "El título debe tener al menos 10 caracteres" | ⬜ |
| 1.4.3 | Submit with description < 50 chars | Error: "La descripción debe tener al menos 50 caracteres" | ⬜ |
| 1.4.4 | Submit without category | Error: "Selecciona una categoría" | ⬜ |
| 1.4.5 | Submit with price = 0 | Error: "El precio debe ser mayor a 0" | ⬜ |
| 1.4.6 | Submit without condition | Error: "Selecciona el estado del producto" | ⬜ |
| 1.4.7 | Submit without department | Error: "Selecciona un departamento" | ⬜ |
| 1.4.8 | Submit without city | Error: "Ingresa la ciudad" | ⬜ |
| 1.4.9 | Submit without images | Error: "Sube al menos 1 imagen" | ⬜ |

---

## 2. Product Detail Page

### 2.1 View Product (Logged Out)

**Preconditions:** User is NOT logged in, product exists

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 2.1.1 | Navigate to `/productos/[id]` | Page loads, product details visible | ⬜ |
| 2.1.2 | Verify breadcrumbs | Breadcrumbs show: Inicio / Category / Product Title | ⬜ |
| 2.1.3 | Verify image gallery | Gallery shows all images, thumbnails visible | ⬜ |
| 2.1.4 | Click "Imagen siguiente" | Gallery advances to next image | ⬜ |
| 2.1.5 | Click "Imagen anterior" | Gallery goes back to previous image | ⬜ |
| 2.1.6 | Click thumbnail | Gallery jumps to selected image | ⬜ |
| 2.1.7 | Verify product info | Title, price, condition, location, views, date visible | ⬜ |
| 2.1.8 | Verify description | Full description visible | ⬜ |
| 2.1.9 | Verify seller card | Seller name, avatar, location visible | ⬜ |
| 2.1.10 | Click "Contactar Vendedor" | WhatsApp opens with pre-filled message and phone number | ⬜ |
| 2.1.11 | Click "Compartir" | WhatsApp share dialog opens | ⬜ |
| 2.1.12 | Verify owner actions NOT visible | Edit, Mark Sold, etc. buttons NOT shown | ⬜ |

### 2.2 View Product (Logged In as Owner)

**Preconditions:** User is logged in as product owner

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 2.2.1 | Navigate to own product | Page loads, "Este es tu producto" badge visible | ⬜ |
| 2.2.2 | Verify action buttons | Editar, Marcar como vendido, Marcar como inactivo, Eliminar visible | ⬜ |
| 2.2.3 | Verify seller card NOT visible | Seller card should not appear for own product | ⬜ |

### 2.3 View Product (Logged In as Non-Owner)

**Preconditions:** User is logged in but NOT the owner

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 2.3.1 | Navigate to another user's product | Page loads normally | ⬜ |
| 2.3.2 | Verify owner badge NOT visible | "Este es tu producto" badge NOT shown | ⬜ |
| 2.3.3 | Verify action buttons NOT visible | Edit, Mark Sold, etc. buttons NOT shown | ⬜ |
| 2.3.4 | Verify seller card visible | Seller card appears with contact button | ⬜ |

---

## 3. Product Edit Flow

### 3.1 Edit Product (Happy Path)

**Preconditions:** User is logged in as product owner

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 3.1.1 | Navigate to `/productos/[id]/editar` | Edit page loads, form pre-filled with product data | ⬜ |
| 3.1.2 | Verify all fields pre-filled | Title, description, category, price, etc. all populated | ⬜ |
| 3.1.3 | Verify images loaded | Existing images show in ImageUpload component | ⬜ |
| 3.1.4 | Change title to "iPhone 13 Pro 256GB" | Title updates | ⬜ |
| 3.1.5 | Change price to 5000 | Price updates | ⬜ |
| 3.1.6 | Remove 1st image | Image removed from preview | ⬜ |
| 3.1.7 | Upload new image | New image uploads and shows | ⬜ |
| 3.1.8 | Click "Actualizar Producto" | Product updated, redirected to product detail | ⬜ |
| 3.1.9 | Verify changes saved | New title, price, images visible on detail page | ⬜ |

### 3.2 Edit Product (Access Control)

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 3.2.1 | Logged out: Navigate to `/productos/[id]/editar` | Redirected to login page | ⬜ |
| 3.2.2 | Logged in as non-owner: Navigate to edit page | Error 403 or redirected | ⬜ |
| 3.2.3 | Navigate to non-existent product ID | Error 404 | ⬜ |

---

## 4. Product Management

### 4.1 My Products Page

**Preconditions:** User is logged in with at least 1 product

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 4.1.1 | Navigate to `/perfil/mis-productos` | Page loads, products listed | ⬜ |
| 4.1.2 | Verify product count | Count shows correct number (e.g., "3 productos") | ⬜ |
| 4.1.3 | Verify product cards | Each card shows image, title, price, status, location, views, date | ⬜ |
| 4.1.4 | Verify actions dropdown | Each card has visible "Acciones" button (mobile) | ⬜ |

### 4.2 Filters and Sorting

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 4.2.1 | Filter by "Activos" | Only active products shown | ⬜ |
| 4.2.2 | Filter by "Vendidos" | Only sold products shown | ⬜ |
| 4.2.3 | Filter by "Inactivos" | Only inactive products shown | ⬜ |
| 4.2.4 | Filter by "Todos" | All products shown (except deleted) | ⬜ |
| 4.2.5 | Sort by "Más recientes" | Products sorted newest first | ⬜ |
| 4.2.6 | Sort by "Más antiguos" | Products sorted oldest first | ⬜ |
| 4.2.7 | Sort by "Precio: menor a mayor" | Products sorted by price ascending | ⬜ |
| 4.2.8 | Sort by "Precio: mayor a menor" | Products sorted by price descending | ⬜ |

### 4.3 Product Actions

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 4.3.1 | Click "Acciones" dropdown | Dropdown opens with options | ⬜ |
| 4.3.2 | Click "Editar" | Redirected to edit page | ⬜ |
| 4.3.3 | Click "Marcar como vendido" | Confirmation dialog appears | ⬜ |
| 4.3.4 | Confirm "Marcar como vendido" | Product status changes to "Vendido", page refreshes | ⬜ |
| 4.3.5 | Click "Marcar como inactivo" | Confirmation dialog appears | ⬜ |
| 4.3.6 | Confirm "Marcar como inactivo" | Product status changes to "Inactivo", page refreshes | ⬜ |
| 4.3.7 | Click "Eliminar" | Confirmation dialog appears | ⬜ |
| 4.3.8 | Confirm "Eliminar" | Product removed from list, page refreshes | ⬜ |
| 4.3.9 | Cancel any action | Dialog closes, no changes made | ⬜ |

### 4.4 Empty States

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 4.4.1 | User with 0 products: Visit page | Empty state shows with "Publicar Nuevo" button | ⬜ |
| 4.4.2 | Filter shows 0 results | Empty state shows for that filter | ⬜ |

---

## 5. Security & RLS Testing

### 5.1 Row Level Security (RLS)

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 5.1.1 | Logged out: Try to create product via API | 403 Forbidden or auth error | ⬜ |
| 5.1.2 | Logged in: Create product | Product created with correct user_id | ⬜ |
| 5.1.3 | User A: Try to update User B's product via API | 403 Forbidden or no rows updated | ⬜ |
| 5.1.4 | User A: Try to delete User B's product via API | 403 Forbidden or no rows deleted | ⬜ |
| 5.1.5 | Anyone: View active product | Product visible | ⬜ |
| 5.1.6 | Non-owner: Try to view inactive product | 404 or access denied | ⬜ |
| 5.1.7 | Owner: View own inactive product | Product visible | ⬜ |

### 5.2 Storage RLS

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 5.2.1 | Logged out: Try to upload image | Auth error | ⬜ |
| 5.2.2 | Logged in: Upload image | Image uploads to `product-images/[user_id]/[filename]` | ⬜ |
| 5.2.3 | Anyone: View public image URL | Image loads | ⬜ |
| 5.2.4 | User A: Try to delete User B's image via API | 403 Forbidden | ⬜ |

---

## 6. UI/UX & Accessibility

### 6.1 Responsive Design

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 6.1.1 | Mobile (375px): View all pages | All content visible, no horizontal scroll | ⬜ |
| 6.1.2 | Mobile: Product gallery | Gallery navigable, controls visible | ⬜ |
| 6.1.3 | Mobile: Product form | All fields accessible, keyboard doesn't obscure inputs | ⬜ |
| 6.1.4 | Mobile: Product actions | Dropdown button visible, not hidden | ⬜ |
| 6.1.5 | Tablet (768px): View all pages | Layout adapts, 2-column grid for products | ⬜ |
| 6.1.6 | Desktop (1920px): View all pages | Layout uses full width, 3-column grid | ⬜ |

### 6.2 Loading States

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 6.2.1 | Navigate to `/perfil/mis-productos` | Loading spinner shows with "Cargando productos..." | ⬜ |
| 6.2.2 | Navigate to `/publicar` | Loading spinner shows with "Cargando..." | ⬜ |
| 6.2.3 | Upload image | Progress indicator shows during upload | ⬜ |
| 6.2.4 | Submit product form | Submit button shows loading state, disabled | ⬜ |
| 6.2.5 | Screen reader: Loading states | Announced via aria-live | ⬜ |

### 6.3 Error Handling

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 6.3.1 | Network error during product creation | Toast error notification appears | ⬜ |
| 6.3.2 | Network error during image upload | Error message shows on image preview | ⬜ |
| 6.3.3 | Invalid form submission | Validation errors show inline | ⬜ |
| 6.3.4 | Toast notification | Auto-dismisses after 5s, has close button | ⬜ |
| 6.3.5 | Screen reader: Error messages | Errors announced via aria-live | ⬜ |

### 6.4 Keyboard Navigation

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 6.4.1 | Tab through product form | All fields reachable, focus visible | ⬜ |
| 6.4.2 | Tab to image upload | Drag zone focusable, Enter opens file picker | ⬜ |
| 6.4.3 | Tab to image reorder buttons | Move Left/Right buttons focusable, Enter activates | ⬜ |
| 6.4.4 | Tab to product actions dropdown | Dropdown focusable, Enter opens menu | ⬜ |
| 6.4.5 | Arrow keys in dropdown | Navigate menu items | ⬜ |
| 6.4.6 | Tab through gallery | Navigation buttons and thumbnails focusable | ⬜ |
| 6.4.7 | Escape key in dialog | Closes confirmation dialogs | ⬜ |
| 6.4.8 | Skip link | Focus jumps to main content | ⬜ |

### 6.5 WCAG 2.2 AA Compliance

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 6.5.1 | Check focus indicators | All interactive elements have visible focus | ⬜ |
| 6.5.2 | Check color contrast | All text meets 4.5:1 ratio (7:1 for small text) | ⬜ |
| 6.5.3 | Check form labels | All inputs have associated labels | ⬜ |
| 6.5.4 | Check ARIA attributes | Proper use of aria-label, aria-hidden, role | ⬜ |
| 6.5.5 | Check touch targets | All buttons ≥44×44px on mobile | ⬜ |
| 6.5.6 | Check alt text | All images have descriptive alt text | ⬜ |
| 6.5.7 | Check semantic HTML | Proper use of headings, nav, main, etc. | ⬜ |
| 6.5.8 | Check status messages | aria-live regions for dynamic content | ⬜ |
| 6.5.9 | Screen reader: Navigate pages | All content accessible and announced | ⬜ |
| 6.5.10 | Screen reader: Fill form | All fields labeled and announced | ⬜ |

---

## 7. Performance Testing

### 7.1 Image Upload Performance

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 7.1.1 | Upload 1 image (2MB) | Completes in < 3s on fast connection | ⬜ |
| 7.1.2 | Upload 5 images (10MB total) | All complete in < 10s on fast connection | ⬜ |
| 7.1.3 | Upload 1 image (5MB) | Compressed before upload, < 1MB uploaded | ⬜ |
| 7.1.4 | Check uploaded image quality | Image quality acceptable (WebP, 85% quality) | ⬜ |

### 7.2 Page Load Times (Lighthouse)

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 7.2.1 | Run Lighthouse on `/publicar` | Performance > 85, Accessibility > 90 | ⬜ |
| 7.2.2 | Run Lighthouse on `/productos/[id]` | Performance > 85, Accessibility > 90 | ⬜ |
| 7.2.3 | Run Lighthouse on `/perfil/mis-productos` | Performance > 85, Accessibility > 90 | ⬜ |
| 7.2.4 | Check First Contentful Paint (FCP) | < 1.8s | ⬜ |
| 7.2.5 | Check Largest Contentful Paint (LCP) | < 2.5s | ⬜ |
| 7.2.6 | Check Cumulative Layout Shift (CLS) | < 0.1 | ⬜ |

---

## 8. Browser Compatibility

### 8.1 Desktop Browsers

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ⬜ | |
| Firefox | Latest | ⬜ | |
| Safari | Latest | ⬜ | |
| Edge | Latest | ⬜ | |

### 8.2 Mobile Browsers

| Browser | Device | Status | Notes |
|---------|--------|--------|-------|
| Safari | iPhone | ⬜ | |
| Chrome | Android | ⬜ | |
| Firefox | Android | ⬜ | |

---

## 9. Code Quality

### 9.1 Linting & Type Checking

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 9.1.1 | Run `npm run lint` | 0 ESLint errors | ⬜ |
| 9.1.2 | Run `npx tsc --noEmit` | 0 TypeScript errors | ⬜ |
| 9.1.3 | Check console for warnings | No React warnings in dev mode | ⬜ |

---

## 10. Automated Accessibility Testing

### 10.1 axe DevTools

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 10.1.1 | Run axe on `/publicar` | 0 critical violations | ⬜ |
| 10.1.2 | Run axe on `/productos/[id]` | 0 critical violations | ⬜ |
| 10.1.3 | Run axe on `/perfil/mis-productos` | 0 critical violations | ⬜ |

---

## Test Summary

**Total Test Cases:** 150+  
**Passed:** ___ / ___  
**Failed:** ___ / ___  
**Blocked:** ___ / ___  
**Not Tested:** ___ / ___

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Product Owner | | | |

---

## Notes

- Use ⬜ for not tested, ✅ for passed, ❌ for failed, ⚠️ for blocked
- Document any bugs found in GitHub Issues
- Retest failed cases after fixes
- Update this checklist as new features are added

---

**Document Version:** 1.0  
**Created:** February 14, 2026  
**Next Review:** After all tests completed
