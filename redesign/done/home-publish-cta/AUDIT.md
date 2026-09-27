# AUDIT — home-publish-cta

Ruta: `/` (landing), estado anon. Escaneo axe 2026-09-22: **0 violaciones** (desktop + mobile, wcag2a/2aa/21a/21aa/22aa — axe-desktop.txt, axe-mobile.txt). Item = UX/findability, no a11y defectiva.

Contexto del feedback (usuario 2026-09-22): "el CTA de publicar no es visible, entran a la app pero no encuentran cómo publicar". Verificado en producción (www.telopillo.lat) y dev: mobile visible publish CTAs = **0**; tablet (768px, < lg) = **0**; desktop = 1 (solo header).

### F-1 (P1) Mobile + tablet: cero CTA publicar visible

Botón "Publicar Gratis" vive solo en nav desktop (`hidden lg:flex`, breakpoint lg=1024). Controles móviles = lupa + Entrar/avatar + hamburger; única entrada = drawer oculto (`MobileNavigationDrawer.tsx:433-434`). Tablet 768px cae en el mismo caso.

evidence: manifest.txt probe `publish links: total=1 visible=0` (mobile + tablet); Header.tsx:146-148 (`hidden lg:flex` nav) vs :153 (`lg:hidden` controles); current/mobile.png + current/tablet.png (full page sin botón publicar); prod-landing-mobile.png idéntico.
- Ref: Nielsen heurística 6 (recognition over recall — acción primaria oculta tras recall del hamburger); WCAG 2.4.5 Multiple Ways (publicar alcanzable por 1 solo camino en móvil).

### F-2 (P1) Contenido del landing sin CTA publicar en todo el recorrido

Hero promueve solo búsqueda + link muted a `/busco`; card "Publicá Gratis" es informativa sin link; cierre (CtaStrip) empuja registro/login. La tarea primaria del vendedor no tiene camino visible en el contenido — solo el botón del header (desktop) que compite con 6+ elementos.

evidence: app/page.tsx:94-129 (hero: HeroSearchForm + link muted `/busco`), :51-72 features array "Publicá Gratis" sin href (:238-254 render sin Link), :260 CtaStrip; current/desktop.png (única entrada publicar = header y=10).
- Ref: Nielsen 6 (visibilidad de acción primaria); user feedback 2026-09-22.

### F-3 (P2) Link "¿Vendés?" apunta a browse de solicitudes, no a publicar

Texto del hero orientado al vendedor ("¿Vendés? Encontrá qué buscan los compradores") pero destino `/busco` = lista de demandas para leer. Usuario vendedor que quiere publicar producto no tiene aquí su camino; el link más cercano a "vender" no publica nada.

evidence: app/page.tsx:116-125 (Link href="/busco", text-muted-foreground).
- Ref: Nielsen 2 (match sistema/mundo real — "vendés" sugiere acción, entrega lista pasiva).

### F-4 (P2) CtaStrip mezcla objetivo: registro sin ruta publicar

Strip final anon "¿Listo para empezar?" ofrece Crear cuenta gratis / Iniciá sesión. Para el visitante que llegó a vender, el CTA no menciona publicar; registro se percibe como fin, no como paso para vender.

evidence: components/home/CtaStrip.tsx (buttons → /register, /login; ninguna mención a publicar); current/mobile.png final strip.
- Ref: Nielsen 6; user feedback 2026-09-22 ("no encuentran cómo publicar").

### F-5 (P2) Vocabulario inconsistente del CTA publicar entre superficies

"Publicar Gratis" (Header.tsx:147, MobileNavigationDrawer.tsx:433) vs voseo "Publicá lo que buscás" (app/buscar/page.tsx:608) vs "Publicar lo que busco" (app/busco/page.tsx:403) vs "Publicar producto" (perfil). Mezcla infinitivo/imperativo voseo en la misma familia de acción.

evidence: grep 2026-09-22 PATTERN-INSTANCES.md (12 instancias).
- Ref: consistencia de patrones G3d; precedente voseo unificación busco-publicar-ui F-1.
