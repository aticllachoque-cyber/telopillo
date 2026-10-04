# PATTERN-INSTANCES — producto-detalle

Patrón: página de detalle (galería + card de vendedor/contacto lateral).

- instance: components/demand/DemandPostDetail.tsx disposition: deferred

## Notas

- `components/demand/DemandPostDetail.tsx` replica el bloque "Ver perfil público" / card de contacto (`:328`, `:376`) — mismo patrón visual que `SellerCard`. La propuesta NO debe inventar un look divergente; la convergencia de ese bloque será su propio item futuro (`deferred`).
- `app/negocio/[slug]/page.tsx` usa componentes propios (`BusinessHeader`, `BusinessInfoSidebar`) — patrón distinto, no afectado.
- `ProductGallery` y `SellerCard` no se usan fuera de `ProductDetailPageClient` (grep verificado).
