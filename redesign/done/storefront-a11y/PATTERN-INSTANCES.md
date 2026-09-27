# PATTERN-INSTANCES — storefront-a11y

> Stage 2 cross-page inventory. Pattern: badge de estado con texto de color sobre fondo tintado del mismo matiz (`text-{green,red}-600` sobre `bg-{green,red}-50`, 12px) + banner con paleta cruda fuera de tokens.

- instance: components/business/BusinessInfoSidebar.tsx:95 (badge "Abierto" green-600/green-50, condicional por día) disposition: in-scope
- instance: components/business/BusinessInfoSidebar.tsx:103 (badge "Cerrado" red-600/red-50, 4.36:1 axe serious) disposition: in-scope
- instance: components/ui/VerificationBadge.tsx:84 (green-700 sobre green-50 ≈4.7:1, pasa) disposition: not-affected
- instance: components/demand/DemandStatusBadge.tsx:20 (amber-800 sobre amber-100, contraste OK) disposition: not-affected
- instance: components/network/NetworkStatusBanner.tsx:14 (amber-950, texto muy oscuro, OK) disposition: not-affected
- instance: app/busco/page.tsx:411 (banner amber-900 sobre amber-50, contraste OK; drift de tokens → item tinted-card-contrast-sweep) disposition: not-affected
- instance: components/home/ResilientHomePreview.tsx:116 (banner amber-900, contraste OK; drift → sweep) disposition: not-affected
- instance: components/products/ImageUpload.tsx:445 (banner amber-900, OK; drift → sweep) disposition: not-affected
- instance: components/shared/SingleImageUpload.tsx:216 (banner amber-900, OK; drift → sweep) disposition: not-affected
- instance: components/ui/snackbar.tsx:48,55 (variantes warning amber; contraste OK) disposition: not-affected
- instance: tests/m4.5-mobile.spec.ts:6 + tests/m4.5-accessibility.spec.ts:7 + tests/m4.5-account-types-e2e.spec.ts:6 (mismo slug stale de TEST_DATA) disposition: deferred (fuera de suite a11y; fix de helpers/index.ts deja const local de cada spec sin cambios — decisión en Checkpoint)
