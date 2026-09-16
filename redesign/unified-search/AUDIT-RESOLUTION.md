# AUDIT-RESOLUTION — unified-search

> Stage 8. Branch `redesign/unified-search`. After-captures: `after/` (3 viewports × resultados + vacío + header, dsf=2, mismo manifest discipline que `current/`). E2E nueva `tests/e2e/search-discovery/unified-search.spec.ts` 19/19 (chromium+mobile); suites existentes search-discovery + header-monkey + navigation-layout 110 passed; accessibility-audit 31/31 (incluye /buscar).

| Finding | Estado | Evidencia de resolución |
|---|---|---|
| F-1 (P1) El buscador solo busca productos — negocios, solicitudes y personas invisibles | resolved | Selector `[Todo ▾]` en header SearchBar (`withTypeSelector`, DropdownMenu Todo/Productos/Negocios/Solicitudes/Personas, commit 8e8865c) + tablist en /buscar con contadores por entidad (SearchTypeTabs, roving tabindex + Arrow/Home/End, badges debounced 400ms con AbortController). Tab switch commitea `type` a la URL y strips params no aplicables (KEPT_PARAMS). Desktop + mobile overlay ambos con selector. after/desktop-resultados.png: tabs Productos 2 / Negocios 0 / Solicitudes 0 / Personas 0. E2E: tab switch URL, round-trip header→/buscar?type=negocios. |
| F-2 (P1) Sin backend de búsqueda de negocios ni personas | resolved | Migración `20260916120000_add_search_businesses_and_profiles.sql` (commit 8db8752, key fix d80cc00): `business_profiles.search_vector` generated+GIN, RPCs `search_businesses` y `search_profiles` (STABLE SECURITY INVOKER, `count(*) OVER ()` totals, GRANT anon+authenticated), aplicada a remoto y local. Rutas `app/api/search-businesses/route.ts` y `app/api/search-profiles/route.ts` (d80cc00) keyword-only con `expandQuery`, envelope tipado. `search_profiles` INNER JOIN active-sellers CTE — solo perfiles con listings activos. E2E API: seed `tienda-electronica-la-paz` presente, invariante `active_listings_count >= 1`, sin keys phone (TELO-003). Guard de productos activos verificado en psql (seller inactive → 0 filas). |
| F-3 (P2) Overlay móvil duplica el form inline en vez de reusar SearchBar | resolved | Form duplicado del overlay móvil ELIMINADO — el portal dialog renderiza `<SearchBar autoFocus withTypeSelector onSubmitted={close} />` (mismo portal, backdrop, Escape, role=dialog). `searchInputRef` + efecto autofocus manual eliminados (autoFocus prop). Mismos aria-labels que desktop (form "Buscar en Telopillo"). header-monkey.spec.ts + navigation-layout.spec.ts green. |
| F-4 (P2) Filtros y sort fijos de producto — no se adaptan a la entidad | resolved | `SearchFilters.enabledFilters` (SearchEnabledFilters): negocios → categoría BUSINESS_CATEGORIES + departamento (sin condición/precio); solicitudes → categoría producto + departamento; personas → solo departamento. `sortOptions` subset per entidad (productos 4 opciones, resto relevance\|newest vía SearchSort/SearchFilters). Tab switch strips params: priceMin/priceMax fuera de negocios/solicitudes/personas (E2E: `priceMin=100` desaparece al pasar a negocios). Chips de filtros activos respetan flags. |
| F-5 (P2) Copy tuteo en estados de /buscar | resolved | Todo el copy en voseo: "Intentá con otras palabras clave o ajustá los filtros", "Publicá una solicitud...", "Publicá lo que buscás →" (CTA demanda solo en productos), placeholders per entidad "Buscar vendedores..."/"Buscar solicitudes...", submit disabled "Buscar (escribí un término primero)", h1 "Buscar". after/desktop-resultados.png: "¿No encontraste exactamente lo que buscás? Publicá una solicitud y dejá que los vendedores te contacten." |

