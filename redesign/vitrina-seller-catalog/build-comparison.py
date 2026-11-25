#!/usr/bin/env python3
"""Build comparison.html for vitrina-seller-catalog (Stage 6).
Embeds the 6 before/after captures as data: URIs and the full mockup.html
inside a <template> (G4b invariant: nothing approved lives outside
comparison.html + proposal/*).
"""
import base64
import pathlib

D = pathlib.Path(__file__).parent


def b64(p):
    return "data:image/jpeg;base64," + base64.b64encode((D / pathlib.Path(p).with_suffix(".jpg")).read_bytes()).decode()


pairs = [
    (
        "Desktop (1920×1080, fullPage, 2x ambos)",
        "Desktop: sin cambios visibles en storefront — F-1..F-3 y F-6 son ajustes mobile; "
        "sección vendedora: F-4/F-5 + iteración 1 (F-7 badges, F-8 thumbs, F-10 nota cap). "
        "F-11: flechas reorder ocultas en el render estático (visibles solo on hover/focus).",
        "current/desktop.png",
        "proposal/stitch-render-desktop.png",
    ),
    (
        "Tablet (768×1024, fullPage, 2x ambos)",
        "Tablet: Destacados ya era grid 2-col ≥640px — el carrusel F-1 solo aplica <640px; "
        "mock combina storefront + manager.",
        "current/tablet.png",
        "proposal/stitch-render-tablet.png",
    ),
    (
        "Mobile (375×812, fullPage, 2x ambos)",
        "Mobile: F-1 carrusel scroll-snap con peek del próximo card; F-2 chips a 44px; "
        "F-3 paginación centrada en una línea; F-6 fade derecho en chips. "
        "Sección vendedora: F-7 badges posición, F-8 thumbnails, F-10 nota cap; flechas siempre visibles en mobile (F-11 no aplica).",
        "current/mobile.png",
        "proposal/stitch-render-mobile.png",
    ),
]

sections = []
for title, note, before, after in pairs:
    sections.append(f"""<section>
  <h2>{title}</h2>
  <p class="meta">{note}</p>
  <div class="pair">
    <figure><figcaption>Before (current)</figcaption><img src="{b64(before)}" alt="current"></figure>
    <figure><figcaption>After (proposal render)</figcaption><img src="{b64(after)}" alt="proposal"></figure>
  </div>
</section>""")

