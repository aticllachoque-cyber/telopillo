# Implementation Plan - Milestone 3: Search & Discovery (Keyword Search)

**Version:** 1.0  
**Date:** February 14, 2026  
**Author:** Alcides Cardenas  
**Estimated Duration:** 5-7 days (based on M2 velocity: ~28-35h estimated, 4-5 days actual)  
**Status:** Ready to Start

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Phase-by-Phase Plan](#3-phase-by-phase-plan)
4. [Risk Analysis & Mitigation](#4-risk-analysis--mitigation)
5. [Testing Strategy](#5-testing-strategy)
6. [Success Criteria](#6-success-criteria)
7. [Rollout Plan](#7-rollout-plan)

---

## 1. Executive Summary

### 1.1 Overview

M3 implements keyword search and discovery for Telopillo.bo—enabling users to find products via search bar, filters, category browsing, and sort options. Uses PostgreSQL Full-Text Search (FTS) with Spanish configuration for Bolivian Spanish support.

### 1.2 Key Metrics

| Metric | Target |
|--------|--------|
| **Estimated Duration** | 5-7 days (25-35 hours) |
| **M2 Velocity Reference** | ~1.4x faster than estimated |
| **Phases** | 7 phases, sequential with some parallelization |
| **Critical Path** | Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 |

### 1.3 Dependencies

- **M2 (Product Listings):** ✅ Complete at 100%
- **Products table:** Exists with title, description, category, subcategory, price, condition, location_department, location_city, status
- **ProductCard, ProductGrid:** Reusable from M2
- **Header:** Exists with links to /buscar and /categorias (pages not yet built)

### 1.4 Deliverables Summary

| Phase | Key Deliverables | Est. Hours |
|-------|------------------|------------|
| 1 | search_vector column, trigger, GIN index, search RPC | 2-3 |
| 2 | Search API route, filter logic | 2-3 |
| 3 | SearchBar component, Header integration | 2-3 |
| 4 | /buscar page, results layout, pagination | 4-5 |
| 5 | Filters sidebar, sort options | 3-4 |
| 6 | /categorias, /categorias/[slug] pages | 3-4 |
| 7 | Empty states, testing, polish | 4-5 |

**Total:** 20-27 hours (~3-4 working days at M2 velocity)

---

## 2. Technical Architecture

### 2.1 Search Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  SearchBar      │────▶│  /buscar?q=...    │────▶│  search_products()   │
│  (Header)       │     │  (Search Results) │     │  RPC / API Route     │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                    │                        │
                                    │                        ▼
                                    │              ┌─────────────────────┐
                                    │              │  products table     │
                                    │              │  search_vector      │
                                    │              │  @@ plainto_tsquery │
                                    │              └─────────────────────┘
                                    │
                                    ▼
┌─────────────────┐     ┌──────────────────┐
│  /categorias    │────▶│  /buscar?cat=... │
│  Category browse│     │  (Filtered)      │
└─────────────────┘     └──────────────────┘
```

### 2.2 Database Changes (Phase 1)

**Add to products table:**
- `search_vector TSVECTOR` — Generated from title (weight A), description (weight B), category (weight C)
- Trigger to auto-update on INSERT/UPDATE
- GIN index on search_vector for fast FTS queries

**Search function:**
- `search_products(search_query, filters)` — Returns products matching FTS + filters
- Uses `plainto_tsquery('spanish', search_query)` for user input
- Uses `ts_rank()` for relevance ordering

### 2.3 Spanish Full-Text Search

PostgreSQL `spanish` config provides:
- Stemming: "buscando" → "busc", "teléfonos" → "telefon"
- Stop words: "el", "la", "de", "en", etc.
- Accent handling: "telefono" matches "teléfono"

**Bolivian synonyms (optional, Phase 1 or defer):**
- chompa ↔ buzo (sweater)
- celular ↔ teléfono
- Can use `CREATE TEXT SEARCH CONFIGURATION` with custom dictionary

### 2.4 URL Structure

| Route | Purpose |
|-------|---------|
| `/buscar` | Search results (q, category, min_price, max_price, location, condition, sort, page) |
| `/categorias` | Category listing |
| `/categorias/[slug]` | Products in category (e.g., /categorias/electronics) |

### 2.5 Reusable Components from M2

| M2 Component | M3 Reuse | Notes |
|--------------|----------|-------|
| ProductCard | ✅ Direct reuse | Display in search results |
| ProductGrid | ✅ Direct reuse | Grid layout for results |
| lib/data/categories.ts | ✅ Direct reuse | Category IDs, names, icons |
| lib/validations/product.ts | ✅ Reference | PRODUCT_CATEGORIES, condition values |

---

## 3. Phase-by-Phase Plan

---

### Phase 1: Database Schema (Full-Text Search)

**Duration:** 2-3 hours  
**Dependencies:** None (M2 complete)  
**Critical Path:** Yes

#### 1.1 Add search_vector Column

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 1.1.1 | Run `npx supabase migration new add_products_search_vector` | 5 min | - |
| 1.1.2 | Add `search_vector TSVECTOR` column to products | 15 min | - |
| 1.1.3 | Create trigger function `products_search_vector_update()` | 30 min | - |
| 1.1.4 | Create trigger on INSERT/UPDATE | 10 min | 1.1.3 |
| 1.1.5 | Backfill existing products (UPDATE products SET search_vector = ...) | 15 min | 1.1.2 |
| 1.1.6 | Create GIN index `idx_products_search_vector` | 10 min | 1.1.2 |

**Trigger function logic:**
```sql
NEW.search_vector :=
  setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(NEW.category, '') || ' ' || COALESCE(NEW.subcategory, '')), 'C');
```

#### 1.2 Create Search RPC Function

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 1.2.1 | Create `search_products` RPC function | 45 min | 1.1 |
| 1.2.2 | Parameters: search_query, category, subcategory, min_price, max_price, location_department, location_city, condition, sort_by, sort_order, limit, offset | 20 min | - |
| 1.2.3 | Build dynamic query with FTS: `search_vector @@ plainto_tsquery('spanish', search_query)` | 30 min | - |
| 1.2.4 | Add ts_rank for relevance when search_query provided | 15 min | - |
| 1.2.5 | Apply filters (category, price range, location, condition) | 25 min | - |
| 1.2.6 | Sort options: relevance, price_asc, price_desc, created_at_desc | 20 min | - |
| 1.2.7 | Return products + total_count | 15 min | - |
| 1.2.8 | RLS: only active products (or owner's) | 10 min | - |

**RPC signature:**
```sql
search_products(
  search_query TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  subcategory_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  location_department TEXT DEFAULT NULL,
  location_city TEXT DEFAULT NULL,
  condition_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  sort_order TEXT DEFAULT 'desc',
  result_limit INT DEFAULT 24,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (products JSONB, total_count BIGINT)
```

#### 1.3 Optional: Bolivian Synonyms (Defer if time-constrained)

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 1.3.1 | Create synonym dictionary (chompa→buzo, celular→teléfono) | 30 min | - |
| 1.3.2 | Integrate into search config | 20 min | - |

**Phase 1 Deliverables:**
- `supabase/migrations/XXXXXX_add_products_search_vector.sql`
- `search_products` RPC function

**Phase 1 Success Criteria:**
- [ ] search_vector column exists and is populated
- [ ] Trigger updates search_vector on INSERT/UPDATE
- [ ] GIN index created
- [ ] search_products RPC returns results for "laptop", "iPhone", etc.
- [ ] Filters (category, price) work correctly
- [ ] Spanish stemming works (e.g., "teléfonos" finds "teléfono")

---

### Phase 2: Search API Route

**Duration:** 2-3 hours  
**Dependencies:** Phase 1  
**Critical Path:** Yes

#### 2.1 API Route

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 2.1.1 | Create `app/api/search/route.ts` | 20 min | - |
| 2.1.2 | Parse query params: q, category, subcategory, min_price, max_price, department, city, condition, sort, page | 25 min | - |
| 2.1.3 | Call search_products RPC with params | 20 min | Phase 1 |
| 2.1.4 | Validate/sanitize inputs (prevent injection) | 20 min | - |
| 2.1.5 | Return JSON: { products, totalCount, page, totalPages } | 15 min | - |
| 2.1.6 | Error handling (try/catch, 500) | 15 min | - |
| 2.1.7 | Add cache headers (Cache-Control: s-maxage=60) for GET | 10 min | - |

**Alternative:** Use Server Action instead of API route if preferred for Next.js 14 patterns. API route allows direct fetch from client; Server Action simplifies form submissions.

**Recommendation:** API route for `/buscar` page (client fetches on mount/param change). Simpler for URL-driven search.

#### 2.2 Search Utilities

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 2.2.1 | Create `lib/search.ts` with buildSearchParams(), parseSearchParams() | 30 min | - |
| 2.2.2 | Type definitions for SearchFilters, SearchResult | 15 min | - |

**Phase 2 Deliverables:**
- `app/api/search/route.ts`
- `lib/search.ts` (optional utilities)

**Phase 2 Success Criteria:**
- [ ] GET /api/search?q=laptop returns products
- [ ] Filters passed correctly to RPC
- [ ] Pagination works (page, limit)
- [ ] Invalid params handled gracefully

---

### Phase 3: Search Bar Component

**Duration:** 2-3 hours  
**Dependencies:** Phase 2 (API)  
**Critical Path:** Yes

#### 3.1 SearchBar Component

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 3.1.1 | Create `components/search/SearchBar.tsx` | 20 min | - |
| 3.1.2 | Input with Search icon, placeholder "Buscar productos..." | 15 min | - |
| 3.1.3 | On submit: navigate to /buscar?q={value} | 20 min | - |
| 3.1.4 | Debounce for future autocomplete (optional: 300ms) | 15 min | - |
| 3.1.5 | Mobile: compact variant (icon-only that expands) | 30 min | - |
| 3.1.6 | Desktop: full-width in nav or centered | 20 min | - |
| 3.1.7 | Accessibility: aria-label, role="search", keyboard submit (Enter) | 15 min | - |
| 3.1.8 | Preserve existing query when on /buscar | 10 min | - |

**Props:**
```typescript
interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  variant?: 'full' | 'compact' | 'mobile'
  className?: string
}
```

#### 3.2 Header Integration

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 3.2.1 | Add SearchBar to Header (between logo and nav, or replace "Buscar" link) | 30 min | 3.1 |
| 3.2.2 | Desktop: SearchBar in nav area, flex-1 max-w-md | 15 min | - |
| 3.2.3 | Mobile: Search icon opens overlay/drawer with SearchBar, or link to /buscar | 30 min | - |
| 3.2.4 | Update "Buscar" link to focus SearchBar or navigate to /buscar | 10 min | - |

**Phase 3 Deliverables:**
- `components/search/SearchBar.tsx`
- Updated `components/layout/Header.tsx`

**Phase 3 Success Criteria:**
- [ ] SearchBar visible in header (desktop)
- [ ] Typing + Enter navigates to /buscar?q=...
- [ ] Mobile: search accessible (icon or link)
- [ ] WCAG: keyboard navigable, labeled

---

### Phase 4: Search Results Page

**Duration:** 4-5 hours  
**Dependencies:** Phase 2, Phase 3  
**Critical Path:** Yes

#### 4.1 Search Results Layout

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 4.1.1 | Create `app/buscar/page.tsx` | 20 min | - |
| 4.1.2 | Read search params (q, category, etc.) from URL | 20 min | - |
| 4.1.3 | Fetch from /api/search with params | 30 min | Phase 2 |
| 4.1.4 | Client component with useEffect + useState for fetch | 25 min | - |
| 4.1.5 | Loading state (skeleton or spinner) | 20 min | - |
| 4.1.6 | Error state (retry button) | 15 min | - |
| 4.1.7 | Integrate ProductGrid with results | 15 min | M2 |
| 4.1.8 | Breadcrumbs: Inicio > Buscar [query] | 15 min | - |

#### 4.2 Pagination

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 4.2.1 | Create Pagination component or use simple prev/next | 30 min | - |
| 4.2.2 | Update URL on page change (?page=2) | 20 min | - |
| 4.2.3 | Display "X-Y of Z results" | 15 min | - |
| 4.2.4 | Mobile: "Cargar más" button (optional alternative to pagination) | 20 min | - |

#### 4.3 Results Header

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 4.3.1 | Display search query: "Resultados para 'laptop'" | 10 min | - |
| 4.3.2 | Display result count | 10 min | - |
| 4.3.3 | Integrate SearchBar with defaultValue from URL | 10 min | Phase 3 |

**Phase 4 Deliverables:**
- `app/buscar/page.tsx`
- `components/search/Pagination.tsx` (or inline)
- `components/search/SearchResultsHeader.tsx` (optional)

**Phase 4 Success Criteria:**
- [ ] /buscar?q=laptop shows results
- [ ] Loading and error states work
- [ ] Pagination updates URL and fetches new page
- [ ] ProductCard links to product detail
- [ ] Mobile responsive

---

### Phase 5: Filters & Sort

**Duration:** 3-4 hours  
**Dependencies:** Phase 4  
**Critical Path:** Yes

#### 5.1 Filter Sidebar

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 5.1.1 | Create `components/search/SearchFilters.tsx` | 30 min | - |
| 5.1.2 | Category filter (Select or Checkbox group from CATEGORIES) | 25 min | - |
| 5.1.3 | Price range (min, max inputs) | 25 min | - |
| 5.1.4 | Location: department Select, city input (optional) | 25 min | - |
| 5.1.5 | Condition filter (new, used_like_new, etc.) | 20 min | - |
| 5.1.6 | "Aplicar" / "Limpiar" buttons | 15 min | - |
| 5.1.7 | Update URL on filter change (debounced or on apply) | 25 min | - |
| 5.1.8 | Mobile: collapsible drawer or bottom sheet | 30 min | - |

#### 5.2 Sort Options

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 5.2.1 | Sort dropdown: Relevancia, Más recientes, Precio: menor a mayor, Precio: mayor a menor | 25 min | - |
| 5.2.2 | Map to API: relevance, created_at_desc, price_asc, price_desc | 15 min | - |
| 5.2.3 | Update URL ?sort=price_asc | 15 min | - |

#### 5.3 Layout Integration

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 5.3.1 | Desktop: Filters sidebar left, results right (e.g., 1/4 + 3/4) | 20 min | - |
| 5.3.2 | Mobile: Filters in drawer, "Filtros" button to open | 25 min | - |
| 5.3.3 | Active filters display (chips with remove) | 25 min | - |

**Phase 5 Deliverables:**
- `components/search/SearchFilters.tsx`
- `components/search/SortSelect.tsx`
- Updated `app/buscar/page.tsx` with filters layout

**Phase 5 Success Criteria:**
- [ ] Category filter works
- [ ] Price range filter works
- [ ] Location filter works
- [ ] Condition filter works
- [ ] Sort changes results order
- [ ] Filters persist in URL (shareable)
- [ ] Mobile filters accessible

---

### Phase 6: Category Browsing

**Duration:** 3-4 hours  
**Dependencies:** Phase 4, Phase 5  
**Critical Path:** Yes

#### 6.1 Categories Listing Page

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 6.1.1 | Create `app/categorias/page.tsx` | 20 min | - |
| 6.1.2 | Display all categories from CATEGORIES (grid of cards) | 30 min | - |
| 6.1.3 | Each card: icon, name, link to /categorias/[slug] | 20 min | - |
| 6.1.4 | Optional: product count per category (requires aggregate query) | 30 min | - |
| 6.1.5 | SEO metadata | 10 min | - |

#### 6.2 Category Detail Page

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 6.2.1 | Create `app/categorias/[slug]/page.tsx` | 20 min | - |
| 6.2.2 | Validate slug against CATEGORIES | 15 min | - |
| 6.2.3 | Redirect to /buscar?category={slug} (reuse search results) | 25 min | - |
| 6.2.4 | Or: fetch products with category filter, render ProductGrid | 30 min | - |
| 6.2.5 | Breadcrumbs: Inicio > Categorías > [Category Name] | 15 min | - |
| 6.2.6 | Subcategory links (optional): /buscar?category=X&subcategory=Y | 25 min | - |
| 6.2.7 | SEO metadata with category name | 10 min | - |

**Recommendation:** Use /buscar?category=electronics for category pages—single source of truth, less code duplication.

**Phase 6 Deliverables:**
- `app/categorias/page.tsx`
- `app/categorias/[slug]/page.tsx`

**Phase 6 Success Criteria:**
- [ ] /categorias shows all categories
- [ ] /categorias/electronics shows electronics products
- [ ] Invalid slug returns 404
- [ ] Breadcrumbs correct

---

### Phase 7: Empty States & Testing

**Duration:** 4-5 hours  
**Dependencies:** Phases 1-6  
**Critical Path:** Yes

#### 7.1 Empty States

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.1.1 | No results: "No encontramos resultados para 'xyz'" | 20 min | - |
| 7.1.2 | Suggestions: "Intenta con términos más generales", related categories | 25 min | - |
| 7.1.3 | Empty search (no q): "Explora categorías" or popular searches | 20 min | - |
| 7.1.4 | Empty category: "No hay productos en esta categoría" | 15 min | - |

#### 7.2 Manual Testing

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.2.1 | Search: "laptop", "iPhone", "chompa", "buzo" | 30 min | - |
| 7.2.2 | Filters: category, price, location | 25 min | - |
| 7.2.3 | Sort: all options | 15 min | - |
| 7.2.4 | Pagination | 15 min | - |
| 7.2.5 | Category browse | 15 min | - |
| 7.2.6 | Mobile: search, filters, results | 25 min | - |
| 7.2.7 | Spanish: "teléfonos", "electrónica" | 15 min | - |

#### 7.3 Performance & Accessibility

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.3.1 | Search response time < 500ms (verify) | 15 min | - |
| 7.3.2 | WCAG: keyboard nav, focus order, labels | 30 min | - |
| 7.3.3 | Screen reader: results count announced | 15 min | - |

#### 7.4 Code Quality & Documentation

| Task | Description | Est. | Deps |
|------|-------------|------|------|
| 7.4.1 | ESLint, TypeScript check | 15 min | - |
| 7.4.2 | Update PROGRESS.md | 15 min | - |
| 7.4.3 | Create TESTING_CHECKLIST.md | 30 min | - |

**Phase 7 Deliverables:**
- Empty state components
- `Documentation/milestones/M3-search-keyword/TESTING_CHECKLIST.md`
- Updated PROGRESS.md

**Phase 7 Success Criteria:**
- [ ] Empty states display correctly
- [ ] All manual tests pass
- [ ] Search < 500ms
- [ ] 0 ESLint, 0 TypeScript errors
- [ ] WCAG 2.2 AA compliance

---

## 4. Risk Analysis & Mitigation

### 4.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FTS returns no results for valid queries | Medium | High | Test Spanish config; add trigram similarity (pg_trgm) for typos if needed |
| Search slow with many products | Low | Medium | GIN index; limit result set; consider materialized view for heavy filters |
| Category slug mismatch (DB vs frontend) | Low | Medium | Use shared CATEGORIES from lib/data; validate slug exists |
| RPC returns too much data | Low | Low | Limit to 24-48 per page; paginate |

### 4.2 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users expect autocomplete | Medium | Medium | Phase 3: simple search first; add autocomplete in M3.1 or M4 |
| Filters overwhelming on mobile | Medium | Medium | Collapsible drawer; "Filtros" button; show active count |
| Empty results frustrate users | High | Medium | Clear empty state with suggestions |

### 4.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SQL injection via search query | Low | High | Use parameterized RPC; plainto_tsquery sanitizes |
| Excessive API calls | Medium | Low | Debounce; cache; rate limit (future) |

---

## 5. Testing Strategy

### 5.1 Manual Testing Checklist

1. **Search**
   - [ ] "laptop" returns laptops
   - [ ] "iPhone" returns iPhones
   - [ ] "teléfonos" (plural) finds "teléfono"
   - [ ] Empty query shows categories or prompt
   - [ ] Special characters handled

2. **Filters**
   - [ ] Category filter works
   - [ ] Price range works
   - [ ] Location filter works
   - [ ] Condition filter works
   - [ ] Combined filters work

3. **Sort**
   - [ ] Relevance (when q provided)
   - [ ] Most recent
   - [ ] Price low-high
   - [ ] Price high-low

4. **Pagination**
   - [ ] Next/prev work
   - [ ] URL updates
   - [ ] Page 1 when filters change

5. **Category Browsing**
   - [ ] /categorias loads
   - [ ] /categorias/electronics shows products
   - [ ] Invalid slug 404

6. **Accessibility**
   - [ ] Keyboard navigation
   - [ ] Screen reader labels
   - [ ] Focus management

### 5.2 Performance

- Search API response < 500ms
- Page load < 3s (LCP)

---

## 6. Success Criteria

### 6.1 Milestone Completion

M3 is complete when:
- [ ] User can search from header
- [ ] Search returns relevant results (< 500ms)
- [ ] Filters (category, price, location, condition) work
- [ ] Sort options work
- [ ] Pagination works
- [ ] Category browsing works
- [ ] Empty states display
- [ ] Mobile responsive
- [ ] WCAG 2.2 AA
- [ ] 0 ESLint, 0 TypeScript errors

---

## 7. Rollout Plan

### 7.1 Deployment Order

1. **Phase 1** → Push migration to Supabase
2. **Phases 2-6** → Deploy frontend
3. **Phase 7** → Final verification

### 7.2 Rollback

| Scenario | Action |
|----------|--------|
| Migration fails | Revert migration; search_vector nullable initially |
| Search broken | Hide SearchBar; link to /categorias only |
| Performance issues | Add result limit; optimize RPC |

---

## Appendix A: File Structure (Target)

```
app/
  buscar/page.tsx
  categorias/
    page.tsx
    [slug]/page.tsx
  api/
    search/route.ts

components/
  search/
    SearchBar.tsx
    SearchFilters.tsx
    SortSelect.tsx
    Pagination.tsx
    EmptySearchState.tsx

lib/
  search.ts (optional)

supabase/
  migrations/
    XXXXXX_add_products_search_vector.sql
```

---

## Appendix B: Time Estimate Summary

| Phase | Low (h) | High (h) |
|-------|---------|----------|
| 1 | 2 | 3 |
| 2 | 2 | 3 |
| 3 | 2 | 3 |
| 4 | 4 | 5 |
| 5 | 3 | 4 |
| 6 | 3 | 4 |
| 7 | 4 | 5 |
| **Total** | **20** | **26** |

At M2 velocity (~1.4x), expect **3-4 working days**.

---

**Last Updated:** February 14, 2026  
**Next Review:** After Phase 1 completion
