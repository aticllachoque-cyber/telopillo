#!/usr/bin/env python3
"""Build comparison.html for storefront-a11y (Stage 6).

Three before/after pairs (desktop 1920x1080, tablet 768x1024, mobile 375x812 —
both sides fullPage dsf=2), coverage table (G3c), sibling table (G3d).
Images embedded as data: URIs; the full mockup HTML is embedded in the page.
"""
import base64
import pathlib
import re

DIR = pathlib.Path(__file__).parent


def data_uri(rel: str) -> str:
    raw = (DIR / rel).read_bytes()
    return "data:image/png;base64," + base64.b64encode(raw).decode()


def table_of_64(bit: int) -> int:
    return 0


PAIRS = [
    ("Desktop — 1920×1080", "current/desktop.png", "proposal/storefront-render-desktop.png"),
    ("Tablet — 768×1024", "current/tablet.png", "proposal/storefront-render-tablet.png"),
    ("Mobile — 375×812", "current/mobile.png", "proposal/storefront-render-mobile.png"),
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
    <tr><td>F-1</td><td>(P1)</td><td>Badge "Cerrado" text-red-600/red-50 4.36:1</td><td>addressed — texto → red-700 #b91c1c (5.87:1) en BusinessInfoSidebar.tsx:103; ver parche en mockup</td></tr>
    <tr><td>F-2</td><td>(P1)</td><td>Badge "Abierto" text-green-600/green-50 ≈3.14:1, render condicional por día</td><td>addressed — texto → green-800 #166534 (6.27:1) en BusinessInfoSidebar.tsx:95; mismo tratamiento que F-1</td></tr>
    <tr><td>F-3</td><td>(P2)</td><td>Banner construcción con gradiente amber fuera de tokens</td><td>addressed — gradiente → tinte muted plano (bg-muted/40 ≈ #f4f4f4) en app/negocio/[slug]/page.tsx:209</td></tr>
    <tr><td>F-4</td><td>(P2)</td><td>TEST_DATA.businessSlug stale — test audita 404</td><td>addressed — slug → 'tienda-electronica-la-paz' en tests/helpers/index.ts:216; sin cambio visual (fix de test)</td></tr>
    <tr><td>F-5</td><td>(P2)</td><td>Descripción banner muted sobre gradiente ≈4.27:1 borderline</td><td>addressed — texto → foreground/80 (#474747 ≈8.5:1) en page.tsx:220</td></tr>
    <tr><td>—</td><td>—</td><td>Specs tests/m4.5-*.spec.ts con slug local stale</td><td>deferred — fuera de la suite a11y; mismo root cause, decisión en Checkpoint</td></tr>
  </tbody>
</table>"""

sibling = """
<table>
  <thead><tr><th>Instancia</th><th>Disposición</th></tr></thead>
  <tbody>
    <tr><td>components/business/BusinessInfoSidebar.tsx:95 (badge "Abierto")</td><td>addressed — texto green-800 en el mismo parche que F-2</td></tr>
    <tr><td>components/business/BusinessInfoSidebar.tsx:103 (badge "Cerrado")</td><td>addressed — texto red-700, parche F-1</td></tr>
    <tr><td>components/ui/VerificationBadge.tsx:84</td><td>not-affected — green-700/-50 pasa 4.5:1</td></tr>
    <tr><td>components/demand/DemandStatusBadge.tsx:20</td><td>not-affected — amber-800/amber-100 contraste OK</td></tr>
    <tr><td>components/network/NetworkStatusBanner.tsx:14</td><td>not-affected — amber-950 muy oscuro, OK</td></tr>
    <tr><td>app/busco/page.tsx:411</td><td>not-affected — contraste OK; drift de tokens → item tinted-card-contrast-sweep</td></tr>
    <tr><td>components/home/ResilientHomePreview.tsx:116</td><td>not-affected — contraste OK; drift → sweep</td></tr>
    <tr><td>components/products/ImageUpload.tsx:445</td><td>not-affected — contraste OK; drift → sweep</td></tr>
    <tr><td>components/shared/SingleImageUpload.tsx:216</td><td>not-affected — contraste OK; drift → sweep</td></tr>
    <tr><td>components/ui/snackbar.tsx:48,55</td><td>not-affected — variantes warning con contraste OK</td></tr>
    <tr><td>tests/m4.5-mobile.spec.ts:6 + tests/m4.5-accessibility.spec.ts:7 + tests/m4.5-account-types-e2e.spec.ts:6</td><td>deferred — fuera de suite a11y; decisión en Checkpoint</td></tr>
  </tbody>
</table>"""

mockup_html = (DIR / "proposal" / "mockup.html").read_text()
mockup_b64 = base64.b64encode(mockup_html.encode()).decode()

page = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>comparison — storefront-a11y</title>
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
  textarea {{ width: 100%; height: 240px; font-family: monospace; font-size: .75rem; }}
</style></head><body>
<h1>storefront-a11y — antes / después</h1>
<p>Ruta <code>/negocio/[slug]</code> — negocio auditado: <code>tienda-electronica-la-paz</code> (estado real 2026-09-15, badge "Cerrado" renderizado — lunes closed en seed).</p>
<div class="note"><strong>Defecto de render declarado:</strong> imágenes de producto en blanco en la columna "después" (lazy-load sin JS en el mock estático — mismo defecto aceptado en buscar-a11y). Defecto conocido del pipeline: badge "Abierto" no renderiza hoy (lunes closed) — parche F-2 aplicado por código, no visible en el mock.</div>
{pairs}
<h2>Cobertura de findings (G3c)</h2>
{coverage}
<h2>Patrones cross-page (G3d)</h2>
{sibling}
<h2>Mockup embebido</h2>
<p>Mock fiel sobre DOM real hidratado (scripts removidos, CSS built inlineeado, parches mínimos inline — ruta fallback <code>stitch:fallback</code>, precedente buscar-a11y loop 1).</p>
<details><summary>Ver mockup.html (embebido, auto-contenido)</summary>
<iframe id="mockframe" style="width:100%;height:70vh;border:1px solid #ddd;border-radius:6px"></iframe>
<br><a id="dl" download="mockup.html" href="data:text/html;base64,{mockup_b64}">Descargar mockup.html</a>
<script>document.getElementById('mockframe').srcdoc = atob("{mockup_b64}");</script>
</details>
</body></html>"""

(DIR / "comparison.html").write_text(page)
print("comparison.html:", f"{(DIR / 'comparison.html').stat().st_size / 1024:.0f} KB")