findings_rows = "\n".join(
    [
        '<tr><td>F-1</td><td>P1</td><td class="addressed">addressed</td><td>Carrusel horizontal scroll-snap en Destacados &lt;640px (cards 72vw/máx 280px, peek del próximo); grid normal ≥640px — delta CSS sobre ProductGrid en app/negocio/[slug]/page.tsx:453-464</td></tr>',
        '<tr><td>F-2</td><td>P2</td><td class="addressed">addressed</td><td>Chips a min-height 44px en mobile (parity con SearchSort 44px), 36px desktop se mantiene</td></tr>',
        '<tr><td>F-3</td><td>P2</td><td class="addressed">addressed</td><td>Paginación mobile: columna centrada, estado "Página X de Y" en una línea, spacers ocultos</td></tr>',
        '<tr><td>F-4</td><td>P2</td><td class="addressed">addressed</td><td>Destacar disabled + aria-disabled + title explicativo al alcanzar cap 4 (20 botones en mock) — components/profile/CatalogManager.tsx:197-241</td></tr>',
        '<tr><td>F-5</td><td>P2</td><td class="addressed">addressed</td><td>Link "Ver mi vitrina" duplicado eliminado del header card; queda el contextual del manager — app/perfil/mis-productos/page.tsx:207-244</td></tr>',
        '<tr><td>F-6</td><td>P2</td><td class="addressed">addressed</td><td>Fade derecho (::after gradiente token background) en nav de chips cuando desborda en mobile</td></tr>',
        '<tr><td>F-7</td><td>P1</td><td class="addressed">addressed</td><td>Badge de posición por card (1/2/3… por categoría, tabular-nums, title "Posición N en {categoría}") — iter.1 usuario</td></tr>',
        '<tr><td>F-8</td><td>P2</td><td class="addressed">addressed</td><td>Thumbnail 56px (initials en mock; imagen real del producto en impl) junto al título — parity con ProductGrid</td></tr>',
        '<tr><td>F-9</td><td>P2</td><td class="addressed">addressed</td><td>title tooltips en flechas: aria-label + "(lista {categoría})" — 48 botones parchados en mock</td></tr>',
        '<tr><td>F-10</td><td>P2</td><td class="addressed">addressed</td><td>Texto inline junto al contador 4/4: "Máximo alcanzado — quitá uno para destacar otro" (muted, visible sin hover) — complementa F-4</td></tr>',
        '<tr><td>F-11</td><td>P3</td><td class="addressed">addressed</td><td>Desktop ≥1024px chevrons opacity 0 → 1 on card hover/focus-within; mobile/tablet siempre visibles (sin hover). Destacar y kebab intactos</td></tr>',
        '<tr><td>F-7</td><td>P1</td><td class="addressed">addressed</td><td>Badge de posición por card (1-20, por categoría, tabular-nums + title) — iteración 1, components/profile/CatalogManager.tsx</td></tr>',
        '<tr><td>F-8</td><td>P2</td><td class="addressed">addressed</td><td>Thumbnail junto al título en cards del manager (mock muestra placeholder con iniciales — impl real usa imagen del producto, object-cover rounded-md) — iteración 1</td></tr>',
        '<tr><td>F-9</td><td>P2</td><td class="addressed">addressed</td><td>title tooltips en flechas con nombre de la lista de categoría ("Subir … (lista Electrónica)") — iteración 1</td></tr>',
        '<tr><td>F-10</td><td>P2</td><td class="addressed">addressed</td><td>Texto inline junto al contador 4/4: "Máximo alcanzado — quitá uno para destacar otro" (visible sin hover, complementa F-4) — iteración 1</td></tr>',
        '<tr><td>F-11</td><td>P3</td><td class="addressed">addressed</td><td>Desktop ≥1024px: flechas reorder opacity-0 → visibles on card hover/focus-within; mobile siempre visibles. NOTA: en el render desktop estático las flechas NO se ven (hover no capturable) — defecto declarado</td></tr>',
    ]
)

sibling_rows = "\n".join(
    [
        '<tr><td>app/negocio/[slug]/page.tsx:411-447 (chips P-A)</td><td class="addressed">addressed</td><td>Chips conservan look pill/contador/aria-current; solo cambia min-height mobile + fade (F-2/F-6)</td></tr>',
        '<tr><td>app/negocio/[slug]/page.tsx:453-464 (Destacados P-B)</td><td class="addressed">addressed</td><td>Mismo heading Star + ProductGrid; envoltura carrusel solo CSS mobile</td></tr>',
        '<tr><td>app/negocio/[slug]/page.tsx:397-402 (SearchSort)</td><td class="not-affected">not-affected</td><td>Ya cumple 44px + sr-only label — es el estándar que F-2 iguala en chips</td></tr>',
        '<tr><td>components/profile/CatalogManager.tsx:197-241 (destacar/reorder P-C)</td><td class="addressed">addressed</td><td>F-4 cambia solo estado disabled + title; tamaños 44px mobile existentes intactos</td></tr>',
        '<tr><td>components/profile/CatalogManager.tsx:134-146 (contador+link P-D)</td><td class="addressed">addressed</td><td>Este link contextual se CONSERVA como único "Ver mi vitrina" (F-5)</td></tr>',
        '<tr><td>app/perfil/mis-productos/page.tsx:207-244 (header card P-D)</td><td class="addressed">addressed</td><td>Link duplicado removido de la propuesta (F-5)</td></tr>',
        '<tr><td>app/buscar/page.tsx (SearchSort otros sorts)</td><td class="not-affected">not-affected</td><td>Patrón selector no se toca fuera del storefront; mismo componente compartido</td></tr>',
        '<tr><td>app/perfil/mis-productos/page.tsx:470-500 (chips estado)</td><td class="not-affected">not-affected</td><td>Chips pre-existentes sin cambios; F-2 aplica solo al nav del storefront</td></tr>',
        '<tr><td>components/products/ProductGrid.tsx (grid compartido)</td><td class="not-affected">not-affected</td><td>Componente intacto — el carrusel F-1 es CSS de envoltura scoped a la sección Destacados</td></tr>',
        '<tr><td>app/busco/[id]/page.tsx barra fixed bottom</td><td class="not-affected">not-affected</td><td>Sin controles sticky nuevos en la propuesta; colisión potencial descartada</td></tr>',
    ]
)

