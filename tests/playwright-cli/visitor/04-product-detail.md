# Visitor Flow 04: Product Detail

## Description

Verifies that an unauthenticated visitor can view a product detail page, interact with the gallery, see seller info, use contact/WhatsApp actions, and share the product.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Database seeded with at least one active product
- No authentication required

## Test Steps

### 1. Navigate to search and find a product

```
playwright-cli navigate http://localhost:3000/buscar
playwright-cli snapshot
```

**Expected:** Search page loads. If products exist, product grid is visible.

### 2. Click a product card

```
playwright-cli click [first-product-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/productos/[id]`. Product detail page loads.

### 3. Verify product content

```
playwright-cli assert [product-title] --visible
playwright-cli assert [product-price] --text "Bs"
```

**Expected:** Product title, description, and price (Bs. format, e.g. "Bs 1.234") are displayed.

### 4. Verify ProductGallery

```
playwright-cli snapshot
```

**Expected:** Main image visible. If multiple images, thumbnails displayed below or beside main image.

### 5. Click gallery thumbnails (if multiple images)

```
playwright-cli click [thumbnail-2]
playwright-cli snapshot
```

**Expected:** Main image changes to selected thumbnail.

### 6. Verify SellerCard

```
playwright-cli assert [seller-name] --visible
```

**Expected:** Seller name, avatar, and verification level displayed. Contact/WhatsApp button visible.

### 7. Click seller name

```
playwright-cli click [seller-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/vendedor/[id]`. Seller profile page loads.

### 8. Return to product and verify ProductActions

```
playwright-cli navigate http://localhost:3000/productos/[id]
playwright-cli snapshot
```

**Expected:** Contact button and WhatsApp link (if seller has phone) are present. ProductActions area visible.

### 9. Verify ShareButton

```
playwright-cli click [share-button]
playwright-cli snapshot
```

**Expected:** Share dialog opens or URL is copied to clipboard (browser may prompt for clipboard permission).

### 10. Verify breadcrumbs / back navigation

```
playwright-cli assert [breadcrumb-inicio] --text "Inicio"
playwright-cli click [volver-link]
playwright-cli snapshot
```

**Expected:** Breadcrumbs show: Inicio / Category / Product title. "Volver" link navigates back.

### 11. Check related products (if present)

```
playwright-cli snapshot
```

**Expected:** If related products section exists, it displays other products from same seller or category.

## Verification Checklist

- [ ] Product title, description, price (Bs. format) displayed
- [ ] ProductGallery shows main image and thumbnails
- [ ] Clicking thumbnails changes main image
- [ ] SellerCard shows seller name, avatar, verification
- [ ] Clicking seller name navigates to /vendedor/[id]
- [ ] ProductActions: contact button, WhatsApp link
- [ ] ShareButton works (copies URL or opens share dialog)
- [ ] Breadcrumbs and back navigation present
- [ ] Related products section (if implemented) displays correctly
