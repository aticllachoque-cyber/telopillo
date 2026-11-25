# Stitch brief — vitrina-seller-catalog (2026-09-28)

## Screen
Storefront público de negocio `/negocio/[slug]` (ElectroLab Bolivia como caso) + vista seller `/perfil/mis-productos` con CatalogManager. Next.js App Router + Tailwind v4 + shadcn/ui, copy en español boliviano (voseo en acciones).

## Component inventory (implementación real, no reinventar)
- Header negocio card (logo, badges, WhatsApp/Compartir) — INTACTO
- Barra Productos: título + (N) + SearchSort "Orden de la tienda" (Select shadcn, label sr-only, 44px mobile)
- Nav chips catálogo: pills rounded-full con label + contador tabular-nums; activo = bg-primary text-primary-foreground; aria-current
- Sección Destacados: heading con Star fill-primary + ProductGrid showActions=false (hasta 4)
- Grid principal ProductGrid + paginación (estado "Página X de Y" + Anterior/Siguiente)
- CatalogManager: contador destacados ★ "X de 4 — aparecen arriba en tu vitrina" + link "Ver mi vitrina"; grupos por categoría (Package icon + nombre + (N)); cards con título/precio/vistas/contactos + botón Destacar (aria-pressed, ring-primary en card destacado) + subir/bajar + ProductActions

## Findings a address (de AUDIT.md)
- F-1 (P1): Destacados en mobile (<640px) → carrusel horizontal scroll-snap (cards ~70-75vw o fijo 260-280px), NO stack vertical de 4; grid normal ≥640px. Desktop/tablet intactos.
- F-2 (P2): chips a min-h-[44px] en mobile (parity con SearchSort); mantener 36px desktop si se desea compacto.
- F-3 (P2): paginación mobile centrada, estado compacto sin wrap feo (ej. "Página 1 de 2" en una línea 13px, botones full-touch).
- F-4 (P2): Destacar disabled (con aria-disabled + title/ayuda) al alcanzar cap 4; contador ya explica.
- F-5 (P2): eliminar link "Ver mi vitrina" duplicado (dejar UNO — el contextual del CatalogManager; header card lo conserva solo si el manager no está visible, ej. filtro vendidos).
- F-6 (P2): affordance de scroll en chips cuando desbordan (fade derecho con mask/gradiente token, o peek del próximo chip).

## Brand tokens (app/globals.css — NO inventar)
--primary oklch(0.205 0 0) · --muted-foreground oklch(0.556 0 0) · --background/--foreground/--input/--muted estándar shadcn neutro · radios rounded-md/lg/full · Star fill-primary.

## Constraints
- Tailwind v4 + shadcn/ui; sin librerías nuevas; sin dark-mode regressions (tokens only)
- Copy español boliviano voseo ("Destacá"/"Ver mi vitrina" ya existen — no cambiar vocabulario salvo F-4)
- Mantener aria-current/aria-pressed/aria-label existentes; no romper axe (baseline 0)
- Sibling constraint: chips/status-pills ya existen en mis-productos (Todos/Activos/Vendidos/Inactivos) y en /buscar — match exacto de ese look, no divergir
- La propuesta es DELTA sobre el DOM real capturado (current/), no rediseño de páginas

## Sibling-pattern inventory (de PATTERN-INSTANCES.md)
6 in-scope (chips, destacados, SearchSort, controles manager, links vitrina), 4 not-affected (buscar sorts, status chips mis-productos, ProductGrid, barra /busco/[id]). Los in-scope deben mantener el look de sus hermanos.

## Iteración 1 (2026-09-28, feedback usuario) — findings nuevos
- F-7 (P1): badge de posición por card en CatalogManager (1.º/2.º… por categoría) — orden visible sin visitar la vitrina. Token muted-foreground, tabular-nums.
- F-8 (P2): thumbnail 56px junto al título en cards del manager (object-cover, rounded-md) — parity con ProductGrid.
- F-9 (P2): title tooltips en flechas ("Subir/Bajar en la lista de {categoría}").
- F-10 (P2): texto inline junto al contador cuando 4/4: "Máximo alcanzado — quitá uno para destacar otro" (muted, sm).
- F-11 (P3): desktop ≥1024px flechas opacity-0 → visible on card hover/focus-within; mobile siempre visibles. NO usar en Destacar ni kebab.
Los F-1..F-6 de la iteración 0 siguen vigentes. El mock debe seguir siendo delta sobre DOM real.
