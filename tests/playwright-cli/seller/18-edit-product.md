# Seller Flow 18: Edit an Existing Product

## Description

Verifies that a logged-in seller can edit an existing product via the ProductFormWizard in edit mode at `/productos/[id]/editar`. Covers navigation to edit, updating information, price/condition, and photos.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests
- User must have at least one product (create one via `/publicar` if needed)

## Test Steps

### Test A: Navigate to Edit

#### 1. Load auth state and navigate to my products

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

**Expected:** ProductGrid with user's products. Each card has actions menu (three-dot or similar).

#### 2. Open actions menu and click Edit

```
playwright-cli click [product-actions-menu-trigger]
playwright-cli click [menuitem-Editar]
playwright-cli snapshot
```

**Expected:** Navigate to `/productos/[id]/editar`. ProductFormWizard loads in edit mode. All 4 steps pre-filled with current product data. Stepper shows steps 1–4. "Guardar Cambios" button on Step 4 instead of "Publicar Producto".

---

### Test B: Edit Product Information

#### 1. Navigate to edit page (from Test A or direct URL)

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli click [product-actions-menu-trigger]
playwright-cli click [menuitem-Editar]
playwright-cli snapshot
```

#### 2. Navigate to Step 2 (Information) and change title/description

```
playwright-cli click [step-2]
playwright-cli snapshot
playwright-cli fill [title] "Samsung Galaxy S21 Ultra - UPDATED"
playwright-cli fill [description] "Celular en excelente estado, 128GB, color negro. Actualizado con más detalles. Incluye cargador y funda."
playwright-cli snapshot
```

**Expected:** Title and description updated in form.

#### 3. Navigate to Step 4 (Review) and save

```
playwright-cli click [step-4]
playwright-cli snapshot
```

**Expected:** Preview shows updated title and description.

```
playwright-cli click [button-Guardar Cambios]
playwright-cli snapshot
```

**Expected:** Redirect to `/productos/[id]`. Success toast "¡Producto actualizado exitosamente!" Updated title and description displayed on product detail page.

---

### Test C: Edit Price and Condition

#### 1. Navigate to edit page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli click [product-actions-menu-trigger]
playwright-cli click [menuitem-Editar]
playwright-cli snapshot
```

#### 2. Go to Step 3 (Details)

```
playwright-cli click [step-3]
playwright-cli snapshot
```

#### 3. Change price and condition

```
playwright-cli fill [price] "3200"
playwright-cli click [condition-used_like_new]
playwright-cli click [button-Siguiente]
playwright-cli click [button-Guardar Cambios]
playwright-cli snapshot
```

**Expected:** Redirect to product detail. Price shows Bs 3.200. Condition shows "Usado - Como nuevo".

---

### Test D: Add/Remove Photos

#### 1. Navigate to edit page

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli click [product-actions-menu-trigger]
playwright-cli click [menuitem-Editar]
playwright-cli snapshot
```

#### 2. Step 1 (Photos): Verify existing photos, remove one if multiple

```
playwright-cli snapshot
```

**Expected:** Existing product images displayed. ImageUpload allows remove (X or trash icon) and add more (up to 5 total).

```
playwright-cli click [remove-photo-button]
playwright-cli snapshot
```

**Expected:** One photo removed. Thumbnail count decreases.

#### 3. Upload a new photo

```
playwright-cli click [image-upload-trigger]
playwright-cli upload [file-input] tests/fixtures/product-test.jpg
playwright-cli snapshot
```

**Expected:** New image thumbnail appears.

#### 4. Save changes

```
playwright-cli click [step-4]
playwright-cli click [button-Guardar Cambios]
playwright-cli snapshot
```

**Expected:** Redirect to product detail. Updated gallery shows new/removed photos correctly.

---

## Verification Checklist

- [ ] Edit page loads at `/productos/[id]/editar` when logged in as owner
- [ ] ProductFormWizard in edit mode pre-fills all 4 steps with current data
- [ ] Step 2: Title and description edits save correctly
- [ ] Step 3: Price and condition edits save correctly
- [ ] Step 1: Photos can be removed and added
- [ ] "Guardar Cambios" redirects to product detail with success toast
- [ ] Updated data displays correctly on product detail page
- [ ] Non-owner or unauthenticated access redirects or returns 403