Notas:
- Persona card link rule = SellerCard exacta: `business_slug ? /negocio/<slug> : /vendedor/<id>` — E2E: Ana Pereira → `/negocio/tienda-electronica-la-paz`. Body sin `+591` (TELO-003).
- "Todo" = aterriza en tab Productos (modo mixto real diferido — ranking no comparable entre 4 entidades, decisión aprobada en plan). Selector default 'todo' cuando URL sin `type` (fix 50e8c9e: antes defaulteaba 'productos'; trigger aria-label case bug 'Buscar en todo Telopillo' nunca resolvía).
- RPC jsonb keys snake_case (convención SearchProduct/SearchDemandPost); `RETURNS TABLE` columna 1 = jsonb, columna 2 = total (orden obligatorio en RETURN QUERY).
- Contadores de tabs: 3 requests extra por búsqueda, `limit=1`, debounce 400ms + AbortController — solo con búsqueda activa.
- suites: search-discovery + header-monkey + navigation-layout 110 passed; accessibility-audit 31/31 (tablist pasa axe); type-check clean; lint 0 errores.
- Commits: a2ba67f (stages 1-6), 8db8752+d80cc00 (fase 1-2 backend), 5d02dd8 (fase 3), 8e8865c (fase 4), 50e8c9e (fix selector), c5bb0bf (fase 5 e2e).

## Post-gates upgrade: negocios/personas a búsqueda híbrida (2026-09-16, decisión del usuario)

El usuario pidió elevar negocios/personas al nivel elaborado de productos. Implementado con el mismo pipeline M4 (commits a793ba4, 3091157, e8c2d24):

- Migración `20260916130000_hybrid_search_businesses_and_profiles.sql`: `embedding vector(384)` + HNSW parcial en `business_profiles` y `profiles`; triggers pg_net (patrón `trigger_generate_embedding`) con text builders SQL compartidos; `profiles_public` expone `embedding` (vista owner-scoped, sin phone — TELO-003 intacto; necesario porque search_profiles es SECURITY INVOKER y anon no tiene SELECT en `profiles`); RPCs `search_businesses`/`search_profiles` con `query_embedding vector(384) DEFAULT NULL` y RRF adaptativo k=60 (2x semántico cuando keyword = 0 hits, template `search_demands_hybrid`). Path keyword-only sin embedding: comportamiento anterior intacto.
- Edge Function `generate-embedding`: modos `BUSINESS`/`PROFILE` (texto pre-built del trigger, mismo contrato que `DEMAND`) + backfill multi-tabla `{backfill:true, table}` (products|businesses|profiles); backfill de profiles hace merge del contexto del negocio dueño.
- `lib/search/query-embedding.ts`: helpers extraídos de /api/search (`isSemanticSearchEnabled` + `getQueryEmbedding` con cache TTL 5min) — las 3 rutas comparten pipeline; business/profile routes reportan `searchMode: 'hybrid'|'keyword'` + logs `embedding_failure`.

Verificación local (flag `semantic_search_enabled=true` + app_config webhook + edge runtime local): backfill 55/55 productos, 6/6 negocios, 17/17 perfiles; triggers fire → 200 BUSINESS+PROFILE en net._http_response; smoke híbrido real vía API: "reparacion de pantalla" → TecnoService #1 (keyword puro daba 0), "muebles" → dueña de Muebles El Roble #1, lenguaje natural "donde puedo comprar ropa" → Moda Bolivia Express #1. Suites: search-discovery 68 passed (incl. unified-search 19/19 + assertion searchMode), cross-cutting 73 passed (header-monkey + navigation-layout + accessibility-audit). scope.txt += 4 archivos.

## Post-upgrade review fixes (2026-09-16, commit 2fd2858)

Revisión adversarial de los cambios recientes (8 hallazgos, ninguno crítico). Aplicados los 3 recomendados:

- `app/api/search-demands/route.ts` importa `isSemanticSearchEnabled`/`getQueryEmbedding` de `lib/search/query-embedding.ts` (antes copia privada — una instancia de cache por bundle de ruta).
- Las 4 rutas de búsqueda saltan el fetch de embedding cuando `limit=1`: los contadores de tabs de /buscar solo leen `total_count`; el conteo keyword-only es exacto (el híbrido queda truncado a la unión RRF de top-50) y se ahorran 3 calls a Hugging Face por keystroke con debounce.
- Edge fn backfill: `const fetch` → `const batch` (no shadowear el fetch global).

Verificado: limit=1 → `searchMode:'keyword'` (sin call HF), limit=12 → `'hybrid'`; search-discovery 70 passed; type-check clean. No aplicados: #8 cosmético (`|| ''` en migración ya commiteada) y flags de diseño heredados del template (total_count híbrido ~cap 100, orden de deploy db→routes, embedding enumerable vía profiles_public — dato derivado, no reversible).
