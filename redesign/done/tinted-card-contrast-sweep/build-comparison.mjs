// Stage 6 comparison.html generator — 7 before/after pairs + coverage tables
// + full proposal embedded. Images as data URIs; mockups via <iframe srcdoc>.
import { readFileSync, writeFileSync } from 'fs'

const R = new URL('./', import.meta.url).pathname
const img = (p) => `data:image/png;base64,${readFileSync(R + p).toString('base64')}`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const PAIRS = [
  ['P1 · Desktop 1920×1080 — /productos/… (owner) · F-1', 'current/desktop.png', 'proposal/render-mockup-owner-notice-desktop.png', 'OwnerListingNotice: 3 párrafos muted → text-foreground/80 (4.27:1 → ≈17.8:1)'],
  ['P2 · Tablet 768×1024 — /productos/… (owner) · F-1', 'current/tablet.png', 'proposal/render-mockup-owner-notice-tablet.png', ''],
  ['P3 · Mobile 375×812 — /productos/… (owner) · F-1', 'current/mobile.png', 'proposal/render-mockup-owner-notice-mobile.png', ''],
  ['P4 · Desktop — / header, dropdown abierto · F-3', 'current/usermenu-desktop.png', 'proposal/render-mockup-usermenu-desktop.png', 'Labels "Publicaciones"/"Cuenta" 11px muted → foreground/80 (4.27:1/4.58:1 → ≈17.8:1)'],
  ['P5 · Mobile — drawer abierto (logged-out) · F-2', 'current/drawer-mobile.png', 'proposal/render-mockup-drawer-mobile.png', 'Banner CTA muted → foreground/80 (4.27:1 → ≈17.8:1)'],
  ['P6 · Desktop — /busco/publicar draft banner · F-4', 'current/draft-demand-desktop.png', 'proposal/render-mockup-draft-desktop.png', 'Subtítulo amber muted → foreground/80 (4.39:1 → ≈18.3:1). Banner muted/30 (estado) = demo inyectado debajo — misma clase swap (4.62:1 → ≈19.3:1)'],
  ['P7 · Desktop — /busco banner offline · F-5', 'current/busco-desktop.png', 'proposal/render-mockup-offline-desktop.png', 'Amber hardcodeado → border-border/60 bg-muted/40 + foreground/80 (tratamiento storefront-a11y F-3). Banner = demo inyectado (estado condicional)'],
]

const G3C = [
  ['F-1', 'addressed', 'P1-P3 (mockup-owner-notice): 3 párrafos OwnerListingNotice.tsx:23,29,34 muted→text-foreground/80'],
  ['F-2', 'addressed', 'P5 (mockup-drawer): MobileNavigationDrawer.tsx:122 muted→text-foreground/80'],
  ['F-3', 'addressed', 'P4 (mockup-usermenu): UserMenu.tsx:102,128 labels 11px muted→text-foreground/80'],
  ['F-4', 'addressed', 'P6 (mockup-draft): 6 banners en 3 archivos — subtítulos amber + estados muted/30 → text-foreground/80'],
  ['F-5', 'addressed', 'P7 (mockup-offline): ResilientHomePreview.tsx:116 + app/busco/page.tsx:411 amber→bg-muted/40 neutro'],
]

const G3D = [
  ['components/products/OwnerListingNotice.tsx', 'addressed'],
  ['components/layout/MobileNavigationDrawer.tsx', 'addressed'],
  ['components/layout/UserMenu.tsx', 'addressed'],
  ['components/products/ProductFormWizard.tsx', 'addressed'],
  ['components/demand/DemandPostForm.tsx', 'addressed'],
  ['components/profile/BusinessProfileForm.tsx', 'addressed'],
  ['components/home/ResilientHomePreview.tsx', 'addressed'],
  ['app/busco/page.tsx', 'addressed'],
  ['app/buscar/page.tsx', 'not-affected'],
  ['app/(auth)/register/page.tsx', 'not-affected'],
  ['components/products/CategoryGrid.tsx', 'not-affected'],
  ['components/products/ImageUpload.tsx', 'not-affected'],
  ['components/demand/OfferProductModal.tsx', 'not-affected'],
  ['lib/constants/productPresentation.ts', 'deferred'],
  ['components/network/NetworkStatusBanner.tsx', 'deferred'],
  ['components/demand/DemandStatusBadge.tsx', 'not-affected'],
  ['components/ui/snackbar.tsx', 'not-affected'],
  ['components/products/ProductDetailPageClient.tsx', 'not-affected'],
  ['app/page.tsx', 'not-affected'],
  ['app/perfil/demandas/page.tsx', 'not-affected'],
  ['components/profile/BusinessHoursEditor.tsx', 'not-affected'],
]
const WHY = {
  'app/buscar/page.tsx': 'CTA card ya fixed por buscar-a11y (text-foreground/80) — es la referencia visual del tratamiento',
  'app/(auth)/register/page.tsx': 'botón/campos text-foreground sobre bg-primary/5 — sin texto muted',
  'components/products/CategoryGrid.tsx': 'estado de selección (border + text-foreground)',
  'components/products/ImageUpload.tsx': 'highlight de selección, sin texto muted',
  'components/demand/OfferProductModal.tsx': 'ring de selección, sin texto muted',
  'lib/constants/productPresentation.ts': 'metaLabel 4.62:1 pasa; constante compartida con ProductCard (blanco, 4.73:1) — endurecer oscurecería superficies fuera de scope. Seguimiento en PLAN ops notes',
  'components/network/NetworkStatusBanner.tsx': 'amber text-amber-950 ≈13:1 pasa; componente global distinto — candidato limpieza propia',
  'components/demand/DemandStatusBadge.tsx': 'badge amber-800/amber-100 ≈6:1 con dark variants',
  'components/ui/snackbar.tsx': 'variantes amber con dark: pareadas ≈10:1',
  'components/products/ProductDetailPageClient.tsx': 'specs card bg-muted/30 con texto foreground (metaLabel = caso deferred)',
  'app/page.tsx': 'secciones bg-muted/30 con contenido foreground',
  'app/perfil/demandas/page.tsx': 'tab strip bg-muted/30 con texto foreground',
  'components/profile/BusinessHoursEditor.tsx': 'chip día cerrado bg-muted/30 sin texto muted',
}

