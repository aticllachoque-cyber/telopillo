# Build comparison.html for busco-publicar-ui: 6 before/after pairs
# (paso2 + paso4 revision x 3 viewports) + G3c coverage + G3d sibling tables.
# Before = current/*.png (real DOM), after = proposal/render-*.png (mockup).
import base64
from pathlib import Path

BASE = Path(__file__).parent

def data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()

PAIRS = [
    ("paso2-desktop", "current/desktop.png", "proposal/render-paso2-desktop.png", "Paso 2 — desktop 1920×1080", "F-1 voseo · F-2 heading/label · F-4 dos columnas sm+"),
    ("paso2-tablet", "current/tablet.png", "proposal/render-paso2-tablet.png", "Paso 2 — tablet 768×1024", "F-1 voseo · F-2 heading/label · F-4 dos columnas sm+"),
    ("paso2-mobile", "current/mobile.png", "proposal/render-paso2-mobile.png", "Paso 2 — mobile 375×812", "F-1 voseo · F-2 heading/label (mobile mantiene 1 columna, F-4 no aplica <640px)"),
    ("revision-desktop", "current/desktop-revision.png", "proposal/render-paso4-desktop.png", "Paso 4 revisión — desktop 1920×1080", "F-1 voseo · F-3 banner borrador removido · F-5 checklist de verificación"),
    ("revision-tablet", "current/tablet-revision.png", "proposal/render-paso4-tablet.png", "Paso 4 revisión — tablet 768×1024", "F-1 voseo · F-3 banner borrador removido · F-5 checklist de verificación"),
    ("revision-mobile", "current/mobile-revision.png", "proposal/render-paso4-mobile.png", "Paso 4 revisión — mobile 375×812", "F-1 voseo · F-3 banner borrador removido · F-5 checklist de verificación"),
]

G3C = [
    ("F-1", "P1", "Voz mixta voseo/tuteo — unificar a voseo boliviano", "addressed", "mockup-paso2.html + mockup-paso4.html: 14 reemplazos de texto (Explicá, elegí, Mencioná, Indicá, Podés, Asegurate, Seleccioná…); heredan edit-routes vía componente compartido"),
    ("F-2", "P2", "Heading paso 2 casing roto + duplica label", "addressed", "mockup-paso2.html: heading → 'Descripción de lo que buscás', label → 'Detalles de la solicitud'"),
    ("F-3", "P2", "Banner 'Borrador guardado localmente.' permanente sin dismiss", "addressed", "mockup-paso4.html: banner removido del estado guardado (aviso efímero/inline propuesto en impl); banner rico restored/error se conserva"),
    ("F-4", "P2", "Paso 2 densidad mínima en desktop", "addressed", "mockup-paso2.html: grid 0.8fr/1.2fr en sm+ (heading full-width); mobile mantiene 1 columna"),
    ("F-5", "P2", "Card 'Antes de publicar' duplica consejos de pasos previos", "addressed", "mockup-paso4.html: reemplazada por checklist de verificación contra datos reales (✓ Título/categoría, ✓ Descripción, ✓ Ubicación, – Presupuesto)"),
]

G3D = [
    ("app/busco/publicar/page.tsx", "in-scope", "addressed", "F-1 voseo en subtítulo ya existente; shell sin cambios estructurales (mx-auto ya en main)"),
    ("components/demand/DemandPostForm.tsx", "in-scope", "addressed", "F-1..F-5 aplican sobre el wizard completo"),
    ("components/demand/DemandImageUpload.tsx", "in-scope", "not-affected", "wrapper sin copy propio problemático; sin cambios de diseño propuestos"),
    ("components/products/CategoryGrid.tsx", "in-scope", "not-affected", "grid de categorías ya consistente con wizard producto; sin cambios"),
    ("components/profile/LocationSelector.tsx", "in-scope", "addressed", "F-1: placeholders 'Seleccioná departamento/ciudad' + 'Primero seleccioná un departamento'"),
    ("app/publicar/page.tsx", "not-affected", "not-affected", "wizard producto = par de consistencia, no se toca"),
    ("components/products/ProductFormWizard.tsx", "not-affected", "not-affected", "hermano de estilo; baseline voseo del que F-1 toma dirección"),
    ("app/busco/[id]/editar/page.tsx", "not-affected", "not-affected", "reusa DemandPostForm — hereda el rediseño automáticamente"),
    ("app/busco/page.tsx", "not-affected", "not-affected", "listado, fuera del flujo de publicación"),
    ("components/products/OwnerListingNotice.tsx", "deferred", "deferred(contraste oculto P1 catalogado → item tinted-card-contrast-sweep)", "fuera de este item"),
]

