// Stage 4 evidence: real WCAG contrast at each finding site.
// Live elements return computed colors in lab()/oklab()/oklch() — parsed and
// converted Node-side; conditional banners are measured via probe elements
// injected into the live page so the real stylesheet resolves the classes.
import { chromium } from '@playwright/test'

const BASE = 'http://localhost:3000'
const OWNER_PRODUCT = `${BASE}/productos/b3bed804-7a25-40af-bc27-28e3746930b1`

// --- color parsing to sRGB (handles Chromium computed-value formats) --------
const gam = (c) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const nums = (s) => (s.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number)

function oklabToRgb(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const [l, m, s] = [l_, m_, s_].map((v) => v ** 3)
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((c) => Math.round(clamp01(gam(clamp01(c))) * 255))
}

function labToRgb(L, a, b) {
  // CIELAB, D50 white
  const Xn = 0.9642956764295677
  const Zn = 0.8251046025104602
  const eps = 216 / 24389
  const kap = 24389 / 27
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  const inv = (f) => (f ** 3 > eps ? f ** 3 : (116 * f - 16) / kap)
  const y = L > kap * eps ? fy ** 3 : L / kap
  const xyz = [inv(fx) * Xn, y, inv(fz) * Zn] // XYZ D50
  // Bradford D50 -> D65 then D65 -> linear sRGB
  const r = 3.1338561 * xyz[0] - 1.6168667 * xyz[1] - 0.4906146 * xyz[2]
  const g = -0.9787684 * xyz[0] + 1.9161415 * xyz[1] + 0.033454 * xyz[2]
  const bl = 0.0719453 * xyz[0] - 0.2289914 * xyz[1] + 1.4052427 * xyz[2]
  return [r, g, bl].map((c) => Math.round(clamp01(gam(clamp01(c))) * 255))
}

function parseColor(str) {
  if (!str || str === 'none' || /transparent/.test(str)) return null
  let m
  if ((m = str.match(/^rgba?\(/))) {
    const v = nums(str)
    return { rgb: v.slice(0, 3), a: v[3] ?? 1 }
  }
  if ((m = str.match(/^oklab\(/))) {
    const v = nums(str)
    return { rgb: oklabToRgb(v[0], v[1], v[2]), a: v[3] ?? 1 }
  }
  if ((m = str.match(/^oklch\(/))) {
    const v = nums(str)
    let [L, C, H] = [v[0] > 1 ? v[0] / 100 : v[0], v[1], v[2]]
    const rad = (H * Math.PI) / 180
    return { rgb: oklabToRgb(L, C * Math.cos(rad), C * Math.sin(rad)), a: v[3] ?? 1 }
  }
  if ((m = str.match(/^lab\(/))) {
    const v = nums(str)
    return { rgb: labToRgb(v[0], v[1], v[2]), a: v[3] ?? 1 }
  }
  if ((m = str.match(/^lch\(/))) {
    const v = nums(str)
    const rad = (v[2] * Math.PI) / 180
    const a = v[1] * Math.cos(rad)
    const b = v[1] * Math.sin(rad)
    return { rgb: labToRgb(v[0], a, b), a: v[3] ?? 1 }
  }
  if ((m = str.match(/^hsl\(/))) {
    const [h, s, l, al] = nums(str)
    const S = s / 100
    const L = l / 100
    const c = (1 - Math.abs(2 * L - 1)) * S
    const hp = h / 60
    const x = c * (1 - Math.abs((hp % 2) - 1))
    const rgb =
      hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x]
    const mm = L - c / 2
    return { rgb: rgb.map((v) => Math.round((v + mm) * 255)), a: al ?? 1 }
  }
  if (str.startsWith('#')) {
    const h = str.slice(1)
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), a: 1 }
  }
  return null
}

const over = (top, bottom) =>
  top.rgb.map((c, i) => Math.round(c * top.a + bottom[i] * (1 - top.a)))
const srgbL = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const luminance = (rgb) => 0.2126 * srgbL(rgb[0]) + 0.7152 * srgbL(rgb[1]) + 0.0722 * srgbL(rgb[2])
const ratio = (fg, bg) => {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// --- live helpers -------------------------------------------------------------
const grabSelector = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const cs = getComputedStyle(el)
    const chain = []
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const v = getComputedStyle(n).backgroundColor
      if (v && v !== 'rgba(0, 0, 0, 0)') chain.push(v)
      const p = parseAlpha(v)
      if (p) break
      function parseAlpha(c) {
        if (!c) return false
        const m = c.match(/\/\s*([\d.]+)\s*\)|,\s*([\d.]+)\s*\)/)
        const alpha = m ? +(m[1] ?? m[2]) : /^rgb/.test(c) ? 1 : null
        return alpha === 1
      }
    }
    return { color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, chain }
  }, sel)

const probe = (page, classes) =>
  page.evaluate((cls) => {
    const d = document.createElement('div')
    d.className = cls
    d.style.display = 'none'
    document.body.appendChild(d)
    const cs = getComputedStyle(d)
    const out = { color: cs.color, bg: cs.backgroundColor }
    d.remove()
    return out
  }, classes)

