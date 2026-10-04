# IDENTIFICATION — storefront-a11y

> Stage 2 output. Screenshot `input/storefront-desktop.png` → route → component files.

## Mapping

- **Screenshot intent:** página pública de storefront de negocio (`/negocio/[slug]`): breadcrumb, banner "Tienda en construcción", header card con nombre/logo/verificación, sidebar de contacto+horarios, grid de productos del negocio.
- **Route:** `app/negocio/[slug]/page.tsx` (server component; `notFound()` si slug no existe).
- **Live check:** `/negocio/tienda-electronica-la-paz` HTTP 200, `<h1>Tienda Electronica La Paz</h1>`, `<title>Tienda Electronica La Paz | Telopillo`; copia estática del banner "Tienda en construcción en Telopillo" presente (page.tsx:218).

## Files

- `app/negocio/[slug]/page.tsx` — markup propio de la página: breadcrumbs, banner construcción (gradiente con amber hardcode, page.tsx:209), conteo "Productos (N)", empty storefront
- `components/business/BusinessInfoSidebar.tsx` — **aquí vive la violación axe pineada**: badges "Abierto" (green, :95) / "Cerrado" (red, :103) `text-xs font-medium` sobre `bg-{green,red}-50` — ratio 4.36:1 (Cerrado, axe serious WCAG 1.4.3); render es condicional por día → flakiness de test
- `tests/helpers/index.ts:216` — `TEST_DATA.businessSlug='usuario-de-desarrollo'` → **404 hoy**; el test de la suite a11y audita una página 404 (false pass/timeout). Causa raíz del debt de este item.

## Out of scope (identificados, no se tocan)

- `components/business/BusinessHeader.tsx` — muted sobre blanco OK (≥4.5:1); avatar fallback grande pasa 3:1 large-text
- `components/products/ProductGrid.tsx`/`ProductCard.tsx` — grid compartido; ya cubierto en contexto buscar; sin violaciones en scan
- Specs `tests/m4.5-*.spec.ts` (×3) usan el mismo slug stale — fuera de la suite a11y; diferidos (mismo root cause, decisión en Checkpoint)

## Evidence

- Axe scan directo 2026-09-15 (`axe-scan.mjs`): desktop+mobile → 1 violación serious compartida (`color-contrast`, `.text-red-600`, fg #e7000b / bg #fef2f2, 4.36:1, 12px normal)
- `curl /negocio/usuario-de-desarrollo` → 404; `/negocio/tienda-electronica-la-paz` → 200
- Negocios seeded: tienda-electronica-la-paz, moda-bolivia-express, casa-andina-hogar (3 productos c/u — no existe storefront vacío para capturar estado empty real)
