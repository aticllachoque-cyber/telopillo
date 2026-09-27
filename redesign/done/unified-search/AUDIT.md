# AUDIT — unified-search

> Stage 4. Item scope: funcionalidad de búsqueda — el buscador (Header SearchBar + `/buscar`) solo encuentra **productos**; el negocio necesita encontrar también **negocios**, **solicitudes** (demand posts) y **personas** (vendedores). Decisiones humanas 2026-09-16: alcance 4 entidades; UX = selector de tipo `[Todo ▾][ input ][Buscar]` en el buscador + tabs con contadores en `/buscar`.
> **Accesibilidad:** el a11y de `/buscar` ya está cerrado por `buscar-a11y` (done); este item no repite auditoría axe, pero el nuevo UI (tablist, cards) debe pasar la suite existente (G6 la corre).

## Baseline

- Capturas: `current/` (3 viewports × resultados "samsung" + vacío "zzzznoexiste" + header) + `input/` (header desktop/mobile, overlay móvil, resultados).
- Datos seeded locales: Samsung ×2 (Diego Mamani / Casa Andina Hogar), storefront `tienda-electronica-la-paz`.
- Estado actual confirmado: `/buscar?q=samsung` → 2 productos, filtros producto-only, h1 "Buscar Productos", CTA demanda.

## Findings

### F-1 (P1) El buscador solo busca productos — negocios, solicitudes y personas son invisibles para la búsqueda
La superficie principal de discovery del marketplace no expone 3 de las 4 entidades. Un usuario que busca "Casa Andina" (negocio), "busco iPhone" (solicitud publicada) o "Diego Mamani" (vendedor) obtiene 0 resultados o ruido de productos. `/api/search-demands` existe (backend demanda) pero ninguna UI lo consulta desde el buscador; negocios y personas no tienen ni backend.

evidence: app/buscar/page.tsx:117 único fetch `/api/search` (productos) — no hay endpoint de negocios/personas en la página
evidence: components/search/SearchBar.tsx:16 placeholder default "Buscar productos..." (promesa solo-productos)
evidence: components/search/SearchBar.tsx:76 aria-label "Buscar productos" (segunda instancia)
evidence: app/buscar/page.tsx:207 h1 "Buscar Productos" (la página entera está marcada como productos)
evidence: input/buscar-resultados-desktop.png — resultados solo productos, sin tabs ni selector
Fix propuesto (aprobado por humano): selector de tipo en SearchBar (DropdownMenu shadcn: Todo/Productos/Negocios/Solicitudes/Personas) → `type` param en URL; tabs accesibles en /buscar (patrón tablist de app/perfil/demandas/page.tsx:308-327) con contadores por entidad; cards de resultado por tipo; "Todo" aterriza en Productos (ranking mixto diferido).

### F-2 (P1) Sin backend de búsqueda de negocios ni personas — F-1 no tiene de dónde tirar
No existe RPC `search_businesses` ni `search_profiles` (solo products/demands tienen FTS). `business_profiles` es anon-legible (RLS `USING (true)`) y `profiles_public` expone campos públicos SIN teléfono (TELO-003), pero nada los busca. Prerrequisito de F-1 — se implementa en Stage 8 como parte de este item.

evidence: supabase/migrations/ — solo 8 migraciones search, todas de products/demands (20260214…20260606220000_fix_search_profiles_public.sql)
evidence: grep search_businesses|search_profiles en supabase/migrations/ → 0 matches
evidence: app/api/ — existen /api/search y /api/search-demands; no existen search-businesses ni search-profiles
Fix propuesto: migración `20260916120000_add_search_businesses_and_profiles.sql` — tsvector generadas + GIN en business_profiles y profiles; RPCs `search_businesses(...)` y `search_profiles(...)` RETURNS TABLE(x JSONB, total_count BIGINT), SECURITY INVOKER `SET search_path = public`, GRANT EXECUTE anon+authenticated. Privacidad personas: INNER JOIN contra CTE `SELECT DISTINCT user_id FROM products WHERE status='active'` (solo perfiles con actividad pública), SOLO campos de profiles_public, jamás phone. + rutas API `app/api/search-businesses` y `app/api/search-profiles` (keyword-only, sin embeddings — no tienen vectores).

### F-3 (P2) Overlay móvil duplica el form de búsqueda inline en vez de reusar SearchBar
El portal dialog móvil tiene su propio `<form>` con input + botón lupa hardcodeados — mismo propósito, otro markup. Divergencia de mantenimiento garantizada: cuando F-1 agregue el selector de tipo al SearchBar, el overlay quedaría sin él si no se unifica. El overlay además pierde los aria-labels consistentes.

evidence: components/layout/Header.tsx:242-287 segundo createPortal con form inline duplicado (input :275, placeholder "Buscar productos..." :277, searchInputRef :33/:73)
evidence: components/layout/Header.tsx:256 aria-label "Buscar productos" en nav-link del overlay (3ª instancia del label en el archivo)
evidence: input/header-mobile-search-overlay.png — overlay con form propio distinto del SearchBar desktop
Fix propuesto: borrar el form inline; renderizar `<SearchBar autoFocus withTypeSelector onSubmitted={close} />` dentro del mismo portal (backdrop/Escape/focus-trap/role=dialog se conservan); eliminar searchInputRef + efecto autofocus redundante.

### F-4 (P2) Filtros y sort fijos de producto — no se adaptan al tipo de entidad
Al existir un solo tipo, SearchFilters muestra Categoría/Condición/Precio siempre y SearchSort ofrece 4 órdenes de producto. Con 4 tipos los controles deben ser por-entidad: negocios → categoría de negocio (BUSINESS_CATEGORIES) + departamento, sort relevance|newest; solicitudes → departamento, sort relevance|newest; personas → departamento, sort relevance|newest; productos mantienen los actuales.

evidence: components/search/SearchFilters.tsx — filtros de producto hardcodeados sin prop de configuración
evidence: components/search/SearchSort.tsx — opciones de producto únicas
evidence: current/desktop-resultados.png — panel Filtros de producto visible (única variante)
Fix propuesto: prop `enabledFilters` en SearchFilters (categorias de negocio desde lib/validations/business-profile.ts BUSINESS_CATEGORIES cuando type=negocios); SearchSort con opciones por tipo; switch de tab hace push stripping params no aplicables; h1 "Buscar Productos" → "Buscar".

### F-5 (P2) Copy tuteo en estados de /buscar — rompe la voz voseo de la app
La app habla en voseo boliviano (Publicá lo que buscás, Completá los datos, wizard 100% voseo tras busco-publicar-ui). El empty-state de /buscar usa tuteo: "Intenta con otras palabras clave", "Publica una solicitud", "Publicar lo que busco". Misma familia de inconsistencia que F-1 de busco-publicar-ui (P1 ahí).

evidence: app/buscar/page.tsx:340 "Intenta con otras palabras clave o ajusta los filtros"
evidence: app/buscar/page.tsx:362 "Publica una solicitud y deja que los vendedores te contacten con ofertas."
evidence: app/buscar/page.tsx:368 "Publicar lo que busco →"
evidence: app/buscar/page.tsx:410 "Publica una solicitud y deja que los vendedores te contacten."
evidence: app/buscar/page.tsx:416 "Publicar lo que busco →"
evidence: app/busco/publicar/page.tsx:111 "Publicá lo que buscás" (voz voseo de referencia)
Fix propuesto: Intenta→Intentá, Publica→Publicá, "Publicar lo que busco"→"Publicá lo que buscás" (alinear con h1 de /busco/publicar). El copy nuevo por-tipo (empty/no-results) se escribe directo en voseo.
