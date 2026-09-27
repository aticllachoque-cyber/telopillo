# Build comparison.html for unified-search: 3 before/after pairs
# (tab Productos desktop, tab Negocios desktop, overlay móvil) + G3c coverage
# + G3d sibling tables. Before = real DOM captures, after = faithful-DOM mockups.
import base64
from pathlib import Path

BASE = Path(__file__).parent

def data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode()

PAIRS = [
    ("tabs-productos-desktop", "current/desktop-resultados.png", "proposal/render-tabs-productos-desktop.png", "/buscar?q=samsung — tab Productos — desktop 1920×1080", "F-1 tabs con conteos + selector [Todo ▾] en SearchBar · F-4 h1 'Buscar' · F-5 voseo ('Publicá lo que buscás')"),
    ("tabs-negocios-desktop", "current/desktop-resultados.png", "proposal/render-tabs-negocios-desktop.png", "/buscar — tab Negocios activa — desktop 1920×1080", "F-1 cards de negocio (fila: logo + nombre + ✓Verificado + categoría/ubicación + productos activos) · F-4 filtros reducidos a Categoría negocio + Departamento"),
    ("mobile-overlay", "input/header-mobile-search-overlay.png", "proposal/render-mobile-overlay-mobile.png", "Header móvil — overlay de búsqueda — 375×812", "F-3 overlay reusa SearchBar con selector (form inline duplicado eliminado) · F-1 selector de tipo disponible en mobile"),
]

G3C = [
    ("F-1", "P1", "Buscador solo busca productos — negocios/solicitudes/personas invisibles", "addressed", "mockup-tabs-*.html: tablist Productos/Negocios/Solicitudes/Personas con badge de conteo; selector [Todo ▾] en ambas SearchBars (header + página); impl: type param + endpoint map + contadores debounced"),
    ("F-2", "P1", "Sin backend de búsqueda de negocios/personas", "addressed", "invisible en mockup — impl Stage 8: migración RPCs search_businesses/search_profiles (SECURITY INVOKER, sin phone, solo perfiles con productos activos) + rutas API keyword-only"),
    ("F-3", "P2", "Overlay móvil duplica form inline en vez de reusar SearchBar", "addressed", "mockup-mobile-overlay.html: overlay con selector [Todo ▾] integrado — mismo SearchBar que desktop"),
    ("F-4", "P2", "Filtros y sort fijos de producto", "addressed", "mockup-tabs-negocios.html: filtros reducidos a Categoría (negocio) + Departamento; h1 'Buscar'; impl: enabledFilters prop + sort por tipo + tab switch stripping params"),
    ("F-5", "P2", "Copy tuteo en estados de /buscar", "addressed", "mockup-tabs-productos.html: 'Publicá una solicitud', 'Publicá lo que buscás' (reemplazos aplicados); impl: Intenta→Intentá + copy nuevo por-tipo directo en voseo"),
]

G3D = [
    ("components/search/SearchBar.tsx", "in-scope", "addressed", "F-1 selector + F-5 placeholders voseo"),
    ("components/layout/Header.tsx", "in-scope", "addressed", "F-1 selector desktop + F-3 overlay unificado"),
    ("app/buscar/page.tsx", "in-scope", "addressed", "F-1 tabs + F-4 adaptativo + F-5 voseo"),
    ("components/search/SearchFilters.tsx", "in-scope", "addressed", "F-4 enabledFilters por tipo"),
    ("components/search/SearchSort.tsx", "in-scope", "addressed", "F-4 opciones por tipo"),
    ("components/search/SearchTypeTabs.tsx", "in-scope (nuevo)", "addressed", "F-1 tablist accesible"),
    ("components/search/BusinessResultCard.tsx", "in-scope (nuevo)", "addressed", "F-1 card negocio"),
    ("components/search/PersonResultCard.tsx", "in-scope (nuevo)", "addressed", "F-1 card persona (sin phone)"),
    ("supabase/migrations/20260916120000_add_search_businesses_and_profiles.sql", "in-scope (nuevo)", "addressed", "F-2 RPCs búsqueda"),
    ("app/api/search-businesses/route.ts", "in-scope (nuevo)", "addressed", "F-2 ruta API"),
    ("app/api/search-profiles/route.ts", "in-scope (nuevo)", "addressed", "F-2 ruta API"),
    ("types/database.ts", "in-scope", "addressed", "F-2 tipos SearchBusiness/SearchPerson"),
    ("tests/e2e/search-discovery/unified-search.spec.ts", "in-scope (nuevo)", "addressed", "F-1/F-2 verificación e2e + privacidad"),
    ("components/products/ProductCard.tsx", "not-affected", "not-affected", "card producto sin cambios"),
    ("components/demand/DemandPostCard.tsx", "not-affected", "not-affected", "reusado tal cual en tab Solicitudes"),
    ("components/products/ProductGrid.tsx", "not-affected", "not-affected", "solo tab Productos"),
    ("app/page.tsx (home hero)", "not-affected", "not-affected", "queda solo productos; selector solo Header + /buscar"),
    ("app/negocio/[slug]/page.tsx", "not-affected", "not-affected", "destino anon-safe de links"),
    ("app/vendedor/[id]/page.tsx", "not-affected", "not-affected", "destino anon-safe de links"),
    ("app/perfil/demandas/page.tsx", "not-affected", "not-affected", "donor patrón tablist, no se toca"),
]

