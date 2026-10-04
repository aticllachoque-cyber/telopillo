# PATTERN-INSTANCES — publicar-a11y

Patrón: wizard multi-paso de publicación (stepper + form por paso) y sus sub-patrones (upload de imágenes, grids de categoría/cards seleccionables, textos de ayuda muted).

- instance: components/products/ProductFormWizard.tsx — disposition: in-scope (wizard producto, ruta /publicar)
- instance: components/demand/DemandPostForm.tsx — disposition: in-scope (wizard demanda, ruta /busco/publicar)
- instance: app/publicar/page.tsx — disposition: in-scope (route shell producto: layout centrado, heading, Términos footer)
- instance: app/busco/publicar/page.tsx — disposition: in-scope (route shell demanda: layout alineado izquierda — candidato finding UX de intake)
- instance: app/productos/[id]/editar/page.tsx — disposition: not-affected (reusa ProductFormWizard — hereda fixes automáticamente; ruta separada fuera de scope)
- instance: app/busco/[id]/editar/page.tsx — disposition: not-affected (reusa DemandPostForm — hereda fixes automáticamente)
- instance: components/products/ImageUpload.tsx — disposition: not-affected (sub-componente upload producto; se toca solo si violación axe vive dentro y el fix no cabe en el wizard — se re-evalúa en Stage 4)
- instance: components/shared/SingleImageUpload.tsx — disposition: not-affected (sub-componente upload demanda; misma regla de re-evaluación)
- instance: components/products/OwnerListingNotice.tsx — disposition: deferred (fuera de este item; violación oculta P1 ya catalogada → item tinted-card-contrast-sweep)
