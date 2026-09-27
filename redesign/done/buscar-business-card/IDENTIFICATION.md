# IDENTIFICATION — buscar-business-card

## Source
User screenshot (prod): `input/user-screenshot-prod.png` — `https://www.telopillo.lat/buscar?type=negocios&q=lenticular`, taken 2026-09-16 right after the unified-search merge. Shows the Negocios tab results: thin horizontal row cards (56px avatar, name, category · location, "N productos activos · Vendedor", chevron).

## Mapping
- Route: `app/buscar/page.tsx` — `type=negocios` renders `results.businesses` into `<ul role="list" className="flex flex-col gap-3">` (app/buscar/page.tsx:395-397).
- Component: `components/search/BusinessResultCard.tsx` — the row card itself (avatar + two muted lines + chevron; 79 lines).
- Sibling in the same family: `components/search/PersonResultCard.tsx` (personas tab, same list-row pattern).
- Reference pattern (the "similar a producto" target): `components/products/ProductCard.tsx` — image-anchored grid card (`Card` + aspect image + hover zoom, h3 title, price, MapPin location row, seller row with Store icon, footer meta), laid out by `components/products/ProductGrid.tsx`.

## Evidence
- `app/buscar/page.tsx:13` imports BusinessResultCard; `:395-397` maps businesses into a single-column list.
- `BusinessResultCard.tsx:38` — `flex items-center gap-4 rounded-xl border ... p-4` row layout; `:41-46` 14×14 Avatar; `:58-70` two truncated muted lines; `:73-75` text chevron.
- `ProductCard.tsx:104-162` — visual anchor (aspect image, group-hover scale-105), `:171-186` title/price/location hierarchy.
- Data available for a richer card (`types/database.ts:713-728` SearchBusiness): business_description, business_category, business_logo_url, city/department, is_nit_verified, owner_name, active_listings_count, verification_level, created_at. No cover image — the logo is the only visual.

## Intent
User: "este es el card de negocios necesitamos mejorar esto mostramos el card del negocio similar a producto" — upgrade the business result card to a product-card-like presentation (visual, grid-friendly), triggered via ui-redesign-flow.
