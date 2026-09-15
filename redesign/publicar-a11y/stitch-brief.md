# stitch-brief — publicar-a11y

## Screen
Dos wizards de publicación (producto `/publicar`, demanda `/busco/publicar`), 4 pasos cada uno, shadcn/Tailwind v4, copy español. Logged-in.

## Findings a resolver (AUDIT.md)
- **F-1**: eliminar duplicación del error "Debes subir al menos 1 imagen" — quitar el `<p>` propio del wizard (`ProductFormWizard.tsx:561`), conservar el render vía prop `error` de `ImageUpload` (única copia).
- **F-2**: centrar layout demanda — `container max-w-2xl` → `container mx-auto max-w-2xl` (`app/busco/publicar/page.tsx:79,102`), igual que la hermana producto.
- **F-3**: test "Publish page" (`accessibility-audit.spec.ts:150`) → `test.slow()` (budget ×3) para absorber contención de suite; cero cambios de app.
- **F-4**: la copia única del error de imágenes debe anunciarse — `ImageUpload` ya recibe `error`; asegurar `role="alert"` en su render (o aria-live) — misma semántica que los errores de categoría/demanda.

## Tokens / constraints
- Todos los fixes usan tokens/clases existentes (`mx-auto`, `text-destructive`, `role="alert"`) — cero nuevos colores/radii.
- Hermandad: el wizard producto YA centra (`container mx-auto max-w-3xl`) — demanda debe igualar el patrón, no inventar uno nuevo.
- Estado final esperado del error: UNA línea roja `text-destructive` con role="alert", bajo la dropzone, en ambos temas.

## Sibling inventory
Ver PATTERN-INSTANCES.md — edit forms (`/productos/[id]/editar`, `/busco/[id]/editar`) reutilizan los wizards: heredan F-1/F-4 automáticamente.

## Ruta de propuesta
Fallback fiel (`stitch:fallback`): fixes son de presencia/atributos, no de diseño visual — un mock Stitch no aporta; el mockup sobre DOM real hidratado muestra el estado exacto resultante (precedente buscar-a11y loop 1 + storefront-a11y).
