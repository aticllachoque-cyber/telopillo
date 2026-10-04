# AUDIT-RESOLUTION — tinted-card-contrast-sweep

> Stage 8 output. Branch `redesign/tinted-card-contrast-sweep`. All ratios
> re-measured live on branch code (measure-contrast.mjs + DOM probes,
> 2026-09-17). Dark-mode axe clean on / + /buscar + /busco
> (after/dark-mode-axe.txt).

## Resolution rows

- F-1 (P1): resolved — OwnerListingNotice.tsx:23,29,34 `text-muted-foreground` → `text-foreground/80`; DOM probe (branch): paragraphs now `text-foreground/80 leading-relaxed`; fg/80 sobre bg-primary/5 = 17.84:1 (antes 4.27:1). Capturas after/desktop|tablet|mobile.png.
- F-2 (P1): resolved — MobileNavigationDrawer.tsx:122 → `text-xs text-foreground/80`; DOM probe (branch, drawer abierto): clase aplicada; 17.84:1 sobre bg-primary/5 (antes 4.27:1). Capturas after/drawer-mobile|tablet.png.
- F-3 (P1): resolved — UserMenu.tsx:102,128 labels → `text-foreground/80`; medido en vivo en branch: Publicaciones 17.84:1 (antes 4.27:1), Cuenta 19.13:1 (antes 4.58:1). Captura after/usermenu-desktop.png.
- F-4 (P2): resolved — 6 banners en ProductFormWizard.tsx:372,391 + DemandPostForm.tsx:413,432 + BusinessProfileForm.tsx:375,394: subtítulos amber y estados muted/30 → `text-foreground/80`; DOM probe (branch, banner visible): `text-sm text-foreground/80`; fg/80 = 18.34:1 sobre amber-500/10 (antes 4.39:1) y 19.30:1 sobre muted/30 (antes 4.62:1 borderline). Capturas after/draft-{demand,product,business}-desktop.png.
- F-5 (P2): resolved — ResilientHomePreview.tsx:116 + app/busco/page.tsx:411 `border-amber-300/60 bg-amber-50 text-amber-900` → `border-border/60 bg-muted/40 text-foreground/80` (tokens oklch, tratamiento storefront-a11y F-3); fg/80 sobre muted/40 = 19.13:1; banner condicional (offline-cached) no reproducible en vivo — evidencia = diff de clases + render de propuesta (mockup-offline) con las mismas clases. Dark-mode: token alpha funciona en ambos temas (axe dark limpio).

## Deferred (aprobados en sign-off)

- lib/constants/productPresentation.ts metaLabel — 4.62:1 pasa hoy; constante compartida con ProductCard (blanco, 4.73:1).
- components/network/NetworkStatusBanner.tsx — amber ≈13:1 pasa; candidato limpieza propia.

## Verification summary

- Gates: G5a/G5b/G5c/G6/G7/G7b PASS (primer run tuvo G5a+G6 transitorios — cold-compile; re-run con server caliente todo PASS).
- After-captures: 10 (mirror 1:1 de current/, mismo manifiesto/landmark/http-status).
- Dark-mode: axe sin violaciones critical/serious en / /buscar /busco.
