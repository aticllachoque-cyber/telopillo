# Pattern instances — busco-detalle

Pattern: página de detalle con layout 2-col (contenido principal + sidebar de contacto) — badges de estado, meta-row, card Resumen, empty state de ofertas, CTA auth, sticky mobile CTA.

- instance: components/products/ProductDetailPageClient.tsx disposition: not-affected
- instance: components/products/SellerCard.tsx disposition: not-affected
- instance: components/products/ProductWhatsAppLink.tsx disposition: not-affected
- instance: app/busco/publicar/page.tsx disposition: not-affected
- instance: components/demand/DemandPostCard.tsx disposition: not-affected
- instance: components/demand/DemandPostFilters.tsx disposition: not-affected
- instance: lib/constants/productPresentation.ts disposition: deferred
- instance: components/products/OwnerListingNotice.tsx disposition: not-affected
- instance: app/perfil/demandas/page.tsx disposition: not-affected

## Notas de disposition

- `ProductDetailPageClient.tsx` — hermano canónico del mismo patrón (item producto-detalle done). Referencia de consistencia (productPresentation ya se usa aquí). No se edita.
- `SellerCard.tsx` — hermano sidebar vendedor. Referencia. No se edita.
- `ProductWhatsAppLink.tsx` — componente COMPARTIDO usado directamente por esta página (DemandPostDetail.tsx:363, :409). Solo uso a nivel props; cambios internos al componente afectarían /productos → no se editan.
- `app/busco/publicar/page.tsx` — comparte el string back-link "Volver a solicitudes" (:109); ya rediseñado en busco-publicar-ui. No se edita.
- `DemandPostCard.tsx` / `DemandPostFilters.tsx` — familia listing /busco, no patrón detalle. No se editan.
- `productPresentation.ts` — constantes compartidas con páginas producto. Cualquier tweak a tokens compartidos se difiere (drift controlado) para mantener scope lock; la propuesta usa las constantes tal cual.
- `OwnerListingNotice.tsx` — patrón owner-notice en detalle producto; aquí las acciones owner son botones inline (DemandPostDetail.tsx:255-277), no el notice. No se edita.
- `app/perfil/demandas/page.tsx` — consume DemandStatusBadge (:408, componente in-scope). La propuesta normaliza el badge a tokens manteniendo el matiz semántico verde/azul/ámbar (cambio visual imperceptible) → look compartido sin divergencia. No se edita el page.
