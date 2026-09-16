# SIGNOFF — busco-publicar-ui

- **Item:** busco-publicar-ui — UI/UX del wizard de demanda `/busco/publicar` (a11y fuera de alcance, cubierto por publicar-a11y)
- **Approver:** Alcides Cardenas (usuario, sesión Claude Code)
- **Date:** 2026-09-15
- **Decision: approved**
- **Iterations consumed:** 2 de 3
  - Iteración 1: "lo de subcategorias no me convence" → 2 columnas con Select rechazada, reemplazada por chips (F-4).
  - Iteración 2: "resumen y antes de publicar tambien esta raro" → sidebar flaca eliminada, stack 1 columna + stats row + checklist merged (F-5).
- **Feedback de aprobación:** "implementa estos findings debe de estar consistentes" → F-6 (touch targets consistentes con wizard producto) promovido de observación a finding P2 y cubierto en impl; PLACEHOLDER_PATTERNS recibe variantes voseo en impl para no romper el guard de descripción tras F-1.
- **sha256 content-only** (`{ sha256sum comparison.html proposal/*; } | awk '{print $1}' | sha256sum`):
  `9e672b5fdd5e70c33fc030651dd0be919a285b523132de556da8bf3a35a5d93a`
- **Alcance aprobado:** F-1 (voseo unificado), F-2 (heading/label paso 2), F-3 (banner saved → inline), F-4 (chips subcategoría), F-5 (paso 4 stack + stats + checklist), F-6 (touch targets patrón hermano).
