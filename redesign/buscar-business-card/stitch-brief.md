# stitch-brief — buscar-business-card

## Screen
`/buscar?type=negocios&q=…` — unified search results for the Negocios tab. Today:
single-column row cards (56px avatar, name, "categoría · ubicación", "N productos
activos · Vendedor", chevron). User asks for a product-card-like presentation.

## Components in play
- `components/search/BusinessResultCard.tsx` (redesign target)
- `components/search/PersonResultCard.tsx` (family sibling — same treatment for consistency, lighter: no description emphasis, avatar-first)
- `app/buscar/page.tsx` (results container `ul` → grid for negocios; personas follows)
- Reference look (do not modify): `components/products/ProductCard.tsx`, `components/products/ProductGrid.tsx`

## Findings to address
F-1 visual hierarchy · F-2 grid layout ≥sm · F-3 identity tile scale · F-4 show
description · F-5 shared VerificationBadge instead of inline emerald span · F-6
name as heading. (Full evidence in AUDIT.md.)

## Target design
Product-card anatomy adapted to a business (no cover photo exists):
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6` (mirror ProductGrid.tsx:52).
- Card top: aspect-[16/9] (mobile) / [16/10] ≥sm muted tile with the business logo centered at ~96px (or big initials on `getAvatarColor`); "Verificado" NIT chip top-left via shared VerificationBadge; hover: tile logo/initials subtle scale like product image hover.
- Body: `h3` name (truncate, hover:text-primary), category as small uppercase muted label, description line-clamp-2 (fallback: nothing), MapPin location row, footer row with border-t: Package "N productos activos" + "Vendedor: X" truncated.
- Whole card is the link (existing pattern) with focus-visible ring.
- Personas sibling: same grid + card chrome, avatar tile smaller/full-bleed, name h3, MapPin row, meta footer (rating/listings) — no description (not in SearchPerson emphasis), keeps existing link rule.

## Brand tokens (app/globals.css)
shadcn oklch palette: card/border/muted/muted-foreground/primary/foreground; radius via `rounded-xl` (existing card radius in this surface); emerald only inside shared VerificationBadge. Spanish (Bolivian voseo) copy: "productos activos", "Vendedor:", "Verificado".

## Constraints
- Tailwind v4 + shadcn, existing route structure; no new dependencies; icons lucide (MapPin, Package, chevron only if needed).
- Match sibling look — do not invent divergent patterns (product card is the reference).
- TELO-003: no phone fields ever.
- Data is already in the SearchBusiness RPC payload — no backend changes.
