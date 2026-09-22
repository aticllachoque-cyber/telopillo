// Build comparison.html for home-publish-cta — 3 before/after pairs + crops + G3c/G3d tables
import { readFileSync, writeFileSync } from 'fs'

const DIR = new URL('./', import.meta.url).pathname
const b64 = (p) => `data:image/png;base64,${readFileSync(DIR + p).toString('base64')}`

const pairs = [
  { name: 'Desktop 1920×1080', before: 'current/desktop.png', after: 'proposal/render-desktop.png' },
  { name: 'Tablet 768×1024', before: 'current/tablet.png', after: 'proposal/render-tablet.png' },
  { name: 'Mobile 375×812', before: 'current/mobile.png', after: 'proposal/render-mobile.png' },
]

const crops = [
  { name: 'Móvil — header (Publicá visible entre lupa y Entrar)', img: 'proposal/crop-mobile-header.png' },
  { name: 'Móvil — hero (botón primario Publicá gratis + link vendedor)', img: 'proposal/crop-mobile-hero.png' },
  { name: 'Móvil — strip final (Publicá gratis primario, Crear cuenta outline)', img: 'proposal/crop-mobile-ctastrip.png' },
]

const g3c = [
  ['F-1', 'addressed', 'Header móvil/tablet: botón primario compacto "Publicá" (icono+texto, 44px) insertado entre lupa y Entrar — visible <1024px. Evidencia: crop-mobile-header.png; render-tablet/mobile.png'],
  ['F-2', 'addressed', 'Contenido landing: hero gana botón primario "Publicá gratis" (/crear) bajo el buscador + strip final gana "Publicá gratis" primario. Evidencia: crop-mobile-hero.png, crop-mobile-ctastrip.png'],
  ['F-3', 'addressed', 'Link vendedor re-wording "¿Vendés? Mirá qué buscan los compradores" (sigue a /busco, browse) y publicación ahora es acción distinta y visible al lado — cero ambigüedad'],
  ['F-4', 'addressed', 'CtaStrip: "Publicá gratis" botón primario primero, "Crear cuenta gratis" degradado a outline, link login intacto'],
  ['F-5', 'addressed', 'Vocabulario unificado a voseo "Publicá gratis" en los 4 CTAs (header móvil+desktop, hero, strip; drawer label se cambia en impl — portal fuera del DOM estático). Tests header-monkey actualizados en Stage 8'],
]

const g3d = [
  ['components/layout/Header.tsx', 'addressed', 'botón móvil + label voseo desktop'],
  ['components/layout/MobileNavigationDrawer.tsx', 'addressed', 'label "Publicar Gratis"→"Publicá gratis" en impl (F-5)'],
  ['components/home/CtaStrip.tsx', 'addressed', 'publish primario + register outline'],
  ['app/page.tsx', 'addressed', 'hero action row'],
  ['app/crear/page.tsx', 'not-affected', 'chooser destino, vocabulario local queda'],
  ['app/buscar/page.tsx', 'not-affected', 'CTA cards empty-state ya existen (referencia voseo)'],
  ['app/busco/page.tsx', 'not-affected', 'botones Publicar solicitud ya existen'],
  ['app/profile/page.tsx', 'not-affected', 'superficie auth'],
  ['app/perfil/mis-productos/page.tsx', 'not-affected', 'superficie auth'],
  ['app/perfil/demandas/page.tsx', 'not-affected', 'superficie auth'],
  ['components/onboarding/WelcomeScreen.tsx', 'not-affected', 'copy ya voseo "publicá gratis"'],
  ['components/layout/Footer.tsx', 'not-affected', 'sin link publicar por diseño (scope cerrado)'],
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
<h1>home-publish-cta — / (landing) — antes vs propuesta</h1>
<p>Feedback origen (2026-09-22): usuarios entran a la app pero no encuentran cómo publicar. Verificado en prod: mobile/tablet = 0 CTAs publicar visibles; desktop = solo header.</p>
<p>Propuesta = mockup fiel sobre DOM real hidratado de <code>/</code> (mismo tema oklch, mismas cards, mismos datos) + parches mínimos. Capturas antes/después idénticas: fullPage, dsf=2, anon, mismos viewports.</p>

<div class="note"><strong>Transparencia:</strong> Stitch MCP generó un diseño de referencia esta vez (proposal/stitch-screen.html + stitch-render-reference.png) pero con design system propio (Plus Jakarta Sans, hex #109353) — diverge del tema real; precedente buscar-a11y loop 1 = rechazo humano. Propuesta de registro = mockup fiel (precedente ×8). Defectos conocidos del mockup: (1) label drawer "Publicá gratis" cambia en impl (portal no está en DOM estático); (2) imágenes servidas por dev server absoluto; (3) SW/PWA no installado en captures (igual ambos lados).</div>

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

<h2>Qué cambia exactamente (impl)</h2>
<ul>
<li><strong>Header móvil/tablet (&lt;1024px)</strong>: botón primario compacto megáfono + "Publicá" (sm+ muestra "Publicá gratis") → /crear, entre lupa y Entrar. Logo flex-1 absorbe el ancho.</li>
<li><strong>Header desktop</strong>: label "Publicar Gratis" → "Publicá gratis".</li>
<li><strong>Hero</strong>: fila bajo el buscador = botón primario "Publicá gratis" (/crear) + link muted "¿Vendés? Mirá qué buscan los compradores" (/busco). Stack en móvil, fila en sm+.</li>
<li><strong>CtaStrip (anon)</strong>: "Publicá gratis" primario primero, "Crear cuenta gratis" outline, login link intacto.</li>
<li><strong>Drawer</strong>: label unificado "Publicá gratis".</li>
<li><strong>Tests</strong>: header-monkey.spec.ts actualiza selector/texto "Publicá gratis" (2 tests).</li>
</ul>
</div>
</body>
</html>
`

writeFileSync(DIR + 'comparison.html', html)
console.log('comparison.html written,', (html.length / 1024 / 1024).toFixed(1), 'MB')
