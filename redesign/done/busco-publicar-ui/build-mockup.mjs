// Stage 6 fallback mockups for busco-publicar-ui (stitch:fallback precedent
// buscar loop 1 / storefront / publicar-a11y): hydrated real DOM of
// /busco/publicar with minimal inline patches for F-1..F-5. Two states:
// paso 2 (F-1 copy + F-2 heading + F-4 two-column) and paso 4 (F-1 + F-5
// checklist). Scripts + nextjs-portal stripped; built CSS inlined.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'fs'

const BASE = 'http://localhost:3000'
const DIR = new URL('./proposal/', import.meta.url).pathname
mkdirSync(DIR, { recursive: true })

// F-1/F-2: voseo unification + heading/label fix (exact DOM strings)
const TEXT_PATCHES = [
  ['Explica rápido qué estás buscando y agrega una imagen opcional para orientar mejor a los vendedores.',
   'Explicá rápido qué estás buscando y agregá una imagen opcional para orientar mejor a los vendedores.'],
  ['Si no ves una categoría perfecta, elige la más cercana y acláralo en la',
   'Si no ves una categoría perfecta, elegí la más cercana y aclaralo en la'],
  ['Describe lo que Necesitas', 'Descripción de lo que buscás'],
  ['Describe lo que necesitas', 'Detalles de la solicitud'],
  ['Menciona estado, marca, modelo, urgencia o cualquier detalle importante.',
   'Mencioná estado, marca, modelo, urgencia o cualquier detalle importante.'],
  ['Indica dónde estás y, si quieres, el rango que estás dispuesto a pagar.',
   'Indicá dónde estás y, si querés, el rango que estás dispuesto a pagar.'],
  ['Puedes dejarlo vacío si prefieres recibir propuestas primero.',
   'Podés dejarlo vacío si preferís recibir propuestas primero.'],
  ['Asegúrate de que la información sea clara antes de publicarla.',
   'Asegurate de que la información sea clara antes de publicarla.'],
  ['Selecciona departamento', 'Seleccioná departamento'],
  ['Selecciona ciudad', 'Seleccioná ciudad'],
  ['Primero selecciona un departamento', 'Primero seleccioná un departamento'],
  ['Agrega más detalles para que los vendedores entiendan mejor tu búsqueda.',
   'Agregá más detalles para que los vendedores entiendan mejor tu búsqueda.'],
  ['Completa tu ubicación', 'Completá tu ubicación'],
]

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2,
  storageState: 'tests/.auth/logged-in.json',
})
const page = await ctx.newPage()

await page.goto(BASE + '/busco/publicar', { waitUntil: 'load' })
await page.evaluate(() => { try { Object.keys(localStorage).filter(k => k.startsWith('draft:')).forEach(k => localStorage.removeItem(k)) } catch {} })
await page.reload({ waitUntil: 'load' })
await page.waitForSelector('text=Referencia de la Solicitud', { timeout: 30_000 })
await page.waitForTimeout(1200)

// walk to paso 2
await page.locator('#title').fill('Busco iPhone 13 en buen estado')
await page.locator('[role="radio"]').first().click()
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(700)
await page.locator('#description').fill('Busco iPhone 13 de 128GB, batería sobre 85 por ciento, con caja y accesorios originales.')

// capture real subcategory options (for the F-4 chips mock)
await page.locator('button[role="combobox"]').first().click()
await page.waitForTimeout(500)
const subcats = await page.getByRole('option').allInnerTexts()
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

