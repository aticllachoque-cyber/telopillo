# Identification — vitrina-seller-catalog

**Fecha:** 2026-09-28 · **Branch auditado:** feat/catalog-vitrina (7d7d7dd) · **Método:** grep de strings visibles sobre app/ + components/ + lectura de diff del commit de la feature + DOM live vía curl/Playwright.

## Feature auditada
"Vitrina seller-curated" (commit 7d7d7dd): destacados (max 4), chips de sección por categoría con contadores, orden manual dentro de grupo, sort "Orden de la tienda". Migración: `products.is_featured` + `products.display_order` + 2 partial indexes (20260927184845).

## Superficie 1 — Storefront público `/negocio/[slug]`
- Route: `app/negocio/[slug]/page.tsx` (server component)
- Evidencia:
  - grep "Destacados" → page.tsx:460 (heading `featured-heading`, icono Star)
  - grep "Categorías del catálogo" → page.tsx:412 (nav chips, aria-label)
  - grep "aria-current" → page.tsx:417/430 (chips, activo = page)
  - grep "vitrina" → page.tsx:299 (showFeatured gating: featured>0 && !cat && sort==='vitrina' && page===1)
  - `SearchSort` con `defaultSort="vitrina"` + `STOREFRONT_SORTS` (page.tsx:397-402)
  - chips hidden si `catalogCategories.length <= 1` (page.tsx:409)
- Componentes hijos tocados por la feature: `components/search/SearchSort.tsx` (+3 líneas, label nuevo)

## Superficie 2 — Seller `/perfil/mis-productos`
- Route: `app/perfil/mis-productos/page.tsx` (client page)
- Componente nuevo: `components/profile/CatalogManager.tsx` (250 líneas)
- Evidencia:
  - grep "CatalogManager" → page.tsx:29 (import), 343-346 (render condicional: `businessSlug && (statusFilter==='all'||'active')`)
  - grep "Destacar|Destacado" → CatalogManager.tsx:210 (botón aria-pressed)
  - grep "Subir|Bajar" → CatalogManager.tsx:220/230 (aria-labels reorder)
  - grep "Destacados:" → CatalogManager.tsx:137 (contador X de 4)
  - grep "Ver mi vitrina" → CatalogManager.tsx:143 + page.tsx:237 (dos instancias del link)
- Gating: SOLO owners con business profile (`business_profiles.id = user.id`), NO aparece en vista persona (page.tsx:343)
- Grupos por categoría ordenados por tamaño desc (CatalogManager.tsx:63); reorder = swap display_order con vecino (97-130)

## Datos de auditoría (local, sembrados para ejercitar la feature)
- ElectroLab Bolivia (`/negocio/electrolab-bolivia`, user 5eedc0de-…e1): 4 productos `is_featured=true` (2 electronics display_order=1, 2 home display_order=1-2), 24 activos en 2 categorías → ejercita Destacados + chips + paginación (page size 12)
- Nota: sembrado SQL directo (local Docker), se registra como manipulación de datos de auditoría, no código.

## Estado previo relacionado
- `storefront-a11y` (done) tocó el MISMO page.tsx (BusinessInfoSidebar) — colisión secuencial: ese item está mergeado en el branch; este item parte del resultado final.
- PR #19 (040359b sort+paginación+banner) también vive aquí — este item AUDITA el conjunto (base PR #19 + 7d7d7dd).
