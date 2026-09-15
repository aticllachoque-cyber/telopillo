# SIGNOFF — buscar-a11y

> Stage 7 record. Gate G4a: this file must contain `Decision: approved`.
> Gate G4b: the hash below must match the CURRENT sha256 over `comparison.html` + `proposal/*`.
> If the proposal changes after approval, this sign-off is stale — re-approval required.
> Recompute with: `{ sha256sum redesign/buscar-a11y/comparison.html redesign/buscar-a11y/proposal/*; } | sha256sum`

- Approver: Alcides Cardenas
- Date: 2026-09-15
- Decision: approved
- Artifact hash (comparison.html + proposal/*): `af3e02d92ce1c80bec390064e2dca24a3467b24b2a91ec8b6c588af30b02f240`

## Notes / conditions

- Iteración 2 aprobada tras loops: loop 1 descartó el mock Stitch por divergencia con el tema actual ("no hay consistencia con el tema de la app actual, lo veo diferente") → propuesta regenerada como mockup fiel sobre DOM real (flag stitch:fallback); loop 2 dobló 3 mejoras acordadas: remover "Mostrando N de M" redundante, omitir "No hay más productos." si totalCount < PAGE_SIZE, banner offline con botón Reintentar funcional.
- Condiciones de implementación (Stage 8):
  - Scope estricto: `app/buscar/page.tsx` (+ `redesign/`). Header, SearchBar, SearchFilters, ProductGrid/ProductCard, footer SIN cambios.
  - F-1/F-2/F-5: texto `text-foreground/80` sobre cards tintadas (≈8.6:1); replicar tratamiento de hermanas (ProductFormWizard.tsx:526, DemandPostForm.tsx:827).
  - F-3: banner offline en tokens neutros (border/bg-muted/text-foreground) + botón Reintentar cableado a reintento real (performSearch).
  - F-4: empty state consolidado en una card, CTA de demanda como fila `border-t`.
  - Mejoras: sin "Mostrando N de M" redundante; "No hay más productos." solo cuando totalCount ≥ PAGE_SIZE.
  - Verificar contraste del fix en tema OSCURO además del claro.
- Defecto de render aceptado: imágenes de producto en blanco en el lado "after" de comparison.html (lazy-load sin JS en el mock estático).
- Diferidos aprobados explícitamente: CTA de demanda como botón sólido, sugerencias en empty state, help-text de SearchFilters, filtro route-scoped para G6.
