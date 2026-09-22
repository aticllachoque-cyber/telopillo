# AUDIT-RESOLUTION — home-publish-cta (ITERACIÓN 1)

> Stage 8 verification. One row per F-<n>: resolved / deferred (sign-off-approved) / open.
> P0/P1 open blocks; P2 open allowed but recorded.

Branch: `redesign/home-publish-cta` (iter.1 sobre 15ca67c) | Date: 2026-09-22
Delta iter.1 (sign-off "procede"): FAB sticky bottom reemplaza botón header móvil; header desktop/hero/strip/drawer sin cambios vs iter.0.

| F | Severity | Disposition | Evidence |
|---|----------|-------------|----------|
| F-1 (P1) | resolved | ITER.1: FAB pill sticky bottom "Publicá gratis" → `/crear` (48px, tokens primary, safe-area inset, z-40 bajo drawer z-50, `lg:hidden`) visible siempre en mobile+tablet; botón header móvil REMOVIDO (declutter 5→4). Montado en `app/page.tsx` (landing) — NOTA IMPL: layout global descartado por colisión con barras bottom propias de /busco/[id] (DemandPostDetail fixed bottom z-40) y wizard (sticky bottom); cero regresiones. Live: after/manifest.txt FAB 158×48 mobile y=752 / tablet y=964 / desktop ausente; after/asserts.txt 12/12 true; after/crop-mobile-fab.png |
| F-2 (P1) | resolved | Hero botón primario + CtaStrip primario (heredado iter.0, sin cambios). Live: asserts "hero publish link: true", "hero+strip: 2" |
| F-3 (P2) | resolved | ¿Vendés? secundario junto a hero primario (heredado iter.0). Live: after/dom.txt |
| F-4 (P2) | resolved | CtaStrip publish primario + register outline (heredado iter.0). Live: after/desktop.png |
| F-5 (P2) | resolved | Voseo unificado — FAB usa mismo label "Publicá gratis"; specs actualizados iter.1 (768px assert → FAB; test nuevo FAB visible/hidden/navega). Live: "old label gone: true" |

Resumen iter.1: 5 resolved, 0 deferred, 0 open.

Verificación adicional: header móvil sin Publicá pero Entrar intacto; footer clearance en scroll bottom (copyright bottom 6819 ≤ FAB top 6855); sin overflow horizontal 375px; type-check limpio; lint 0 errores (11 warnings pre-existentes scripts redesign/); publish links visibles 3/3/3 viewports (hero+strip+FAB en móvil, nav+hero+strip en desktop).
