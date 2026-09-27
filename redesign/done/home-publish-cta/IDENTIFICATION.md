# IDENTIFICATION — home-publish-cta

Route: `/` (landing) — `app/page.tsx` (server component, `Home()`)

## Screenshot → route → component mapping

| Visible element | Source |
|---|---|
| Header sticky (logo, search, nav, Publicar Gratis desktop-only, Entrar/hamburger mobile) | `components/layout/Header.tsx` |
| Hero card: badge "Marketplace 100% boliviano", h1 "Lo buscás, ¡te lo pillo!", HeroSearchForm, muted link "¿Vendés? Encontrá qué buscan los compradores" → `/busco` | `app/page.tsx:94-129`, `components/home/HeroSearchForm.tsx` |
| Categorías populares (8 + Ver todas) | `app/page.tsx:131-181` |
| Productos populares / Solicitudes recientes previews | `components/home/ResilientHomePreview.tsx` (vía `app/page.tsx:183`) |
| Trust strip (9 Departamentos / 0% / ShieldCheck / 24-7) | `app/page.tsx:185-225` |
| ¿Por qué Telopillo? — feature cards; "Publicá Gratis" es card informativa SIN link | `app/page.tsx:227-257` (features array :51-72) |
| CTA strip final (anon): "¿Listo para empezar?" → Crear cuenta gratis / Iniciá sesión — sin ruta publicar | `components/home/CtaStrip.tsx` |
| "Publicar Gratis" móvil SOLO dentro de hamburger drawer | `components/layout/MobileNavigationDrawer.tsx:433-434` |
| Footer | `components/layout/Footer.tsx` (no afecta) |

## Root cause del feedback (2026-09-22)

Usuarios entran pero no encuentran cómo publicar:

1. **Mobile: cero CTA publicar visible.** Header móvil (`Header.tsx:152-214`) = search icon + Entrar/avatar + hamburger. Publicar vive solo dentro del drawer (`MobileNavigationDrawer.tsx:433-434` → `/crear`), oculto tras hamburger. No existe bottom nav.
2. **Desktop: botón publicar solo en header** (`Header.tsx:146-148` → `/crear`). Contenido de landing nunca surfaces publicar: hero vende búsqueda + link muted a `/busco`; "Publicá Gratis" card informativa sin link (`page.tsx:52-55`); CtaStrip empuja registro/login, no publicar (`CtaStrip.tsx`).
3. **CTAStrip mezcla mensajes**: para vendedor potencial ("¿Listo para empezar? Crear cuenta gratis") no ofrece camino a publicar; el flujo real de publicación es `/crear` → `/publicar` (producto) | `/busco/publicar` (demanda).

## Landmark

`Lo buscás, ¡te lo pillo!` (h1 hero, único en DOM)

## Scope (ver scope.txt)

- `app/page.tsx` — hero/CTA strip de landing
- `components/home/CtaStrip.tsx` — strip final anon
- `components/layout/Header.tsx` — controles móviles (publish CTA visible mobile)
- `components/layout/MobileNavigationDrawer.tsx` — drawer (consistencia etiqueta/ruta)
