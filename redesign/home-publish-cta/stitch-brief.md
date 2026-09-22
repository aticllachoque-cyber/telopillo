# stitch-brief — home-publish-cta

## Pantalla

Landing `/` (anon, estado canónico del feedback). Estructura actual: Header sticky → Hero (badge, h1 "Lo buscás, ¡te lo pillo!", HeroSearchForm, link muted "¿Vendés?" → /busco) → Categorías populares → ResilientHomePreview (productos + solicitudes) → Trust strip → ¿Por qué Telopillo? (4 feature cards) → CtaStrip (anon: Crear cuenta gratis / Iniciá sesión) → Footer.

## Objetivo

Hacer visible el camino a PUBLICAR en desktop y mobile/tablet. Feedback real 2026-09-22: usuarios entran y no encuentran cómo publicar. Mobile y tablet hoy tienen CERO CTA publicar visible; desktop solo header.

## Findings a resolver (AUDIT.md)

- F-1 P1: mobile+tablet sin CTA publicar visible (header móvil sin botón; drawer oculto)
- F-2 P1: contenido landing sin CTA publicar en el recorrido (hero/features/CtaStrip)
- F-3 P2: link "¿Vendés?" → /busco no publica
- F-4 P2: CtaStrip empuja registro sin ruta publicar
- F-5 P2: vocabulario "Publicar Gratis" vs voseo "Publicá" inconsistente

## Inventario de componentes

- `app/page.tsx` — hero, features, secciones (server component)
- `components/home/CtaStrip.tsx` — strip final anon (client, usa useAuth)
- `components/layout/Header.tsx` — header sticky, controles móviles
- `components/layout/MobileNavigationDrawer.tsx` — drawer hamburguesa
- Destino: `/crear` (chooser "¿Qué querés publicar?" → /publicar producto | /busco/publicar demanda)

## Tokens de marca (app/globals.css, oklch)

- `--primary` verde Telopillo, `--primary-foreground`
- `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--card`, `--border`, `--ring`
- Botones: shadcn Button default (bg-primary), outline, ghost. Touch targets ≥44px (min-h-[44px]) — patrón existente header.
- Iconos lucide: `Megaphone` (publicar), `Plus`, `Target` (solicitudes), `Search`.

## Constraints

- Tailwind v4 + shadcn/ui; NO inventar colores/radios fuera de tokens.
- Copy español boliviano (voseo) — unificar CTA publicar a voseo p/ej "Publicá gratis" (F-5, precedente busco-publicar-ui F-1).
- Ruta existente `/crear` — no crear rutas nuevas; el chooser ya resuelve producto vs demanda.
- Header móvil ya tiene 3 controles (lupa, Entrar/avatar, ☰) — el nuevo botón publicar debe caber sin romper el header en 375px (evaluar: botón compacto icono+texto o icono).
- CtaStrip client component con useAuth (isAuthenticated oculta strip) — respetar lógica.
- Spanish UI; código inglés.
- SEO/JSON-LD del hero intacto.

## Sibling-pattern inventory (PATTERN-INSTANCES.md — match, no divergir)

- CTAs publicar hermanos: "Publicá lo que buscás →" (app/buscar/page.tsx:608, cards empty-state), "Publicar solicitud" botón (app/busco/page.tsx:253), "Publicar producto" (perfil).
- Patrón botón acción primaria header: Button asChild min-h-[44px] (Header.tsx:146).
- Patrón link muted hero: page.tsx:116-125.
- Onboarding WelcomeScreen menciona "publicá gratis" (voseo) — vocabulario objetivo.

## Nota de enfoque (a resolver en propuesta)

Candidatos a explorar (la propuesta decide, con cobertura F-1..F-5):
1. Botón publicar visible en header mobile/tablet (compacto).
2. CTA publicar en hero (par search/publicar o fila de 2 acciones).
3. CtaStrip: acción principal "Publicá gratis" + registro secundario.
4. Link "¿Vendés?" → /crear o ajuste de copy.
No excluir: bottom nav móvil sería patrón nuevo global (scope mayor) — solo si el humano lo aprueba como iteración.
