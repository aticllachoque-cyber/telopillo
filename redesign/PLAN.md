# redesign/PLAN.md — ui-redesign-flow worklist

> Single source of truth for resume. Rows update **in place** — never append a duplicate row.
> `done` rows are immutable (forward-only). Flags: `stitch:fallback`, `tokens:drift`, `collides:<slug>`.
> Status: `todo | in-progress | awaiting-signoff | done | skipped | blocked`.

| slug | route | components | stage | status | flags | progress |
|------|-------|-----------|-------|--------|-------|----------|
| producto-detalle | /productos/[id] | components/products/ProductDetailPageClient.tsx (+Gallery, SellerCard, OwnerListingNotice, ProductActions, ShareButton) | 8-verify | done | signoff 2026-09-13; impl 205d5cf; tokens:drift (resuelto vía clases compartidas); g6:preexisting-debt (decisión humana 2026-09-13; test a11y de la página PASS; deuda → buscar-storefront-a11y) | 8/8 |
| buscar-storefront-a11y | /buscar + /negocio/[slug] | (por identificar — intake propio) | 1-intake | todo | color-contrast serious ×2 en /buscar (resultados samsung + empty state) + storefront timeout en suite a11y; bloquea G6 a nivel repo | 0/8 |

## Ops notes

- 2026-09-12: preflight — 0 blocks. WARNs: dev server off (Stage 3 lo arranca), Supabase off (ruta pública, no requerido), STITCH_API_KEY heredada posiblemente stale (re-exportar de ~/.config/environment.d/stitch.conf antes de Stage 6), sin estado logged-in (no requerido, ruta pública). Primer item real: `producto-detalle` (input del usuario: screenshot products/4jZfwwvcTUi14sEdNtYH58--horquilla-massi). Deuda a11y conocida en /buscar + storefront (main) — fuera de scope de este item.
- 2026-09-13: Stage 7 sign-off registrado (SIGNOFF.md, approver Alcides, hash content-only G4b `4ab3e703…`). Nota: primera corrida gates.sh — G4b BLOCK stale porque el hash inicial se calculó con filenames; corregido con fórmula content-only del gate. gates.sh además cuelga al final si `npm run dev` queda como job hijo (bash do_wait) — matar proceso tras leer GATES.log; la próxima corrida completa ocurre en Stage 8. G6 BLOCK a11y pre-impl esperado (deuda /buscar+storefront en main). Avance a Stage 8.
- 2026-09-13: Stage 8 implementado en branch `redesign/producto-detalle` (commit `205d5cf`, 4 archivos en scope). G8a PASS (after-captures 3 viewports), G8b PASS (6/6 findings resolved), G7/G7b PASS (scope+tokens limpios). Único BLOCK: G6 — fallas son exclusivamente la deuda pre-existente `/buscar` contrast ×2 + storefront timeout (test "Product detail page" de esta página PASS). Item NO marcado done (disciplina fail-closed): pendiente decisión humana — marcar done con flag documentado, o item propio de deuda a11y primero. Reorg de Documentation/ se commiteó en main (`4c9749f`) con ok del usuario para desbloquear G7.
