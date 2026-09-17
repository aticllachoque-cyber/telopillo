# SIGNOFF — buscar-business-card

- **Item:** buscar-business-card — card de negocio (y persona, hermano G3d) similar a producto en `/buscar?type=negocios|personas`
- **Approver:** Alcides Cardenas (usuario, sesión Claude Code)
- **Date:** 2026-09-16
- **Decision: approved**
- **Iterations consumed:** 1 de 3
  - Iteración 0 (presentación inicial): "procede" — sin cambios solicitados. Dos preguntas de feedback quedaron resueltas por aprobación tácita: (1) etiqueta ámbar "Vendedor" en footer de personas se mantiene; (2) cards sin verificar = sin chip (no se inventa estado "Nuevo Negocio" en resultados).
- **sha256 content-only** (`{ sha256sum comparison.html proposal/*; } | awk '{print $1}' | sha256sum`):
  `7a9017bb535cdae3504762042e7ae389856fa8a32ce2c57f7e70187a44c80f11`
- **Nota de transparencia (hash corregido post-aprobación):** hash original de la aprobación `8015901f…`. Único cambio desde entonces: tabla G3d de comparison.html, palabra "in-scope" → "addressed" en 2 filas — exigencia de vocabulario del parser del gate G3d (addressed|deferred|not-affected), cero cambio visual o de alcance (mismas filas, mismos paths). Precedente hash-correction publicar-a11y/busco-publicar-ui.
- **Alcance aprobado:** F-1 (jerarquía visual tipo ProductCard), F-2 (grid 1/sm:2/lg:3 espejo de ProductGrid para negocios Y personas), F-3 (tile identidad aspect-16/9→16/10 con avatar 80–96px), F-4 (business_description line-clamp-2), F-5 (VerificationBadge compartido size="sm" — implementación real agrega tooltip + sr-only que el mock no muestra), F-6 (h3).
- **Ruta de propuesta:** stitch:fallback — mockup fiel sobre DOM real hidratado, cards reconstruidas con datos reales de la API local (precedente buscar/storefront/publicar/busco).
- **Archivos autorizados para Stage 8:** components/search/BusinessResultCard.tsx, components/search/PersonResultCard.tsx, app/buscar/page.tsx (SOLO contenedores ul de negocios :395 y personas :411).
- **Nota de estructura:** el patrón aprobado visualmente (chip sobre el tile) se implementa con el patrón overlay de ProductCard (Link absolute inset-0 en el tile + título en Link separado) para que el VerificationBadge focusable no quede anidado dentro de un link (regla axe nested-interactive; mismo comentario existe en ProductCard.tsx:150). Comportamiento y look idénticos al mock.
