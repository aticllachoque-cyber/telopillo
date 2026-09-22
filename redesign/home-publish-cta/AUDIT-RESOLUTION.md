# AUDIT-RESOLUTION — home-publish-cta

> Stage 8 verification. One row per F-<n>: resolved / deferred (sign-off-approved) / open.
> P0/P1 open blocks; P2 open allowed but recorded.

Branch: `redesign/home-publish-cta` (from main `436af44`) | Date: 2026-09-22

| F | Severity | Disposition | Evidence |
|---|----------|-------------|----------|
| F-1 (P1) | resolved | Botón "Publicá" en header móvil/tablet (clon de Entrar, `min-h-[44px] min-w-[44px]`, Megaphone + texto expandible `Publicá`→`Publicá gratis` en sm+). Live: after/manifest.txt — publish links visible: desktop=3, tablet=3, mobile=3 (antes 1/0/0); after/asserts.txt "mobile header publish visible+44px: true 44px"; after/crop-mobile-header.png |
| F-2 (P1) | resolved | Fila de acción en hero: botón primario "Publicá gratis" → `/crear` (aria-label "Publicá gratis — sin costo ni comisiones") + link secundario ¿Vendés? `/busco`. Live: after/asserts.txt "hero publish link: true"; after/desktop.png, after/mobile.png |
| F-3 (P2) | resolved | ¿Vendés? deja de competir como CTA principal del hero: de `<p>` muted a link secundario junto al botón primario de publicar (jerarquía visual clara). Live: after/dom.txt (link secundario con ChevronRight bajo botón primario) |
| F-4 (P2) | resolved | CtaStrip reordena: primario `size="lg"` "Publicá gratis" → `/crear`, "Crear cuenta gratis" pasa a `variant="outline"`; copy "Publicá tu primer aviso en 2 minutos. Gratis, sin tarjeta, sin comisiones.". Live: after/asserts.txt "hero+strip publish links (aria-label): 2" |
| F-5 (P2) | resolved | Vocabulario unificado a voseo "Publicá gratis": label desktop Header, footer MobileNavigationDrawer (:434), tests/e2e/cross-cutting/header-monkey.spec.ts (5 regexes `/publicá gratis/i` + banner-scoping en :267/:374). Live: after/asserts.txt "old label gone: true", "desktop header label voseo: true" |

Resumen: 5 resolved, 0 deferred, 0 open.

Verificación adicional: sin overflow horizontal a 375px (`scrollWidth <= clientWidth`), 4 links publish totales por viewport (3 visibles + 1 en drawer cerrado), type-check limpio, lint 0 errores (12 warnings pre-existentes en scripts redesign/).