pairs_html = []
for key, before, after, title, notes in PAIRS:
    pairs_html.append(f"""
    <section class="pair">
      <h2>{title}</h2>
      <p class="notes">{notes}</p>
      <div class="cols">
        <figure><figcaption>Antes — main (captura DOM real)</figcaption><img src="{data_uri(BASE / before)}" loading="lazy"></figure>
        <figure><figcaption>Después — mockup fiel (DOM real + parches)</figcaption><img src="{data_uri(BASE / after)}" loading="lazy"></figure>
      </div>
    </section>""")

def rows_g3c():
    return "\n".join(
        f"<tr><td><strong>{fid} ({p})</strong></td><td>{name}</td><td>{st}</td><td>{how}</td></tr>"
        for fid, p, name, st, how in G3C
    )

def rows_g3d():
    return "\n".join(
        f"<tr><td><code>{f}</code></td><td>{scope}</td><td>{st}</td><td>{note}</td></tr>"
        for f, scope, st, note in G3D
    )

html = f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Comparison — unified-search</title>
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
<h1>unified-search — antes / después</h1>
<p class="meta">Item: búsqueda unificada productos + negocios + solicitudes + personas (Header SearchBar + <code>/buscar</code>). Decisión humana 2026-09-16: alcance 4 entidades; UX selector <code>[Todo ▾][input][Buscar]</code> + tabs con conteos. Ruta fallback <code>stitch:fallback</code> (precedente buscar, storefront, publicar-a11y, busco-publicar-ui). Antes = capturas DOM real (<code>current/</code> + <code>input/</code>); después = mockups fieles sobre DOM real con parches (<code>proposal/</code>).</p>

<h2>Resumen de la propuesta</h2>
<ul>
  <li><strong>F-1 (P1):</strong> selector de tipo en ambas SearchBars (Todo/Productos/Negocios/Solicitudes/Personas — "Todo" aterriza en tab Productos) + tablist accesible en /buscar con badge de conteo por entidad.</li>
  <li><strong>F-2 (P1):</strong> backend nuevo en impl — RPCs <code>search_businesses</code>/<code>search_profiles</code> (SECURITY INVOKER, solo campos públicos, SIN teléfono; personas solo con productos activos) + rutas API keyword-only.</li>
  <li><strong>F-3:</strong> overlay móvil reusa SearchBar (con selector) — el form inline duplicado desaparece.</li>
  <li><strong>F-4:</strong> filtros y sort por tipo; h1 "Buscar"; tab switch limpia params no aplicables.</li>
  <li><strong>F-5:</strong> voseo exclusivo ("Publicá una solicitud", "Publicá lo que buscás", "Intentá").</li>
  <li><strong>Destinos:</strong> negocio → <code>/negocio/&lt;slug&gt;</code>; persona → <code>/negocio/&lt;slug&gt;</code> si tiene negocio, si no <code>/vendedor/&lt;id&gt;</code> (regla SellerCard); solicitud → <code>/busco/&lt;id&gt;</code> (DemandPostCard tal cual).</li>
</ul>

{''.join(pairs_html)}

<h2>Cobertura de findings (G3c)</h2>
<table>
  <tr><th>Finding</th><th>Problema</th><th>Estado</th><th>Cómo se resuelve</th></tr>
  {rows_g3c()}
</table>

<h2>Instancias del patrón (G3d)</h2>
<table>
  <tr><th>Archivo</th><th>Scope</th><th>Disposición</th><th>Nota</th></tr>
  {rows_g3d()}
</table>

<p class="meta">Generado 2026-09-16 · Stage 6 Checkpoint 3 — propuesta pendiente de sign-off humano.</p>
</body>
</html>
"""

(BASE / "comparison.html").write_text(html)
print("comparison.html written")
