# AUDIT — producto-detalle

**Fecha:** 2026-09-12 · **Vistas:** desktop.png (1440×900), mobile.png (375×812) · Ruta `/productos/[id]` (captura local: cuna convertible; patrón idéntico al input del usuario).

## Hallazgos

### F-1 (P1) CTA primaria de contacto bajo el fold en móvil
Guideline: Mobile usability / interaction heuristics — la acción principal (Contactar por WhatsApp, `SellerCard`) renderiza después de galería + card de detalle completa en la columna única de 375px; el comprador móvil debe scrollear toda la descripción antes de poder contactar.
evidence: components/products/ProductDetailPageClient.tsx:129-228 (grid `lg:grid-cols-3`: SellerCard en col 2, DOM order la deja al final en móvil) + redesign/producto-detalle/current/mobile.png

### F-2 (P1) Botón "Reportar" sin acción
Guideline: Heurística de feedback (Nielsen) — control visible sin handler ni destino; click no hace nada, rompe la expectativa básica de respuesta.
evidence: components/products/ProductDetailPageClient.tsx:195-202 (Button sin `onClick` ni `href`)

### F-3 (P2) Flechas de galería bajo target táctil de 44px
Guideline: WCAG 2.2 AA — 2.5.8 (mín. 24px pasa, pero el estándar del proyecto es ≥44px en controles táctiles); 36px con `md:opacity-70` adicional en desktop.
evidence: components/products/ProductGallery.tsx:56-71 (`Button size="icon"` = `size-9` 36px, components/ui/button.tsx:26)

### F-4 (P2) Jerarquía above-the-fold en desktop: galería desplaza título/precio
Guideline: jerarquía visual — `aspect-square` a `lg:col-span-2` de `max-w-7xl` ≈ 800px de alto; título y precio quedan bajo el fold de 900px; el precio solo se alcanza arriba vía el preview chico de la sidebar.
evidence: components/products/ProductGallery.tsx:42 + redesign/producto-detalle/current/desktop.png

### F-5 (P2) Escala verde hardcodeada fuera de tokens oklch
Guideline: consistencia shadcn/tokens (`app/globals.css`) — CTA WhatsApp y badge de verificación usan la escala `green-*` de Tailwind, no tokens del design system; deriva de token y riesgo de divergencia con la paleta oklch.
evidence: lib/constants/productPresentation.ts (whatsappButtonClass) + components/ui/VerificationBadge.tsx:83-88

### F-6 (P2) "Volver" pierde contexto de navegación
Guideline: usabilidad/navegación — enlace fijo a `/` aunque el usuario llegue desde `/buscar` o `/negocio`; el breadcrumb ya cubre Inicio, "Volver" debería respetar el origen.
evidence: components/products/ProductDetailPageClient.tsx:107-113 (`href="/"`)

## No hallado (verificado)

- Contraste de badge positive `text-green-700` sobre `bg-green-50` ≈ 4.8:1 — pasa AA (pero ver F-5 por tokens).
- Contador de galería `bg-black/80 text-white` — contraste sobrado; `role="status"` + `aria-live` correctos.
- Thumbnails 62px en 375px — target táctil OK; `aria-pressed` correcto.
- Breadcrumb semántico con `aria-current` — correcto.

## Deuda pre-existente fuera de scope (recordatorio)

`color-contrast` serious en `/buscar` empty-state y storefront de negocio — falla en main sin este item; NO se aborda aquí (G6 bloquea a nivel repo hasta item propio).
