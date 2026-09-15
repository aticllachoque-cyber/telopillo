# Stitch brief — storefront-a11y

> Stage 5 output. Página pública de storefront `/negocio/[slug]` de Telopillo (marketplace boliviano): cerrar la violación axe serious + integridad del test G6, sin diverger del tema actual.

## Screen description

Ruta pública server-rendered. Layout desktop: breadcrumb arriba; banner informativo "Tienda en construcción en Telopillo" (icono Construction + título + descripción); card header con logo/nombre/verificación/descripción; grid 2:1 — columna izquierda con heading "Productos (N)" + product cards, sidebar derecho sticky con teléfono, horarios (badge Abierto/Cerrado), ubicación, sitio web, redes, WhatsApp. Mobile 375px: todo apilado, sidebar de contacto primero.

## Component inventory (archivos reales)

- `app/negocio/[slug]/page.tsx` — breadcrumbs, banner construcción (gradiente amber, :209), conteo productos, empty storefront
- `components/business/BusinessInfoSidebar.tsx` — **violación axe**: badges Abierto (:95, green) / Cerrado (:103, red), render condicional por día
- `components/business/BusinessHeader.tsx`, `components/products/ProductGrid.tsx` — renderizados, **fuera de alcance** (sin violaciones)
- `tests/helpers/index.ts:216` — slug stale que hace que el test G6 audite una 404

## Findings to address (de AUDIT.md)

- **F-1 (P1)** badge "Cerrado": `text-red-600` sobre `bg-red-50` → 4.36:1 (axe serious, WCAG 1.4.3). Necesita ≥4.5:1.
- **F-2 (P1)** badge "Abierto": `text-green-600` sobre `bg-green-50` → ≈3.14:1 calculado; render intermitente por día (flaky).
- **F-3 (P2)** banner construcción con gradiente `to-amber-500/10` — ámbar fuera del sistema de tokens monocromático.
- **F-4 (P2)** `TEST_DATA.businessSlug` stale → test audita 404. Fix de datos de test, no visual.
- **F-5 (P2)** descripción del banner `text-muted-foreground` sobre gradiente tintado ≈4.27:1 borderline.

## Brand tokens (app/globals.css, oklch — NO inventar valores)

- `--background` blanco, `--foreground` casi negro, `--primary` casi negro, `--muted/--secondary/--accent` ≈ blanco-gris, `--border`, `--ring`, radius `--radius` (shadcn). Tema monocromático (croma 0). Copy español (Bolivia).
- Estados de negocio requieren matiz (abierto/cerrado): usar la escala Tailwind pero con step que cumpla 4.5:1 sobre el -50 (ver constraints).

## Constraints

- Tailwind CSS v4 + shadcn/ui; tokens de `app/globals.css`; fix debe funcionar en tema claro y oscuro
- Archivos a tocar: `app/negocio/[slug]/page.tsx`, `components/business/BusinessInfoSidebar.tsx`, `tests/helpers/index.ts` (+ `redesign/`)
- Contraste badges: texto verde → **green-800** (#166534 ≈6.3:1; green-700 ≈4.3:1 NO alcanza); texto rojo → **red-700** (#b91c1c ≈5.9:1) — mantener dots `-500` (decorativos, aria-hidden). Match del hermano `VerificationBadge.tsx:84` que ya usa step -700/-800 de texto sobre -50
- Banner: matiz semántico sin amber — `border` + `bg-muted/40` + texto `text-foreground`/`text-foreground/80` (consistente con fix de buscar-a11y)
- Mantener look del resto de la página — **match the existing sibling look — do not invent a divergent pattern** (lección loop 1 de buscar-a11y: mock divergente fue rechazado)
- Touch targets ≥44px; español boliviano
- F-4: `businessSlug: 'tienda-electronica-la-paz'` (negocio seeded real, 3 productos). Specs `tests/m4.5-*.spec.ts` con slug local stale: diferidos (decisión en Checkpoint)

## Feedback Checkpoint 3 (loops)

- (aún sin loops — ruta fallback fiel elegida de entrada por precedente de buscar-a11y loop 1: mock divergente de Stitch fue rechazado por el usuario)
