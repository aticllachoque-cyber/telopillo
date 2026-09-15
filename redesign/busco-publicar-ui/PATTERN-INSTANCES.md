Patrón: wizard multi-paso de publicación de solicitudes (stepper + form por paso + pantalla de revisión).

- instance: app/busco/publicar/page.tsx — disposition: in-scope (route shell demanda)
- instance: components/demand/DemandPostForm.tsx — disposition: in-scope (wizard demanda completo)
- instance: components/demand/DemandImageUpload.tsx — disposition: in-scope (wrapper upload imagen referencia paso 1; delega en SingleImageUpload)
- instance: components/products/CategoryGrid.tsx — disposition: in-scope (grid de categorías paso 1; compartido con wizard producto — cambios con custodia de consistencia)
- instance: components/profile/LocationSelector.tsx — disposition: in-scope (departamento/ciudad paso 3; compartido con perfil)
- instance: app/publicar/page.tsx — disposition: not-affected (wizard producto = par de consistencia, NO se toca; divergencia deliberada solo si finding lo justifica y se documenta)
- instance: components/products/ProductFormWizard.tsx — disposition: not-affected (wizard producto, hermano de estilo; servir de referencia visual, no target)
- instance: app/busco/[id]/editar/page.tsx — disposition: not-affected (reusa DemandPostForm: hereda el rediseño automáticamente)
- instance: app/busco/page.tsx — disposition: not-affected (listado de solicitudes, mismo dominio pero fuera del flujo de publicación)
- instance: components/products/OwnerListingNotice.tsx — disposition: deferred (P1 oculta catalogada → item tinted-card-contrast-sweep)
