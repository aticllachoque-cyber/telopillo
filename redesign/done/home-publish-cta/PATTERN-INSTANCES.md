# PATTERN-INSTANCES — home-publish-cta

Pattern: publish / primary-action CTA entry points ("publicar") across surfaces. Inventory grep 2026-09-22 (`Publicar|Publicá|/crear` sobre `app/` + `components/`).

- instance: components/layout/Header.tsx disposition: in-scope
  Desktop tiene botón "Publicar Gratis" → /crear (Header.tsx:146-148); controles móviles (:152-214) sin entrada publicar. Corazón del feedback móvil.
- instance: components/layout/MobileNavigationDrawer.tsx disposition: in-scope
  "Publicar Gratis" → /crear (:433-434), único entry móvil hoy, oculto tras hamburger. Consistencia etiqueta/ruta con nuevo CTA visible.
- instance: components/home/CtaStrip.tsx disposition: in-scope
  Strip final anon ofrece register/login, sin ruta publicar.
- instance: app/page.tsx disposition: in-scope
  Landing: hero sin CTA publicar, feature card "Publicá Gratis" informativa sin link (:52-55).
- instance: app/crear/page.tsx disposition: not-affected
  Destino chooser ("¿Qué querés publicar?" → /publicar | /busco/publicar). Ya resuelve la bifurcación; vocabulario local queda.
- instance: app/buscar/page.tsx disposition: not-affected
  CTA cards "Publicá lo que buscás →" en empty/no-results (:602-657). Referencia hermana voseo.
- instance: app/busco/page.tsx disposition: not-affected
  "Publicar solicitud" (:253,306) + "Publicar lo que busco" (:403). Ya tiene CTA publicar.
- instance: app/profile/page.tsx disposition: not-affected
  "Publicar producto" (:439), superficie auth.
- instance: app/perfil/mis-productos/page.tsx disposition: not-affected
  "Publicar producto" (:236-238,346), superficie auth.
- instance: app/perfil/demandas/page.tsx disposition: not-affected
  "Publicar solicitud"/"Publicar nueva solicitud" (:367,388), superficie auth.
- instance: components/onboarding/WelcomeScreen.tsx disposition: deferred
  Copy onboarding "publicá gratis"/"Publicá lo que necesitás" (:20-21) — mención textual, sin CTA; ripple de vocabulario solo si la propuesta unifica etiqueta.
- instance: components/layout/Footer.tsx disposition: not-affected
  Sin link publicar (solo redes + info/legal). Añadirlo sería scope creep; la propuesta no lo toca.

Nota vocabulario (alimenta Stage 5/6): split "Publicar Gratis" (header/drawer) vs voseo "Publicá..." (CTAs hermanos en /buscar, /busco). G3d exigirá consistencia del CTA nuevo con hermanos.
