# Visitor Flow 05: Seller Profile

## Description

Verifies that an unauthenticated visitor can view a seller's profile page, see their product listings, and navigate to product details.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- At least one product in database (to obtain seller ID from product detail)
- No authentication required

## Test Steps

### 1. Obtain seller ID from product detail

```
playwright-cli navigate http://localhost:3000/buscar
playwright-cli snapshot
playwright-cli click [first-product-link]
playwright-cli snapshot
playwright-cli click [seller-link]
playwright-cli snapshot
```

**Expected:** From product detail, clicking seller name navigates to `/vendedor/[id]`. Note the seller ID from the URL for reuse.

### 2. Navigate directly to seller profile (alternative)

```
playwright-cli navigate http://localhost:3000/vendedor/{id}
playwright-cli snapshot
```

**Expected:** Replace `{id}` with a valid seller UUID. Seller profile page loads.

### 3. Verify SellerProfileHeader

```
playwright-cli assert [seller-name] --visible
playwright-cli assert [seller-avatar] --visible
```

**Expected:** Seller name, avatar, verification badge, location (if set), and product count displayed.

### 4. Verify seller's product grid

```
playwright-cli snapshot
```

**Expected:** Product grid shows seller's active products. Section heading "Productos de [name]".

### 5. Click a product

```
playwright-cli click [product-card-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/productos/[id]`. Product detail page loads.

### 6. Navigate back to seller profile

```
playwright-cli navigate http://localhost:3000/vendedor/{id}
playwright-cli snapshot
```

**Expected:** Seller profile still displays correctly. Product grid intact.

### 7. Verify share/contact options

```
playwright-cli snapshot
```

**Expected:** If business profile exists, link to storefront. Contact options visible where applicable.

## Verification Checklist

- [ ] SellerProfileHeader shows name, avatar, verification
- [ ] Seller's product grid displays
- [ ] Clicking a product navigates to product detail
- [ ] Back navigation preserves seller profile state
- [ ] Share/contact options visible when available
