# Stitch brief — buscar-a11y

> Stage 5 output. Diseño de la página `/buscar` de Telopillo (marketplace boliviano), enfocado en cerrar las violaciones de accesibilidad que bloquean el gate G6, sin romper la consistencia con el resto de la app.

## Screen description

Página de búsqueda de productos. Layout desktop: header con search bar full-width arriba; debajo, sidebar izquierdo (256px, sticky) con tarjeta de filtros (categoría, condición, departamento, rango de precio, orden) y columna derecha con: contador de resultados ("N resultados para X" / "Mostrando N de M"), grid de product cards, y CTA inferior de demanda. Mobile 375px: filtros colapsados en tarjeta "Filtros — Mostrar", cards apiladas en una columna.

## Component inventory (archivos reales)

- `app/buscar/page.tsx` — página completa (client component, markup inline): header + SearchBar, sidebar filtros (SearchFilters en Card), estados (loading skeleton, error, sin query, resultados, empty), CTA cards de demanda, banner de caché offline
- `components/search/SearchBar.tsx`, `components/search/SearchFilters.tsx`, `components/products/ProductGrid.tsx`/`ProductCard.tsx` — hijos renderizados, **fuera de alcance** (no rediseñar su look)

## Findings to address (de AUDIT.md)

- **F-1 (P1)** card CTA de resultados: `text-muted-foreground` (#737373) sobre `bg-primary/5` → 4.27:1, axe serious. Necesita ≥4.5:1.
- **F-2 (P1)** card CTA del empty state: mismo patrón, 4.27:1, axe serious. Necesita ≥4.5:1.
- **F-3 (P2)** banner de caché offline con paleta amber hardcodeada → mover a tokens semánticos del tema.
- **F-4 (P2)** empty state con dos CTA de demanda apilados casi idénticos → consolidar en una sola jerarquía clara (una card CTA primaria).
- **F-5 (P2)** texto descriptivo sobre `bg-muted/50` al límite (4.6:1) → mismo endurecimiento de contraste que F-1/F-2.

## Brand tokens (app/globals.css, oklch — NO inventar valores)

- `--background: oklch(1 0 0)` (blanco), `--foreground: oklch(0.145 0 0)`
- `--primary: oklch(0.205 0 0)` (casi negro), `--muted: oklch(0.97 0 0)`, `--secondary/--accent: oklch(0.97 0 0)`
- `--border: oklch(0.922 0 0)`, `--ring: oklch(0.708 0 0)`, radius vía `--radius` (shadcn)
- Tema monocromático (croma 0). Copy en español (Bolivia). Precios "Bs 1.234"

## Constraints

- Tailwind CSS v4 + shadcn/ui; tokens de `app/globals.css` únicamente (tema claro; dark mode usa el mismo par de tokens, el fix debe funcionar en ambos)
- Solo se toca `app/buscar/page.tsx` (más `redesign/`); no cambiar rutas ni estructura de datos; estados y flujos existentes se preservan (loading/error/cache/offline)
- El fix de contraste NO puede ser "agregar sombra/fondo blanco": debe resolver ratio real ≥4.5:1 con tokens (ej. `text-foreground` o un muted más oscuro sobre las cards tintadas)
- Mantener look consistente con las cards hermanas (`ProductFormWizard.tsx:526`, `DemandPostForm.tsx:827` usan `border-primary/20 bg-primary/5` + `text-foreground/80`) — **match the existing sibling look — do not invent a divergent pattern**
- Touch targets ≥44px en mobile; español boliviano en todo el copy

## Feedback Checkpoint 3 (loops)

- **Loop 1 (2026-09-15):** mock Stitch rechazado — "no hay consistencia con el tema de la app actual". Regeneración: mockup fiel sobre DOM real, parche mínimo. Restricción nueva: NO diverger del look actual en nada fuera de las zonas problema.
- **Loop 2 (2026-09-15):** usuario pide doblar mejoras acordadas en la misma propuesta: (a) remover "Mostrando N de M" redundante con el conteo principal; (b) omitir "No hay más productos." cuando totalCount < PAGE_SIZE; (c) banner offline con acción Reintentar funcional (mock ya la muestra; en Stage 8 cablear a performSearch). Verificar contraste del fix en tema OSCURO también durante Stage 8.
