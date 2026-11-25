# AUDIT-RESOLUTION — vitrina-seller-catalog (Stage 8, 2026-09-28)

Branch: redesign/vitrina-seller-catalog (desde feat/catalog-vitrina 7d7d7dd) · Commits: ver git log · Scope: app/negocio/[slug]/page.tsx + components/profile/CatalogManager.tsx + app/perfil/mis-productos/page.tsx

| Finding | Disposition | Evidence |
|---------|-------------|----------|
| F-1 (P1) | resolved | app/negocio/[slug]/page.tsx — wrapper `[&>ul]:max-sm:flex!` + snap-x/mandatory, li `w-[72vw]! max-w-[280px]! flex-none! snap-start`; grid ≥sm intacto. after/mobile.png |
| F-2 (P2) | resolved | chips `min-h-[44px] sm:min-h-[36px]` (ambos links: Todo + categorías); parity SearchSort. after/mobile.png |
| F-3 (P2) | resolved | nav paginación `max-sm:flex-col max-sm:gap-2 sm:justify-between`, spacers `max-sm:hidden` → "Página X de Y" centrado en una línea. after/mobile.png |
| F-4 (P2) | resolved | CatalogManager: `disabled={… \|\| (!is_featured && atFeaturedCap)}` + title "Máximo 4 destacados…"; aria-pressed intacto |
| F-5 (P2) | resolved | mis-productos header: link vitrina solo en modo personal (`{!businessSlug && …}`); manager conserva el contextual |
| F-6 (P2) | resolved | nav chips `relative` + `after:` gradiente from-background→transparent, `max-sm:after:block` |
| F-7 (P1) | resolved | badge posición por card (`{index + 1}`, rounded-full bg-muted, title "Posición N en {categoría}") dentro de cada grupo |
| F-8 (P2) | resolved | `next/image` 56×56 object-cover rounded-md con `product.images[0]`; fallback Package en bg-muted si sin imagen |
| F-9 (P2) | resolved | flechas `title` = aria-label + "(lista {categoría})" |
| F-10 (P2) | resolved | junto al contador cuando `atFeaturedCap`: " · Máximo alcanzado — quitá uno para destacar otro" (visible sin hover, mobile incluido) |
| F-11 (P3) | resolved | Card `group`; flechas `lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100`; mobile/tablet siempre visibles. after/catalog-desktop.png: flechas ocultas (hover no capturable) — defecto declarado igual que en propuesta |

Notas:
- G6 falla 1 test pre-existente NO causado por este item: "Seller profile page" (mobile) — `/vendedor/9b8794bb-…` da 404 (TEST_DATA.businessSellerId stale vs seed actual) → error doc `<html id="__next_error__">` sin lang. Ruta fuera de scope; misma familia de deuda seed-viejo documentada en PLAN (storefront.spec ×6). Los 30 tests a11y restantes PASS, incl. storefront + mis-productos ambos viewports.
- tokens:drift advisory resuelto: implementación usa solo clases Tailwind/tokens, cero hex.
