# AUDIT — tinted-card-contrast-sweep

> Stage 4 output. Cross-cutting contrast sweep of muted text on tinted surfaces.
> All ratios measured live 2026-09-17 via `measure-contrast.mjs` (Playwright:
> computed colors — Chromium lab()/oklch() parsed and converted — ancestor-chain
> alpha compositing, WCAG relative luminance). Conditional banners measured via
> class probes resolved against the live stylesheet (no fabricación).

## Scope

- Surfaces: `/productos/<id>` (owner) · `/` header (UserMenu open, drawer open) · `/busco/publicar`, `/publicar`, `/profile/edit` (draft banners) · offline-banner twins (`ResilientHomePreview`, `/busco`)
- Components: OwnerListingNotice, MobileNavigationDrawer, UserMenu, ProductFormWizard, DemandPostForm, BusinessProfileForm, ResilientHomePreview, app/busco/page.tsx
- Captures: `current/desktop.png`, `current/tablet.png`, `current/mobile.png` (canonical, fullPage dsf=2) + `current/usermenu-desktop.png`, `current/drawer-{mobile,tablet}.png`, `current/draft-{demand,product,business}-desktop.png`
- axe run: `npm run test:a11y` — not re-run at Stage 4: the three P1 sites are invisible to axe by construction (closed containers / owner-only), which is this item's origin (ops note 2026-09-15). Full suite runs at Stage 8 (G6).

## Findings

### F-1 (P1)

OwnerListingNotice: three `text-muted-foreground` paragraphs (`:23`, `:29`, `:34`) sit on the `bg-primary/5` Card (`:15`). Effective bg rgb(243,243,243), fg #737373 → **4.27:1** @14px/400. Fail WCAG AA 4.5:1. Owner-only surface — axe never sees it in anonymous audits.

- guideline: WCAG 2.2 AA — 1.4.3 Contrast (Minimum)
evidence: components/products/OwnerListingNotice.tsx:23 — measured 4.27:1 @14px/400 (measure-contrast.mjs, live)

### F-2 (P1)

MobileNavigationDrawer logged-out CTA banner: `text-muted-foreground` p (`:122`) on `bg-primary/5` div (`:120`) → **4.27:1** @12px/400. Drawer closed during audits → invisible to axe.

- guideline: WCAG 2.2 AA — 1.4.3 Contrast (Minimum)
evidence: components/layout/MobileNavigationDrawer.tsx:122 — measured 4.27:1 @12px/400 (measure-contrast.mjs, live; current/drawer-mobile.png)

### F-3 (P1)

UserMenu group labels: two `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` labels (`:102` "Publicaciones", `:128` "Cuenta") on `bg-primary/5` groups (`:97`, `:126`). "Publicaciones" **4.27:1**; "Cuenta" 4.58:1 (barely over, on a lighter popover bg) — same pattern, both fragile; 11px is the smallest muted text in the app. Dropdown closed during audits → invisible to axe.

- guideline: WCAG 2.2 AA — 1.4.3 Contrast (Minimum)
evidence: components/layout/UserMenu.tsx:102 — measured 4.27:1 @11px/600 (measure-contrast.mjs, live; current/usermenu-desktop.png)

### F-4 (P2)

Draft-banner family (3 forms × 2 banners): amber pendingDraft banners carry a `text-muted-foreground` subtitle on `bg-amber-500/10` → **4.39:1** @14px/400 (FAIL, amber tint is lighter than the muted/30 twin); muted/30 status banners ("borrador recuperado"/"error"/"guardado") sit at **4.62:1** — passes today with 0.12 headroom; any token shift breaks it. Files: ProductFormWizard.tsx:368+370 (amber) + :391 (muted/30); DemandPostForm.tsx:409+414 + :432; BusinessProfileForm.tsx:371+376 + :394.

- guideline: WCAG 2.2 AA — 1.4.3 (amber subtitle fails) + defensive hardening (muted/30 borderline)
evidence: probe-measured 4.39:1 (muted on bg-amber-500/10 → rgb(255,245,230)) y 4.62:1 (muted on bg-muted/30 → rgb(252,252,252)); current/draft-{demand,product,business}-desktop.png

### F-5 (P2)

Offline-cached banners drift from the token system: `border-amber-300/60 bg-amber-50 text-amber-900` hardcoded (not oklch tokens, no dark variants) in ResilientHomePreview.tsx:116 and app/busco/page.tsx:411. Contrast itself passes (amber-900 on amber-50 = **8.73:1**) — this is palette drift + missing `dark:` handling, same class of finding as storefront-a11y F-3 (which was neutralized to `bg-muted/40`).

- guideline: token consistency (app/globals.css oklch palette) — hardcoded palette colors
evidence: components/home/ResilientHomePreview.tsx:116 + app/busco/page.tsx:411 — hardcoded amber-300/50/900 (probe 8.73:1)

## Deferred (documented, not findings)

- `lib/constants/productPresentation.ts:25` metaLabel muted over specs `bg-muted/30` (ProductDetailPageClient.tsx:229): 4.62:1 borderline-pass. Shared constant also feeds ProductCard on white (4.73:1 PASS) — hardening would darken untouched surfaces. PATTERN-INSTANCES disposition: deferred.
- `components/network/NetworkStatusBanner.tsx:14` hardcoded amber ≈13:1 (pass). Separate global component; token cleanup candidate, outside this sweep's failing set.

## Fix reference (verified)

`text-foreground/80` (the sibling treatment from storefront-a11y F-5 / buscar-a11y F-1) measures **17.8–19.3:1** on every tinted surface in this sweep — uniform, token-pure, dark-mode safe via the same alpha mechanism the hermanas already use.
