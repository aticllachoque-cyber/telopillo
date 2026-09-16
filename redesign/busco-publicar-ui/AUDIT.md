# AUDIT — busco-publicar-ui

> Stage 4. Item scope: visual/UX/copy del wizard de demanda `/busco/publicar`.
> **Accesibilidad fuera de alcance (explícito):** el ítem hermano `publicar-a11y` (done, merged a1e85de) auditó estos mismos archivos con step-through axe de 20 estados = 0 violaciones, y cerró F-1..F-4 (a11y). Este item cubre lo que ese ítem no: voz/copy, consistencia, densidad, jerarquía visual.

## Baseline

- Capturas: `current/` (3 viewports × paso1 + paso4 revisión, fullPage dsf=2, logged-in).
- Contraste de texto: heredado OK de publicar-a11y (muted sobre bg-muted/30 = 4.54:1+; destructive 4.76:1; step-through 0 violaciones post-merge).
- Wizard producto `/publicar` (ProductFormWizard) = par de referencia de consistencia — mismo patrón stepper, misma familia de cards.

## Findings

### F-1 (P1) Voz mixta voseo/tuteo — el wizard habla en dos personas distintas
La app usa **voseo boliviano** como voz de producto (`Publicá lo que buscás`, `Completá los datos`, `Elegí la categoría`, `Incluí marca`, `Subí fotos claras` en el wizard producto). El wizard demanda mezcla tuteo en la mayoría de sus textos guía:

evidence: components/demand/DemandPostForm.tsx:525 "Explica rápido qué estás buscando y agrega"
evidence: components/demand/DemandPostForm.tsx:581 "Si no ves una categoría perfecta, elige la más cercana"
evidence: components/demand/DemandPostForm.tsx:649 "Menciona estado, marca, modelo, urgencia"
evidence: components/demand/DemandPostForm.tsx:669 "Indica dónde estás y, si quieres"
evidence: components/demand/DemandPostForm.tsx:691 "Puedes dejarlo vacío si prefieres"
evidence: components/demand/DemandPostForm.tsx:754 "Asegúrate de que la información sea clara"
evidence: components/demand/DemandPostForm.tsx:830 "Describe bien qué buscas"
evidence: components/demand/DemandPostForm.tsx:831 "Incluye una imagen si ayuda"
evidence: components/demand/DemandPostForm.tsx:832 "Revisa ubicación y presupuesto"
evidence: components/profile/LocationSelector.tsx:75 placeholder "Selecciona departamento"
evidence: components/profile/LocationSelector.tsx:101 placeholder "Selecciona ciudad"
evidence: components/profile/LocationSelector.tsx:112 "Primero selecciona un departamento"
vs voseo ya presente en el MISMO archivo:
evidence: components/demand/DemandPostForm.tsx:547 "Incluí marca, modelo o referencia"
evidence: components/demand/DemandPostForm.tsx:566 "Elegí la categoría principal"
evidence: app/busco/publicar/page.tsx:111 "Publicá lo que buscás" (h1)
evidence: app/busco/publicar/page.tsx:113 "Completá los datos… lo que necesitás"
Y baseline app-wide voseo consistente (wizard producto):
evidence: components/products/ProductFormWizard.tsx:522 "Subí fotos claras"
evidence: components/products/ProductFormWizard.tsx:534 "Incluí fotos"
evidence: components/products/ProductFormWizard.tsx:628 "Elegí la categoría"
Un mismo formulario salta de "Publicá" (h1) a "Explica"/"Asegúrate" (cuerpo) — inconsistencia de marca y tono en la superficie más importante del flujo demanda. **Fix propuesto: unificar TODO el wizard a voseo** (Explicá, elegí, Mencioná, Indicá, Podés, Asegurate, Describí, Incluí, Revisá, Seleccioná). Afecta edit-routes que reusan el componente (heredan el fix, ver PATTERN-INSTANCES).

### F-2 (P2) Heading del paso 2 con casing roto y duplicado del label
"Describe lo que Necesitas" mezcla sentence-case con sustantivo capitalizado — los otros 3 pasos usan title case ("Referencia de la Solicitud", "Ubicación y Presupuesto", "Revisa tu Solicitud"). Además el heading repite casi literal el label del textarea justo debajo ("Describe lo que necesitas *").

