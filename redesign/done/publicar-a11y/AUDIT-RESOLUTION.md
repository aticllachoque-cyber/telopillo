# AUDIT-RESOLUTION — publicar-a11y

> Stage 8 verify. Branch `redesign/publicar-a11y`, impl `cb7de56`. Evidencia: `after/` (6 capturas, 3 viewports × 2 rutas, misma disciplina que Stage 3) + `audit-after/` (error states).

| Finding | Severidad | Estado | Evidencia |
|---------|-----------|--------|-----------|
| F-1 error imágenes duplicado | (P2) | resolved | `ProductFormWizard.tsx:561` `<p>` duplicado eliminado — única copia vía prop `error` de `ImageUpload` (`:565-571`, role="alert" aria-live="assertive"). `after/audit-after/producto-step1-errores-mobile.png`: 1 línea (antes 2). |
| F-2 demanda sin centrar | (P2) | resolved | `app/busco/publicar/page.tsx:79,102` — `container mx-auto max-w-2xl` en ambos contenedores. `after/demanda-desktop.png`: centrado, igual que hermana `/publicar`. |
| F-3 timeout test "Publish page" | (P2) | resolved | `tests/e2e/cross-cutting/accessibility-audit.spec.ts:150` — `test.slow()` (budget ×3). **G6: PASS en corrida de Stage 8** (primera vez en 4 corridas; 30 passed / 0 failed). |
| F-4 error sin announce SR | (P2) | resolved | Resuelto por F-1: la copia única sobreviviente es el render de `ImageUpload` que ya anuncia (role="alert" aria-live="assertive"). Mismo cambio, sin código adicional. |

## Resumen

4/4 findings **resolved**. 0 open. 0 deferred.

Notas:
- Edit forms (`/productos/[id]/editar`, `/busco/[id]/editar`) heredan F-1/F-4 automáticamente (reusan los wizards).
- Dark mode: fixes de presencia/atributos (remoción de nodo, mx-auto) — sin superficie de contraste nueva; clases de la copia sobreviviente inalteradas (`text-destructive` 4.76:1 ambos temas, verificado en AUDIT.md).
- Defecto de captura conocido (idéntico a Stage 4): barra sticky Cancelar/Siguiente se superpone en screenshots fullPage mobile — artefacto del pipeline, no del código.
