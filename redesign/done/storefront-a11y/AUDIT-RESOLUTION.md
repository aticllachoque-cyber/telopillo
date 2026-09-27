# AUDIT-RESOLUTION — storefront-a11y

> Stage 8 record. One row per finding from AUDIT.md. Literal (P1)/(P2) required next to each F-id (gate G8b).
> Impl commit: `6dd37b4` fix(negocio): close storefront a11y findings F-1..F-5

| Finding | Severity | Disposition | Evidence |
|---------|----------|-------------|----------|
| F-1 | (P1) | resolved | Badge "Cerrado" `text-red-600` → `text-red-700` (#b91c1c) — 5.91:1 sobre red-50 (antes 4.36:1). `components/business/BusinessInfoSidebar.tsx:103`. Dot `bg-red-500` intacto (decorativo, aria-hidden). Visible en after/desktop.png. |
| F-2 | (P1) | resolved | Badge "Abierto" `text-green-600` → `text-green-800` (#166534) — 6.81:1 sobre green-50 (antes ≈3.14:1). `components/business/BusinessInfoSidebar.tsx:95`. Misma familia que F-1; mismo tratamiento que VerificationBadge. No renderiza hoy (lunes = closed en seed; render condicional por día — defecto de render aceptado en SIGNOFF); parche verificado en código y compilado (clase presente en el build). |
| F-3 | (P2) | resolved | Banner construcción: gradiente `from-primary/12 via-primary/5 to-amber-500/10` → plano `bg-muted/40` (sin amber). `app/negocio/[slug]/page.tsx:209`. Border `border-primary/35` queda (sin cambios, fuera de la condición del sign-off). Visible en after/*.png. |
| F-4 | (P2) | resolved | `TEST_DATA.businessSlug` `'usuario-de-desarrollo'` (404) → `'tienda-electronica-la-paz'` — la suite a11y de G6 ahora audita la página real. `tests/helpers/index.ts:216`. Sin cambio visual. |
| F-5 | (P2) | resolved | Descripción banner `text-muted-foreground` → `text-foreground/80` — 13.70:1 en tema oscuro, ≈8.5:1 en claro. `app/negocio/[slug]/page.tsx:220`. |

## Verificación dark mode (condición de SIGNOFF)

- Badges: colores estáticos (`bg-red-50`, `bg-green-50`, `text-red-700`, `text-green-800`) sin variantes `dark:` → contraste idéntico en ambos temas: F-1 5.91:1, F-2 6.81:1 (≥ 4.5:1 WCAG 1.4.3).
- Banner: `foreground/80` sobre `muted/40` en tema oscuro (muted 0.269 sobre background 0.145 oklch) = 13.70:1.
- Axe live en tema oscuro (clase `.dark` forzada): 0 violaciones serious/critical/moderate en desktop y mobile → `dark-mode-axe.txt`.

## Verificación en página compilada

- `bg-muted/40`, `text-foreground/80`, `text-red-700 bg-red-50` presentes en el HTML servido por dev server (branch code).
- `from-primary/12` ausente — gradiente eliminado.
- `text-green-800` ausente del HTML de hoy (badge no renderiza lunes — esperado).

## Specs m4.5 con slug local stale

`tests/m4.5-*.spec.ts` (×3) — deferred según SIGNOFF (fuera de la suite a11y de G6). Sin cambios.
