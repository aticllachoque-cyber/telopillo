# Search & Discovery — E2E Test Plan

> **Plan ID:** E2E-SEARCH-001
> **Priority:** High
> **Prerequisite Plans:** None (public pages, but needs seeded products)
> **Target Files:**
> - `tests/e2e/search-discovery/keyword-search.spec.ts`
> - `tests/e2e/search-discovery/semantic-search.spec.ts`
> - `tests/e2e/search-discovery/filters-sort.spec.ts`
> - `tests/e2e/search-discovery/categories.spec.ts`
> - `tests/e2e/search-discovery/search-api.spec.ts`

---

## Complete Search Flow

```
Homepage Search Bar → Keyword Results → Apply Filters → Sort Results
→ Category Browse → Semantic Query → Cross-Language → Pagination
```

---

## Flow 1: Keyword Search

**User Story:** As a buyer, I want to search for products by keyword so I find exact matches.
**Preconditions:** Products seeded with known titles (e.g., "Samsung Galaxy S24", "iPhone 15 Pro").

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 1.1 | Navigate to homepage | `/` | `page.goto('/')` | Search bar visible in hero | — |
| 1.2 | Type "samsung" in search bar | `/` | `getByPlaceholder(/buscar/i)` or `getByRole('searchbox')` | Text entered | — |
| 1.3 | Submit search (Enter) | `/` | Press Enter | Redirect to `/buscar?q=samsung` | `search-01-results.png` |
| 1.4 | Verify results page | `/buscar?q=samsung` | Results count, product cards | Results with "Samsung" in title or description | — |
| 1.5 | Verify search input retains query | `/buscar?q=samsung` | Search input on results page | Input shows "samsung" | — |
| 1.6 | Search from results page | `/buscar` | Clear and type new query | New results for new query | — |

**Assertions:**
- [ ] URL contains `?q=samsung`
- [ ] Results contain products matching "samsung"
- [ ] Results count is displayed
- [ ] Product cards show title, price, image, category
- [ ] Header search bar also works (not just hero bar)

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E1 | Search for "xyznonexistent123" | Empty state: "No results" with suggestions |
| E2 | Empty search submission | Navigate to `/buscar` — show all products or empty state |
| E3 | Very long query (500+ chars) | Handled gracefully, no server error |
| E4 | Special characters: `<>&"'` | Sanitized in URL and display, no XSS |

---

## Flow 2: Semantic Search

**User Story:** As a buyer, I want to search by concept (not exact keywords) so I find relevant products using natural language.
**Preconditions:** `SEMANTIC_SEARCH_ENABLED=true`, products seeded, embeddings generated.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 2.1 | Search: "algo para llamar" (concept: phone) | `/buscar?q=algo para llamar` | Search bar | Results include phones/electronics | `search-02-semantic.png` |
| 2.2 | Search: "ropa de invierno" (winter clothes) | `/buscar?q=ropa de invierno` | Search bar | Results include jackets, sweaters | — |
| 2.3 | Cross-language: "cheap phone" (English) | `/buscar?q=cheap phone` | Search bar | Results include phones (Spanish products) | — |
| 2.4 | Verify search mode in API response | `/api/search?q=...` | API call | `searchMode: "hybrid"` in response | — |

**Assertions:**
- [ ] Concept queries return semantically relevant results
- [ ] Cross-language queries work (English → Spanish products)
- [ ] API response includes `searchMode`, `latencyMs` metadata
- [ ] Results are ranked by relevance (RRF fusion)

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E5 | Semantic search when embeddings unavailable | Falls back to keyword search gracefully |
| E6 | Very short query: "a" | Returns results or graceful handling |

---

## Flow 3: Filters and Sorting

**User Story:** As a buyer, I want to filter and sort results to narrow down my options.
**Preconditions:** Products seeded across multiple categories, prices, and conditions.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 3.1 | Navigate to search results | `/buscar?q=samsung` | `page.goto(...)` | Results visible | — |
| 3.2 | Open category filter | `/buscar` | Category dropdown/select | Options visible | — |
| 3.3 | Select "Electrónica" | `/buscar` | Category option | URL updates: `?category=electronics` | `search-03-filtered.png` |
| 3.4 | Verify filtered results | `/buscar` | Product cards | Only electronics products shown | — |
| 3.5 | Clear category filter | `/buscar` | "Clear" or "X" button | All results restored | — |
| 3.6 | Sort by "Precio: menor a mayor" | `/buscar` | Sort dropdown | Results ordered by price ascending | `search-04-sorted.png` |
| 3.7 | Sort by "Más recientes" | `/buscar` | Sort dropdown | Results ordered by date descending | — |
| 3.8 | Combine filter + sort | `/buscar` | Category + Sort | Filtered and sorted results | — |

