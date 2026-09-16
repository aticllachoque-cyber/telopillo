# AUDIT-RESOLUTION — busco-publicar-ui

> Stage 8. Branch `redesign/busco-publicar-ui`. After-captures: `after/` (3 viewports × paso1 + paso4 revisión, + extra desktop-paso2, fullPage dsf=2, logged-in, mismo manifest discipline que `current/`).

| Finding | Estado | Evidencia de resolución |
|---|---|---|
| F-1 (P1) Voz mixta voseo/tuteo | resolved | DemandPostForm: Explicá/elegí/Mencioná/Indicá/Podés/Asegurate/Agregá/Completá (grep tuteo = 0 residual); LocationSelector: Seleccioná ×2 + Primero seleccioná. Guard `lib/utils/demand.ts` con variantes voseo (/public[áa] lo que busc[áa]s/i, /describ[íi] lo que necesit[áa]s/i, /descripci[óo]n de lo que busc[áa]s/i) — validación no rompe tras unificación. after/dom.txt sin tuteo. |
| F-2 (P2) Heading paso 2 casing roto + duplica label | resolved | Heading "Descripción de lo que buscás" (title case, hermanos consistentes), label "Detalles de la solicitud". Confirmado en after/desktop-paso2.png y assert live `text=Descripción de lo que buscás` en walkthrough de 3 viewports. |
| F-3 (P2) Banner borrador permanente | resolved | Banner card solo para restored/error; estado "saved" = texto inline `aria-live="polite"` en footer junto a Publicar (after/desktop-revision.png: "Borrador guardado localmente." en footer, sin card). Banner rico de borrador recuperado intacto. |
| F-4 (P2) Paso 2 densidad mínima | resolved | Subcategoría como chips seleccionables (`aria-pressed`, flex-wrap, familia CategoryGrid), sin dropdown; textarea min-h 14rem. after/desktop-paso2.png: Smartphones seleccionado, paso denso. Iteración 1 (2-col Select) rechazada por humano — respetado. |
| F-5 (P2) Card consejos + layout raro paso 4 | resolved | Sidebar eliminada — stack 1 columna; Resumen como grid sm:grid-cols-3 (Ubicación \| Presupuesto \| Imagen); checklist de verificación computada del formulario (ChecklistMark ✓/–) merged bajo border-t. after/desktop-revision.png. Iteración 2 aprobada por humano. |
| F-6 (P2) Touch targets inconsistentes con wizard producto | resolved | Patrón hermano `min-h-[44px] sm:min-h-0` en Input título, Inputs presupuesto, botones nav Atrás/Siguiente/Publicar y chips de subcategoría — igual que ProductFormWizard (:584,746,1021,1031,1041). |

Notas:
- Placeholder guard: las variantes voseo en PLACEHOLDER_PATTERNS mantienen el bloqueo de texto-placeholder pegado (caso reportado por usuario pre-rediseño sigue cubierto, ahora también en voseo).
- ProductFormWizard (/publicar) NO tocado (fuera de scope, Checkpoint 1) — el fix F-3 doblado a /publicar queda como candidato de item futuro (nota en AUDIT F-3).
- tokens:drift advisory (hex en checklist del mockup): impl usa exclusivamente tokens (bg-primary, text-primary-foreground, bg-muted, border-border) — saldado.
- Edit-routes /busco/[id]/editar heredan vía componente compartido.
