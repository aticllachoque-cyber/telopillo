# AUDIT-RESOLUTION — busco-detalle

> Stage 8 verification. One row per F-<n>: resolved / deferred (sign-off-approved) / open.
> P0/P1 open blocks; P2 open allowed but recorded.

| F | Severity | Disposition | Evidence |
|---|----------|-------------|----------|
| F-1 (P1) | resolved | AvatarFallback sidebar + OfferCard minis → `text-foreground/80` (twMerge desplaza text-muted-foreground default). Live: after/asserts.txt (clases con fg/80). Axe re-run: 0 violations light ×4 corridas (antes 1 serious ×4) + 0 dark ×2 (axe-dark-check.mjs) |
| F-2 (P1) | resolved | Compact CTA near-top móvil bajo título (`lg:hidden`, patrón hermano producto) + card CTA inferior → `hidden lg:block` (desktop conserva). Live: after/asserts.txt (compact present con clases correctas); after/mobile.png muestra CTA bajo título; after/desktop.png mantiene card sidebar |
| F-3 (P2) | resolved | Fila meta bajo H1 removida; card Resumen única fuente (4 li: Ubicación/Publicado/Vigencia/Presupuesto). Live: after/asserts.txt (h1+div muted → removed; ul 4 li); after/mobile.png |
| F-4 (P2) | resolved | "¿Tenés lo que esta persona busca?" + "Iniciá sesión para ofrecer" (compact + card desktop). Live: after/asserts.txt (voseo ok/ok) |
| F-5 (P2) | deferred | Aprobado en sign-off: DemandStatusBadge mantiene matiz semántico; globals.css sin tokens de estado y fuera de scope; perfil/demandas sin divergencia. Advisory tokens:drift documentado |
| F-6 (P2) | resolved | Resumen `<ul aria-label>` + 4 `<li className={metaRow}>` (espejo hermano producto). Live: after/asserts.txt (ul present, 4 li) |

Resumen: 5 resolved, 1 deferred (aprobado), 0 open.
