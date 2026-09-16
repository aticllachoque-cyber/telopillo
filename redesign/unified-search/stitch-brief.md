# stitch-brief — unified-search

## Screen

Dos superficies acopladas: (1) **Header** — barra de búsqueda `[selector tipo ▾][ input ][Buscar]` + nav (Productos, Categorías, Solicitudes, Publicar Gratis, Ingresar); en mobile, portal dialog con el MISMO SearchBar (no form duplicado). (2) **`/buscar?q=…`** — h1 "Buscar", misma SearchBar grande, **tabs de tipo con contadores** (Productos | Negocios | Solicitudes | Personas — tablist accesible), panel Filtros (adaptativo por tipo), sort, y resultados según tipo: productos = ProductGrid actual; negocios/personas = lista de filas (logo/avatar + nombre + VerificationBadge + categoría/ubicación + "X productos activos"); solicitudes = DemandPostCard existente. Empty states por tipo.

## Findings a resolver (de AUDIT.md)

- **F-1 (P1):** buscador busca solo productos → agregar Negocios/Solicitudes/Personas. Selector DropdownMenu en SearchBar con opciones Todo/Productos/Negocios/Solicitudes/Personas; "Todo" = aterriza en `/buscar` tab Productos. Submit → `/buscar?q=…&type=…` (type omitido para Todo). Tabs en /buscar con badge de conteo por entidad (contadores debounced, limit=1 batch).
- **F-2 (P1):** backend nuevo (2 RPCs + 2 rutas API) — invisible en el mockup, se implementa en Stage 8 como prerrequisito; el mockup asume resultados para "electronica" en Negocios y su dueño en Personas.
- **F-3 (P2):** overlay móvil reusa SearchBar (con selector), NO form inline duplicado.
- **F-4 (P2):** filtros/sort por tipo: productos mantienen todo; negocios = categoría negocio + departamento, sort relevance|newest; solicitudes = departamento; personas = departamento. h1 → "Buscar".
- **F-5 (P2):** copy voseo exclusivo — "Intentá", "Publicá una solicitud", "Publicá lo que buscás". NUNCA tuteo.

## Component inventory

- `components/search/SearchBar.tsx` — + DropdownMenu selector (shadcn), props `withTypeSelector`, `onSubmitted`; placeholders por tipo (voseo).
- `components/layout/Header.tsx` — desktop SearchBar con selector; overlay móvil → SearchBar en portal.
- `app/buscar/page.tsx` — tabs (SearchTypeTabs), endpoint map por type, cards por tipo, filtros adaptativos, empty states voseo.
- Nuevos: `SearchTypeTabs` (tablist roving focus), `BusinessResultCard` + `PersonResultCard` (fila lista, link `/negocio/<slug>` o `/vendedor/<id>` según SellerCard.tsx:95), solicitudes reusa `DemandPostCard`.

## Brand tokens (app/globals.css oklch — usar solo tokens)

- primary, primary-foreground, muted, muted-foreground, border, card, background, ring, destructive. Tabs = misma familia que tabs de perfil/demandas (botones pill con aria-selected + badge count). Iconos lucide (Store, User, ClipboardList, Package, Search).

## Constraints

- Tailwind v4 + shadcn/ui, Next.js 16 App Router, React 19.
- Copy en español boliviano **voseo** exclusivamente.
- **Sibling constraint — match existing look:** el SearchBar actual (input rounded + botón Buscar primary) y la página /buscar (layout 2 col desktop con Filtros a la izquierda) son el patrón base — el selector y tabs se integran, no rediseñan desde cero. DemandPostCard/ProductGrid no cambian visualmente.
- No inventar patrón de tabs divergente: tablist pill con badge = patrón de `app/perfil/demandas/page.tsx:308-327`.
- a11y: tablist con role=tab/tablist/aria-selected + flechas; targets 44px mobile; G6 suite axe debe pasar.
- Privacidad: cards persona SIN teléfono; link persona → /negocio si tiene business_slug, si no /vendedor/<id>.

## Sibling-pattern inventory (de PATTERN-INSTANCES + verificación)

in-scope: SearchBar, Header, /buscar page, SearchFilters, SearchSort, SearchTypeTabs/BusinessResultCard/PersonResultCard (nuevos), migración RPCs + API routes (F-2). not-affected: /negocio/[slug], /vendedor/[id], /busco listing, DemandPostCard visual, ProductGrid/ProductCard, home hero search.