const MOCKUPS = [
  ['mockup-owner-notice', 'F-1 · OwnerListingNotice (página completa del dueño)'],
  ['mockup-usermenu', 'F-3 · UserMenu dropdown abierto'],
  ['mockup-drawer', 'F-2 · Drawer móvil (banner logged-out)'],
  ['mockup-draft', 'F-4 · Banners borrador (demand wizard)'],
  ['mockup-offline', 'F-5 · Banner offline neutralizado (busco)'],
]

let html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>comparison — tinted-card-contrast-sweep</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #fafafa; color: #18181b; }
  header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #e4e4e7; padding: 12px 20px; z-index: 10; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  header p { margin: 0; font-size: 12px; color: #52525b; }
  main { padding: 20px; max-width: 1400px; margin: 0 auto; }
  section.pair { background: #fff; border: 1px solid #e4e4e7; border-radius: 10px; padding: 16px; margin-bottom: 24px; }
  section.pair h2 { font-size: 14px; margin: 0 0 4px; }
  section.pair .note { font-size: 12px; color: #52525b; margin: 0 0 12px; }
  .sides { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .side h3 { font-size: 12px; margin: 0 0 6px; color: #52525b; text-transform: uppercase; letter-spacing: .04em; }
  .side img { width: 100%; border: 1px solid #e4e4e7; border-radius: 6px; display: block; }
  table { border-collapse: collapse; width: 100%; font-size: 12.5px; background: #fff; }
  th, td { border: 1px solid #e4e4e7; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f4f4f5; }
  code { background: #f4f4f5; padding: 1px 4px; border-radius: 4px; font-size: 11.5px; }
  details { margin-bottom: 12px; }
  summary { cursor: pointer; font-weight: 600; font-size: 13px; }
  iframe { width: 100%; height: 520px; border: 1px solid #e4e4e7; border-radius: 6px; background: #fff; }
  .transparency { background: #fefce8; border: 1px solid #eab30840; border-radius: 8px; padding: 10px 14px; font-size: 12.5px; }
</style>
</head>
<body>
<header>
  <h1>tinted-card-contrast-sweep — antes / después</h1>
  <p>7 pares · F-1..F-5 · fix uniforme text-foreground/80 (17.8–19.3:1 verificado) + banner neutro bg-muted/40 · 2026-09-17</p>
</header>
<main>
`

for (const [title, before, after, note] of PAIRS) {
  html += `<section class="pair">
  <h2>${title}</h2>
  ${note ? `<p class="note">${note}</p>` : ''}
  <div class="sides">
    <div class="side"><h3>Antes (current/)</h3><img src="${img(before)}" alt="${before}"></div>
    <div class="side"><h3>Después (proposal/)</h3><img src="${img(after)}" alt="${after}"></div>
  </div>
</section>\n`
}

html += `<section>
  <h2 style="font-size:15px">G3c — cobertura de findings</h2>
  <table><tr><th> Finding </th><th> Disposición </th><th> Dónde </th></tr>
`
for (const [f, d, w] of G3C) html += `  <tr><td> ${f} </td><td> ${d} </td><td> ${w} </td></tr>\n`
html += `  </table>
</section>

<section>
  <h2 style="font-size:15px">G3d — consistencia del patrón cross-page</h2>
  <table><tr><th> Instancia </th><th> Disposición </th><th> Razón </th></tr>
`
for (const [p, d] of G3D) html += `  <tr><td><code>${p}</code></td><td> ${d} </td><td> ${WHY[p] ?? ''} </td></tr>\n`
html += `  </table>
</section>

<section>
  <h2 style="font-size:15px">Propuesta completa (invariant: contenido embebido)</h2>
`
for (const [name, label] of MOCKUPS) {
  const doc = readFileSync(`${R}proposal/${name}.html`, 'utf8')
  html += `  <details open><summary>${label} — proposal/${name}.html</summary>
  <iframe srcdoc="${esc(doc)}" title="${name}"></iframe></details>\n`
}

html += `  <div class="transparency"><strong>Notas de transparencia:</strong>
  (1) P6 banner muted/30 y P7 banner offline son <em>demos inyectados</em> (marcados <code>data-demo-injected</code> en el mockup) — estados condicionales no reproducibles en vivo sin falla de red/borrador restaurado; markup = copia exacta del componente real con las clases propuestas. (2) Imágenes de producto en mocks dependen del dev server local activo. (3) El "después" de cada par es render del HTML de propuesta a viewport idéntico (fullPage, dsf=2), no screenshot de Stitch.
  </div>
</section>
</main>
</body>
</html>
`

writeFileSync(`${R}comparison.html`, html)
console.log('comparison.html written:', (html.length / 1e6).toFixed(1), 'MB')
