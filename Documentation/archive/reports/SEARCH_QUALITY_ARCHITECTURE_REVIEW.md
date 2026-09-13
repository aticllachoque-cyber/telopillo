# Search Quality Improvement Plan — Technical Architecture Review

**Reviewer:** Software Architect  
**Date:** February 23, 2026  
**Scope:** 7-phase search quality plan, 6 architect questions

---

## Executive Summary

The plan is sound overall, but **Phase 1 has a critical bug**: `plainto_tsquery` with synonym-expanded text produces AND logic, matching *fewer* results. Use OR-based tsquery construction instead. Phase 3 adds negligible latency; Phase 4 and Phase 1 are complementary. The PostgreSQL synonym dictionary is not viable on Supabase Cloud. A reduced semantic boost (1.2–1.5x) is a reasonable alternative to removing it. Spanish-specific embedding models have migration cost; defer until post-MVP.

---

## 1. Phase 1: Query Synonym Expansion — Critical Bug

### The Bug

`plainto_tsquery('spanish', 'telefono celular smartphone movil')` produces:

```sql
'telefon' & 'celular' & 'smartphon' & 'movil'
```

PostgreSQL inserts **AND** between words. Documents must contain **all four** terms to match. This reduces recall, not increases it.

**Current code path:** `app/api/search/route.ts` → `search_query` → `plainto_tsquery('spanish', trim(search_query))` in `search_products_semantic` and `search_demands_hybrid`.

### Recommended Fix: OR-Based tsquery

**Option A: Custom `plainto_or_tsquery` in SQL (recommended)**

```sql
-- Add to a migration
CREATE OR REPLACE FUNCTION public.plainto_or_tsquery(config regconfig, query text)
RETURNS tsquery
LANGUAGE sql
STABLE
AS $$
  SELECT string_agg(
    to_tsquery(config, quote_literal(trim(lexeme))),
    ' | '
  )::tsquery
  FROM unnest(tsvector_to_array(to_tsvector(config, trim(query)))) AS lexeme
  WHERE trim(lexeme) != '';
$$;

-- Fallback for empty: return a query that matches nothing (or everything if you prefer)
-- Handle edge case: empty string -> NULL or match-all
```

**Simpler approach:** Build tsquery from expanded terms with OR:

```sql
-- In lib/search/synonyms.ts (or equivalent), expandQuery returns: "telefono | celular | smartphone | movil"
-- Then in SQL, we need to parse this safely. Problem: to_tsquery expects specific format.

-- Safer: expand in API, pass as array, let SQL build OR query
-- New RPC param: search_terms TEXT[] — e.g. ['telefono','celular','smartphone','movil']
-- In SQL:
--   v_tsquery := (SELECT string_agg(to_tsquery('spanish', quote_literal(term)), ' | ')::tsquery FROM unnest(search_terms) AS term);
```

**Option B: Build tsquery in API, pass pre-built (not recommended)**  
Passing raw tsquery from client is a SQL injection risk. Build it server-side.

**Option C: `websearch_to_tsquery`**  
`websearch_to_tsquery('telefono OR celular OR smartphone')` would work, but:
- Requires the API to format the string with `OR`
- User could inject `" OR "` — must sanitize
- `websearch_to_tsquery` interprets `-` as NOT, `"..."` as phrase — can conflict with synonym strings

**Recommendation:** Add `plainto_or_tsquery` (or equivalent) in a migration. Have `expandQuery()` return space-separated synonyms; in SQL, split on spaces, stem each token, and join with `|`. A cleaner approach:

```sql
-- plainto_or_tsquery: takes "telefono celular smartphone", returns tsquery with OR
CREATE OR REPLACE FUNCTION public.plainto_or_tsquery(config regconfig, query text)
RETURNS tsquery
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  terms text[];
  result tsquery := NULL;
  t text;
BEGIN
  IF query IS NULL OR trim(query) = '' THEN
    RETURN NULL;
  END IF;
  terms := regexp_split_to_array(trim(lower(query)), '\s+');
  FOREACH t IN ARRAY terms
  LOOP
    IF t != '' THEN
      result := result | to_tsquery(config, quote_literal(regexp_replace(trim(t), E'[\\s\'|:&()!]+', '', 'g')));
      -- Handle NULL for first term
      IF result IS NULL THEN
        result := to_tsquery(config, quote_literal(regexp_replace(trim(t), E'[\\s\'|:&()!]+', '', 'g')));
      END IF;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;
```

