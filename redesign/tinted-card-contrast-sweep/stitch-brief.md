# stitch-brief — tinted-card-contrast-sweep

> Stage 5 output. Ruta elegida: **fallback** (`stitch:fallback`) — ítem de
> contraste/token en superficies existentes; un mock externo no puede
> representar estados owner-only/cerrados. Precedente: buscar-a11y loop 1
> (mock Stitch rechazado por divergencia), publicar-a11y (fixes de
> presencia/atributos). Mockup fiel sobre DOM real hidratado.

## Screen description

Barrido transversal (no una pantalla): texto `text-muted-foreground` (#737373) sobre superficies tinted (`bg-primary/5`, `bg-amber-500/10`, `bg-muted/30`) en 7 componentes + 1 ruta. Usuarios afectados: dueños de productos (OwnerListingNotice), visitantes móviles sin cuenta (banner CTA del drawer), usuarios logueados (labels del UserMenu, banners de borrador en 3 formularios). El objetivo es legibilidad AA uniforme con el tratamiento que ya usan las hermanas (`text-foreground/80`) y eliminar el drift amber hardcodeado.

## Component inventory

| Component | File | Role on screen |
|-----------|------|----------------|
| OwnerListingNotice | components/products/OwnerListingNotice.tsx | Card informativa "Este es tu producto" (solo dueño) |
| MobileNavigationDrawer | components/layout/MobileNavigationDrawer.tsx | Drawer móvil; banner CTA registro (logged-out) :120-122 |
| UserMenu | components/layout/UserMenu.tsx | Dropdown header; labels de grupo 11px :102,:128 |
| ProductFormWizard | components/products/ProductFormWizard.tsx | Wizard /publicar; banners borrador :368/:391 |
| DemandPostForm | components/demand/DemandPostForm.tsx | Wizard /busco/publicar; banners borrador :409/:432 |
| BusinessProfileForm | components/profile/BusinessProfileForm.tsx | Form /profile/edit; banners borrador :371/:394 |
| ResilientHomePreview | components/home/ResilientHomePreview.tsx | Banner offline-cached :116 |
| busco page | app/busco/page.tsx | Banner offline-cached :411 |

## Audit findings to address

| Finding | Severity | What the design must change |
|---------|----------|----------------------------|
| F-1 | P1 | OwnerListingNotice: 3 párrafos muted→`text-foreground/80` sobre `bg-primary/5` (4.27:1 → 17.8:1) |
| F-2 | P1 | Drawer banner: p muted→`text-foreground/80` (4.27:1 → 17.8:1) |
| F-3 | P1 | UserMenu labels 11px muted→`text-foreground/80` ×2 (4.27:1/4.58:1 → 17.8:1) |
| F-4 | P2 | Banners borrador (6 instancias, 3 archivos): subtítulos/estado muted→`text-foreground/80` (amber 4.39:1 → 18.3:1; muted/30 4.62:1 → 19.3:1) |
| F-5 | P2 | Banners offline-cached ×2: neutralizar amber hardcodeado → `border-border/60 bg-muted/40` + `text-foreground/80` (tratamiento storefront-a11y F-3) |

## Brand tokens (from app/globals.css — never invent values)

- palette (light): `--background oklch(1 0 0)` · `--foreground oklch(0.145 0 0)` · `--primary oklch(0.205 0 0)` · `--muted oklch(0.97 0 0)` · `--border oklch(0.922 0 0)` · `--radius 0.625rem`
- dark: `--muted oklch(0.269 0 0)` etc. (misma mecánica alpha)
- El fix usa SOLO alpha del token foreground (`/80`) — ningún valor nuevo, ningún hex.

## Constraints

- Tailwind v4 + shadcn primitives — no new component libraries.
- Spanish UI copy — SIN cambios de copy (ítem de contraste; textos intactos).
- Existing route structure unchanged.
- **Match the existing sibling look — do not invent a divergent pattern**: `text-foreground/80` es exactamente el tratamiento de buscar-a11y F-1 (page.tsx:651) y ProductFormWizard:536 tips; el banner neutro `bg-muted/40` es el de storefront-a11y F-3.
- Sibling-pattern inventory (PATTERN-INSTANCES.md): 8 in-scope (los del fix), 13 not-affected (foreground-on-tinted ya correctos — buscar:648 CTA card es la referencia visual del tratamiento), 2 deferred (metaLabel constante compartida, NetworkStatusBanner).
- Dark mode: alpha sobre token foreground funciona en ambos temas (misma mecánica que hermanas); verificar en Stage 8.

## Iteration feedback

<!-- Stage 7 loops append here -->