const out = []
const emit = (name, r, fallbackBg) => {
  if (!r) return out.push(`${name}: NOT FOUND`)
  const fg = parseColor(r.color)
  let eff = fallbackBg
  for (const raw of (r.chain || []).slice().reverse()) {
    const c = parseColor(raw)
    if (!c) continue
    eff = c.a >= 1 ? c.rgb : over(c, eff)
  }
  out.push(
    `${name}: ${r.color} on rgb(${eff}) @ ${r.fontSize}/${r.fontWeight} = ${ratio(fg.rgb, eff).toFixed(2)}:1`,
  )
}

const browser = await chromium.launch()

// A: live sites (logged-in)
const authCtx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  storageState: 'tests/.auth/logged-in.json',
})
const p1 = await authCtx.newPage()
await p1.goto(OWNER_PRODUCT, { waitUntil: 'load' })
await p1.waitForSelector('text=Este es tu producto', { timeout: 20_000 })
emit('F-1 OwnerListingNotice p1', await grabSelector(p1, 'div.space-y-2 > p.text-muted-foreground'), [255, 255, 255])

await p1.goto(BASE, { waitUntil: 'load' })
await p1.waitForSelector('button[aria-label="Menú de usuario"]', { timeout: 20_000 })
await p1.click('button[aria-label="Menú de usuario"]')
await p1.waitForSelector('#user-menu-publicaciones-label', { timeout: 10_000 })
emit('F-3 UserMenu label Publicaciones', await grabSelector(p1, '#user-menu-publicaciones-label'), [255, 255, 255])
emit('F-3 UserMenu label Cuenta', await grabSelector(p1, '#user-menu-cuenta-label'), [255, 255, 255])

// page background token probe (for conditional-banner math)
const pageBg = parseColor((await probe(p1, 'bg-background')).bg)?.rgb ?? [255, 255, 255]
await authCtx.close()

// B: drawer banner (logged-out)
const anonCtx = await browser.newContext({ viewport: { width: 375, height: 812 } })
const p2 = await anonCtx.newPage()
await p2.goto(BASE, { waitUntil: 'load' })
await p2.waitForSelector('button[aria-label="Abrir menú"]', { timeout: 20_000 })
await p2.click('button[aria-label="Abrir menú"]')
await p2.waitForSelector('text=Creá tu cuenta gratis', { timeout: 10_000 })
emit('F-2 drawer banner muted p', await grabSelector(p2, 'div.bg-primary\\/5 > p.text-muted-foreground'), [255, 255, 255])

// C: probes for conditional banners (no live instance without draft state)
const probePage = p2
const tokens = {}
for (const [k, cls] of Object.entries({
  mutedFg: 'text-muted-foreground',
  fg80: 'text-foreground/80',
  fg90: 'text-foreground/90',
  primary5: 'bg-primary/5',
  muted30: 'bg-muted/30',
  muted40: 'bg-muted/40',
  amberA10: 'bg-amber-500/10',
  amber50: 'bg-amber-50',
  amber900: 'text-amber-900',
})) {
  const r = await probe(probePage, cls)
  tokens[k] = {
    fg: parseColor(r.color),
    bg: parseColor(r.bg),
  }
}
await anonCtx.close()
await browser.close()

const comp = (t) => (t.bg.a >= 1 ? t.bg.rgb : over(t.bg, pageBg))
const pair = (name, fgT, bgRgb) =>
  out.push(`${name}: = ${ratio(fgT.fg.rgb, bgRgb).toFixed(2)}:1`)

out.push(`[page bg] rgb(${pageBg})`)
out.push(
  `[tokens] muted-fg rgb(${tokens.mutedFg.fg.rgb}) fg/80 rgb(${tokens.fg80.fg.rgb}) fg/90 rgb(${tokens.fg90.fg.rgb}) primary/5 rgb(${comp(tokens.primary5)}) muted/30 rgb(${comp(tokens.muted30)}) muted/40 rgb(${comp(tokens.muted40)}) amber-500/10 rgb(${comp(tokens.amberA10)})`,
)
pair('F-4 muted on muted/30', tokens.mutedFg, comp(tokens.muted30))
pair('F-4 muted on amber-500/10', tokens.mutedFg, comp(tokens.amberA10))
pair('F-5 amber-900 on amber-50', tokens.amber900, tokens.amber50.bg.rgb)
pair('[fix-ref] fg/80 on primary/5', tokens.fg80, comp(tokens.primary5))
pair('[fix-ref] fg/80 on muted/30', tokens.fg80, comp(tokens.muted30))
pair('[fix-ref] fg/80 on amber-500/10', tokens.fg80, comp(tokens.amberA10))
pair('[fix-ref] fg/80 on muted/40', tokens.fg80, comp(tokens.muted40))
pair('[fix-ref] fg/90 on primary/5', tokens.fg90, comp(tokens.primary5))

console.log(out.join('\n'))
