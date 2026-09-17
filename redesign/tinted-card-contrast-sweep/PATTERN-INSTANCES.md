# Pattern instances — tinted-card-contrast-sweep

Sibling implementations of the tinted-surface + muted-text pattern
(`bg-primary/5`, `bg-muted/30`, `bg-amber-500/10`, hardcoded amber) found by the
repo-wide sweep (grep `bg-primary/5|bg-muted/30|bg-amber` over `app/ components/`).

G3d parses the `- instance:` lines below — exact format
`- instance: <repo path> disposition: in-scope|deferred|not-affected`
(no example line inside a fence: the gate's grep cannot tell it from a real
instance — validated gotcha from earlier items).

## Instances

- instance: components/products/OwnerListingNotice.tsx disposition: in-scope
- instance: components/layout/MobileNavigationDrawer.tsx disposition: in-scope
- instance: components/layout/UserMenu.tsx disposition: in-scope
- instance: components/products/ProductFormWizard.tsx disposition: in-scope
- instance: components/demand/DemandPostForm.tsx disposition: in-scope
- instance: components/profile/BusinessProfileForm.tsx disposition: in-scope
- instance: components/home/ResilientHomePreview.tsx disposition: in-scope
- instance: app/busco/page.tsx disposition: in-scope
- instance: app/buscar/page.tsx disposition: not-affected
- instance: app/(auth)/register/page.tsx disposition: not-affected
- instance: components/products/CategoryGrid.tsx disposition: not-affected
- instance: components/products/ImageUpload.tsx disposition: not-affected
- instance: components/demand/OfferProductModal.tsx disposition: not-affected
- instance: lib/constants/productPresentation.ts disposition: deferred
- instance: components/network/NetworkStatusBanner.tsx disposition: deferred
- instance: components/demand/DemandStatusBadge.tsx disposition: not-affected
- instance: components/ui/snackbar.tsx disposition: not-affected
- instance: components/products/ProductDetailPageClient.tsx disposition: not-affected
- instance: app/page.tsx disposition: not-affected
- instance: app/perfil/demandas/page.tsx disposition: not-affected
- instance: components/profile/BusinessHoursEditor.tsx disposition: not-affected

## Disposition rationale

- **in-scope (8)** — the five findings live here: F-1/F-2/F-3 P1 muted-on-`bg-primary/5`, F-4 draft-banner family (amber failing + muted/30 borderline), F-5 offline-banner amber drift twins.
- **app/buscar/page.tsx:648 not-affected** — same `bg-primary/5` CTA card but already fixed by buscar-a11y (`text-foreground/80`, 17.8:1); reference sibling, no change needed.
- **register:254 not-affected** — dashed `bg-primary/5` box, button/fields use `text-foreground`.
- **CategoryGrid:97 / ImageUpload:484 / OfferProductModal:167 not-affected** — selection-highlight states (border + `text-foreground`), no muted-on-tinted text.
- **MobileNavigationDrawer:246 (in-scope file, distinct site) not-affected** — authenticated "Publicaciones" section heading is `text-foreground/90` over `bg-primary/5` (17.8:1); only the logged-out CTA banner :120-122 is violated.
- **lib/constants/productPresentation.ts deferred** — `metaLabel: 'text-muted-foreground'` renders over the specs card `bg-muted/30` (ProductDetailPageClient:229) at 4.62:1 (passes, borderline). Shared constant also feeds ProductCard on white (4.73:1 PASS, measured publicar-a11y); hardening it would darken untouched surfaces. Follow-up in PLAN ops notes.
- **NetworkStatusBanner.tsx deferred** — hardcoded amber offline banner, `text-amber-950` on `bg-amber-500/10` (≈13:1, passes). Distinct global component; token cleanup candidate, not part of this sweep's failing set.
- **DemandStatusBadge:20 not-affected** — `text-amber-800` on `bg-amber-100` ≈ 6+:1, badge family with dark variants.
- **snackbar.tsx not-affected** — amber variants are `text-amber-950`/`text-amber-100` with paired `dark:` classes, ≈10:1.
- **ProductDetailPageClient:229 / app/page.tsx:94,187 / perfil/demandas:307 / BusinessHoursEditor:163 not-affected** — `bg-muted/30` surfaces whose text is `text-foreground`/`font-medium` (or the deferred metaLabel constant), no muted-on-tinted copy beyond the deferred case.
