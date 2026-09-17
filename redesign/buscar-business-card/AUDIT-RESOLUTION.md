# AUDIT-RESOLUTION — buscar-business-card

Impl branch: `redesign/buscar-business-card` · Sign-off: 2026-09-16 (hash
`8015901f…`, ver SIGNOFF.md) · Archivos tocados: exactamente los 3 del scope.

| Finding | Resolución | Estado |
|---------|-----------|--------|
| F-1 (P1) jerarquía visual | Card tipo ProductCard: tile de identidad + h3 + categoría uppercase + descripción + MapPin + footer border-t (BusinessResultCard.tsx rebuild completo) | resolved |
| F-2 (P1) columna única | Contenedores negocios y personas en app/buscar/page.tsx → `grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6` (espejo ProductGrid.tsx:52) | resolved |
| F-3 (P2) tile 56px | Tile `aspect-[16/9] sm:aspect-[16/10]` con Avatar `h-20 w-20 sm:h-24 sm:w-24` + `group-hover:scale-105` (ambas cards) | resolved |
| F-4 (P2) descripción no renderizada | `business_description` con `line-clamp-2` (omitida si vacía — payload prod puede no traerla) | resolved |
| F-5 (P2) badge emerald inline | `<VerificationBadge>` compartido `size="sm"`: negocio "Negocio con Teléfono" (gate `is_nit_verified`), persona "Vendedor con Teléfono" (gate `verification_level >= 1`). Fuera del link (patrón overlay ProductCard.tsx:150 — axe nested-interactive) | resolved |
| F-6 (P2) nombre `<p>` | `h3` con Link anidado (heading contiene link — patrón preferido), `truncate` + `hover:text-primary` | resolved |

## Verificación

- `npm run type-check`: clean · `npm run lint`: 0 errors (7 warnings pre-existentes en server.ts/scripts, sin relación).
- Live probe: grid computado `256px 256px 256px` (3 cols lg) · 0 elementos interactivos anidados.
- `npx playwright test tests/e2e/search-discovery/ --project=chromium`: **36 passed** (incl. unified-search.spec.ts — links "Ver negocio X" / "Ver perfil de X" vía overlay aria-label, hrefs intactos, TELO-003 sin +591).
- After-captures: 6 (3 viewports × negocios/personas, fullPage dsf=2) — impl coincide con el mockup aprobado.
- Gates: corrida completa en GATES.log (ver PLAN.md ops notes para el resultado).

## Notas de desviación vs mock (transparencia)

- Estructura de link: el mock envolvía toda la card en un `<a>`; la impl usa el patrón overlay real de ProductCard (Link `absolute inset-0` en el tile + h3 con Link propio) para que el VerificationBadge focusable no quede anidado en un link. Look y comportamiento idénticos; declarado en SIGNOFF.md antes de implementar.
- `list-none p-0 m-0` del grid del mock no se replicó: el `ul[role="list"]` de /buscar ya renderiza sin viñetas (preflight) y los p-0/m-0 son no-ops ahí; clases finales más limpias.

## Open / deferred

- Ninguno del AUDIT. Contenedor de solicitudes (`xl:grid-cols-3` gap-4) sigue con ritmo distinto al de productos/negocios/personas (`lg:grid-cols-3` gap escalonado) — DemandPostCard not-affected por PATTERN-INSTANCES; si se quiere unificar, item futuro.