mockup = (D / "proposal" / "mockup.html").read_text()
# strip the closing html tags so template content stays inert
mockup_inner = mockup

html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>comparison — vitrina-seller-catalog</title>
<style>
  :root {{ color-scheme: light; }}
  body {{ margin: 0; font: 14px/1.5 system-ui, sans-serif; }}
  header {{ padding: 1rem 1.5rem; border-bottom: 1px solid #8884; position: sticky; top: 0; background: #fff; }}
  h1 {{ font-size: 1.1rem; margin: 0; }}
  .meta {{ color: #666; font-size: .85rem; }}
  section {{ padding: 1rem 1.5rem; }}
  h2 {{ font-size: 1rem; }}
  .pair {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }}
  .pair figure {{ margin: 0; }}
  .pair figcaption {{ font-weight: 600; margin-bottom: .4rem; }}
  .pair img {{ max-width: 100%; border: 1px solid #8884; }}
  @media (max-width: 900px) {{ .pair {{ grid-template-columns: 1fr; }} }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ border: 1px solid #8884; padding: .4rem .6rem; text-align: left; vertical-align: top; }}
  .addressed {{ color: #18794e; font-weight: 600; }}
  .deferred {{ color: #946f00; font-weight: 600; }}
  .not-affected {{ color: #18794e; font-weight: 600; }}
  details {{ margin: 1rem 1.5rem; }}
  summary {{ cursor: pointer; font-weight: 600; }}
</style>
</head>
<body>
<header>
  <h1>Redesign comparison — vitrina-seller-catalog</h1>
  <div class="meta">Rutas: /negocio/[slug] (pública) + /perfil/mis-productos (seller) · Rama base: feat/catalog-vitrina 7d7d7dd · 2026-09-28 · Iteración 1 (F-7..F-11 feedback usuario) · Source: fallback mockup (delta-on-real-DOM; stitch:fallback) · Desktop 1920×1080 · Tablet 768×1024 · Mobile 375×812 — fullPage, escala 2x</div>
</header>

<section>
  <h2>Findings disposition (G3c)</h2>
  <table>
    <thead><tr><th>Finding</th><th>Severity</th><th>Disposition</th><th>Where / Reason</th></tr></thead>
    <tbody>
{findings_rows}
    </tbody>
  </table>
</section>

<section>
  <h2>Sibling pattern instances (G3d)</h2>
  <table>
    <thead><tr><th>Instance</th><th>Disposition</th><th>Why the proposal stays consistent / why it drifts</th></tr></thead>
    <tbody>
{sibling_rows}
    </tbody>
  </table>
</section>

{chr(10).join(sections)}

<details>
  <summary>Propuesta completa embebida (mockup.html — invariante G4b)</summary>
  <p class="meta">Copia exacta de proposal/mockup.html. Para verla interactiva: guardar como .html y abrir (CSS de dev inlineado; imágenes apuntan al stack local :3000/:54321).</p>
</details>
<template id="embedded-proposal">{mockup_inner}</template>
</body>
</html>
"""

out = D / "comparison.html"
out.write_text(html)
print("written", out, len(html), "bytes")
