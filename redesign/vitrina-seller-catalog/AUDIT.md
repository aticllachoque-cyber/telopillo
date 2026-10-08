# Audit — vitrina-seller-catalog (2026-09-28)

**Contexto:** post-impl audit de la feature vitrina seller-curated (feat/catalog-vitrina 7d7d7dd). Base: capturas `current/` (ElectroLab con 4 destacados sembrados) + scans axe ×5 estados + revisión código.

**Resultado axe directo (@axe-core/playwright, tags WCAG 2.x A/AA):** 0 violaciones en storefront desktop/mobile, storefront ?cat=home mobile, catalog desktop/mobile (`/tmp/vitrina-axe.json`, regenerable). Suite repo G6: 30/31 — única falla `/categorias` mobile timeout, ruta FUERA del item (deuda pre-existente, patrón /publicar-documentado; se retoma en Stage 8).

**Fortalezas verificadas (no generan finding):** sort con label sr-only + trigger 44px mobile (SearchSort.tsx:83-90); chips con `aria-current` y contadores tabular-nums (page.tsx:417-446); botón Destacar `aria-pressed` (CatalogManager.tsx:204); reorder con aria-label por producto (:220/:230); cap 4 enforce app+UX; destacados excluidos del grid principal (page.tsx:300-302); featured solo página 1 vista vitrina (:298-299).

### F-1 (P1) Mobile: fila Destacados = hasta 4 cards full-width apiladas antes del catálogo
En 375px cada destacado ocupa una fila completa del grid de 1 columna → hasta ~4 viewports de scroll antes del grid principal; el buyer pierde el contexto del catálogo total (24). En desktop es 1 fila compacta — solo mobile/tablet sufre. Patrón marketplace estándar: carrusel horizontal (scroll-snap) en <640px, grid en ≥640px. `showActions={false}` ya distingue la sección.
evidence: app/negocio/[slug]/page.tsx (sección featured :453-464 renderiza ProductGrid completo sin variante mobile)
evidence: redesign/vitrina-seller-catalog/current/crop-mobile-featured.png
Severidad justificada: P1 — afecta la superficie compra principal (storefront mobile = mayoría del tráfico marketplace) en cada tienda con destacados activos.

### F-2 (P2) Chips de sección: touch target 36px, inconsistente con la convención 44px del item
Los chips usan `min-h-[36px]`; el patrón hermano del MISMO feature (SearchSort trigger) usa `min-h-[44px]` en mobile, igual que los botones de CatalogManager. WCAG 2.5.8 AA (24px) se cumple — es consistencia interna: target cómodo al pulgar y paridad con hermanos.
evidence: app/negocio/[slug]/page.tsx (:422 y :435 min-h-[36px] en ambos chips)
evidence: components/search/SearchSort.tsx (SelectTrigger min-h-[44px] mobile)

### F-3 (P2) Paginación mobile: "Página 1 de 2" wrap feo + controles descentrados
En 375px el texto de estado parte en dos líneas ("Página 1 de" / "2") y el par estado/botón queda descentrado (justify-between con texto angosto). Página 2 muestra solo "Anterior" sin estado simétrico claro. Copia corta ("1 / 2" con aria-label completo) o stack centrado lo resuelve.
evidence: app/negocio/[slug]/page.tsx (nav paginación :469+, flex justify-between)
evidence: redesign/vitrina-seller-catalog/current/crop-mobile-pagination.png

### F-4 (P2) Cap de destacados: botones "Destacar" quedan habilitados al llegar a 4
Con 4/4 los demás botones siguen clickeables y responden con snackbar de error (CatalogManager.tsx:69-73). Funciona, pero el affordance miente: mejor deshabilitar (con `aria-disabled` + explicación ya existente en el contador "4 de 4") o snackbar informativo en vez de error.
evidence: components/profile/CatalogManager.tsx (guard cap :68-74; botón sin consideración de cap en disabled :202)

### F-5 (P2) Redundancia: dos links "Ver mi vitrina" visibles en la misma viewport
El header card de mis-productos (:237) y la fila de resumen de CatalogManager (:140-145) muestran el mismo link simultáneamente en desktop (y apilados en mobile). Duplicación visual sin daño funcional; conservar uno (el del manager, contextual) o diferenciar (header = compartir/perfil, manager = preview vitrina).
evidence: app/perfil/mis-productos/page.tsx (link header card)
evidence: components/profile/CatalogManager.tsx (link fila resumen :140-146)

### F-6 (P2) Chips sin affordance de scroll horizontal cuando desbordan
El nav usa `overflow-x-auto pb-1` sin indicación (fade/sombra/partial-peek) de que hay más categorías; con 2-3 chips cabe (ElectroLab), con 5+ el buyer no percibe scroll. Riesgo latente para catálogos multi-categoría.
evidence: app/negocio/[slug]/page.tsx (nav chips :411-415)

**Fuera de alcance registrado:** lógica de datos (queries, migración, gating) — funciona según verificación funcional; solo UI/UX del render.

---

## Iteración 1 (2026-09-28, feedback usuario sobre manager vendedor)

### F-7 (P1) Orden manual invisible: ningún card muestra su posición
Las flechas reordenan pero el resultado (posición en la lista/vitrina) no se muestra en ningún lado — el usuario reordena a ciegas y debe visitar la vitrina para verificar. Fix propuesto: badge numérico por card (1.º, 2.º…) visible junto al título.
evidence: components/profile/CatalogManager.tsx (items.map sin índice visible; handleMove solo muta display_order)

### F-8 (P2) Manager sin thumbnail: identificación solo por título
Los cards del manager son texto-only (título+precio+stats) mientras el grid público hermano (ProductGrid) muestra imagen. Con títulos largos y parecidos (3× Samsung, 2× monitores en ElectroLab) el reconocimiento visual es lento. Fix: thumbnail pequeño (56px, rounded, object-cover) junto al título.
evidence: components/profile/CatalogManager.tsx (CardContent sin <Image>; comparar components/products/ProductGrid.tsx con imagen)

### F-9 (P2) Flechas reorder sin tooltip: aria-label no alcanza para videntes
"Subir/Bajar {título} en la lista" existe como aria-label pero sin `title` — usuario de mouse no descubre qué hacen los chevrons (¿sube en la vitrina? ¿en la categoría?). Además el reorder es POR CATEGORÍA (cada sección ordena su propia lista) y eso es invisible. Fix: title tooltips + aclaración en el heading de sección.
evidence: components/profile/CatalogManager.tsx (:217-241 botones sin title; handleMove(category, index, ±1))

### F-10 (P2) Cap destacados sin explicación accesible sin hover (extiende F-4)
F-4 propone disabled + title, pero title = hover y mobile no tiene hover: al tocar botón disabled en el phone no hay feedback de por qué. Fix complementario: cuando featuredCount = MAX, texto inline junto al contador ("Máximo alcanzado — quitá uno para destacar otro") que explica el estado sin interacción.
evidence: components/profile/CatalogManager.tsx (contador :134-139 estático; botones disabled sin ruta de feedback en touch)

### F-11 (P3) Densidad de controles: 4 controles por card × 24 cards
Destacar + ↑ + ↓ + kebab siempre visibles compiten jerárquicamente; el reorder es acción rara vs Destacar frecuente. Fix propuesto (desktop only): flechas se revelan on card-hover/focus-within (opacity), mobile siempre visibles (no hay hover). Kept: kebab agrupa secundarias — correcto.
evidence: components/profile/CatalogManager.tsx (fila acciones :197-241 siempre visible)