**Assertions:**
- [ ] Filters update URL query parameters
- [ ] Filtered results match the selected filter
- [ ] Sort order is visually correct (verify first vs last card)
- [ ] Combining filters and sort works
- [ ] Results count updates after filtering
- [ ] Clear filter restores original results
- [ ] Filters persist across page reload (URL-based state)

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E7 | Filter to category with zero results | Empty state for that filter |
| E8 | Invalid filter in URL: `?category=fake` | Graceful handling (ignore or show all) |
| E9 | Multiple filters simultaneously | All filters applied correctly |

---

## Flow 4: Category Browsing

**User Story:** As a buyer, I want to browse products by category from the categories page.
**Preconditions:** Products seeded in at least 3 categories.

| Step | Action | Page/Route | Selector Strategy | Expected Result | Screenshot |
|------|--------|------------|-------------------|-----------------|------------|
| 4.1 | Navigate to categories | `/categorias` | `page.goto('/categorias')` | Category grid visible | `search-05-categories.png` |
| 4.2 | Verify all categories shown | `/categorias` | Category cards | At least 5 categories displayed | — |
| 4.3 | Click "Electrónica" category | `/categorias` | Category card/link | Redirect to `/buscar?category=electronics` | `search-06-cat-results.png` |
| 4.4 | Verify filtered results | `/buscar?category=electronics` | Product cards | Only electronics products | — |
| 4.5 | Navigate back to categories | `/buscar` | Breadcrumb or categories link | Categories page | — |
| 4.6 | Click "Vehículos" category | `/categorias` | Category card | Redirect to `/buscar?category=vehicles` | — |

**Assertions:**
- [ ] Categories page displays all available categories
- [ ] Each category card links to `/buscar?category=...`
- [ ] Category pages show filtered results
- [ ] Breadcrumb navigation works

**Accessibility:**
- [ ] axe-core scan on `/categorias` — zero critical/serious
- [ ] Category cards are keyboard-navigable
- [ ] Each category has descriptive text or label

**Mobile (375px):**
- [ ] Category grid adapts to mobile (2 columns or single)
- [ ] No horizontal scroll
- [ ] Touch targets >= 44px on category cards

---

## Flow 5: Search API Direct Tests

**User Story:** As a developer, I want to verify the search API returns correct data structures.
**Preconditions:** Products seeded.

| Step | Action | Endpoint | Expected Result |
|------|--------|----------|-----------------|
| 5.1 | Keyword search | `GET /api/search?q=samsung` | `{ products: [...], total: N, searchMode: "..." }` |
| 5.2 | Category filter | `GET /api/search?category=electronics` | Products filtered by category |
| 5.3 | Combined query + filter | `GET /api/search?q=samsung&category=electronics` | Intersection of results |
| 5.4 | Pagination | `GET /api/search?q=samsung&page=2` | Second page of results |
| 5.5 | Empty query | `GET /api/search` | All products or empty |
| 5.6 | Seller type filter | `GET /api/search?sellerType=business` | Only business seller products |

**Assertions:**
- [ ] Response is valid JSON with expected schema
- [ ] `products` is an array of product objects
- [ ] Each product has: `id`, `title`, `price`, `category`, `images`
- [ ] Pagination metadata is correct
- [ ] `searchMode` indicates keyword/hybrid/semantic
- [ ] `latencyMs` is present and reasonable (< 2000ms)

**Error Scenarios:**

| # | Trigger | Expected Behavior |
|---|---------|-------------------|
| E10 | Invalid page number: `page=-1` | Default to page 1 or 400 error |
| E11 | SQL injection: `q=' OR 1=1 --` | Sanitized, no data leak |
| E12 | Extremely long query | 400 or truncated, no server crash |

---

## Test Data Requirements

| Entity | Data | Notes |
|--------|------|-------|
| Electronics products | 3+ products in "electronics" category | Various prices |
| Vehicle products | 2+ products in "vehicles" category | |
| Clothing products | 2+ products in "clothing" category | |
| Business seller products | At least 1 product from business seller | For sellerType filter |
| Product with Spanish description | "Celular Samsung en buen estado, como nuevo" | For semantic search |