evidence: components/demand/DemandPostForm.tsx:605 heading "Describe lo que Necesitas"
evidence: components/demand/DemandPostForm.tsx:636 label "Describe lo que necesitas *"
evidence: components/demand/DemandPostForm.tsx:523 heading "Referencia de la Solicitud" (title case, patrón hermanos)
evidence: components/demand/DemandPostForm.tsx:667 heading "Ubicación y Presupuesto"
evidence: components/demand/DemandPostForm.tsx:752 heading "Revisa tu Solicitud"
Fix: heading "Descripción de lo que buscás" (title case, sin duplicar label) + label diferenciado ("Detalles de la solicitud").

### F-3 (P2) Banner de borrador permanente — ocupa espacio en todos los pasos sin salida
"Borrador guardado localmente." aparece como card border+bg permanente bajo el stepper apenas hay autoguardado y NO se puede cerrar; acompaña al usuario por los 4 pasos. El caso útil (recuperar borrador) ya tiene su propio banner rico con Restaurar/Descartar (:391-405). El estado "saved" es el de menor información y el que más permanece.

evidence: components/demand/DemandPostForm.tsx:409-417 banner draftStatus !== 'idle' sin dismiss
evidence: components/demand/DemandPostForm.tsx:412 texto 'Borrador guardado localmente.'
evidence: components/demand/DemandPostForm.tsx:388-405 banner de borrador recuperado (Restaurar/Descartar) — caso con acción ya cubierto
Fix: degradar "saved" a aviso efímero (auto-hide 3-4s o texto inline de una línea en el footer junto al botón Publicar); "restored"/"error" conservan banner.

### F-4 (P2) Paso 2 con densidad mínima en desktop
Paso 2 = un Select opcional + un Textarea; en desktop 1920 (container max-w-2xl) queda ~50% de página vacía bajo el textarea (ver current/desktop.png) — el paso más bajo en densidad del wizard y da sensación de flujo lento. El par de referencia (wizard producto) resuelve el equivalente con layout de dos columnas en sm+ en el paso de detalles.

evidence: components/demand/DemandPostForm.tsx:602-662 paso 2 completo = Select subcategoría + Textarea
evidence: input/intake-paso2.png (captura intake del paso 2 en desktop 1920: whitespace dominante bajo el textarea)
**Iteración 1 (Checkpoint 3, feedback humano):** la solución de 2 columnas con Select se rechazó — el dropdown abierto tapa la columna vecina. Fix revisto: subcategoría como grupo de chips seleccionables (flex-wrap), columna única — misma familia visual que CategoryGrid (radio-cards) del paso 1.
evidence: app/busco/publicar/page.tsx:102 container max-w-2xl
Fix propuesto: dos columnas en sm+ (subcategoría + descripción lado a lado) o mover imagen de referencia del paso 1 al paso 2 para densificar; mantener mobile de una columna.

### F-5 (P2) Lista "Antes de publicar:" en paso 4 duplica rol de los textos guía por paso
Los 3 bullets de revisión repiten lo que cada paso ya dijo como helper ("Describe bien qué buscas" ≈ paso 2, "Incluye una imagen" ≈ paso 1, "Revisa ubicación y presupuesto" ≈ paso 3), ahora en tuteo. En revisión el usuario quiere verificar SUS datos, no re-leer consejos. Ocupa una card entera (bg-primary/5) empujando el botón Publicar fuera del primer scroll.

evidence: components/demand/DemandPostForm.tsx:826-834 card "Antes de publicar:" con 3 <li>
evidence: components/demand/DemandPostForm.tsx:525 (helper paso 1 ya cubre imagen), :649 (paso 2 cubre detalle), :669 (paso 3 cubre ubicación/presupuesto)
**Iteración 2 (Checkpoint 3, feedback humano):** el layout del paso 4 también resultó "raro" — Resumen y Antes de publicar viven en una sidebar derecha (lg:grid-cols-[1.2fr_0.8fr]) que en viewports medios queda flaca (~200px). Fix revisto: eliminar sidebar → stack en 1 columna; Resumen como fila de 3 stats (sm+); checklist merged en la misma card bajo border-t.
evidence: components/demand/DemandPostForm.tsx:757 grid lg:grid-cols-[1.2fr_0.8fr] (sidebar flaca en viewports medios)
Fix: reemplazar card de consejos por checklist de verificación contra datos ingresados (✓ Título · ✓ Categoría · ✓ Ubicación · Presupuesto: opcional) — feedback real del estado del formulario.

## No-repeat / fuera de alcance

- a11y (contraste, roles, foco, touch targets): auditado a 0 violaciones por publicar-a11y en 20 estados — no se re-audit.
- Copy de validación zod (lib/validations/demand.ts): backend, fuera de scope.
