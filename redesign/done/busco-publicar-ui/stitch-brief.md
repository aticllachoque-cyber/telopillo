# stitch-brief — busco-publicar-ui

## Screen

Wizard multi-paso "Publicá lo que buscás" (`/busco/publicar`) — publicación de solicitudes de compra (demanda). 4 pasos con stepper (ol horizontal en sm+, progressbar en mobile): 1 Referencia (título, categoría grid, imagen opcional) → 2 Descripción (subcategoría select + textarea) → 3 Ubicación y Presupuesto (departamento/ciudad selects, rango Bs.) → 4 Revisión (resumen + confirmar). Nav Atrás / Siguiente sticky-footer; publicación = "Publicar solicitud".

## Findings a resolver (de AUDIT.md)

- **F-1 (P1):** unificar TODO el copy del wizard a **voseo boliviano** — voz de marca de la app ("Publicá", "Elegí", "Subí"). Hoy mezcla tuteo (Explica/Asegúrate/Selecciona…) con voseo (Publicá/Incluí/Elegí). NUNCA proponer copy en tuteo.
- **F-2 (P2):** heading paso 2 → title case consistente con hermanos ("Descripción de lo que buscás"), sin duplicar el label del textarea.
- **F-3 (P2):** banner "Borrador guardado localmente." → aviso efímero/inline; banner rico solo para restored/error.
- **F-4 (P2):** paso 2 densificado — subcategoría como **grupo de chips seleccionables** (misma familia visual que las radio-cards de CategoryGrid del paso 1), columna única. **Iteración 1 (feedback humano):** la propuesta original de 2 columnas sm+ con Select fue rechazada — el dropdown radial tapa la columna vecina al abrirse ("lo de subcategorias no me convence"). NO usar select en 2 columnas; chips envueltos en flex-wrap.
- **F-5 (P2):** card "Antes de publicar:" → checklist de verificación contra datos reales del formulario (✓ Título, ✓ Categoría, ✓ Ubicación; Presupuesto opcional) en vez de consejos genéricos. **Iteración 2 (feedback humano):** el layout del paso 4 también se rehace — sin sidebar derecha (queda flaca en viewports medios): stack en 1 columna, Resumen como fila de 3 stats en sm+ (Ubicación | Presupuesto | Imagen), checklist merged en la misma card bajo border-t.
- **F-6 (P2, sign-off):** touch targets alineados al patrón hermano producto: `min-h-[44px] sm:min-h-0` en inputs y botones nav (44px solo mobile, altura nativa desktop).

## Component inventory

- `page.tsx` shell: back-link, h1, subtítulo, Términos footer, container max-w-2xl (mx-auto ya en main vía publicar-a11y F-2).
- `DemandPostForm`: stepper nav, 4 steps, draft banner, submit error banner, nav buttons (Atrás ghost / Siguiente solid / Publicar solicitud solid full-width mobile).
- Sub-componentes: `CategoryGrid` (radio cards con iconos), `DemandImageUpload`→SingleImageUpload (dropzone), `LocationSelector` (2 selects dependientes), shadcn Input/Textarea/Select/Card/Button.

## Brand tokens (app/globals.css oklch — usar solo tokens)

- primary, primary-foreground, muted, muted-foreground, border, destructive, card, background, ring.
- Radios: rounded-lg/xl como el wizard producto. Iconos lucide (Camera, MapPin, Eye…).

## Constraints

- Tailwind v4 + shadcn/ui, Next.js 16 App Router, React 19.
- Copy en español boliviano **voseo** exclusivamente.
- **Sibling constraint — match the existing sibling look:** wizard producto `/publicar` (ProductFormWizard) es el patrón hermano; el wizard demanda debe mantenerse visualmente de la misma familia (mismo stepper, misma jerarquía heading text-xl, mismos botones). No inventar patrón divergente. Wizard producto NO se toca.
- No cambios a validaciones zod, API, ni lógica de draft localStorage.
- a11y ya hardening por publicar-a11y — no regresar atributos/roles.
- PATTERN-INSTANCES (Stage 2): edit-routes heredan vía componente compartido; owner-listing card del wizard producto no afectada.

## Sibling-pattern inventory (de PATTERN-INSTANCES.md)

in-scope: DemandPostForm (wizard demanda), page.tsx shell, LocationSelector, CategoryGrid, DemandImageUpload. not-affected: ProductFormWizard (/publicar), rutas de edición (heredan), /busco listing, OwnerListingNotice.
