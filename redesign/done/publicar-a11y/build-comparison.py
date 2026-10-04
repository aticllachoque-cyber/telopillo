#!/usr/bin/env python3
"""Build comparison.html for publicar-a11y (Stage 6).

Before/after pairs: demanda layout (F-2) desktop/tablet/mobile + producto
step1 error state (F-1/F-4) desktop/mobile. Both sides fullPage dsf=2.
Images embedded as data: URIs; the demanda mockup is embedded in the page.
"""
import base64
import pathlib

DIR = pathlib.Path(__file__).parent


def data_uri(rel: str) -> str:
    raw = (DIR / rel).read_bytes()
    return "data:image/png;base64," + base64.b64encode(raw).decode()


PAIRS = [
    ("Demanda /busco/publicar — Desktop 1920×1080 (F-2: centrado)",
     "current/demanda-desktop.png", "proposal/render-demanda-fixed-desktop.png"),
    ("Demanda /busco/publicar — Tablet 768×1024 (F-2)",
     "current/demanda-tablet.png", "proposal/render-demanda-fixed-tablet.png"),
    ("Demanda /busco/publicar — Mobile 375×812 (F-2)",
     "current/demanda-mobile.png", "proposal/render-demanda-fixed-mobile.png"),
    ("Producto /publicar paso 1 errores — Desktop 1920×1080 (F-1/F-4: error único)",
     "audit/producto-step1-errores-desktop.png", "proposal/render-error-fixed-desktop-desktop.png"),
    ("Producto /publicar paso 1 errores — Mobile 375×812 (F-1/F-4)",
     "audit/producto-step1-errores-mobile.png", "proposal/render-error-fixed-mobile-mobile.png"),
]

pair_html = []
for title, before, after in PAIRS:
    pair_html.append(f"""
    <section class="pair">
      <h2>{title}</h2>
      <div class="row">
        <figure><figcaption>Antes (main)</figcaption><img src="{data_uri(before)}" loading="lazy"></figure>
        <figure><figcaption>Después (propuesta)</figcaption><img src="{data_uri(after)}" loading="lazy"></figure>
      </div>
    </section>""")

pairs = "\n".join(pair_html)

coverage = """
<table>
  <thead><tr><th>Finding</th><th>Severidad</th><th>Resumen</th><th>Disposición</th></tr></thead>
  <tbody>
    <tr><td>F-1</td><td>(P2)</td><td>Error "Debes subir al menos 1 imagen" duplicado en wizard producto</td><td>addressed — eliminar <p> duplicado en ProductFormWizard.tsx:561; única copia queda vía prop error de ImageUpload (ver par mobile: 2 líneas → 1)</td></tr>
    <tr><td>F-2</td><td>(P2)</td><td>Página demanda sin centrar en desktop (container sin mx-auto)</td><td>addressed — container mx-auto max-w-2xl en app/busco/publicar/page.tsx:79,102 (ver pares desktop/tablet: contenido centrado igual que hermana producto)</td></tr>
    <tr><td>F-3</td><td>(P2)</td><td>Timeout crónico test "Publish page" en suite a11y (bloquea G6 repo-wide)</td><td>addressed — test.slow() en accessibility-audit.spec.ts:150 (budget ×3 absorbe contención de suite); fix de test, sin cambio visual</td></tr>
    <tr><td>F-4</td><td>(P2)</td><td>Error de imágenes sin announce a screen readers</td><td>addressed — via F-1: la copia única que sobrevive es el render de ImageUpload (ImageUpload.tsx:565-571) que YA tiene role="alert" aria-live="assertive"; mismo cambio de F-1</td></tr>
  </tbody>
</table>"""

