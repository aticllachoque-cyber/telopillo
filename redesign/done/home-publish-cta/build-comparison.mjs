// Build comparison.html for home-publish-cta — ITERATION 1 (Checkpoint 4 feedback: FAB bottom)
// Pairs: ANTES = impl v1 as-executed (after/) | PROPUESTA = mockup iter.1 (FAB bottom, header móvil sin botón)
import { readFileSync, writeFileSync } from 'fs'

const DIR = new URL('./', import.meta.url).pathname
const b64 = (p) => `data:image/png;base64,${readFileSync(DIR + p).toString('base64')}`

const pairs = [
  { name: 'Desktop 1920×1080', before: 'after/desktop.png', after: 'proposal/render-desktop.png' },
  { name: 'Tablet 768×1024', before: 'after/tablet.png', after: 'proposal/render-tablet.png' },
  { name: 'Mobile 375×812', before: 'after/mobile.png', after: 'proposal/render-mobile.png' },
]

const crops = [
  { name: 'Móvil — FAB sticky bottom (top de página)', img: 'proposal/crop-mobile-fab.png' },
  { name: 'Móvil — FAB persiste sobre contenido (mid-scroll)', img: 'proposal/crop-mobile-fab-scrolled.png' },
  { name: 'Móvil — header decluttered iter.1 (lupa + Entrar, sin Publicá)', img: 'proposal/crop-mobile-header-v2.png' },
  { name: 'Móvil iter.0 — header con Publicá (impl v1, para comparar)', img: 'proposal/crop-mobile-header.png' },
  { name: 'Móvil — hero (botón primario Publicá gratis + link vendedor, ya en impl v1)', img: 'proposal/crop-mobile-hero.png' },
  { name: 'Móvil — strip final (Publicá gratis primario, ya en impl v1)', img: 'proposal/crop-mobile-ctastrip.png' },
]

const g3c = [
  ['F-1', 'addressed', 'ITER.1: FAB sticky bottom "Publicá gratis" (pill 48px, token primary, safe-area inset) visible siempre <1024px + botón header móvil REMOVIDO (declutter 5→4 controles). Desktop conserva header. Evidencia: crop-mobile-fab.png, crop-mobile-fab-scrolled.png, crop-mobile-header-v2.png'],
  ['F-2', 'addressed', 'Contenido landing: hero gana botón primario "Publicá gratis" (/crear) bajo el buscador + strip final gana "Publicá gratis" primario (impl v1, sin cambios iter.1). Evidencia: crop-mobile-hero.png, crop-mobile-ctastrip.png'],
  ['F-3', 'addressed', 'Link vendedor re-wording "¿Vendés? Mirá qué buscan los compradores" (sigue a /busco, browse) y publicación ahora es acción distinta y visible al lado — cero ambigüedad (impl v1, sin cambios iter.1)'],
  ['F-4', 'addressed', 'CtaStrip: "Publicá gratis" botón primario primero, "Crear cuenta gratis" degradado a outline, link login intacto (impl v1, sin cambios iter.1)'],
  ['F-5', 'addressed', 'Vocabulario unificado a voseo "Publicá gratis" en todos los CTAs — iter.1 mantiene (FAB usa mismo label). Tests header-monkey ya actualizados en impl v1; iter.1 ajusta asserts del botón header móvil removido'],
]

