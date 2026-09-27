# SIGNOFF — publicar-a11y

- **Approver:** Alcides (usuario, Checkpoint 3)
- **Fecha:** 2026-09-15
- **Decision: approved**
- **sha256 content-only** (`{ sha256sum comparison.html proposal/*; } | awk '{print $1}' | sha256sum`): `17fa7f96b1007c4f0789721ba5ef2500aebb54a19c27dae15f8748545ae0e539`
- **Decision verbatim:** "procede a implementarlo" (tras confirmar cobertura: step-through axe de 20 estados — 4 pasos × error states × 2 wizards × 2 viewports, 0 violaciones)

> Nota de transparencia: primer hash registrado (e7c871b7…) se calculó con una
> fórmula distinta a la del gate; corregido a la fórmula content-only del gate
> ANTES de Stage 8 — mtimes de comparison.html (16:56) y proposal/* (16:53)
> prueban cero cambios de contenido desde la presentación al usuario.
> Los gates G4a/G4b permanecen BLOCK hasta que este archivo registre la aprobación
> real. Re-ejecutar Stages 5/6 invalida este archivo (stale sign-off).
