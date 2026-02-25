# Visitor Flow 07: Browse Demand Posts

## Description

Verifies that an unauthenticated visitor can browse demand posts ("Busco/Necesito"), search, filter by category and department, sort, and navigate to demand details.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Database seeded with demand posts (for non-empty results)
- No authentication required

## Test Steps

### 1. Navigate to demands page

```
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
```

**Expected:** Page loads. Search input with `aria-label="Buscar solicitudes"`. DemandPostFilters visible.

### 2. Verify search input

```
playwright-cli fill [search-input] "celular"
playwright-cli press [search-input] Enter
playwright-cli snapshot
```

**Expected:** URL updates with `?q=celular`. Results refresh.

### 3. Test category filter

```
playwright-cli click [filter-category]
playwright-cli click [category-option]
playwright-cli snapshot
```

**Expected:** URL includes `category=` param. DemandPostFilters category select (id="filter-category") updates results.

### 4. Test department filter

```
playwright-cli click [filter-department]
playwright-cli click [department-option]
playwright-cli snapshot
```

**Expected:** URL includes `department=` param. DemandPostFilters department select (id="filter-department") updates results.

### 5. Test sort options

```
playwright-cli click [filter-sort]
playwright-cli click [sort-option]
playwright-cli snapshot
```

**Expected:** Sort options: "Más recientes" (newest), "Más ofertas" (most_offers), "Por vencer" (expiring_soon). URL includes `sort=` param.

### 6. Verify DemandPostCard grid

```
playwright-cli snapshot
```

**Expected:** DemandPostCard components render in a grid. Each card shows title, category, location, offers count, expiration.

### 7. Click a demand card

```
playwright-cli click [demand-card-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/busco/[id]`. Demand post detail page loads.

### 8. Test pagination (if available)

```
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
playwright-cli click [siguiente-button]
playwright-cli snapshot
```

**Expected:** When totalCount > PAGE_SIZE (12), pagination buttons appear. "Siguiente" loads next page.

### 9. Verify "Publicar solicitud" link

```
playwright-cli navigate http://localhost:3000/busco
playwright-cli snapshot
playwright-cli click [publicar-solicitud-link]
playwright-cli snapshot
```

**Expected:** Link navigates to `/busco/publicar`. Unauthenticated users are redirected to login.

### 10. Test empty state message

```
playwright-cli fill [search-input] "xyznonexistent123"
playwright-cli press [search-input] Enter
playwright-cli snapshot
```

**Expected:** If no demands match: "No hay solicitudes aún" or similar. CTA to "Publicar solicitud".

### 11. On mobile: test collapsible Filtros button

```
playwright-cli set-viewport 375 667
playwright-cli snapshot
playwright-cli click [filtros-button]
playwright-cli snapshot
```

**Expected:** Button has `aria-controls="demand-filters-mobile"`. Clicking expands filter panel. Filters (category, department, sort) become visible.

## Verification Checklist

- [ ] Search input with aria-label="Buscar solicitudes" works
- [ ] DemandPostFilters: category, department, sort
- [ ] Search query updates URL with ?q=
- [ ] filter-category, filter-department, filter-sort work
- [ ] Sort: "Más recientes", "Más ofertas", "Por vencer"
- [ ] DemandPostCard grid renders
- [ ] Clicking a card navigates to /busco/[id]
- [ ] Pagination works when demands > 12
- [ ] "Publicar solicitud" link goes to /busco/publicar
- [ ] Empty state message displays
- [ ] Mobile: collapsible "Filtros" button (aria-controls="demand-filters-mobile") works
