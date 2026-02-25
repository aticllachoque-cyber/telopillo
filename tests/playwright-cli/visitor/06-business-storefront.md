# Visitor Flow 06: Business Storefront

## Description

Verifies that an unauthenticated visitor can view a business storefront page at `/negocio/{slug}`, including business header, info sidebar, and product grid.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- At least one business profile with a slug in the database. **Seed one with:**  
  `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/seed-business-storefront.sql`  
  (uses the first existing user with a profile, e.g. seller1@test.com; adds business profile and ensures they have products.)  
  This creates slug **`tienda-electronica-la-paz`** → test URL: `http://localhost:3000/negocio/tienda-electronica-la-paz`
- No authentication required

## Test Steps

### 1. Navigate to business storefront

```
playwright-cli goto http://localhost:3000/negocio/tienda-electronica-la-paz
playwright-cli snapshot
```

**Expected:** Business storefront page loads (slug: `tienda-electronica-la-paz`).

### 2. Verify BusinessHeader

```
playwright-cli assert [business-name] --visible
```

**Expected:** Business name, logo (if set), and description displayed in header card.

### 3. Verify BusinessInfoSidebar

```
playwright-cli snapshot
```

**Expected:** Sidebar shows contact info (phone, WhatsApp, address if set), business hours, website, social links (Facebook, Instagram, TikTok) where configured.

### 4. Verify product grid

```
playwright-cli assert [productos-heading] --visible
```

**Expected:** "Productos" section with product count. Product grid displays business's active products.

### 5. Click a product

```
playwright-cli click [product-card-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/productos/[id]`. Product detail page loads.

### 6. Verify share/contact options

```
playwright-cli goto http://localhost:3000/negocio/tienda-electronica-la-paz
playwright-cli snapshot
```

**Expected:** WhatsApp, phone, or other contact CTAs visible in sidebar. Share options if implemented.

## Verification Checklist

- [ ] BusinessHeader shows business name, logo, description
- [ ] BusinessInfoSidebar shows contact info, category
- [ ] Product grid displays business products
- [ ] Clicking a product navigates to product detail
- [ ] Share/contact options visible
