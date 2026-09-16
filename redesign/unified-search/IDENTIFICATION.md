# IDENTIFICATION — unified-search

> Stage 2. Item: búsqueda unificada — el buscador (Header SearchBar + `/buscar`) hoy solo busca productos; se agrega búsqueda de **negocios**, **solicitudes** (demand posts) y **personas** (perfiles públicos de vendedores). Decisión humana 2026-09-16: alcance = 4 entidades; UX = selector de tipo en el buscador `[Todo ▾][ input ][Buscar]` + tabs en `/buscar` con contadores.

## Mapeo screenshot → ruta → componentes

- **Header (desktop):** `components/layout/Header.tsx` — renderiza `<SearchBar />` (:116 dentro de Suspense). **Overlay móvil:** form inline duplicado (:241-300, "Buscar productos..." + botón lupa + close) — finding de duplicación; se reemplaza por `<SearchBar>` en el mismo portal dialog.
- **SearchBar:** `components/search/SearchBar.tsx` — placeholder default "Buscar productos..." (:16), 2× `aria-label="Buscar productos"` (:56, :76), submit → `/buscar?q=`. Se agregan props `withTypeSelector` + `onSubmitted`.
- **Página resultados:** `app/buscar/page.tsx` — h1 "Buscar Productos" (:60 skeleton, :207 estado), fetch único a `/api/search`, filtros `SearchFilters`, sort `SearchSort`, resultados `ProductGrid`. Se agrega param `type`, tabs, cards por tipo, filtros adaptativos.
- **Backend nuevo (sin UI previa, prerrequisito Stage 8):** migración `supabase/migrations/20260916120000_add_search_businesses_and_profiles.sql` (2 RPCs: `search_businesses`, `search_profiles` SECURITY INVOKER, sin phone) + `app/api/search-businesses/route.ts` + `app/api/search-profiles/route.ts` + tipos `SearchBusiness`/`SearchPerson` en `types/database.ts`.

## Evidencia

- landmark h1 "Buscar Productos" (app/buscar/page.tsx:207); placeholder "Buscar productos..." (SearchBar.tsx:16).
- Intake: `input/header-desktop.png` (header actual, logo + input + Buscar + nav), `input/header-mobile.png` + `input/header-mobile-search-overlay.png` (overlay móvil con form inline DUPLICADO — no reusa SearchBar), `input/buscar-resultados-desktop.png` (`/buscar?q=samsung`, solo productos).
- Plan aprobado: selector de tipo (DropdownMenu shadcn) + tabs accesibles (patrón tablist de app/perfil/demandas/page.tsx:308-327).

## Fuera de scope

- Página home (hero search) — par de referencia, no se toca (queda solo productos).
- `/negocio/[slug]`, `/vendedor/[id]`, `/busco` — páginas destino, ya anon-safe, no se modifican.
- Búsqueda semántica (embeddings) para negocios/personas — solo keyword FTS en este item (no tienen vectores).
- Modo mixto real ("Todo" rankea 4 entidades juntas) — diferido; "Todo" aterriza en tab Productos.