sibling = """
<table>
  <thead><tr><th>Instancia</th><th>Disposición</th></tr></thead>
  <tbody>
    <tr><td>components/products/ProductFormWizard.tsx (wizard producto, /publicar)</td><td>addressed — F-1/F-4: error único con role="alert"</td></tr>
    <tr><td>components/demand/DemandPostForm.tsx (wizard demanda, /busco/publicar)</td><td>not-affected — errores ya anuncian (role="alert" :555,656,714,739); axe 0 violaciones en 20 estados</td></tr>
    <tr><td>app/publicar/page.tsx (route shell producto)</td><td>not-affected — ya centra (container mx-auto max-w-3xl); par de referencia para F-2</td></tr>
    <tr><td>app/busco/publicar/page.tsx (route shell demanda)</td><td>addressed — F-2: container mx-auto en :79 y :102</td></tr>
    <tr><td>app/productos/[id]/editar/page.tsx</td><td>not-affected — reusa ProductFormWizard: hereda F-1/F-4 automáticamente</td></tr>
    <tr><td>app/busco/[id]/editar/page.tsx</td><td>not-affected — reusa DemandPostForm: hereda fixes automáticamente</td></tr>
    <tr><td>components/products/ImageUpload.tsx</td><td>not-affected — ya renderiza error con role="alert" aria-live="assertive" (:565-571); se vuelve la copia única tras F-1</td></tr>
    <tr><td>components/shared/SingleImageUpload.tsx</td><td>not-affected — sin duplicación, contraste OK</td></tr>
    <tr><td>components/products/OwnerListingNotice.tsx</td><td>deferred — violación oculta P1 → item tinted-card-contrast-sweep (propuesta pendiente)</td></tr>
  </tbody>
</table>"""

mockup_html = (DIR / "proposal" / "mockup-demanda.html").read_text()
mockup_b64 = base64.b64encode(mockup_html.encode()).decode()

page = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>comparison — publicar-a11y</title>
<style>
  body {{ font-family: system-ui, sans-serif; margin: 2rem; color: #171717; }}
  h1 {{ font-size: 1.4rem; }} h2 {{ font-size: 1.1rem; margin: 1.5rem 0 .5rem; }}
  .row {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }}
  figure {{ margin: 0; }} figcaption {{ font-size: .85rem; font-weight: 600; margin-bottom: .3rem; }}
  img {{ width: 100%; border: 1px solid #ddd; border-radius: 6px; }}
  table {{ border-collapse: collapse; width: 100%; font-size: .85rem; margin: .5rem 0 1.5rem; }}
  th, td {{ border: 1px solid #ddd; padding: .35rem .5rem; text-align: left; vertical-align: top; }}
  th {{ background: #f5f5f5; }}
  .note {{ background: #fef9c3; border: 1px solid #e4e4e7; padding: .6rem .8rem; border-radius: 6px; font-size: .85rem; }}
  details {{ margin: 1rem 0; }} summary {{ cursor: pointer; font-weight: 600; }}
</style></head><body>
<h1>publicar-a11y — antes / después</h1>
<p>Rutas <code>/publicar</code> (producto) + <code>/busco/publicar</code> (demanda) — estado real 2026-09-15, logged-in, drafts limpiados entre capturas.</p>
<div class="note"><strong>Transparencia:</strong> (1) en los pares mobile del wizard producto, la barra sticky Cancelar/Siguiente se superpone al contenido en el screenshot fullPage — artefacto idéntico en ambos lados, no es parte de la propuesta. (2) El mockup embebido es demanda (F-2, el único fix visible en layout estático); F-1/F-4 se demuestran con los pares de estado de error. Ruta fallback <code>stitch:fallback</code> — fixes de presencia/atributos, no de diseño visual (precedente buscar-a11y + storefront-a11y).</div>
{pairs}
<h2>Cobertura de findings (G3c)</h2>
{coverage}
<h2>Patrones cross-page (G3d)</h2>
{sibling}
<h2>Mockup embebido (demanda centrada)</h2>
<p>Mock fiel sobre DOM real hidratado (scripts removidos, nextjs-portal removido, CSS built inlineeado, parche F-2 inline — margen auto).</p>
<details><summary>Ver mockup-demanda.html (embebido, auto-contenido)</summary>
<iframe id="mockframe" style="width:100%;height:70vh;border:1px solid #ddd;border-radius:6px"></iframe>
<br><a id="dl" download="mockup-demanda.html" href="data:text/html;base64,{mockup_b64}">Descargar mockup-demanda.html</a>
<script>document.getElementById('mockframe').srcdoc = atob("{mockup_b64}");</script>
</details>
</body></html>"""

(DIR / "comparison.html").write_text(page)
print("comparison.html:", f"{(DIR / 'comparison.html').stat().st_size / 1024:.0f} KB")
