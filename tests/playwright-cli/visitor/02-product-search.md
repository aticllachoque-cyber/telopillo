# Visitor Flow 02: Product Search

## Description

Verifies that an unauthenticated visitor can search products, apply filters (category, condition, department, price range), sort results, paginate, and handle empty states.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Database seeded with products (for non-empty results)
- No authentication required

## Test Steps

### 1. Navigate to search page

```
playwright-cli navigate http://localhost:3000/buscar
playwright-cli snapshot
```

**Expected:** SearchBar, SearchFilters (sidebar on desktop, collapsible on mobile), and SearchSort components render. Page title "Buscar Productos".

### 2. Type query and submit

```
playwright-cli fill [search-input] "celular"
playwright-cli click [search-submit]
playwright-cli snapshot
```

**Expected:** URL updates with `?q=celular`. Results load (or empty state if no matches).

### 3. Test category filter

```
playwright-cli click [filter-category]
playwright-cli click [category-option]
playwright-cli snapshot
```

**Expected:** URL includes `category=` param. Results update to match selected category.

### 4. Test condition filter

```
playwright-cli click [filter-condition]
playwright-cli click [condition-option]
playwright-cli snapshot
```

**Expected:** URL includes `condition=` (e.g. `new` or `used`). Results update.

### 5. Test department filter

```
playwright-cli click [filter-department]
playwright-cli click [department-option]
playwright-cli snapshot
```

**Expected:** URL includes `department=` (e.g. La Paz, Santa Cruz). Results update.

### 6. Test price range filters

```
playwright-cli fill [price-min] "100"
playwright-cli fill [price-max] "5000"
playwright-cli click [apply-price-button]
playwright-cli snapshot
```

**Expected:** URL includes `priceMin=100` and `priceMax=5000`. Results filtered by price range.

### 7. Test sort options

```
playwright-cli click [sort-select]
playwright-cli click [sort-option-newest]
playwright-cli snapshot
```

**Expected:** Results reorder. Test each: relevance, newest (Más recientes), price_asc (Precio: menor a mayor), price_desc (Precio: mayor a menor).

### 8. Test "Limpiar filtros" button

```
playwright-cli snapshot
playwright-cli click [limpiar-filtros]
playwright-cli snapshot
```

**Expected:** When filters are active, "Limpiar" button clears all filters. URL resets. Results show all products (or empty state).

### 9. Test pagination (if results > 1 page)

```
playwright-cli click [siguiente-button]
playwright-cli snapshot
playwright-cli click [anterior-button]
playwright-cli snapshot
```

**Expected:** "Siguiente" navigates to next page. "Anterior" returns to previous page. Page indicator updates (e.g. "Página 2 de 3").

### 10. Test empty results state

```
playwright-cli fill [search-input] "xyznonexistent123"
playwright-cli click [search-submit]
playwright-cli snapshot
```

**Expected:** "No se encontraron resultados" message. "Limpiar filtros y búsqueda" link. "Publicar lo que busco" CTA to `/busco/publicar`.

### 11. Test search with Bolivian terms

```
playwright-cli fill [search-input] "chompa"
playwright-cli click [search-submit]
playwright-cli snapshot
```

**Expected:** Results include sweaters/hoodies (chompa = sudadera). Semantic search understands Bolivian Spanish.

```
playwright-cli fill [search-input] "celular"
playwright-cli click [search-submit]
playwright-cli snapshot
```

**Expected:** Results include phones/mobile devices.

## Verification Checklist

- [ ] SearchBar, SearchFilters, SearchSort render on /buscar
- [ ] Search query updates URL with ?q=
- [ ] Category filter updates results
- [ ] Condition filter (new/used) works
- [ ] Department filter works
- [ ] Price range (priceMin, priceMax) works
- [ ] Sort options: relevance, newest, price_asc, price_desc
- [ ] "Limpiar" button clears filters when active
- [ ] Pagination works when results span multiple pages
- [ ] Empty results state displays correctly
- [ ] Bolivian terms "chompa" and "celular" return relevant results
