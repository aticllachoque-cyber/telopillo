# IDENTIFICATION — buscar-a11y

> Stage 2 output. Screenshot → route → component mapping with evidence.
> Gate G1: every `components/**.tsx` path listed here must exist on disk.

## Input

- Screenshot(s): `redesign/buscar-a11y/input/buscar-resultados-desktop.png`, `redesign/buscar-a11y/input/buscar-empty-desktop.png`
- Route: `/buscar` (top-level `app/buscar/page.tsx`, client component)

## Route mapping

| Evidence (visible string / landmark / class) | Matched in | File |
|---|---|---|
| "Buscar Productos" (h1) | grep `app/` | app/buscar/page.tsx:207 |
| "Publica una solicitud y deja que los vendedores te contacten." (violación axe, resultados) | grep `app/` | app/buscar/page.tsx:405 |
| "Publica una solicitud y deja que los vendedores te contacten con ofertas." (violación axe, empty state) | grep `app/` | app/buscar/page.tsx:357 |
| "No encontramos productos" (empty state heading) | grep `app/` | app/buscar/page.tsx:332 |

## Component mapping

| Component | File | Evidence |
|-----------|------|----------|
| SearchBar (rendered) | components/search/SearchBar.tsx | import at app/buscar/page.tsx:5 |
| SearchFilters (rendered) | components/search/SearchFilters.tsx | import at app/buscar/page.tsx:6 |
| ProductGrid → ProductCard (rendered) | components/products/ProductGrid.tsx, components/products/ProductCard.tsx | import at app/buscar/page.tsx:7 |

Rendered children are **out of scope** — both axe violations live in `app/buscar/page.tsx` inline markup (CTA cards). Scope widens only if the approved proposal requires it.

## A11y evidence (axe scan 2026-09-15, dev server main)

- `color-contrast (serious)` ×1 node en `/buscar?q=samsung`:
  - target `.mb-3` — `<p class="text-sm text-muted-foreground mb-3">Publica una solicitud y deja que los vendedores te contacten.</p>`
  - ratio **4.27:1** (fg `#737373` = `text-muted-foreground`, bg `#f3f3f3` = `bg-primary/5` sobre blanco); requerido 4.5:1
  - source: app/buscar/page.tsx:402-407 (card `border-primary/20 bg-primary/5`)
- `color-contrast (serious)` ×1 node en `/buscar?q=nonexistent`:
  - mismo patrón, texto "…te contacten con ofertas."
  - source: app/buscar/page.tsx:354-357
- Storefront (`/negocio/usuario-de-desarrollo`): 0 serious/critical en scan directo — PERO esa URL da **404** hoy (TEST_DATA.businessSlug no matchea seed actual); item `storefront-a11y` lo investiga (timeout del test + slug stale).

## DOM snapshot confirmation

- `curl /buscar?q=samsung` + grep: landmark "Buscar Productos" presente: **yes**

## Landmark (verbatim visible string)

Recorded to `redesign/buscar-a11y/landmark.txt`:

```
Buscar Productos
```

## Identified files (scope)

Recorded to `redesign/buscar-a11y/scope.txt`:

```
app/buscar/page.tsx
redesign/
```