async function serialize({ chips, subcats: subs = [] }) {
  return await page.evaluate(async ({ chips, subcats, patches }) => {
    const clone = document.documentElement.cloneNode(true)

    // strip scripts + nextjs-portal
    clone.querySelectorAll('script, nextjs-portal').forEach((el) => el.remove())

    // inline built stylesheets (file:// render would otherwise be unstyled)
    for (const link of [...clone.querySelectorAll('link[rel="stylesheet"]')]) {
      try {
        const css = await (await fetch(link.href)).text()
        const style = document.createElement('style')
        style.textContent = css
        link.replaceWith(style)
      } catch { link.remove() }
    }

    const body = clone.querySelector('body')

    // F-1/F-2 text patches (voseo + heading) via TreeWalker
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
      for (const [from, to] of patches) {
        if (node.textContent.includes(from)) node.textContent = node.textContent.replaceAll(from, to)
      }
    }

    if (chips) {
      // F-4 (iteración 1): subcategoría como grupo de chips seleccionables —
      // misma familia visual que CategoryGrid (radio-cards) del paso 1.
      // Sin dropdown: el Select se reemplaza por flex-wrap de chips.
      const textarea = body.querySelector('#description')
      if (textarea) {
        const step2 = textarea.closest('[class*="space-y-6"]')
        const blocks = step2
          ? [...step2.children].filter((c) => /(^|\s)space-y-2(\s|$)/.test(c.getAttribute('class') || ''))
          : []
        if (step2 && blocks.length >= 2) {
          const label = blocks[0].querySelector('label')
          const chipsHtml = subcats
            .map((s, i) =>
              i === 0
                ? `<button type="button" class="inline-flex items-center rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">${s}</button>`
                : `<button type="button" class="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-muted/50">${s}</button>`,
            )
            .join('\n')
          blocks[0].innerHTML = `${label ? label.outerHTML : ''}<div class="flex flex-wrap gap-2" style="padding-top:.5rem">${chipsHtml}</div>`
          // densify: taller textarea so the paso fills the desktop viewport better
          const ta = body.querySelector('#description')
          if (ta) ta.style.minHeight = '14rem'
        }
      }
    } else {
      // F-5 (iteración 2): paso 4 reestructurado —
      //  (a) sin sidebar flaca: grid lg 2-col → stack en una columna
      //  (b) Resumen como fila de 3 stats (Ubicación | Presupuesto | Imagen)
      //  (c) checklist de verificación merged en la misma card (border-t)
      const lis = [...body.querySelectorAll('li')]
      const adviceLi = lis.find((li) => li.textContent.includes('Describe bien qué buscas'))
      if (adviceLi) {
        const adviceCard = adviceLi.closest('[class~="border-primary/20"]')
        if (adviceCard) {
          adviceCard.innerHTML = `
            <p class="font-medium">Verificación de tu solicitud:</p>
            <ul class="mt-2 space-y-1">
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" style="font-size:10px">✓</span> Título y categoría completos</li>
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" style="font-size:10px">✓</span> Descripción presente</li>
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" style="font-size:10px">✓</span> Ubicación: Santa Cruz de la Sierra, Santa Cruz</li>
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground" style="font-size:10px">–</span> Presupuesto: Bs. 3.000 – Bs. 5.500</li>
            </ul>`
        }

        const resumenH4 = [...body.querySelectorAll('h4')].find((h) => h.textContent.trim() === 'Resumen')
        if (resumenH4) {
          const resumenCard = resumenH4.closest('.rounded-lg')

          // (c) merge checklist card into Resumen card, separated by border-t
          if (adviceCard) {
            const merged = document.createElement('div')
            merged.setAttribute('style', 'margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border, #e5e5e5)')
            merged.innerHTML = adviceCard.innerHTML
            resumenCard.appendChild(merged)
            adviceCard.remove()
          }

          // (b) Resumen stats as a 3-across row on sm+ (1 col mobile)
          const stats = resumenCard.querySelector('.mt-4')
          if (stats) {
            stats.setAttribute('data-mock-stats', '')
            stats.style.gap = '1rem'
          }

          // (a) kill the skinny sidebar: 2-col lg grid → single column stack
          const layout = resumenCard.closest('[class*="lg:grid-cols"]')
          if (layout) layout.style.gridTemplateColumns = 'minmax(0,1fr)'

          const media = document.createElement('style')
          media.textContent = '[data-mock-stats]{display:grid}@media (min-width:640px){[data-mock-stats]{grid-template-columns:repeat(3,1fr)}}'
          clone.querySelector('head').appendChild(media)
        }
      }
    }

    // F-3: draft autosave banner removed (element only exists after autosave;
    // mock asserts the target state = absent)
    for (const div of body.querySelectorAll('div')) {
      if (div.children.length === 0 && div.textContent.trim() === 'Borrador guardado localmente.') {
        div.closest('.rounded-lg')?.remove()
      }
    }

    return '<!doctype html>\n' + clone.outerHTML
  }, { chips, subcats, patches: TEXT_PATCHES })
}

const paso2 = await serialize({ chips: true, subcats })
writeFileSync(DIR + 'mockup-paso2.html', paso2)

// walk to paso 4
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(700)
await page.locator('button[role="combobox"]').first().click()
await page.waitForTimeout(400)
await page.getByRole('option').first().click()
await page.waitForTimeout(400)
await page.locator('button[role="combobox"]').nth(1).click()
await page.waitForTimeout(400)
await page.getByRole('option').first().click()
await page.waitForTimeout(300)
await page.locator('#price_min').fill('3000')
await page.locator('#price_max').fill('5500')
await page.getByRole('button', { name: /Siguiente/i }).click()
await page.waitForTimeout(1000)

const paso4 = await serialize({ chips: false })
writeFileSync(DIR + 'mockup-paso4.html', paso4)

await ctx.close()
await browser.close()
console.log('mockups written:', ['mockup-paso2.html', 'mockup-paso4.html'].join(', '))
