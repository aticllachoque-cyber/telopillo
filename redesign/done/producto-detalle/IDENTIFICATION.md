# IDENTIFICATION — producto-detalle

## Route

`app/productos/[id]/page.tsx` (dynamic segment `[id]`, slug-style ids like `4jZfwwvcTUi14sEdNtYH58--horquilla...`)

## Component map (screenshot → files)

| Screenshot region | Component | Path |
|---|---|---|
| Página completa de detalle | `ProductDetailPageClient` | `components/products/ProductDetailPageClient.tsx` (233 ln, raíz) |
| Carrusel de imágenes + thumbnails | `ProductGallery` | `components/products/ProductGallery.tsx` (117 ln) |
| Card "Vendedor" (avatar, badge teléfono, ubicación, Ver perfil público, consejos) | `SellerCard` | `components/products/SellerCard.tsx` (253 ln) |
| Banner "Este es tu producto" | `OwnerListingNotice` | `components/products/OwnerListingNotice.tsx` (43 ln) |
| Botones Editar/Eliminar, WhatsApp, Compartir | `ProductActions`, `ShareButton` | `components/products/ProductActions.tsx` (345 ln), `components/products/ShareButton.tsx` (32 ln) |

## Evidence

- grep "Este es tu producto" → único match: `components/products/OwnerListingNotice.tsx`
- `ProductDetailPageClient.tsx` importa: ProductGallery, SellerCard, ProductActions, ShareButton, OwnerListingNotice
- `<h1>` del título en `ProductDetailPageClient.tsx:136`; encabezado "Descripción" en `:181`
- consumido por `app/productos/[id]/page.tsx`

## Landmark (G0d)

Verbatim visible: `Descripción` (h2, siempre presente en detalle de producto)
