# AUDIT — busco-detalle

> Stage 4 output. Gate G2: every finding needs severity AND an `evidence:` line;
> evidence citing a repo file must cite a file that exists.
> Severity: P0 (blocks use / WCAG A fail) · P1 (degraded / WCAG AA fail) · P2 (polish).

## Scope

- Route: `/busco/[id]` · Components: `components/demand/DemandPostDetail.tsx` (+PageClient, StatusBadge, ImageFrame, OfferProductModal)
- Captures: `current/{desktop,tablet,mobile}.png` (0 ofertas, imagen+budget) + `current/{desktop,tablet,mobile}-ofertas.png` (3 ofertas, OfferCard) — 2026-09-18, anon
- axe run: scan directo @axe-core/playwright WCAG 2.0/2.1/2.2 AA — `redesign/busco-detalle/axe-scan.txt` (4 corridas: primary/ofertas × desktop/mobile, 2026-09-18)
- Contrastes: `redesign/busco-detalle/contrast-probe.txt` (live computed, light+dark, canvas-converted)

## Findings

### F-1 (P1) AvatarFallback del Comprador: 4.35:1 en tema claro

Iniciales "UD" del card Comprador renderizan `bg-muted text-muted-foreground` (clases default del AvatarFallback) = 4.35:1 en claro (FAIL 1.4.3, texto 16px/500 < 4.5:1). Dark pasa (5.86:1). Axe lo reporta serious en las 4 corridas. Es exactamente la familia de violation del sweep tinted-card (muted-on-tinted), no cubierta entonces porque este card no estaba en el inventario. Fix familiar: `text-foreground/80`.

- guideline: WCAG 2.2 AA — 1.4.3 Contrast (Minimum)
evidence: axe-scan.txt (serious color-contrast, target .size-full, 4/4 corridas) + contrast-probe.txt "avatar-fallback (Comprador UD) … 4.35:1" light / 5.86:1 dark + components/demand/DemandPostDetail.tsx:335

### F-2 (P1) CTA vendedor sin presencia móvil: entierro below-the-fold

Para el visitante anon (el vendedor prospecto), la única CTA de conversión ("¿Tienes lo que esta persona busca?" + "Inicia sesión para ofrecer") vive en un card al final del sidebar, debajo de Ofertas y del card Comprador — en mobile queda tras TODO el contenido (imagen, resumen, descripción, ofertas). La barra sticky móvil inferior solo existe para estados logueado-canOffer ("Ofrecer producto") o whatsapp-del-poster; anon sin sesión no tiene ninguna acción visible sin scroll completo. El hermano producto resolvió esto mismo en producto-detalle con el compact price+CTA near-top en mobile (F-1 de ese item).

- guideline: Mobile usability / heurística de conversión (acción primaria accesible sin scroll completo)
evidence: current/mobile.png (CTA card último en el stack) + components/demand/DemandPostDetail.tsx:384-397 (CTA card) y :400-415 (sticky solo canOffer/whatsapp) + components/products/ProductDetailPageClient.tsx:261-282 (patrón hermano compact CTA móvil)

### F-3 (P2) Meta duplicada: fila bajo H1 repite el card Resumen

La fila bajo el H1 (ubicación, fecha, días restantes — DemandPostDetail.tsx:176-191) repite 3 de 4 campos que el card Resumen vuelve a mostrar (:204-239, +Presupuesto solo ahí). En mobile la misma información aparece dos veces en ~1.5 pantallas. El hermano producto NO duplica: la meta vive una sola vez en el sidebar (metaRow list).

- guideline: UX heuristic (redundancia) / consistencia con patrón hermano producto
evidence: components/demand/DemandPostDetail.tsx:176-191 vs :204-239 + current/mobile.png (doble bloque) + components/products/ProductDetailPageClient.tsx:231-256 (hermano sin duplicación)

### F-4 (P2) Voseo inconsistente en CTAs del detalle

"¿Tienes lo que esta persona busca?" (:388) e "Inicia sesión para ofrecer" (:392) están en tuteo, mientras el flujo busco quedó unificado en voseo (busco-publicar-ui F-1: wizard demanda completo) y el repo usa voseo en superficies consumer (CtaStrip "Iniciá sesión", onboarding, drawer). Corrección: "¿Tenés lo que esta persona busca?" / "Iniciá sesión para ofrecer". ("Sé el primero…" es válido en ambos.)

- guideline: Consistencia de voz (precedente busco-publicar-ui F-1)
evidence: components/demand/DemandPostDetail.tsx:388 + :392 + components/home/CtaStrip.tsx:36 ("Iniciá sesión")

### F-5 (P2) DemandStatusBadge con colores de paleta Tailwind hardcodeados

`bg-green-100 text-green-800 border-green-200` (+blue/amber variants) — fuera del sistema oklch de globals.css (regla de diseño del flow: tokens only). Misma clase de drift que los banners amber del sweep (F-5 allí). Contraste AA ok (familia green-800/100 ≈ 7:1, precedente storefront F-1/F-2 medidos 5.91-6.81:1). Ripple: el badge también se consume en app/perfil/demandas/page.tsx:408 — la propuesta mantiene el matiz semántico (verde/azul/ámbar) normalizando a tokens, sin cambio visual perceptible, para no divergir ahí.

- guideline: Token consistency (tokens:drift advisory)
evidence: components/demand/DemandStatusBadge.tsx:12-20 + app/perfil/demandas/page.tsx:408 (consumidor fuera de screenshot)

### F-6 (P2) `aria-label="Resumen"` en div genérico: no anunciado

El contenedor del Resumen es un `<div aria-label="Resumen">` sin role — aria-label en nodo de rol genérico no se expone a AT (label huérfano). El hermano producto usa `<ul>` + `<li className={metaRow}>` (lista semántica real).

- guideline: WCAG 2.2 AA — 1.3.1 Info and Relationships (semántica) / consistencia hermano
evidence: components/demand/DemandPostDetail.tsx:204 + components/products/ProductDetailPageClient.tsx:231-256

## Notas (sin finding)

- Empty-state Ofertas 4.66:1 claro / 6.74:1 dark — PASS pero borderline (misma familia muted que F-4 del sweep); si se toca el empty state en la propuesta, subir a `text-foreground/80`.
- OfferCard mini-avatar fallback (h-5, text-[10px]) usa las mismas clases bg-muted/text-muted-foreground que F-1 (misma medición aplicaría); axe no lo aisló por target size — tratar junto a F-1.
- Back-link "Volver a solicitudes" 19.8:1/19:1, min-h-[44px] — PASS.
- Meta labels muted 4.74:1 claro — PASS (watch item, no finding).
- Redirect 308 a canonical + http 200 final verificado en current-capture (http-status.txt).
