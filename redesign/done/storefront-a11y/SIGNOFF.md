# SIGNOFF — storefront-a11y

> Stage 7 record. Gate G4a: this file must contain `Decision: approved`.
> Gate G4b: the hash below must match the CURRENT sha256 over `comparison.html` + `proposal/*`.
> If the proposal changes after approval, this sign-off is stale — re-approval required.
> Recompute with: `{ sha256sum redesign/storefront-a11y/comparison.html redesign/storefront-a11y/proposal/*; } | sha256sum`

- Approver: Alcides Cardenas
- Date: 2026-09-15
- Decision: approved
- Artifact hash (comparison.html + proposal/*): `8243f471c76fb7e9df1bb9f3b81e0200162bdf9a5cb1dc1742ebea872a3d1938`

## Notes / conditions

- Primera iteración aprobada (sin loops). Ruta fallback fiel (`stitch:fallback`) aceptada por precedente de buscar-a11y loop 1 (mock divergente de Stitch fue rechazado).
- Condiciones de implementación (Stage 8):
  - Scope: `app/negocio/[slug]/page.tsx`, `components/business/BusinessInfoSidebar.tsx`, `tests/helpers/index.ts` (+ `redesign/`). BusinessHeader, ProductGrid/ProductCard SIN cambios.
  - F-1: badge "Cerrado" → texto `text-red-700` (5.87:1 sobre red-50); dot `bg-red-500` queda (decorativo, aria-hidden).
  - F-2: badge "Abierto" → texto `text-green-800` (6.27:1 sobre green-50); dot `bg-green-500` queda.
  - F-3: banner construcción → sin gradiente amber; tinte muted plano (`bg-muted/40` o equivalente en tokens).
  - F-5: descripción del banner → `text-foreground/80`.
  - F-4: `TEST_DATA.businessSlug` → `'tienda-electronica-la-paz'`.
  - Verificar contraste del fix en tema OSCURO además del claro (badges y banner).
- Defectos de render aceptados: imágenes lazy en blanco en el "after" del mock; badge "Abierto" no visible en mock (no renderiza lunes).
- Diferidos aprobados explícitamente: specs `tests/m4.5-*.spec.ts` (×3) con slug local stale — quedan sin cambios (fuera de suite a11y).