const g3d = [
  ['components/layout/Header.tsx', 'addressed', 'ITER.1: botón móvil removido; label voseo desktop queda'],
  ['components/layout/MobileNavigationDrawer.tsx', 'addressed', 'label "Publicá gratis" ya en impl v1'],
  ['components/home/CtaStrip.tsx', 'addressed', 'publish primario + register outline ya en impl v1'],
  ['app/page.tsx', 'addressed', 'hero action row ya en impl v1'],
  ['app/crear/page.tsx', 'not-affected', 'chooser destino, vocabulario local queda'],
  ['app/buscar/page.tsx', 'not-affected', 'CTA cards empty-state ya existen (referencia voseo)'],
  ['app/busco/page.tsx', 'not-affected', 'botones Publicar solicitud ya existen'],
  ['app/profile/page.tsx', 'not-affected', 'superficie auth'],
  ['app/perfil/mis-productos/page.tsx', 'not-affected', 'superficie auth'],
  ['app/perfil/demandas/page.tsx', 'not-affected', 'superficie auth'],
  ['components/onboarding/WelcomeScreen.tsx', 'not-affected', 'copy ya voseo "publicá gratis"'],
  ['components/layout/Footer.tsx', 'addressed', 'ITER.1: padding-bottom en impl para compensar FAB (no tapar links)'],
]

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>home-publish-cta — comparación antes/después</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f4f4f5; color: #18181b; }
  .wrap { max-width: 1400px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 1.4rem; } h2 { font-size: 1.15rem; margin-top: 40px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0 32px; }
  .pair figure { margin: 0; background: #fff; border: 1px solid #d4d4d8; border-radius: 8px; overflow: hidden; }
  .pair figcaption { padding: 8px 12px; font-size: .85rem; border-bottom: 1px solid #e4e4e7; }
  .pair img { display: block; width: 100%; height: auto; }
  .crops img { display: block; width: 375px; max-width: 100%; border: 1px solid #d4d4d8; border-radius: 8px; margin: 8px 0 24px; }
  table { border-collapse: collapse; width: 100%; background: #fff; font-size: .85rem; }
  th, td { border: 1px solid #d4d4d8; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #fafafa; }
  .addr { color: #166534; font-weight: 600; } .na { color: #52525b; }
  .note { background: #fefce8; border: 1px solid #eab308; border-radius: 8px; padding: 12px 16px; font-size: .85rem; }
  code { background: #f4f4f5; padding: 1px 5px; border-radius: 4px; font-size: .85em; }
</style>
</head>
<body>
<div class="wrap">
<h1>home-publish-cta — / (landing) — ITERACIÓN 1: impl v1 vs propuesta FAB bottom</h1>
<p>Feedback origen (2026-09-22): usuarios entran a la app pero no encuentran cómo publicar. Iteración 0 (impl v1, ya en branch) resolvió con botón header móvil. <strong>Feedback Checkpoint 4 (mismo día): evaluar botón sticky inferior en vez de header.</strong></p>
<p>ANTES = impl v1 as-executed (capturas after/). PROPUESTA iter.1 = mockup fiel sobre el MISMO DOM real (dev server sirve branch impl v1) + delta: D-1 remueve botón header móvil, D-2 inyecta FAB sticky bottom (pill "Publicá gratis", tokens primary vivos vía getComputedStyle, hidden ≥1024px). Capturas idénticas: fullPage, dsf=2, anon, mismos viewports.</p>

<div class="note"><strong>Transparencia iter.1:</strong> (1) FAB en fullPage renders aparece anclado al primer viewport (comportamiento Chromium con position:fixed) — crops viewport muestran comportamiento real top y mid-scroll; (2) valores del FAB leídos del botón primario real (bg lab/oklch primary) — cero valores inventados; (3) hero/strip/drawer sin cambios vs impl v1; (4) iter.0 Stitch sigue como reference-only (stitch-meta.json).</div>
<div class="note"><strong>Rationale FAB (evaluación):</strong> zona pulgar (Fitts), header declutter 5→4 controles en 375px, patrón Wallapop/Meli, auth-agnóstico. Header sticky ya persistía — ventaja real es ergonomía + espacio, no persistencia.</div>

<h2>Pares antes/después</h2>
${pairs
  .map(
    (p) => `<div class="pair">
  <figure><figcaption>ANTES — ${p.name}</figcaption><img src="${b64(p.before)}" alt="antes ${p.name}"></figure>
  <figure><figcaption>DESPUÉS (propuesta) — ${p.name}</figcaption><img src="${b64(p.after)}" alt="después ${p.name}"></figure>
</div>`,
  )
  .join('\n')}

<h2>Detalle móvil (crops legibles)</h2>
<div class="crops">
${crops.map((c) => `<p>${c.name}</p><img src="${b64(c.img)}" alt="${c.name}">`).join('\n')}
</div>

<h2>Cobertura de findings (G3c)</h2>
<table><tr><th>Finding</th><th>Disposición</th><th>Dónde</th></tr>
${g3c.map((r) => `<tr><td>${r[0]}</td><td class="${r[1] === 'addressed' ? 'addr' : 'na'}">${r[1]}</td><td>${r[2]}</td></tr>`).join('\n')}
</table>

<h2>Instancias hermanas (G3d)</h2>
<table><tr><th>Instancia</th><th>Disposición</th><th>Nota</th></tr>
${g3d.map((r) => `<tr><td><code>${r[0]}</code></td><td class="${r[1] === 'addressed' ? 'addr' : 'na'}">${r[1]}</td><td>${r[2]}</td></tr>`).join('\n')}
</table>

<h2>Qué cambia exactamente (impl iter.1 — delta sobre impl v1)</h2>
<ul>
<li><strong>NUEVO componente FAB</strong> (components/layout/PublishFab.tsx o inline en layout): pill fixed bottom-center "Publicá gratis" → /crear, <code>lg:hidden</code>, 48px, safe-area inset, z-40 (bajo drawer z-50), tokens primary.</li>
<li><strong>Header móvil</strong>: botón Publicá REMOVIDO (desktop nav intacto).</li>
<li><strong>Footer</strong>: padding-bottom compensatorio (FAB no tapa links).</li>
<li><strong>Tests</strong>: header-monkey mobile asserts ajustan (botón header móvil fuera; FAB add asserts).</li>
<li><strong>Sin cambios</strong>: hero, CtaStrip, drawer, desktop header.</li>
</ul>
</div>
</body>
</html>
`

writeFileSync(DIR + 'comparison.html', html)
console.log('comparison.html written,', (html.length / 1024 / 1024).toFixed(1), 'MB')
