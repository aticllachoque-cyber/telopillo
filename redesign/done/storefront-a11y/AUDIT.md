# AUDIT — storefront-a11y

> Stage 4 output. WCAG 2.2 AA + mobile 375px + shadcn token consistency + heuristics.
> Estado auditado: `current/` (main, dev server local, 2026-09-15). Escaneo axe directo desktop+mobile (`axe-scan.mjs`).
> Estado auditado hoy (lunes): negocio con horarios de lunes = "closed" → badge **Cerrado** renderizado; badge **Abierto** (green) NO renderizó hoy — ratio calculado desde tokens Tailwind (ver F-2).

### F-1 (P1) Badge "Cerrado" con contraste insuficiente — WCAG 1.4.3

Badge de estado en "Horario de Atención": `text-red-600` (#e7000b) sobre `bg-red-50` (#fef2f2) → ratio **4.36:1** (mínimo 4.5:1, texto 12px normal). Axe: `color-contrast (serious)` — la violación que dispara el flag de este item.

evidence: axe scan 2026-09-15 desktop+mobile — target `.text-red-600`, html `<span role="status" class="text-xs font-medium text-red-600 bg-red-50 …">Cerrado</span>`; source components/business/BusinessInfoSidebar.tsx:103

### F-2 (P1) Badge "Abierto" con contraste aún peor (no renderizó hoy) — WCAG 1.4.3

Badge hermano `text-green-600` (#16a34a) sobre `bg-green-50` (#f0fdf4) → ratio calculado **≈3.14:1** (falla 4.5:1). Axe no lo reportó hoy porque el badge solo renderiza cuando el negocio tiene horarios el día corriente (condicional por día, BusinessInfoSidebar.tsx:50) — violación intermitente por día de semana = flakiness del test.

evidence: cálculo WCAG sobre tokens Tailwind v4 (L(green-600)=0.2691, L(green-50)=0.9530 → 3.14:1); render condicional en components/business/BusinessInfoSidebar.tsx:92-99, :50

### F-3 (P2) Banner "Tienda en construcción" con paleta cruda fuera de token — shadcn token consistency

El banner MVP usa gradiente con `from-primary/12 via-primary/5 to-amber-500/10` (page.tsx:209). El ámbar no existe en la paleta semántica del tema (monocromática, croma 0, app/globals.css) — drift del sistema de tokens, misma clase que F-3 de buscar-a11y.

evidence: app/negocio/[slug]/page.tsx:209 — `bg-gradient-to-br from-primary/12 via-primary/5 to-amber-500/10`

### F-4 (P2) Test de suite a11y audita una página 404 — integridad de G6

`TEST_DATA.businessSlug='usuario-de-desarrollo'` (tests/helpers/index.ts:216) devuelve **404** hoy (negocio inexistente en DB). El test "Business storefront page" audita la página 404 → false pass (404 sin violaciones) o timeout. Cualquier fix de contraste en el storefront real NO quedaría cubierto por la suite.

evidence: `curl /negocio/usuario-de-desarrollo` → 404; `/negocio/tienda-electronica-la-paz` → 200; tests/e2e/cross-cutting/accessibility-audit.spec.ts:109-114

### F-5 (P2) Texto del banner sobre gradiente tintado al límite del contraste — WCAG 1.4.3

Descripción del banner usa `text-muted-foreground` (#737373) sobre gradiente `via-primary/5` (≈#f3f3f3 en la zona media) → ≈4.27:1 borderline, mismo patrón de riesgo que F-1/F-2 de buscar-a11y. Axe no lo marca hoy (el gradiente varía el fondo computado por nodo).

evidence: app/negocio/[slug]/page.tsx:220 — `text-sm leading-relaxed text-muted-foreground` dentro del banner `bg-gradient-to-br from-primary/12 via-primary/5 to-amber-500/10`
