# IDENTIFICATION — busco-publicar-ui

> Stage 2. Item: UI/UX redesign del wizard de publicación de solicitudes ("Publicá lo que buscás", `/busco/publicar`). Scope visual/UX completo — el ítem hermano `publicar-a11y` (done, merged a1e85de) ya cerró los fixes de accesibilidad (F-1..F-4) sobre estos mismos archivos; este item NO repite a11y, propone mejora de diseño/UX.

## Mapeo screenshot → ruta → componentes

- **Ruta:** `app/busco/publicar/page.tsx` (route shell: back-link, heading, Términos footer, renderiza el wizard) — 157 líneas.
- **Wizard:** `components/demand/DemandPostForm.tsx` (880 líneas, client component) — STEPS ×4 (:55), stepper (:421-495), paso 1 referencia (:520), paso 2 descripción (:602), paso 3 ubicación/presupuesto (:664), paso 4 revisión (:749), nav Atrás/Siguiente (:844+).
- **Sub-componentes tocados solo si un finding vive dentro:** `components/shared/SingleImageUpload.tsx` (imagen de referencia), `components/ui/*` (shadcn: Input, Textarea, Select/Combobox, Card, Button).

## Evidencia

- landmark "Publicá lo que buscás" renderizado por `page.tsx` (heading h1); "Referencia de la Solicitud" (step heading paso 1, DemandPostForm).
- Intake: `input/intake-paso{1,2,3,4}*.png` — 6 capturas del flujo completo (4 pasos + estado de validación de ciudad) walkthrough logged-in, desktop 1920 fullPage dsf=2.
- Contraste con item hermano: publicar-a11y AUDIT.md F-2 referenciaba estos archivos (mx-auto) — ya mergeado a main; baseline de este item = post-merge.

## Fuera de scope

- `/publicar` (wizard producto) — par de referencia de consistencia, no se toca.
- Rutas de edición `/busco/[id]/editar` (reusan DemandPostForm — heredarán cambios; documentar en PATTERN-INSTANCES).
- Backend/API `app/api/search-demands`, validaciones `lib/validations/demand.ts` (copy de zod se respeta).