Actually, the `|` operator for tsquery concatenation: `q1 | q2` means OR. And we need to avoid SQL injection — `to_tsquery` with `quote_literal` may not work for arbitrary strings. Safer: use `plainto_tsquery` per term and OR them:

```sql
-- Simpler: split expanded query into words, plainto_tsquery each, OR together
-- plainto_tsquery('spanish', 'telefono') gives 'telefon'
-- We need: 'telefon' | 'celular' | 'smartphon' | 'movil'
-- 
-- to_tsquery('spanish', 'telefon') works for single lexeme
-- For user input we need to_tsvector first to get stemmed form, then convert to tsquery
-- 
-- Alternative: use websearch_to_tsquery with controlled input
-- websearch_to_tsquery('telefono or celular or smartphone') 
-- We control the string, so we can ensure it's "word1 or word2 or word3"
-- Must escape/sanitize each word so it doesn't contain " or " or "-" or quotes
```

**Pragmatic implementation (Option 1 — recommended):**

1. In `lib/search/synonyms.ts`: `expandQuery("telefono")` → `"telefono celular smartphone movil"`.
2. In API: split by spaces, sanitize each token (alphanumeric + Spanish chars), join with ` OR `.
3. In SQL: use `websearch_to_tsquery('spanish', 'telefono or celular or smartphone or movil')`.

**New RPC signature:** Add optional `search_query_fts` — the API sends the expanded OR-formatted string for FTS, while the original query goes to `getQueryEmbedding` for semantic. The SQL function uses `websearch_to_tsquery` when `search_query_fts` is provided, otherwise `plainto_tsquery` on `search_query`.

**Sanitization:** Each token must be stripped of `|`, `&`, `-`, `"`, `'`, `(`, `)`. If a token is empty after sanitization, skip it. Limit to ~20 terms to avoid huge tsqueries.

**Alternative (Option 2 — custom SQL function):** If `websearch_to_tsquery` causes issues with special chars, add `plainto_or_tsquery`:

```sql
CREATE OR REPLACE FUNCTION public.plainto_or_tsquery(config regconfig, query text)
RETURNS tsquery
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  terms text[];
  t text;
  q tsquery;
  result tsquery := NULL;
BEGIN
  IF query IS NULL OR trim(query) = '' THEN
    RETURN NULL;
  END IF;
  terms := regexp_split_to_array(trim(lower(query)), '\s+');
  FOREACH t IN ARRAY terms
  LOOP
    IF trim(t) != '' THEN
      q := plainto_tsquery(config, trim(t));
      result := CASE WHEN result IS NULL THEN q ELSE result | q END;
    END IF;
  END LOOP;
  RETURN result;
END;
$$;
```

Then pass the expanded query (space-separated) to this function instead of `plainto_tsquery`.

---

## 2. Phase 2: Remove 2x Semantic Boost — Alternative

**Current logic (from `20260223160000_add_semantic_similarity_threshold.sql`):**

```sql
CASE
  WHEN (SELECT cnt FROM keyword_hit_count) = 0
  THEN COALESCE(2.0 / (v_rrf_k + sr.rn), 0)
  ELSE COALESCE(1.0 / (v_rrf_k + sr.rn), 0)
END
```

**Recommendation:** Use a moderate boost (e.g. 1.5x) instead of removing it entirely.

**Rationale:**
- When FTS finds 0 matches, semantic results are the only signal. A 2x boost may over-rank weak semantic matches.
- Removing the boost entirely may under-rank good semantic matches when FTS misses (e.g. "chompa" vs "sudadera").
- A 1.5x multiplier keeps semantic as the primary signal when FTS fails, without over-weighting.

**Implementation:**

```sql
CASE
  WHEN (SELECT cnt FROM keyword_hit_count) = 0
  THEN COALESCE(1.5 / (v_rrf_k + sr.rn), 0)  -- was 2.0
  ELSE COALESCE(1.0 / (v_rrf_k + sr.rn), 0)
END
```

**Recommendation:** Implement 1.5x first; if relevance still feels off, tune to 1.2x or 1.0x based on A/B or manual evaluation.

---

## 3. Phase 3: Configurable Thresholds — Performance

**Concern:** Extra SELECT from `app_config` per search adds latency.

**Current state:** `isSemanticSearchEnabled()` already does one `app_config` SELECT per search (in both `/api/search` and `/api/search-demands`).

**Options:**

