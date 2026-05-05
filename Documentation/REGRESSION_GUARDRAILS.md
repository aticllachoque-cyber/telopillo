# Regression Guardrails

Objetivo: capturar bugs reales y evitar regresiones con reglas simples + tests focalizados.

## 1) URL State Is Source Of Truth (`/buscar`, `/busco`)

- Regla: no hacer `router.push` automático desde `useEffect` usando estado intermedio de filtros.
- Regla: hacer `router.push` solo por acción explícita del usuario (submit, cambio de filtro, limpiar).
- Riesgo mitigado: volver a una búsqueda previa (`q` viejo) por condiciones de carrera.

## 2) Query Preservation

- Regla: al aplicar filtros/orden, preservar `q` actual.
- Regla: al limpiar filtros, no borrar `q` salvo que el usuario limpie búsqueda.
- Test asociado: `search-discovery/keyword-search.spec.ts` (caso de regresión `q` estable).

## 3) Deterministic Selectors In E2E

- Regla: usar selectores por nombre accesible específico (`getByLabel(/filtrar por categoría/i)`), no regex ambiguos.
- Regla: evitar asserts sobre textos duplicados (empty state + contador).
- Riesgo mitigado: falsos negativos por strict mode de Playwright.

## 4) Async Navigation Hygiene

- Regla: después de acciones que actualizan URL, validar con `expect(page).toHaveURL(...)`.
- Regla: esperar fin de carga (`Buscando productos...` hidden) antes de asserts de resultados.

## 5) Minimal Regression Set (Prioridad)

1. Cambio de búsqueda + filtro no restaura query anterior.
2. Limpiar filtros mantiene `q`.
3. Sort mantiene `q` y filtros activos.
4. Navegación back/forward restaura controles visibles.
5. Empty state no rompe tests por duplicidad de texto.
