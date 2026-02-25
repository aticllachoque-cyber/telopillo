# Cross-Cutting Flow 22: Mobile Responsive Layout

## Description

Verifies that key pages adapt correctly across mobile, tablet, and desktop viewports. Uses `playwright-cli resize` to test different screen sizes.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Database seeded with products and demand posts (for non-empty search/detail pages)
- For authenticated form tests: saved auth state (`state-load --name=logged-in`)
- Valid product ID and demand ID for detail page tests

## Viewports

| Name    | Size      | Device example |
|---------|-----------|-----------------|
| Mobile  | 375x812   | iPhone          |
| Mobile  | 390x844   | iPhone 14       |
| Tablet  | 768x1024  | iPad            |
| Desktop | 1280x720  | Standard        |
| Desktop | 1440x900  | Large           |

## Test Steps

### Test A: Home Page Responsive

#### 1. Mobile viewport (375x812)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Hero section adapts (text wraps, search full-width). Category grid adapts (fewer columns on mobile). No horizontal overflow.

#### 2. Screenshot for comparison

```
playwright-cli screenshot --filename=home-mobile.png
```

**Expected:** Screenshot saved for visual comparison.

#### 3. Tablet viewport (768x1024)

```
playwright-cli resize 768 1024
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Tablet layout. Category grid shows more columns. Hero section adapts.

#### 4. Desktop viewport (1280x720)

```
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Desktop layout. Full horizontal nav. Category grid in full layout.

---

### Test B: Product Search Responsive

#### 1. Mobile viewport (375x812)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000/buscar?q=celular
playwright-cli snapshot
```

**Expected:** Filters collapse or are hidden behind a toggle on mobile. Product cards stack vertically (1 column). Search bar adapts.

#### 2. Tablet viewport (768x1024)

```
playwright-cli resize 768 1024
playwright-cli navigate http://localhost:3000/buscar?q=celular
playwright-cli snapshot
```

**Expected:** 2-column product grid. Filters may be visible or in toggle.

#### 3. Desktop viewport (1280x720)

```
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000/buscar?q=celular
playwright-cli snapshot
```

**Expected:** 3+ column grid. Filters sidebar visible by default.

---

### Test C: Product Detail Responsive

Replace `{id}` with a valid product UUID.

#### 1. Mobile viewport (375x812)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000/productos/{id}
playwright-cli snapshot
```

**Expected:** Gallery takes full width. Seller card and actions stack below gallery. Text is readable. No horizontal overflow.

#### 2. Desktop viewport (1280x720)

```
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000/productos/{id}
playwright-cli snapshot
```

**Expected:** Side-by-side layout (gallery + seller info). No overflow.

---

### Test D: Demand Browse Responsive

#### 1. Mobile viewport (375x812)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
```

**Expected:** Mobile filter toggle ("Filtros" button with `aria-controls="demand-filters-mobile"`). Demand cards stack properly.

#### 2. Click "Filtros" to expand filters

```
playwright-cli click [filtros-button]
playwright-cli snapshot
```

**Expected:** Filters expand. Category, department, sort controls visible.

#### 3. Desktop viewport (1280x720)

```
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
```

**Expected:** Filters sidebar visible by default. No toggle needed.

---

### Test E: Forms Responsive

#### 1. Register form (mobile)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000/register
playwright-cli snapshot
```

**Expected:** Form fields are full-width. Buttons are tappable size (min 44x44).

#### 2. Login form (mobile)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000/login
playwright-cli snapshot
```

**Expected:** Same checks: full-width fields, tappable buttons.

#### 3. Demand form (mobile, authenticated)

```
playwright-cli state-load --name=logged-in
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000/busco/publicar
playwright-cli snapshot
```

**Expected:** Form fields adapt. Buttons tappable. No overflow.

---

### Test F: Header and Navigation Responsive

(Complements 20-navigation.md. Quick verification.)

#### 1. Mobile (375px)

```
playwright-cli resize 375 812
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Hamburger menu visible. Desktop nav hidden.

#### 2. Tablet (768px)

```
playwright-cli resize 768 1024
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** May show partial nav or hamburger depending on breakpoints.

#### 3. Desktop (1280px)

```
playwright-cli resize 1280 720
playwright-cli navigate http://localhost:3000
playwright-cli snapshot
```

**Expected:** Full horizontal nav. No hamburger.

## Verification Checklist

- [ ] Home: hero and category grid adapt at 375px, 768px, 1280px
- [ ] Home: no horizontal overflow on mobile
- [ ] Product search: filters collapse/toggle on mobile (375px)
- [ ] Product search: 1 column mobile, 2 column tablet, 3+ column desktop
- [ ] Product detail: gallery full-width on mobile, side-by-side on desktop
- [ ] Product detail: text readable, no overflow
- [ ] Demand browse: "Filtros" button with aria-controls="demand-filters-mobile" on mobile
- [ ] Demand browse: filters expand on click
- [ ] Demand browse: filters visible by default on desktop
- [ ] Register/login forms: full-width fields, tappable buttons (min 44x44) on mobile
- [ ] Demand form: adapts on mobile when authenticated
- [ ] Header: hamburger on mobile (375px), full nav on desktop (1280px)
