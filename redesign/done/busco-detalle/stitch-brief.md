# stitch-brief — busco-detalle

> Stage 5 output. Input to Google Stitch MCP (preferred) or fallback mockup generation.
> Iteration feedback from Stage 7 is appended at the bottom (max 3 loops, then escalate).
> NOTA: precedente de propuesta aceptada = mockup fiel sobre DOM real (stitch:fallback, ×6 items:
> buscar/storefront/publicar/busco/buscar-business-card/tinted-sweep). Este brief alimenta esa ruta.

## Screen description

Detalle de solicitud "busco" (`/busco/[id]`): un comprador publica lo que necesita (ej. "Busco Reloj Smart Garmin", Santa Cruz, presupuesto opcional, imagen opcional, vigencia 30 días) y vendedores llegan a ofrecerle sus productos. Audiencia dual: (a) vendedor prospecto anónimo o logueado que evalúa ofrecer, (b) el dueño revisando ofertas. Objetivo de conversión: que un vendedor con el producto entienda la solicitud rápido y actúe (ofrecer / contactar por WhatsApp / ingresar para ofrecer). Layout actual: 2-col lg (contenido principal 2/3 + sidebar 1/3), back-link arriba, badges estado/categoría, H1, meta-row, imagen 2:1, card Resumen (meta + descripción), card Ofertas (lista OfferCard o empty state), sidebar Comprador (avatar, nombre, ubicación, WhatsApp o perfil) + card CTA auth.

## Component inventory

| Component | File | Role on screen |
|-----------|------|----------------|
| DemandPostPageClient | components/demand/DemandPostPageClient.tsx | wrapper: back-link + container |
| DemandPostDetail | components/demand/DemandPostDetail.tsx | layout 2-col, badges, H1, meta, Resumen, Ofertas + OfferCard, sidebar Comprador, CTAs, sticky móvil |
| DemandStatusBadge | components/demand/DemandStatusBadge.tsx | badge Activo/Encontrado/Expirado |
| DemandImageFrame | components/demand/DemandImageFrame.tsx | imagen de la solicitud o placeholder por categoría |
| OfferProductModal | components/demand/OfferProductModal.tsx | modal para elegir producto propio a ofertar (logueado) |

## Audit findings to address

| Finding | Severity | What the design must change |
|---------|----------|----------------------------|
| F-1 | P1 | AvatarFallback Comprador (y mini-avatars OfferCard): `text-muted-foreground` sobre `bg-muted` 4.35:1 claro → `text-foreground/80` (fix familiar sweep) |
| F-2 | P1 | CTA vendedor anon visible en mobile sin scroll completo: compact CTA near-top (patrón hermano producto F-1) o sticky — cubre "Iniciá sesión para ofrecer" / estado logueado "Ofrecer producto" |
| F-3 | P2 | Eliminar duplicación meta: fila bajo H1 vs card Resumen — una sola fuente (decidir en propuesta: mantener Resumen como única meta, fila bajo H1 se simplifica o desaparece; hermano producto tiene meta 1 vez) |
| F-4 | P2 | Voseo: "¿Tenés lo que esta persona busca?" / "Iniciá sesión para ofrecer" |
| F-5 | P2 | DemandStatusBadge: matiz semántico verde/azul/ámbar preservado, clases normalizadas (token discipline, tokens:drift advisory; sin cambio visual perceptible — consumidor perfil/demandas no debe divergir) |
| F-6 | P2 | Resumen semántico: `<ul>`+`<li>` como hermano producto (aria-label en div genérico hoy no anunciado) |

## Brand tokens (from app/globals.css — never invent values)

- palette: `--background: oklch(1 0 0)`, `--foreground: oklch(0.145 0 0)`, `--card: oklch(1 0 0)`, `--primary: oklch(0.205 0 0)` (dark: `--background: oklch(0.145 0 0)`, `--card: oklch(0.205 0 0)`, `--primary: oklch(0.922 0 0)`), `--muted: oklch(0.97 0 0)`, `--muted-foreground: oklch(0.556 0 0)` (dark 0.708), `--border`, `--ring` derivados
- radius: `--radius: 0.625rem` (escalera sm..4xl derivada)
- typography/spacing: presentation constants compartidas con producto — `detailTitle: font-bold text-balance break-words text-xl sm:text-2xl lg:text-3xl tracking-tight`, `sectionHeading: text-base font-semibold sm:text-lg`, `metaRow/metaLabel/metaIcon`, `listingPrice: text-xl sm:text-2xl font-bold text-primary tabular-nums`

## Constraints

- Tailwind v4 + shadcn primitives (`components/ui/`) — no new component libraries.
- Spanish UI copy, voseo (F-4, precedente busco-publicar-ui F-1).
- Existing route structure unchanged (`app/busco/[id]`); data flow (server page → PageClient → Detail) intact.
- Mobile-first: 375px y 1920x1080 ambos; touch targets ≥44px.
- **Sibling pattern lock (G3d)**: match el look del hermano `components/products/ProductDetailPageClient.tsx` (producto-detalle, ya rediseñado) — mismas presentation constants, mismo Card border-border/80 shadow-sm, mismo patrón compact-CTA móvil. NO inventar patrón divergente.
- Componentes compartidos fuera de scope: ProductWhatsAppLink (solo uso props), productPresentation.ts (deferred — usar constantes tal cual).
- Estados a respetar: anon (CTA login), logueado no-owner activo (Ofrecer producto + sticky), owner (Editar/Marcar encontrado, sin CTA), poster con/sin WhatsApp (link vs Ver perfil público), ofertas 0..N, placeholder descripción, expirado/encontrado (badges).

## Iteration feedback

<!-- Stage 7 loops append here -->
