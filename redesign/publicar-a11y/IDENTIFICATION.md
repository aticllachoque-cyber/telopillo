# IDENTIFICATION — publicar-a11y

> Stage 2. Item cubre DOS rutas (decisión Checkpoint 1 del usuario, 2026-09-15: "disparala para ambos").

## Rutas

| Ruta | Archivo route | Componente wizard | Evidencia |
|------|--------------|-------------------|-----------|
| `/publicar` (producto) | `app/publicar/page.tsx` (121 líneas, 'use client') | `components/products/ProductFormWizard.tsx` (1066 líneas, 4 pasos: Fotos → Información → Detalles → Revisar) | import en page.tsx:10; captura input/publicar-producto-desktop.png con heading "Publicar Producto" |
| `/busco/publicar` (demanda) | `app/busco/publicar/page.tsx` (157 líneas, 'use client') | `components/demand/DemandPostForm.tsx` (880 líneas, 4 pasos: Referencia → Descripción → Detalles → Revisar) | import en page.tsx:10; captura input/publicar-demanda-desktop.png con heading "Publicá lo que buscás" |

Ambas rutas protegidas (redirect a `/login?redirect=...` si no auth) — capturas y audits requieren logged-in state (`tests/.auth/logged-in.json`, creado 2026-09-15).

## Deuda que motiva el item

- G6 (suite a11y full-repo): test "Publish page" (`tests/e2e/cross-cutting/accessibility-audit.spec.ts:150`) falla con `frame.evaluate: Test timeout of 30000ms exceeded` en `builder.analyze()` — 3 corridas consistentes (2026-09-15).
- **Root cause acotado 2026-09-15:** NO es patología de página. Réplica aislada de la config exacta de la suite (`withTags(wcag2a/2aa/22aa)` + `exclude select-value`, viewport mobile, tras networkidle): **1.6s, 0 violaciones**. El test es el último de la cola [mobile] (31/31) bajo Next dev con compile on-demand — el presupuesto de 30s del test se agota entre login + goto + compile + analyze bajo contención de workers paralelos. Hipótesis: flake de suite, no deuda de accesibilidad.
- Consecuencia: el item audita de verdad los wizards (los scans de suite solo ven el paso 1) y el debt de G6 se resuelve o documenta en Stage 8.

## Componentes en scope

- `app/publicar/page.tsx` — route producto
- `app/busco/publicar/page.tsx` — route demanda
- `components/products/ProductFormWizard.tsx` — wizard producto (violaciones axe viven aquí si existen)
- `components/demand/DemandPostForm.tsx` — wizard demanda
- Out of scope: Header/Footer/SearchBar (componentes compartidos globales), `components/products/ImageUpload.tsx` y `components/shared/SingleImageUpload.tsx` (sub-componentes usados aquí — solo se tocan si una violación axe vive dentro y no tiene fix en el wizard; se registra en PATTERN-INSTANCES)
