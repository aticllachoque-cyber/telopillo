# Pattern instances — vitrina-seller-catalog

Patrones UI nuevos de la feature: (P-A) "chip pill selector con contador y aria-current" ; (P-B) "fila destacados con heading Star + grid" ; (P-C) "botón destacar (toggle aria-pressed) + controles reorder (subir/bajar)" ; (P-D) "link 'Ver mi vitrina'".

```
```

- instance: app/negocio/[slug]/page.tsx:411-447 (chips catálogo con contador, P-A) disposition: in-scope
- instance: app/negocio/[slug]/page.tsx:453-464 (sección Destacados, P-B) disposition: in-scope
- instance: app/negocio/[slug]/page.tsx:397-402 (SearchSort defaultSort vitrina, P-A hermano) disposition: in-scope
- instance: components/profile/CatalogManager.tsx:197-241 (destacar + subir/bajar, P-C) disposition: in-scope
- instance: components/profile/CatalogManager.tsx:134-146 (contador destacados + link Ver mi vitrina, P-D) disposition: in-scope
- instance: app/perfil/mis-productos/page.tsx:207-244 (header card con link Ver mi vitrina duplicado, P-D) disposition: in-scope
- instance: app/buscar/page.tsx (SearchSort con otros sorts, patrón selector chips) disposition: not-affected
- instance: app/perfil/mis-productos/page.tsx:470-500 aprox (chips filtro estado Todos/Activos/Vendidos/Inactivos, P-A hermano pre-existente) disposition: not-affected
- instance: components/products/ProductGrid.tsx (grid compartido por Destacados y grid principal) disposition: not-affected
- instance: app/busco/[id]/page.tsx DemandPostDetail barra fixed bottom (colisión potencial con controles reorder sticky futuros) disposition: not-affected
