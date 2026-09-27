# redesign/ — índice de estados

> Estado por item: ver fila en [PLAN.md](PLAN.md) (fuente de verdad, rows in-place).
> Este README es SOLO el índice legible. Dir de cada item = `redesign/<slug>/`, NO mover (PLAN.md y el skill ui-redesign-flow referencian por ruta).

## ✅ done — implementado, mergeado a `main` (10/10)

| slug | ruta | signoff | impl | PR/merge |
|------|------|---------|------|----------|
| producto-detalle | `/productos/[id]` | 2026-09-13 | `205d5cf` | mergeado |
| buscar-a11y | `/buscar` | 2026-09-15 (iter 2) | `e9b8d35`+`dc7de61` | mergeado |
| storefront-a11y | `/negocio/[slug]` | 2026-09-15 | `6dd37b4` | mergeado |
| publicar-a11y | `/publicar` | 2026-09-15 | `cb7de56` | mergeado |
| buscar-business-card | `/buscar` (card negocio) | 2026-09-16 (iter 0) | en main | mergeado (branch eliminada) |
| unified-search | `/buscar` + Header (4 entidades) | 2026-09-16 | `a2ba67f…c5bb0bf` | mergeado |
| busco-publicar-ui | `/busco` + `/publicar` (UX visual) | signoff en dir | en main | mergeado |
| tinted-card-contrast-sweep | sweep contraste cards | 2026-09-17 | en main | mergeado |
| busco-detalle | `/busco/[id]` | 2026-09-18 (iter 0) | `bddd095` | mergeado (branch eliminada) |
| home-publish-cta | landing FAB "Publicá gratis" | 2026-09-24 (iter 1) | `e24bdec` | PR #18 mergeado |

## 🔵 wip — vacío

Ningún item en curso. Último cerrado: `home-publish-cta` (2026-09-24).

## ⚪ backlog — items futuros anotados en flags de PLAN.md

| candidato | origen | nota |
|-----------|--------|------|
| FAB global (todas las rutas <1024px) | home-publish-cta flag | hoy landing-only por colisión con barras bottom de `/busco/[id]` + wizard |
| F-5 badge tokens | busco-detalle flag DEFERRED | `globals.css` fuera de scope; consumidores perfil/demandas sin divergencia aún |
| specs m4.5 slug stale | storefront-a11y deferred | aprobado deferral, pendiente |
| vitrina funcional (sort+pager) | PR #19 | UI reutiliza componentes auditados; si hay feedback visual → nueva row |

## Limpieza (2026-09-27)

- Branches locales `redesign/*` mergeadas a main: **eliminadas** (8). `buscar-business-card` y `busco-detalle` ya no tenían branch.
- `redesign/` pesa ~190MB (screenshots before/after + mockups de cada item, trackeados en git). Si pesa: opción futura = archivar `input/ current/ comparison.html` de items cerrados hace >1 semana.