| Option | Latency | Complexity | Recommendation |
|--------|---------|------------|----------------|
| **A. Add second SELECT** in SQL | +1–2 ms | Low | Acceptable |
| **B. Batch read** | Same | Low | Single `SELECT key, value FROM app_config WHERE key IN ('semantic_search_enabled', 'semantic_threshold_products', 'semantic_threshold_demands')` in API, pass to RPC |
| **C. Session variable** | Same | Medium | Requires `SET LOCAL` before RPC; not ideal for RPC |
| **D. Function default** | 0 | Low | Can't read from DB in default; use `COALESCE` with param |

**Recommendation:** **Option B** — read `app_config` once in the API route (same as `isSemanticSearchEnabled`), batch the threshold keys, and pass `semantic_threshold` as an RPC parameter. No extra SQL round-trip.

**Implementation sketch:**

```typescript
// In API route, alongside isSemanticSearchEnabled:
const { data: configRows } = await supabase
  .from('app_config')
  .select('key, value')
  .in('key', ['semantic_search_enabled', 'semantic_threshold_products', 'semantic_threshold_demands'])

const thresholds = Object.fromEntries(
  (configRows ?? []).map(r => [r.key, r.value])
)
const semanticThreshold = parseFloat(
  thresholds['semantic_threshold_products'] ?? '0.70'
) // or demands: 0.65
```

Then add `semantic_threshold DOUBLE PRECISION DEFAULT 0.75` to the RPC and pass it from the API. Fallback in SQL: `COALESCE(semantic_threshold_param, 0.75)`.

**For ~43 items:** The cost is negligible either way. The main win is avoiding a second round-trip by batching.

---

## 4. Phase 4 vs Phase 1 — Redundancy

**Phase 1:** Query expansion for **FTS**. User query "telefono" → FTS sees "telefono | celular | smartphone" (OR). Helps FTS match documents that use "celular" but not "telefono".

**Phase 4:** Embedding hints for **indexing**. Product "iPhone 15" in category "Celulares" → embedding text gets "celular telefono smartphone". Helps semantic similarity when the user queries "telefono".

**Conclusion:** They are **complementary**, not redundant:
- Phase 1: query-side FTS
- Phase 4: document-side semantic
- RRF combines FTS and semantic scores; no double-counting.

**Implementation note:** Keep `CATEGORY_HINTS` in the Edge Function and `expandQuery` in the API. Both should use the same synonym map for consistency.

---

## 5. Alternative to Phase 1: PostgreSQL Synonym Dictionary

**PostgreSQL options:**
- `synonym` template: `.syn` file, `word => synonym`
- `xsyn` template: `.rules` file, word groups
- Both require files in `$SHAREDIR/tsearch_data/`

**Supabase Cloud:** The database filesystem is not user-writable. You cannot add custom `.syn` or `.rules` files.

**Self-hosted Supabase:** Would work if you can place files in the correct directory.

**Recommendation:** Use API-level synonym expansion for Supabase Cloud. Revisit the dictionary approach only if you move to self-hosted or another provider that allows custom FTS files.

---

## 6. Embedding Model: Spanish-Specific vs Multilingual

**Current:** `paraphrase-multilingual-MiniLM-L12-v2` (384 dims, 50+ languages).

**Alternative:** `hiiamsid/sentence_similarity_spanish_es` (768 dims, Spanish-specific).

**Trade-offs:**

| Factor | Multilingual (current) | Spanish-specific |
|--------|-------------------------|------------------|
| Dims | 384 | 768 |
| Storage | 1.5 KB/embedding | 3 KB/embedding |
| HNSW | Smaller index | Larger index |
| HF Inference API | Supported | Verify availability |
| Bolivian Spanish | Good | Potentially better |
| Migration | None | New migration, full backfill |

**Migration cost:**
1. `ALTER TABLE products ALTER COLUMN embedding TYPE vector(768)` (and same for `demand_posts`).
2. Recreate HNSW indexes.
3. Update Edge Function model and response handling.
4. Full backfill of products and demands.
5. Confirm the Spanish model is on HuggingFace Inference API.

**Recommendation:** **Defer** until post-MVP. With ~43 items, the current model is sufficient. Revisit when:
- You have more data and clearer relevance issues, or
- You need better handling of Bolivian dialect/slang.

---

## 7. Phase 5: Demand Trigger — Verification

**Current demand embedding trigger** (`20260218120000_create_demand_posts.sql`):