pairs_html = []
for key, before, after, title, notes in PAIRS:
    pairs_html.append(f"""
    <section class="pair">
      <h2>{title}</h2>
      <p class="notes">{notes}</p>
      <div class="cols">
        <figure><figcaption>Antes — main a1e85de</figcaption><img src="{data_uri(BASE / before)}" loading="lazy"></figure>
        <figure><figcaption>Después — propuesta (mockup fiel)</figcaption><img src="{data_uri(BASE / after)}" loading="lazy"></figure>
      </div>
    </section>""")

g3c_rows = "\n".join(
    f"<tr><td>{f}</td><td>{p}</td><td>{d}</td><td>{disp}</td><td>{where}</td></tr>"
    for f, p, d, disp, where in G3C
)
g3d_rows = "\n".join(
    f"<tr><td>{inst}</td><td>{orig}</td><td>{disp}</td><td>{note}</td></tr>"
    for inst, orig, disp, note in G3D
)

html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Comparison — busco-publicar-ui</title>
<style>
  body {{ font-family: system-ui, sans-serif; margin: 2rem; background: #fafafa; color: #111; }}
  h1 {{ font-size: 1.5rem; }}
  h2 {{ font-size: 1.1rem; margin-top: 2.5rem; }}
  .pair {{ margin-bottom: 3rem; border-bottom: 1px solid #ddd; padding-bottom: 2rem; }}
  .notes {{ color: #555; font-size: .9rem; }}
  .cols {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }}
  figure {{ margin: 0; }}
  figcaption {{ font-weight: 600; margin-bottom: .4rem; font-size: .9rem; }}
  img {{ width: 100%; border: 1px solid #ccc; }}
  table {{ border-collapse: collapse; width: 100%; font-size: .85rem; margin: 1rem 0 2rem; }}
  th, td {{ border: 1px solid #ccc; padding: .4rem .6rem; text-align: left; vertical-align: top; }}
  th {{ background: #eee; }}
  .meta {{ color: #555; font-size: .85rem; }}
</style>
</head>
<body>
<h1>busco-publicar-ui — antes / después</h1>
<p class="meta">Item: UI/UX del wizard de demanda <code>/busco/publicar</code>. Antes = main a1e85de (capturas <code>current/</code>, logged-in, fullPage dsf=2). Después = render de mockups fieles sobre DOM real (<code>proposal/</code>, mismos viewports/fullPage/dsf). Ruta fallback <code>stitch:fallback</code> (precedente buscar loop 1, storefront, publicar-a11y).</p>

<h2>Resumen de la propuesta</h2>
<ul>
  <li><strong>F-1 (P1):</strong> todo el wizard unificado a voseo boliviano — voz de marca de la app ("Publicá", "Elegí", "Subí"). Hoy mezcla tuteo (Explica, Asegúrate, Selecciona).</li>
  <li><strong>F-2:</strong> heading paso 2 "Descripción de lo que buscás" (title case, sin duplicar label "Detalles de la solicitud").</li>
  <li><strong>F-3:</strong> aviso de autoguardado degradado a efímero/inline — sin card permanente por 4 pasos.</li>
  <li><strong>F-4:</strong> paso 2 en dos columnas sm+ (subcategoría 0.8fr | descripción 1.2fr); mobile 1 columna.</li>
  <li><strong>F-5:</strong> "Antes de publicar:" → checklist de verificación contra datos reales del formulario.</li>
</ul>

{''.join(pairs_html)}

<h2>Cobertura de findings (G3c)</h2>
<table>
<tr><th>Finding</th><th>Prioridad</th><th>Descripción</th><th>Disposition</th><th>Dónde</th></tr>
{g3c_rows}
</table>

<h2>Consistencia de patrones hermanos (G3d)</h2>
<table>
<tr><th>Instancia</th><th>Original</th><th>Disposition</th><th>Nota</th></tr>
{g3d_rows}
</table>

<h2>Notas de transparencia (defectos del mockup)</h2>
<ul>
  <li>El mock es DOM real congelado: sin JS. Interacciones (selects, upload) están muertas; el estado "después" es el objetivo, no interactivo.</li>
  <li>Checklist F-5: los ítems ✓/– son estáticos con datos del walkthrough (Santa Cruz, Bs. 3.000–5.500); en impl se computan del formulario real.</li>
  <li>El banner de borrador (F-3) en "antes" aparece tras autoguardado durante el walkthrough; en el mock "después" se representa el estado objetivo sin banner.</li>
  <li>Stepper en mock puede mostrar separadores "-" artefacto del congelado (lib opcional sin hidratar); en real son iconos.</li>
  <li>Textos de LocationSelector ("Seleccioná…") se verán al recorrer paso 3 — el mock de paso 2/4 no muestra paso 3; parche de copy cubre todo el archivo.</li>
</ul>
</body>
</html>"""

(BASE / "comparison.html").write_text(html, encoding="utf-8")
print("comparison.html written:", len(html), "chars")
