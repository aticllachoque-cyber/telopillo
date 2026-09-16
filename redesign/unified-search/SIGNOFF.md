# SIGNOFF — unified-search

- **Item:** unified-search — búsqueda unificada productos + negocios + solicitudes + personas (Header SearchBar + `/buscar`)
- **Approver:** Alcides Cardenas (usuario, sesión Claude Code)
- **Date:** 2026-09-16
- **Decision: approved**
- **Iterations consumed:** 1 de 3
  - Iteración 1: "se estan solapando los componentes" → chip del selector `[Todo ▾]` se insertaba adentro del wrapper del input y el icono `Search` absoluto (`left-3`) caía encima. Fix: chip como hijo directo del form antes del wrapper (desktop + overlay móvil). Mockups + renders + comparison regenerados.
- **sha256 content-only** (`{ sha256sum comparison.html proposal/*; } | awk '{print $1}' | sha256sum`):
  `b1d410a195084db50da4e8096222cc369c18a9c4fe7b2c515ef1b0dfe290119b`
- **Alcance aprobado:** F-1 (selector de tipo + tabs con conteos), F-2 (backend: RPCs search_businesses/search_profiles SECURITY INVOKER sin phone + rutas API keyword-only), F-3 (overlay móvil reusa SearchBar), F-4 (filtros/sort por tipo + h1 "Buscar"), F-5 (voseo exclusivo). "Todo" aterriza en tab Productos (ranking mixto diferido).
