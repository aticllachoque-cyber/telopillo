# AUDIT — publicar-a11y

> Stage 4. Metodología: (1) step-through completo de ambos wizards (producto + demanda × desktop/mobile × 4 pasos + estados de validación, 20 estados) con axe wcag2a/2aa/22aa por estado → `audit/stepthrough.txt` + `audit/*.png`; (2) capturas estáticas 3 viewports × 2 rutas → `current/`; (3) contraste computado sobre tokens de `app/globals.css`; (4) inspección de código.

## Resultado axe

**0 violaciones** critical/serious/moderate en los 20 estados auditados. La deuda G6 (timeout del test "Publish page") NO es una violación de accesibilidad — ver F-3.

## Findings

### F-1 (P2) — Error de imágenes duplicado en wizard producto
- Guideline: UX/heurística de feedback (duplicación de mensaje de error).
evidence: `components/products/ProductFormWizard.tsx:559` pasa `error={errors.images?.message}` a `ImageUpload` (que lo renderiza) Y `:561` renderiza además su propio `<p className="text-sm text-destructive">{errors.images.message}</p>` — el mensaje "Debes subir al menos 1 imagen" aparece ×2 (visible en `audit/producto-step1-errores-mobile.png`, dos líneas rojas idénticas bajo la zona de upload). Schema origen: `lib/validations/product.ts:115`.

### F-2 (P2) — Página demanda sin centrar en desktop (layout asimétrico)
- Guideline: UX/layout consistencia entre rutas hermanas.
evidence: `app/busco/publicar/page.tsx:79` y `:102` usan `container max-w-2xl` SIN `mx-auto` (Tailwind `container` no centra solo) → contenido pegado al borde izquierdo con medio viewport vacío a la derecha en ≥1024px. La página hermana producto SÍ centra: `app/publicar/page.tsx:80` = `container mx-auto max-w-3xl`. Visible: `current/demanda-desktop.png` vs `current/desktop.png`.

### F-3 (P2) — Timeout crónico del test "Publish page" en suite a11y (bloquea G6 a nivel repo)
- Guideline: confiabilidad de la suite (no es violación axe).
evidence: `tests/e2e/cross-cutting/accessibility-audit.spec.ts:150` falla con `frame.evaluate: Test timeout of 30000ms exceeded` en `builder.analyze()` — 3 corridas G6 consistentes (2026-09-15). Root cause acotado: réplica aislada de la config exacta (mismo viewport/tags/exclude, logged-in) = **1.6s, 0 violaciones** (`audit/stepthrough.txt`); el test es el último de la cola [mobile] 31/31 y el presupuesto de 30s se agota por contención de workers + compile dev on-demand. Fix de test, no de app.

### F-4 (P2) — Error de imágenes sin announce a screen readers (inconsistencia con hermanas)
- Guideline: WCAG 3.3.1 Error Identification (announcement de errores de validación).
evidence: `components/products/ProductFormWizard.tsx:561` — el `<p>` del error de imágenes no tiene `role="alert"` ni `aria-live`; el error de categoría del MISMO wizard sí (`role="alert"`, bloque Categoría ~:652) y todos los errores del wizard demanda también (`DemandPostForm.tsx:555,656,714,739`). Nota Stage 6: el render de `ImageUpload` (que recibe la prop `error`, `ImageUpload.tsx:565-571`) YA incluye `role="alert" aria-live="assertive"` — eliminar el duplicado de F-1 deja como única copia la que anuncia correctamente; F-4 se resuelve con el mismo cambio de F-1.

## Descartados / notas

- Contraste: `text-destructive` 4.76:1, `text-muted-foreground` 4.73:1 (blanco) / 4.54:1 (bg-muted/50, tips box) — todos ≥ 4.5:1, PASS (coherente con 0 violaciones axe).
- Overlay "N" sobre botón Cancelar en capturas mobile = indicador dev de Next.js, no existe en producción — artefacto de captura, no finding.
- Labels del stepper ocultos en tablet/mobile = responsive por diseño (títulos visibles en desktop).
- Touch targets: botones Siguiente/Anterior/categorías ≥ 44px (clases `min-h-[44px]` presentes).
