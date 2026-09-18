# SIGNOFF — busco-detalle

- Approver: Alcides Cardenas (usuario, sesión Claude Code)
- Date: 2026-09-18
- Decision: approved
- Verbatim: "aproar" (interpretado como "aprobar" — respuesta al Checkpoint 3 con la pregunta aprobar/iterar/rechazar; única lectura razonable en contexto)
- Loop: iteración 0 (sin feedback intermedio)

## Artifact hash (G4b — content-only)

```
224582fbdf51930d6f815cbefd1b083ee99a6c2175508de5fbb540568607210a
```

Fórmula: `{ sha256sum comparison.html proposal/*; } | awk '{print $1}' | sha256sum`

## Deferred explícitos aprobados

- F-5 (P2) DemandStatusBadge tokens — badge mantiene matiz semántico green/blue/amber; globals.css fuera de scope; perfil/demandas sin divergencia.

## Transparencia

- Propuesta = mockup fiel sobre DOM real (stitch:fallback, precedente ×6); renders file:// con CSS inlineado; imágenes lazy-load de OfferCard pueden aparecer en blanco en renders (declarado en comparison.html).
