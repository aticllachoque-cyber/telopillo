# Stitch brief — producto-detalle

## Screen

Product detail page for **Telopillo** (Bolivian marketplace, Spanish UI). Desktop 1440px + mobile 375px. Route `/productos/[id]`.

Layout today: breadcrumb + "Volver" → 2-column grid (desktop): left = square gallery + detail card (title, price, meta list, description, share/report); right = sticky seller card (avatar+name+verification badge, "Tu consulta sobre" product preview, WhatsApp CTA, profile button, safety tips).

## Component inventory

- `ProductGallery` — main square image, prev/next arrows, counter pill, 5-col thumbnail strip
- `ProductDetailPageClient` — page grid, breadcrumb, meta list (Estado/Ubicación/Vistas/Publicado), description, share + reportar
- `SellerCard` — seller identity, verification badge, product preview, WhatsApp CTA, safety tips
- `OwnerListingNotice` (owner view), `ProductActions` (Editar/Eliminar), `ShareButton`

## Findings to address (from AUDIT.md)

- **F-1 (P1):** on mobile, the WhatsApp contact CTA sits below the entire description — surface contact/price/CTA near the top on mobile (e.g. compact price+CTA block after gallery, full seller card after description).
- **F-2 (P1):** "Reportar" button is dead — give it a visible destination (report dialog/route placeholder with real affordance) or clear feedback.
- **F-3 (P2):** gallery prev/next arrows are 36px — raise to ≥44px touch targets.
- **F-4 (P2):** desktop: square gallery at 2/3 width pushes title+price below the fold — consider cap on gallery height (e.g. 4:3 or max-h) so title/price surface above the fold.
- **F-5 (P2):** keep all colors on the app token palette (oklch shadcn tokens); do not invent new greens.
- **F-6 (P2):** "Volver" should preserve navigation context (breadcrumb-aware back).

## Brand tokens (app/globals.css oklch — use these, no hardcoded hex)

- background/foreground/card/border/ring: neutral oklch scale
- primary: brand green oklch token; destructive: red token
- radius: `--radius` (0.625rem); WhatsApp CTA currently green-50/green-900 outline — keep a green *token-mapped* treatment
- Typography: sans (Geist), bold titles, `text-primary` price

## Constraints

- Tailwind CSS v4 + shadcn/ui, React 19 Server/Client Components
- Spanish (Bolivian) UI copy — keep all existing labels: "Contactar por WhatsApp", "Tu consulta sobre", "Consejos de seguridad", "Descripción", "Vendedor"
- Touch targets ≥44px, WCAG 2.2 AA contrast
- Keep information architecture: gallery, meta list, description, seller card, safety tips all present
- Do NOT redesign the header/footer — page content only

## Sibling pattern inventory (do not diverge)

- `components/demand/DemandPostDetail.tsx` replicates the "Ver perfil público" / seller-contact card pattern (lines 328, 376). **Match the existing sibling look — do not invent a divergent pattern** for the seller/contact card. Converging that sibling is a future item.
- `ProductGallery` and `SellerCard` are used nowhere else — free to improve within this page.

## Iteration 1 feedback (2026-09-12, user review of first proposal)

1. **No inventar componentes** que no existen en el diseño original: quitar badges "Seminuevo/Entrega Inmediata", código de publicación, sección "Atributos", "Pagos QR", "Normas comunitarias", mega-nav desktop con buscador/enlaces que no existen. Header y footer deben ser los reales del sitio (el header real colapsa a menú hamburguesa en móvil).
2. **Sin componentes superpuestos**: en móvil el bloque precio y el botón WhatsApp se sobrelapaban — usar layout estático sin `position: fixed/sticky`.

## Iteración 2 feedback (2026-09-12, user review)

3. **Paleta del diseño original obligatoria**: solo neutros del sitio (tokens oklch de `app/globals.css` → #252525 texto, #363636 primary/precio, #707070 secundario, #e5e5e5 bordes, #f4f4f4 superficie, #ffffff fondo) + el verde WhatsApp existente (#15803d sobre #f0fdf4) como único color cromático. Prohibido el azul/lavanda Material del design-system de Stitch (#dae2fd, #f8f9ff, etc.).

## Iteración 3 — adiciones solicitadas por el usuario (2026-09-12)

4. **Productos relacionados**: sección nueva tras el detalle — grid 4 col desktop / 2 col móvil, cards minimalistas patrón marketplace (foto 4:3, título 2 líneas, precio bold, ubicación), sin badges/ratings/favoritos. Implementación Stage 8: productos de la misma categoría (query existente, sin API nueva).
5. **Link al catálogo del vendedor**: botón outline "Ver catálogo del vendedor" en SellerCard, debajo de "Ver perfil del vendedor". Implementación Stage 8: `/vendedor/[id]` o `/negocio/[slug]` (routes ya existen; SellerCard ya linkea ambos hoy, SellerCard.tsx:102,134).
