# AUDIT — buscar-a11y

> Stage 4 output. WCAG 2.2 AA + mobile 375px + shadcn token consistency + heuristics.
> Estado auditado: `current/` (main, dev server local, 2026-09-15). Escaneo axe directo en ambos estados.
> Nota: burbuja flotante "N" en capturas = Next.js dev tools indicator (solo dev, no es UI de la app — fuera de alcance).

### F-1 (P1) Contraste insuficiente en card CTA inferior de resultados — WCAG 1.4.3

En resultados con productos, el texto de la card "¿No encontraste exactamente lo que buscas?" usa `text-muted-foreground` (#737373) sobre `bg-primary/5` (#f3f3f3 computado) → ratio **4.27:1** (mínimo 4.5:1, texto 14px normal). Axe: `color-contrast (serious)` — es la violación que bloquea G6 a nivel repo.

evidence: axe scan 2026-09-15 `/buscar?q=samsung` — target `.mb-3`, html `<p class="text-sm text-muted-foreground mb-3">Publica una solicitud y deja que los vendedores te contacten.</p>`; source app/buscar/page.tsx:402-407

### F-2 (P1) Contraste insuficiente en card CTA del empty state — WCAG 1.4.3

Mismo patrón en `/buscar?q=nonexistent`: "Publica una solicitud y deja que los vendedores te contacten con ofertas." con `text-muted-foreground` sobre card `bg-primary/5` → **4.27:1**. Axe: `color-contrast (serious)` — segunda violación que bloquea G6.

evidence: axe scan 2026-09-15 `/buscar?q=nonexistent` — target `.mb-3`; source app/buscar/page.tsx:354-357

### F-3 (P2) Banner de caché con paleta hardcodeada fuera de token — shadcn token consistency

El banner "Mostrando resultados guardados por una falla de conexión" usa Tailwind palette cruda (`border-amber-300/60 bg-amber-50 text-amber-900`) en vez de tokens oklch de `app/globals.css`. Drift del sistema de tokens; además el amarillo no existe en la paleta semántica del tema.

evidence: app/buscar/page.tsx:286 — `className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900"`

### F-4 (P2) Doble CTA de demanda apilado en empty state — heurística de redundancia

En el empty state se renderizan dos boxes consecutivos con mensaje casi idéntico: card `bg-muted/50` "No encontramos productos… Publicar lo que busco →" (app/buscar/page.tsx:354-367, segundo bloque del `space-y-4`) seguida de card `bg-primary/5` "¿No encontraste lo que buscas?… Publicar lo que busco →". Misma acción, dos CTAs visuales compitiendo; diluye la acción primaria y alarga el empty state.

evidence: app/buscar/page.tsx:359-364 vs app/buscar/page.tsx:354-357 — captura `current/empty-desktop.png` (dos cards apiladas)

### F-5 (P2) Texto descriptivo del empty box en `bg-muted/50` al límite del contraste — WCAG 1.4.3

"Intenta con otras palabras clave o ajusta los filtros" usa `text-muted-foreground` sobre `bg-muted/50` (≈#f9f9f9) → ~4.6:1, pasa por 0.1. Cualquier endurecimiento del fondo o lightness del token lo tira abajo; mismo patrón de riesgo que F-1/F-2.

evidence: app/buscar/page.tsx:332-335 — `bg-muted/50 rounded-lg p-8` + `text-muted-foreground`; axe scan no lo marca hoy (pasa por margen mínimo)