```sql
CREATE TRIGGER trg_demand_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, description, category ON public.demand_posts
  -- MISSING: subcategory

CREATE TRIGGER trg_demand_post_embedding
  AFTER INSERT OR UPDATE OF title, description, category ON public.demand_posts
  -- MISSING: subcategory
```

**Embedding text built in `trigger_demand_post_embedding`:**
```sql
v_embedding_text := 'Busco: ' || NEW.title
  || '. ' || NEW.description
  || '. Categoría: ' || NEW.category;
  -- MISSING: subcategory
```

**`update_demand_posts_search_vector`** (from `20260223120000_fix_demand_search_precision.sql`) already includes subcategory:
```sql
setweight(to_tsvector('spanish', coalesce(NEW.category, '') || ' ' || coalesce(NEW.subcategory, '')), 'C')
```

**Gap:** The `search_vector` trigger still uses `UPDATE OF title, description, category` — it should include `subcategory` so that subcategory-only changes refresh the vector. The function body is correct; the trigger column list is incomplete.

**Fix for Phase 5:**

1. **Both triggers:** Add `subcategory` to `UPDATE OF`:
   ```sql
   UPDATE OF title, description, category, subcategory
   ```

2. **`trigger_demand_post_embedding`:** Include subcategory in the embedding text:
   ```sql
   v_embedding_text := 'Busco: ' || NEW.title
     || '. ' || NEW.description
     || '. Categoría: ' || coalesce(NEW.category, '') || coalesce(' ' || NEW.subcategory, '');
   ```

---

## 8. Phase 6: Backfill — Edge Function

**Current backfill:** Only products (`body.backfill === true`).

**Required:** Add demand backfill mode, e.g. `body.backfill === 'demands'` or `body.backfill_demands === true`.

**Implementation:** Mirror the product backfill: select `demand_posts` with `embedding IS NULL`, build text (title + description + category + subcategory), call HF, update `demand_posts.embedding`. Use the same `buildDemandText()` (or equivalent) as the webhook so indexing is consistent.

---

## 9. Additional Findings

### 9.1 Cache Eviction Bug

Both search routes use a simple FIFO eviction:

```typescript
if (EMBEDDING_CACHE.size >= CACHE_MAX_SIZE) {
  const firstKey = EMBEDDING_CACHE.keys().next().value
  if (firstKey) EMBEDDING_CACHE.delete(firstKey)
}
```

`Map` in JavaScript preserves insertion order, so this removes the oldest entry. For a 5-minute TTL, this is acceptable. Consider LRU if you later increase cache size or TTL.

### 9.2 Duplicate Cache Logic

`/api/search` and `/api/search-demands` each define their own `EMBEDDING_CACHE`. They do not share cache. Consider extracting a shared `lib/search/embedding-cache.ts` so that a query used for both products and demands is only embedded once.

### 9.3 `websearch_to_tsquery` Sanitization

If you use `websearch_to_tsquery` for OR expansion, sanitize each term:
- Strip: `|`, `&`, `-`, `"`, `'`, `(`, `)`, `!`
- Reject empty tokens
- Limit number of terms (e.g. 20) to avoid huge tsqueries

---

## 10. Implementation Order

| Phase | Priority | Blockers |
|-------|----------|----------|
| **Phase 5** (Fix demand trigger) | P0 | None |
| **Phase 1** (Synonym expansion) | P0 | Must use OR tsquery |
| **Phase 2** (2x boost → 1.5x) | P1 | None |
| **Phase 3** (Configurable thresholds) | P1 | Batch with existing app_config read |
| **Phase 4** (Embedding hints) | P1 | None |
| **Phase 6** (Backfill) | P1 | After Phase 5 |
| **Phase 7** (Browser verification) | P2 | After 1–6 |

---

## 11. Summary of Recommendations

1. **Phase 1:** Use OR-based tsquery (`websearch_to_tsquery` with sanitized `"a or b or c"` or a custom `plainto_or_tsquery`). Do not pass synonym-expanded text to `plainto_tsquery`.
2. **Phase 2:** Use 1.5x semantic boost when `keyword_count = 0` instead of removing it.
3. **Phase 3:** Read thresholds in the API with a batched `app_config` query and pass them as RPC parameters.
4. **Phase 4 & 1:** Keep both; they operate on different sides (query vs document).
5. **Phase 5:** Add `subcategory` to both demand triggers and to the embedding text.
6. **PostgreSQL synonym dictionary:** Not viable on Supabase Cloud; stick with API-level expansion.
7. **Spanish embedding model:** Defer; revisit after MVP with more data.
