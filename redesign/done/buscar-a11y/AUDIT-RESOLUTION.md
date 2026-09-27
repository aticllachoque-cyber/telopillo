# AUDIT-RESOLUTION — buscar-a11y

> Stage 8 output. One row per AUDIT.md finding. `resolved` / `deferred` (sign-off-approved reason) / `open`.
> Dark-theme verification (sign-off condition): `dark-mode-axe.txt` — 0 color-contrast violations in both states.

| finding | severity | status | where / reason |
|---------|----------|--------|----------------|
| F-1 (P1) results-bottom CTA contrast 4.27:1 | P1 | resolved | `text-muted-foreground` → `text-foreground/80` on the demand-CTA description (app/buscar/page.tsx); ≈8.6:1 over `bg-primary/5`, matches sibling pattern (ProductFormWizard.tsx:526, DemandPostForm.tsx:827). Verified light + dark. |
| F-2 (P1) empty-state CTA contrast 4.27:1 | P1 | resolved | Same `text-foreground/80` treatment in the consolidated empty card (app/buscar/page.tsx). Verified light + dark. |
| F-3 (P2) offline cache banner hardcoded amber | P2 | resolved | Banner rebuilt on semantic tokens (`border bg-muted text-foreground`) with a functional Reintentar button wired to `performSearch()` and `role="status"` (app/buscar/page.tsx). |
| F-4 (P2) double demand CTA in empty state | P2 | resolved | Two stacked cards consolidated into one card; demand CTA demoted to a `border-t` row inside it. |
| F-5 (P2) empty-state description contrast at the margin (~4.6:1) | P2 | resolved | Description text now `text-foreground/80` (≈8.6:1). Verified light + dark. |

## Sign-off improvement conditions (iteration 2)

- "Mostrando N de M" counter removed (redundant with the main count) — resolved.
- "No hay más productos." renders only when `results.totalCount >= PAGE_SIZE` — resolved.
- Banner Reintentar wired to a real retry (`performSearch()`) — resolved.

## Out-of-scope observations (recorded, not findings of this item)

- `landmark-unique (moderate)` on `.max-w-xl > form` (SearchBar duplicated landmark) — lives in `components/search/SearchBar.tsx`, out of scope per SIGNOFF (children untouched). Pre-existing on main.
- G6 full-suite failure remaining after this item = storefront a11y test (timeout + stale `TEST_DATA.businessSlug` 404) — that is the `storefront-a11y` item debt, sequenced next. Buscar-scoped tests must pass.
