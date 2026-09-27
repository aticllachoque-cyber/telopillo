# IDENTIFICATION — tinted-card-contrast-sweep

> Stage 2 output. Cross-cutting item: the "screenshot" is not one route but three
> hidden states captured at intake (owner notice, open drawer, open user menu).
> Identification comes from the repo-wide pattern sweep (grep evidence below),
> confirmed live at intake with hard asserts.

## Input

- Screenshots: `redesign/tinted-card-contrast-sweep/input/{owner-notice-desktop,usermenu-desktop,drawer-mobile}.png`
- Surfaces (3 states, 2 auth contexts):
  - `/productos/<id>` logged-in as owner → OwnerListingNotice card
  - `/` header dropdown open (logged-in) → UserMenu groups
  - `/` mobile drawer open (logged-out) → MobileNavigationDrawer CTA banner

## Route mapping

| Evidence (visible string / landmark / class) | Matched in | File |
|---|---|---|
| "Este es tu producto" | grep `components/` | components/products/OwnerListingNotice.tsx:22 |
| "Creá tu cuenta gratis" / "Publicá, ofertá y contactá vendedores" | grep `components/` | components/layout/MobileNavigationDrawer.tsx:121-123 |
| "Publicaciones" / "Cuenta" group labels (`user-menu-*-label`) | grep `components/` | components/layout/UserMenu.tsx:99-129 |
| draft banners "Encontramos un borrador guardado" / "Estás trabajando sobre un borrador recuperado" | grep `components/` | ProductFormWizard.tsx:368,391 · DemandPostForm.tsx:409,432 · BusinessProfileForm.tsx:371,394 |
| offline banners "Mostrando contenido|solicitudes guardadas por una falla de conexión" | grep `app/ components/` | ResilientHomePreview.tsx:116 · app/busco/page.tsx:411 |

## Component mapping

| Component | File | Evidence |
|-----------|------|----------|
| OwnerListingNotice | components/products/OwnerListingNotice.tsx | Card `bg-primary/5` :15; 3 `<p className="text-muted-foreground">` :23,29,34 — measured 4.27:1 @14px/400 |
| MobileNavigationDrawer | components/layout/MobileNavigationDrawer.tsx | banner div `bg-primary/5` :120; muted `<p>` :122 — 4.27:1 @12px/400 |
| UserMenu | components/layout/UserMenu.tsx | group divs `bg-primary/5` :97,:126; labels `text-[11px] … text-muted-foreground` :102,:128 — 4.27:1 / 4.58:1 @11px/600 |
| ProductFormWizard | components/products/ProductFormWizard.tsx | amber pendingDraft banner :368 (muted subtitle :370 = 4.39:1) + muted/30 status banner :391 (4.62:1) |
| DemandPostForm | components/demand/DemandPostForm.tsx | amber :409 (muted subtitle) + muted/30 :432 — same family, same ratios |
| BusinessProfileForm | components/profile/BusinessProfileForm.tsx | amber :371 (muted subtitle) + muted/30 :394 — same family, same ratios |
| ResilientHomePreview | components/home/ResilientHomePreview.tsx | hardcoded `border-amber-300/60 bg-amber-50 text-amber-900` :116 (8.73:1 — drift, not failure) |
| busco page | app/busco/page.tsx | hardcoded amber offline banner :411 (same drift twin) |

## DOM snapshot confirmation

- intake-capture.mjs hard asserts (playwright, 2026-09-17): `text=Este es tu producto` ✓, `button[aria-label="Menú de usuario"]` + `#user-menu-publicaciones-label` ✓, `text=Creá tu cuenta gratis` ✓ — all present in live DOM.
- measure-contrast.mjs resolved the same nodes via `div.space-y-2 > p.text-muted-foreground`, `#user-menu-*-label`, `div.bg-primary\/5 > p.text-muted-foreground`.

## Landmark (verbatim visible string)

Recorded to `redesign/tinted-card-contrast-sweep/landmark.txt`:

```
Este es tu producto
```

(Lives on the canonical captured page `/productos/b3bed804-…` under owner auth — reproducible with `tests/.auth/logged-in.json` for current/ and after/ captures.)

## Identified files (scope)

Recorded to `redesign/tinted-card-contrast-sweep/scope.txt`:

```
components/products/OwnerListingNotice.tsx
components/layout/MobileNavigationDrawer.tsx
components/layout/UserMenu.tsx
components/products/ProductFormWizard.tsx
components/demand/DemandPostForm.tsx
components/profile/BusinessProfileForm.tsx
components/home/ResilientHomePreview.tsx
app/busco/page.tsx
redesign/
```
