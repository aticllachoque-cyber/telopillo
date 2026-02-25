# Seller Flow 17: Manage My Products

## Description

Verifies that a logged-in seller can view, filter, sort, pause, reactivate, and delete their products at `/perfil/mis-productos`.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Supabase local instance running
- User must be logged in: use `playwright-cli state-load --name=logged-in` before tests
- User must have at least one product (create one via `/publicar` if needed)

## Test Steps

### Test A: View My Products

#### 1. Load auth state and navigate to my products

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

**Expected:** ProductGrid displays user's products. Status filter pills: "Todos", "Activos", "Vendidos", "Inactivos". Sort dropdown (e.g., "Más recientes", "Más antiguos", "Precio: Mayor a menor", "Precio: Menor a mayor"). Product count. "Publicar Nuevo" button. "Volver al perfil" link.

---

### Test B: Filter by Status

#### 1. Navigate to my products

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

#### 2. Select "Activos" filter

```
playwright-cli click [filter-Activos]
playwright-cli snapshot
```

**Expected:** Only active products shown. Product count updates. Status badge "Activo" on cards.

#### 3. Select "Inactivos" filter

```
playwright-cli click [filter-Inactivos]
playwright-cli snapshot
```

**Expected:** Only inactive products shown. Status badge "Inactivo" on cards. Empty state if none: "No tienes productos inactivos."

#### 4. Select "Todos" filter

```
playwright-cli click [filter-Todos]
playwright-cli snapshot
```

**Expected:** All products (excluding deleted) shown.

---

### Test C: Pause a Product (Mark as Inactive)

#### 1. Navigate to my products, ensure "Activos" or "Todos" filter

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

#### 2. Open actions menu on an active product card

```
playwright-cli click [product-actions-menu-trigger]
playwright-cli snapshot
```

**Expected:** Dropdown opens with options: Editar, Compartir, Marcar como vendido, Marcar como inactivo, Eliminar.

#### 3. Click "Marcar como inactivo"

```
playwright-cli click [menuitem-Marcar como inactivo]
playwright-cli snapshot
```

**Expected:** Confirmation dialog: "¿Marcar como inactivo?" with "Cancelar" and "Marcar como inactivo" buttons.

#### 4. Confirm

```
playwright-cli click [dialog-confirm-Marcar como inactivo]
playwright-cli snapshot
```

**Expected:** Product status changes to inactive. Product may disappear from "Activos" view or show "Inactivo" badge.

#### 5. Filter by "Inactivos" and verify

```
playwright-cli click [filter-Inactivos]
playwright-cli snapshot
```

**Expected:** The paused product appears in the Inactivos list.

---

### Test D: Reactivate a Product

#### 1. Navigate to my products, filter by "Inactivos"

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli click [filter-Inactivos]
playwright-cli snapshot
```

**Expected:** At least one inactive product. ProductCard has actions menu.

#### 2. Open actions menu and reactivate

```
playwright-cli click [product-actions-menu-trigger]
playwright-cli snapshot
```

**Expected:** Dropdown opens. If "Reactivar" or "Marcar como activo" option exists, click it and confirm. If not, this test documents expected behavior—the app may need a reactivate action added.

**Note:** ProductActions currently shows Editar, Compartir, Eliminar for inactive products. "Marcar como activo" / "Reactivar" may need to be added to the UI. Skip this step if not implemented.

#### 3. Verify product is active

```
playwright-cli click [filter-Activos]
playwright-cli snapshot
```

**Expected:** If reactivate was performed, the product appears in Activos list.

---

### Test E: Delete a Product

#### 1. Navigate to my products

```
playwright-cli state-load --name=logged-in
playwright-cli navigate http://localhost:3000/perfil/mis-productos
playwright-cli snapshot
```

#### 2. Open actions menu and click Eliminar

```
playwright-cli click [product-actions-menu-trigger]
playwright-cli click [menuitem-Eliminar]
playwright-cli snapshot
```

**Expected:** Confirmation dialog: "¿Eliminar producto?" Description explains action cannot be undone. "Cancelar" and "Eliminar" buttons.

#### 3. Confirm deletion

```
playwright-cli click [dialog-confirm-Eliminar]
playwright-cli snapshot
```

**Expected:** Product removed from list. Product count updates. Success feedback if shown.

---

## Status Filter Reference

| Filter | Label | Shows |
|--------|-------|-------|
| all | Todos | All products except deleted |
| active | Activos | status = active |
| sold | Vendidos | status = sold |
| inactive | Inactivos | status = inactive |

---

## Verification Checklist

- [ ] My products page loads at `/perfil/mis-productos` when logged in
- [ ] ProductGrid displays user's products
- [ ] Status filter pills work (Todos, Activos, Vendidos, Inactivos)
- [ ] Sort options work (newest, oldest, price asc/desc)
- [ ] "Marcar como inactivo" changes product to inactive
- [ ] Inactive product appears in "Inactivos" filter
- [ ] Reactivate flow works (via edit or direct action if available)
- [ ] Delete opens confirmation dialog
- [ ] Confirming delete removes product from list
- [ ] Unauthenticated access redirects to login
