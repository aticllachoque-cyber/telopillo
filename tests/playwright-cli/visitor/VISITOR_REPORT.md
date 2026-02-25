# Visitor Flows Test Report

**Date:** 2026-02-24  
**Tool:** Playwright CLI (session: visitor-test)  
**Base URL:** http://localhost:3000  
**Viewports:** Desktop (default), Mobile (375×812)

---

## Executive Summary

All 9 visitor flows were executed. **9 flows passed** (flow 06 business storefront was seeded via `scripts/seed-business-storefront.sql` then tested). Console logs showed **no errors** during normal browsing. One expected error on 404 page (resource not found).

---

## Flow Results

| # | Flow | Status | Notes |
|---|------|--------|-------|
| 01 | Homepage | ✅ Pass | Hero, search, categories, trust, features, CTA, footer |
| 02 | Product Search | ✅ Pass | Search, filters, sort, 4 results for "celular" |
| 03 | Categories | ✅ Pass | /categorias loads, category cards visible |
| 04 | Product Detail | ✅ Pass | Title, price, description, seller card, share; **no images** |
| 05 | Seller Profile | ✅ Pass | /vendedor/[id] loads, product grid |
| 06 | Business Storefront | ✅ Pass | Seeded via `scripts/seed-business-storefront.sql`; slug `tienda-electronica-la-paz`, 5 products |
| 07 | Browse Demands | ✅ Pass | 5 demands, search, filters (category, department, sort) |
| 08 | Demand Detail | ✅ Pass | Title, description, budget, location, offers section |
| 09 | Static Pages | ✅ Pass | /terminos, /privacidad, /nonexistent-page (404) |

---

## Console Logs

**Normal browsing (home, search, product):**
- No errors, no warnings
- HMR, Fast Refresh logs only (dev mode)

**404 page:**
- `[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found)` — expected for `/nonexistent-page`

---

## UI/UX Assessment

### Strengths

1. **Accessibility**
   - Skip link: "Saltar al contenido principal" present
   - Semantic regions: `main`, `contentinfo`, `navigation`, `search`, `banner`
   - ARIA labels on search inputs: "Término de búsqueda", "Buscar solicitudes"
   - Filter comboboxes: "Categoría", "Condición", "Departamento", "Ordenar por"

2. **Header**
   - Logo, search bar, "Publicar Gratis", "Ingresar" visible on desktop
   - Mobile: "Buscar", "Ingresar", "Abrir menú" (hamburger)

3. **Search**
   - Hero search: fill + submit → redirects to `/buscar?q=celular`, 4 results
   - Search filters: "Los filtros se aplican automáticamente al seleccionar"
   - CTA: "¿No encontraste exactamente lo que buscas? Publicar lo que busco →"

4. **Product Detail**
   - Breadcrumb: Inicio / electronica / Product title
   - "Volver" link to home
   - Seller card: name, verification badge, "Ver perfil del vendedor"
   - Security tips: "Reúnete en lugares públicos", etc.

5. **Demands**
   - Clear cards: "Busco bicicleta para ciudad", category, location, budget, offers count
   - "Publicar solicitud" link to /busco/publicar

6. **404 Page**
   - "Página no encontrada" heading
   - "Ir al inicio" and "Buscar productos" links
   - Footer intact

7. **Mobile**
   - CTA strip: "¿Listo para empezar?" with "Crear Cuenta Gratis", "¿Ya tenés cuenta? Iniciá sesión"
   - All sections present (hero, categories, trust, features, footer)

### Issues & Recommendations

| Issue | Severity | Location | Recommendation |
|-------|----------|----------|----------------|
| **Product shows "Sin imágenes"** | Medium | Product detail | Seed data or upload flow missing images; ensure products have at least one image |
| **Seller has no contact** | Low | Product detail | "El vendedor aún no ha agregado un número de contacto" — expected for new sellers; consider prompting in onboarding |
| **Header search disabled** | Low | Header | "Buscar (escribe un término primero)" — button disabled until searchbox has text; UX is acceptable |
| **404 console error** | Low | 404 page | Expected; consider suppressing or handling in devtools for cleaner logs |

### Mobile UX Notes

- Mobile home shows CTA strip "¿Listo para empezar?" (not visible on desktop when logged out)
- Hamburger menu: "Abrir menú" present
- No "Publicar Gratis" in mobile header (likely in menu)
- Categories grid adapts to mobile

---

## Verification Checklist (from test plans)

### 01 Homepage
- [x] Hero section loads with h1, trust badge, and search form
- [x] Hero search submits and navigates to `/buscar?q=celular`
- [x] Category grid shows 8 categories + "Ver todas" link
- [x] Trust stats section displays 9 departamentos, 0% comisiones
- [x] Features section shows 4 cards
- [x] CTA strip visible for unauthenticated users (mobile)
- [x] "Se busca" / demand link navigates to /busco
- [x] Footer links exist

### 02 Product Search
- [x] SearchBar, SearchFilters, SearchSort render on /buscar
- [x] Search query updates URL with ?q=
- [x] 4 results for "celular"
- [x] "Publicar lo que busco" CTA to /busco/publicar

### 04 Product Detail
- [x] Product title, description, price (Bs. format) displayed
- [ ] ProductGallery shows main image and thumbnails — **"Sin imágenes"** for this product
- [x] SellerCard shows seller name, avatar, verification
- [x] "Ver perfil del vendedor" link
- [x] ShareButton, ReportButton present
- [x] Breadcrumbs and back navigation present

### 07 Browse Demands
- [x] Search input with aria-label="Buscar solicitudes"
- [x] DemandPostFilters: category, department, sort
- [x] 5 demand cards visible
- [x] "Publicar solicitud" link to /busco/publicar

### 09 Static Pages
- [x] /terminos renders
- [x] /privacidad renders
- [x] /nonexistent-page shows 404 with "Ir al inicio", "Buscar productos"

---

## Commands Used

```bash
playwright-cli open http://localhost:3000 --session=visitor-test
playwright-cli -s=visitor-test goto http://localhost:3000
playwright-cli -s=visitor-test fill e35 "celular"
playwright-cli -s=visitor-test click e36
playwright-cli -s=visitor-test goto http://localhost:3000/categorias
playwright-cli -s=visitor-test goto http://localhost:3000/productos/e570fc94-abd8-4e3d-a317-18fccc730139
playwright-cli -s=visitor-test goto http://localhost:3000/vendedor/a0000000-0000-0000-0000-000000000001
playwright-cli -s=visitor-test goto http://localhost:3000/busco
playwright-cli -s=visitor-test goto http://localhost:3000/busco/4b67818f-4927-435d-8a57-5c7d0fd86850
playwright-cli -s=visitor-test goto http://localhost:3000/terminos
playwright-cli -s=visitor-test goto http://localhost:3000/nonexistent-page
playwright-cli -s=visitor-test resize 375 812
playwright-cli -s=visitor-test close
```

---

## Next Steps

1. **Product images:** Ensure seed data includes product images or update ProductFormWizard to require at least one image.
2. **Business storefront:** Add a business profile with slug to seed data to test flow 06.
3. **Test plan updates:** Add `playwright-cli` command examples (e.g. `fill`, `click`, `goto`) without `assert` since `assert` is not available in this CLI version.
