# Visitor Flow 03: Category Browsing

## Description

Verifies that an unauthenticated visitor can browse the full categories page and navigate to filtered search results by category.

## Prerequisites

- Playwright CLI installed and available in PATH
- Dev server running at `http://localhost:3000`
- Database seeded with products in various categories
- No authentication required

## Test Steps

### 1. Navigate to categories page

```
playwright-cli navigate http://localhost:3000/categorias
playwright-cli snapshot
```

**Expected:** Categories page loads. All category cards/links displayed in a grid. Page title "Categorías".

### 2. Verify category cards

```
playwright-cli assert [categories-heading] --text "Categorías"
```

**Expected:** Each category card shows icon, label, and description. Categories include: Electrónica, Vehículos, Hogar, Moda, Deportes, Construcción, Bebé, Juguetes, etc.

### 3. Click first category

```
playwright-cli click [first-category-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/buscar?category={categoryId}`. Search page shows filtered results for that category.

### 4. Navigate back to categories

```
playwright-cli navigate http://localhost:3000/categorias
playwright-cli snapshot
```

**Expected:** Returns to categories page. All categories visible.

### 5. Click different category

```
playwright-cli click [second-category-link]
playwright-cli snapshot
```

**Expected:** Navigates to `/buscar?category={differentCategoryId}`. Results differ from step 3. Filtered by the new category.

## Verification Checklist

- [ ] /categorias page loads with all category cards
- [ ] Each category has icon, label, and description
- [ ] Clicking a category navigates to /buscar?category={category}
- [ ] Search page shows filtered results for selected category
- [ ] Different categories produce different filtered results
