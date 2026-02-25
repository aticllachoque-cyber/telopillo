# Seller Flow 16: Create (Publish) a Product

## Description

Verifies that a logged-in seller can create a product via the ProductFormWizard at `/publicar`. The wizard has 4 steps: Photos, Information, Details, and Review.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests
- Test image file available (e.g., `tests/fixtures/product-test.jpg`)

## Test Steps

### Test A: Full Product Creation

#### 1. Load auth state and navigate to publish page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/publicar
playwright-cli snapshot
```

**Expected:** ProductFormWizard Step 1 (Photos) is active. "Fotos del Producto" heading. ImageUpload area. "Siguiente" and "Cancelar" buttons.

#### 2. Step 1 – Photos: Upload at least one image

```
playwright-cli click [image-upload-trigger]
playwright-cli upload [file-input] tests/fixtures/product-test.jpg
playwright-cli snapshot
```

**Expected:** Image thumbnail appears. No validation error. "Siguiente" enabled.

**Note:** If playwright-cli does not support file upload, use `run-code` with `setInputFiles` or document as manual step.

#### 3. Proceed to Step 2

```
playwright-cli click [button-Siguiente]
playwright-cli snapshot
```

**Expected:** Step 2 (Information) loads. Fields: title, description, CategoryGrid, subcategory select.

#### 4. Step 2 – Information: Fill title, description, category

```
playwright-cli fill [title] "Samsung Galaxy S21 Ultra"
playwright-cli fill [description] "Celular en excelente estado, 128GB, color negro. Incluye cargador y funda original. Sin rayones en pantalla."
playwright-cli click [category-electronics]
playwright-cli click [subcategory-trigger]
playwright-cli click [subcategory-option-Smartphones]
playwright-cli click [button-Siguiente]
playwright-cli snapshot
```

**Expected:** Category card "Electrónica" selected. Subcategory "Smartphones" selected if available. Proceeds to Step 3.

**Note:** Replace refs with actual snapshot refs. CategoryGrid uses clickable cards; category ID is `electronics`.

#### 5. Step 3 – Details: Fill price, condition, location

```
playwright-cli fill [price] "3500"
playwright-cli click [condition-used_good]
playwright-cli click [location_department-trigger]
playwright-cli click [location_department-option-La Paz]
playwright-cli fill [location_city] "La Paz"
playwright-cli click [button-Siguiente]
playwright-cli snapshot
```

**Expected:** Price 3500 BOB. Condition "Usado - Buen estado" (used_good) selected. Department "La Paz", city "La Paz". Proceeds to Step 4.

#### 6. Step 4 – Review: Verify preview and publish

```
playwright-cli snapshot
```

**Expected:** Preview card shows title, price, category, condition, location, description, images. "Publicar Producto" button.

```
playwright-cli click [button-Publicar Producto]
playwright-cli snapshot
```

**Expected:** Redirect to `/productos/[id]`. Product detail page shows all entered data correctly. Success toast "¡Producto publicado exitosamente!"

---

### Test B: Navigate Between Steps

#### 1. Start wizard, complete Step 1 and Step 2

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/publicar
playwright-cli upload [file-input] tests/fixtures/product-test.jpg
playwright-cli click [button-Siguiente]
playwright-cli fill [title] "Test Product Navigation"
playwright-cli fill [description] "This is a test product to verify step navigation and data preservation between steps."
playwright-cli click [category-electronics]
playwright-cli click [button-Siguiente]
playwright-cli snapshot
```

**Expected:** On Step 3.

#### 2. Click "Anterior" to go back to Step 2

```
playwright-cli click [button-Anterior]
playwright-cli snapshot
```

**Expected:** Back on Step 2. Title, description, category data preserved.

#### 3. Click "Siguiente" to return to Step 3

```
playwright-cli click [button-Siguiente]
playwright-cli snapshot
```

**Expected:** Step 3. Step 2 data still preserved. Can continue forward.

---

### Test C: Cancel Product Creation

#### 1. Start wizard and fill some data

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/publicar
playwright-cli upload [file-input] tests/fixtures/product-test.jpg
playwright-cli click [button-Siguiente]
playwright-cli fill [title] "Product to Cancel"
playwright-cli snapshot
```

#### 2. Click "Cancelar"

```
playwright-cli click [button-Cancelar]
playwright-cli snapshot
```

**Expected:** Navigation away from wizard (e.g., back to previous page or home). No product created.

---

## Wizard Steps Reference

| Step | Title | Key Fields |
|------|-------|-------------|
| 1 | Fotos | ImageUpload (1–5 images, required) |
| 2 | Información | title (10–100 chars), description (50–5000 chars), category, subcategory |
| 3 | Detalles | price (BOB), condition (new, used_*), location_department, location_city |
| 4 | Revisar | Preview card, "Publicar Producto" or "Guardar Cambios" |

---

## Verification Checklist

- [ ] ProductFormWizard loads at `/publicar` when logged in
- [ ] Step 1 (Photos) requires at least 1 image
- [ ] Step 2 fields: title, description, category, subcategory
- [ ] Step 3 fields: price, condition, location
- [ ] Step 4 shows correct preview
- [ ] Full flow publishes product and redirects to `/productos/[id]`
- [ ] "Anterior" preserves data when going back
- [ ] "Siguiente" preserves data when going forward
- [ ] "Cancelar" navigates away without creating product
- [ ] Unauthenticated access redirects to login
