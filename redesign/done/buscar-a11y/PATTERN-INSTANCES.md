# Pattern instances — buscar-a11y

Sibling implementations of the same UI pattern: "CTA/notice card — `rounded-lg border-primary/20 bg-primary/5` con texto descriptivo dentro". Los 2 hallazgos axe viven en 2 instancias de este patrón dentro de `app/buscar/page.tsx`. Hermanos con el mismo combo en otras páginas usan `text-foreground/80` (no `text-muted-foreground`) y no violan contraste.

```
```

- instance: app/buscar/page.tsx:354 (empty-state CTA card, violación axe) disposition: in-scope
- instance: app/buscar/page.tsx:402 (results-bottom CTA card, violación axe) disposition: in-scope
- instance: components/products/ProductFormWizard.tsx:526 (tips card, usa text-foreground/80) disposition: not-affected
- instance: components/demand/DemandPostForm.tsx:827 (checklist card, usa text-foreground/80) disposition: not-affected
- instance: app/(auth)/register/page.tsx:254 (business-optional card, texto foreground) disposition: not-affected
- instance: components/layout/MobileNavigationDrawer.tsx:120 (banner card) disposition: not-affected
- instance: components/layout/UserMenu.tsx:97 (notice card) disposition: not-affected
