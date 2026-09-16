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

async function serialize({ twoColumn }) {
  return await page.evaluate(async ({ twoColumn, patches }) => {
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

    if (twoColumn) {
      // F-4: step-2 blocks side by side on sm+ — patch the two direct child
      // wrappers (subcategoría field + descripción field) into a 2-col grid;
      // heading block spans full width.
      const textarea = body.querySelector('#description')
      if (textarea) {
        const step2 = textarea.closest('[class*="space-y-6"]')
        const blocks = step2
          ? [...step2.children].filter((c) => /(^|\s)space-y-2(\s|$)/.test(c.getAttribute('class') || ''))
          : []
        if (step2 && blocks.length >= 2) {
          step2.style.display = 'grid'
          step2.style.gap = '1.5rem'
          step2.children[0].style.gridColumn = '1 / -1' // heading spans full width
          const media = document.createElement('style')
          media.textContent = '[data-mock-two-col]{grid-template-columns:minmax(0,1fr)}@media (min-width:640px){[data-mock-two-col]{grid-template-columns:minmax(0,0.8fr) minmax(0,1.2fr)}}'
          clone.querySelector('head').appendChild(media)
          step2.setAttribute('data-mock-two-col', '')
        }
      }
    } else {
      // F-5: paso 4 — replace advice card with data-driven verification checklist
      const lis = [...body.querySelectorAll('li')]
      if (lis.some((li) => li.textContent.includes('Describe bien qué buscas'))) {
        const card = lis.find((li) => li.textContent.includes('Describe bien qué buscas')).closest('.border-primary\\/20')
        if (card) {
          card.innerHTML = `
            <p class="font-medium">Verificación de tu solicitud:</p>
            <ul class="mt-2 space-y-1">
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" style="font-size:10px">✓</span> Título y categoría completos</li>
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" style="font-size:10px">✓</span> Descripción presente</li>
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground" style="font-size:10px">✓</span> Ubicación: Santa Cruz de la Sierra, Santa Cruz</li>
              <li class="flex items-center gap-2"><span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-muted-foreground" style="font-size:10px">–</span> Presupuesto: Bs. 3.000 – Bs. 5.500</li>
            </ul>`
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
  }, { twoColumn, patches: TEXT_PATCHES })
}

const paso2 = await serialize({ twoColumn: true })
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

const paso4 = await serialize({ twoColumn: false })
writeFileSync(DIR + 'mockup-paso4.html', paso4)

await ctx.close()
await browser.close()
console.log('mockups written:', ['mockup-paso2.html', 'mockup-paso4.html'].join(', '))
