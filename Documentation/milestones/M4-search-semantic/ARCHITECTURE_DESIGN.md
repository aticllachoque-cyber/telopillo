# M4 Semantic Search Architecture Design

**Telopillo.bo Marketplace**  
**Target:** Bolivian Spanish hybrid search (keyword + semantic)  
**Last Updated:** February 14, 2026

---

## 1. Summary

M4 adds semantic search to Telopillo.bo using **pgvector** for vector storage, **Hugging Face Inference API** for embeddings (`paraphrase-multilingual-MiniLM-L12-v2`, 384 dimensions), and **Reciprocal Rank Fusion (RRF, k=60)** to merge keyword (FTS) and semantic results. A feature flag allows toggling between keyword-only and hybrid search. Embeddings are generated automatically via Database Webhooks invoking an Edge Function on product INSERT/UPDATE.

---

## 2. Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Search Bar     │────▶│  /api/search     │────▶│  Feature Flag Check  │
│  (Next.js)      │     │  (API Route)     │     │  semantic_search?    │
└─────────────────┘     └────────┬─────────┘     └──────────┬──────────┘
                                 │                          │
                    ┌────────────┴────────────┐              │
                    │ OFF: search_products()  │              │
                    │ (keyword only, M3)      │              │
                    └────────────────────────┘              │
                                 │                          │
                    ┌────────────┴────────────┐              │
                    │ ON: 1) Edge Function    │◀─────────────┘
                    │     generate-embedding  │
                    │     2) search_products_ │
                    │        semantic()       │
                    └────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                    Supabase (PostgreSQL)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ products     │  │ app_config   │  │ search_products_semantic  │ │
│  │ - embedding  │  │ (feature     │  │ (hybrid RRF)              │ │
│  │   vector(384)│  │  flag)      │  │                           │ │
│  └──────┬───────┘  └──────────────┘  └──────────────────────────┘ │
│         │                                                            │
│         │ INSERT/UPDATE                                               │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Database Webhook → Edge Function generate-embedding           │   │
│  │ → Hugging Face API → UPDATE products SET embedding = ...      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Migration SQL

**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_semantic_search.sql`

```sql
-- =============================================================================
-- M4: Semantic Search - pgvector, embeddings, hybrid search
-- =============================================================================
-- Adds: pgvector extension, embedding column, HNSW index, app_config (feature
-- flag), search_products_semantic() RPC with RRF hybrid search.
-- Embedding model: paraphrase-multilingual-MiniLM-L12-v2 (384 dims)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enable pgvector extension
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- 2. Add embedding column to products
-- -----------------------------------------------------------------------------
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS embedding vector(384);

COMMENT ON COLUMN public.products.embedding IS 'M4: Semantic embedding from title+description+category. Model: paraphrase-multilingual-MiniLM-L12-v2 (384d).';

-- -----------------------------------------------------------------------------
-- 3. HNSW index for approximate nearest neighbor (cosine distance)
-- -----------------------------------------------------------------------------
-- Only index rows with non-null embeddings. vector_cosine_ops for cosine similarity.
CREATE INDEX IF NOT EXISTS idx_products_embedding_hnsw
  ON public.products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 4. Feature flag: app_config table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.app_config IS 'Key-value config for feature flags and app settings.';

-- Insert default: semantic search OFF (safe default)
INSERT INTO public.app_config (key, value)
VALUES ('semantic_search_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

-- RLS: allow read for anon/authenticated (feature flags are non-sensitive)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_select_policy"
  ON public.app_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service_role can update (via Edge Function or dashboard)
CREATE POLICY "app_config_update_service_role"
  ON public.app_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT ALL ON public.app_config TO service_role;

-- -----------------------------------------------------------------------------
-- 5. search_products_semantic() - Hybrid search with RRF (k=60)
-- -----------------------------------------------------------------------------
-- Combines: keyword (FTS, top 50) + semantic (cosine, top 50) → RRF merge
-- When query_embedding is NULL: falls back to keyword-only (same as search_products)
CREATE OR REPLACE FUNCTION public.search_products_semantic(
  search_query TEXT DEFAULT NULL,
  query_embedding vector(384) DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  price_min DECIMAL DEFAULT NULL,
  price_max DECIMAL DEFAULT NULL,
  location_department_filter TEXT DEFAULT NULL,
  condition_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INT DEFAULT 24,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  products JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
  v_has_semantic BOOLEAN;
  v_rrf_k CONSTANT INT := 60;
BEGIN
  v_has_search := (search_query IS NOT NULL AND trim(search_query) != '');
  v_has_semantic := (query_embedding IS NOT NULL);

  IF v_has_search THEN
    v_tsquery := plainto_tsquery('spanish', trim(search_query));
  END IF;

  -- When no semantic: delegate to keyword-only logic (same structure as search_products)
  IF NOT v_has_semantic THEN
    RETURN QUERY
    SELECT * FROM public.search_products(
      search_query,
      category_filter,
      price_min,
      price_max,
      location_department_filter,
      condition_filter,
      status_filter,
      sort_by,
      result_limit,
      result_offset
    );
    RETURN;
  END IF;

  -- Hybrid: keyword top 50 + semantic top 50 → RRF merge
  RETURN QUERY
  WITH
  -- Base filter (same as search_products)
  base_filter AS (
    SELECT p.id, p.user_id, p.title, p.description, p.category, p.subcategory,
           p.price, p.currency, p.condition, p.location_department, p.location_city,
           p.images, p.status, p.views_count, p.favorites_count, p.contacts_count,
           p.created_at, p.updated_at, p.expires_at
    FROM public.products p
    WHERE (p.status = 'active' OR p.user_id = auth.uid())
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (location_department_filter IS NULL OR p.location_department = location_department_filter)
      AND (condition_filter IS NULL OR p.condition = condition_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
  ),

  -- Keyword results: top 50 (FTS match required when search_query provided)
  keyword_results AS (
    SELECT bf.id, ts_rank_cd(p.search_vector, v_tsquery, 32) AS relevance
    FROM base_filter bf
    JOIN public.products p ON p.id = bf.id
    WHERE (NOT v_has_search OR (p.search_vector @@ v_tsquery))
    ORDER BY relevance DESC NULLS LAST
    LIMIT 50
  ),
  keyword_ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY relevance DESC NULLS LAST)::INT AS rn
    FROM keyword_results
  ),

  -- Semantic results: top 50 (cosine distance, embedding must exist)
  semantic_results AS (
    SELECT bf.id, (p.embedding <=> query_embedding) AS distance
    FROM base_filter bf
    JOIN public.products p ON p.id = bf.id
    WHERE p.embedding IS NOT NULL
    ORDER BY p.embedding <=> query_embedding
    LIMIT 50
  ),
  semantic_ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY distance ASC)::INT AS rn
    FROM semantic_results
  ),

  -- Union of IDs from both result sets
  all_ids AS (
    SELECT id FROM keyword_ranked
    UNION
    SELECT id FROM semantic_ranked
  ),

  -- RRF score: sum(1/(k + rank_i)) for each list
  rrf_scores AS (
    SELECT
      a.id,
      (COALESCE(1.0 / (v_rrf_k + kr.rn), 0) + COALESCE(1.0 / (v_rrf_k + sr.rn), 0)) AS rrf_score
    FROM all_ids a
    LEFT JOIN keyword_ranked kr ON kr.id = a.id
    LEFT JOIN semantic_ranked sr ON sr.id = a.id
  ),

  -- Join back to get full product data, apply sort
  fused AS (
    SELECT bf.*, r.rrf_score
    FROM base_filter bf
    JOIN rrf_scores r ON r.id = bf.id
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM fused
  ),
  ordered AS (
    SELECT *
    FROM fused
    ORDER BY
      CASE WHEN sort_by = 'relevance' THEN rrf_score END DESC NULLS LAST,
      CASE WHEN sort_by = 'newest' THEN created_at END DESC NULLS LAST,
      CASE WHEN sort_by = 'price_asc' THEN price END ASC NULLS LAST,
      CASE WHEN sort_by = 'price_desc' THEN price END DESC NULLS LAST,
      created_at DESC
    LIMIT result_limit
    OFFSET result_offset
  ),
  paginated AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'user_id', o.user_id,
          'title', o.title,
          'description', o.description,
          'category', o.category,
          'subcategory', o.subcategory,
          'price', o.price,
          'currency', o.currency,
          'condition', o.condition,
          'location_department', o.location_department,
          'location_city', o.location_city,
          'images', o.images,
          'status', o.status,
          'views_count', o.views_count,
          'favorites_count', o.favorites_count,
          'contacts_count', o.contacts_count,
          'created_at', o.created_at,
          'updated_at', o.updated_at,
          'expires_at', o.expires_at,
          'relevance_score', o.rrf_score
        )
        ORDER BY
          CASE WHEN sort_by = 'relevance' THEN o.rrf_score END DESC NULLS LAST,
          CASE WHEN sort_by = 'newest' THEN o.created_at END DESC NULLS LAST,
          CASE WHEN sort_by = 'price_asc' THEN o.price END ASC NULLS LAST,
          CASE WHEN sort_by = 'price_desc' THEN o.price END DESC NULLS LAST,
          o.created_at DESC
      ) AS products_json,
      (SELECT total FROM counted) AS total_count
    FROM ordered o
  )
  SELECT
    COALESCE(p.products_json, '[]'::JSONB) AS products,
    p.total_count
  FROM paginated p;
END;
$$;

COMMENT ON FUNCTION public.search_products_semantic IS 'M4: Hybrid search (keyword + semantic) with RRF k=60. Falls back to keyword-only when query_embedding is NULL.';

GRANT EXECUTE ON FUNCTION public.search_products_semantic(
  TEXT, vector, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT
) TO anon, authenticated;
```

---

## 4. Feature Flag Design

### Option A: Database (`app_config` table) — Recommended

| Key                    | Value   | Description                          |
|------------------------|---------|--------------------------------------|
| `semantic_search_enabled` | `true` / `false` | Toggle hybrid search ON/OFF |

**Pros:** Toggle without deploy, can be changed via Supabase Dashboard or SQL  
**Cons:** One extra DB read per search request

**Read in API route:**
```typescript
const { data } = await supabase.from('app_config').select('value').eq('key', 'semantic_search_enabled').single()
const semanticEnabled = data?.value === 'true'
```

### Option B: Environment Variable

| Variable                 | Values  | Description                          |
|--------------------------|---------|--------------------------------------|
| `SEMANTIC_SEARCH_ENABLED` | `true` / `false` | Toggle hybrid search ON/OFF |

**Pros:** No DB read, fast, works in serverless  
**Cons:** Requires redeploy to change

### Recommendation: Hybrid

- **Primary:** Env var `SEMANTIC_SEARCH_ENABLED` (default: `false`)
- **Override:** If env is unset, fall back to `app_config` table
- **Rationale:** Env var for quick deploys; DB for runtime toggles without redeploy

```typescript
// Pseudocode
const semanticEnabled =
  process.env.SEMANTIC_SEARCH_ENABLED === 'true' ||
  (process.env.SEMANTIC_SEARCH_ENABLED === undefined &&
   (await getConfig('semantic_search_enabled')) === 'true')
```

---

## 5. Edge Function Design

### 5.1 `generate-embedding` — Pseudocode

**Path:** `supabase/functions/generate-embedding/index.ts`

**Invocation:**
1. **Database Webhook** (product INSERT/UPDATE) → POST with `{ type, table, record }`
2. **API route** (search query embedding) → POST with `{ text: "user search query" }`

```typescript
// supabase/functions/generate-embedding/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HF_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization' }, 401)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const body = await req.json()

    // --- Mode 1: Database Webhook (product INSERT/UPDATE) ---
    if (body.type === 'INSERT' || body.type === 'UPDATE') {
      const record = body.record ?? body.new_record ?? body
      const productId = record.id
      const text = buildProductText(record)
      if (!text?.trim()) return json({ error: 'No text to embed' }, 400)

      const embedding = await callHuggingFace(text)
      if (!embedding) return json({ error: 'HF embedding failed' }, 500)

      const { error } = await supabase
        .from('products')
        .update({ embedding })
        .eq('id', productId)

      if (error) return json({ error: error.message }, 500)
      return json({ success: true, product_id: productId })
    }

    // --- Mode 2: Direct text (search query embedding) ---
    const { text } = body
    if (!text?.trim()) return json({ error: 'Missing text' }, 400)

    const embedding = await callHuggingFace(text)
    if (!embedding) return json({ error: 'HF embedding failed' }, 500)

    return json({ embedding })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function buildProductText(record: Record<string, unknown>): string {
  const parts = [
    record.title,
    record.description,
    record.category,
    record.subcategory,
  ].filter(Boolean)
  return parts.join(' ')
}

async function callHuggingFace(text: string): Promise<number[] | null> {
  const HF_TOKEN = Deno.env.get('HUGGINGFACE_API_KEY')
  if (!HF_TOKEN) throw new Error('HUGGINGFACE_API_KEY not set')

  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  })

  if (!res.ok) {
    console.error('HF API error:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  // HF returns [[0.1, -0.2, ...]] for feature extraction
  const embedding = Array.isArray(data)?.[0] ?? data
  if (!Array.isArray(embedding) || embedding.length !== 384) return null
  return embedding
}

function json(obj: object, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 5.2 Hugging Face API

- **Endpoint:** `POST https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction`
- **Headers:** `Authorization: Bearer {HF_TOKEN}`, `Content-Type: application/json`
- **Body:** `{ "inputs": "text to embed" }`
- **Response:** `[0.1, -0.2, ...]` (384 floats, flat array)
- **Free tier:** ~30K requests/month
- **Note:** The old `api-inference.huggingface.co` endpoint is deprecated. Use `router.huggingface.co` instead.

### 5.3 Database Webhook Setup

**Supabase Dashboard → Database → Webhooks → Create**

| Field    | Value                                                                 |
|----------|-----------------------------------------------------------------------|
| Name     | `product-embedding-webhook`                                            |
| Table    | `products`                                                            |
| Events   | `INSERT`, `UPDATE`                                                    |
| Type     | `Supabase Edge Function`                                             |
| Function | `generate-embedding`                                                  |

**Payload:** Default (sends `type`, `table`, `record`, `old_record` for UPDATE)

**Note:** Webhook fires after commit. For INSERT, `record` has the new row. For UPDATE, use `record` (new) or `old_record` (previous). Build text from `record` and update `record.id` with the new embedding.

---

## 6. API Route Changes

**File:** `app/api/search/route.ts`

### Logic Flow

```
1. Parse params (q, category, priceMin, priceMax, department, condition, sort, page, limit)
2. Check feature flag: semantic_search_enabled (env or app_config)
3. If OFF → call search_products() (existing M3) → return
4. If ON and q is empty → call search_products() (browse mode, no embedding needed)
5. If ON and q is non-empty:
   a. Call Edge Function generate-embedding with { text: q }
   b. On error → fallback to search_products()
   c. On success → call search_products_semantic(search_query, query_embedding, filters...)
6. Return { products, totalCount, page, limit, totalPages, hasMore }
```

### Pseudocode

```typescript
// app/api/search/route.ts (changes)

const semanticEnabled = process.env.SEMANTIC_SEARCH_ENABLED === 'true' ||
  (await getSemanticConfigFromDb(supabase))

if (!semanticEnabled || !params.q?.trim()) {
  // Keyword only
  const { data, error } = await supabase.rpc('search_products', { ... })
  // ... existing logic
  return NextResponse.json({ products, totalCount, ... })
}

// Hybrid: get query embedding
const embedRes = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-embedding`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, // or anon for public
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: params.q }),
  }
)

if (!embedRes.ok) {
  // Fallback to keyword
  const { data } = await supabase.rpc('search_products', { ... })
  return NextResponse.json({ ... })
}

const { embedding } = await embedRes.json()

const { data, error } = await supabase.rpc('search_products_semantic', {
  search_query: params.q,
  query_embedding: embedding,
  category_filter: params.category || null,
  price_min: params.priceMin || null,
  price_max: params.priceMax || null,
  location_department_filter: params.department || null,
  condition_filter: params.condition || null,
  status_filter: params.status || null,
  sort_by: params.sort || 'relevance',
  result_limit: limit,
  result_offset: offset,
})

// Same response shape as search_products
const result = data?.[0] || { products: [], total_count: 0 }
return NextResponse.json({
  products: result.products,
  totalCount: result.total_count,
  page,
  limit,
  totalPages: Math.ceil(result.total_count / limit),
  hasMore: offset + result.products.length < result.total_count,
})
```

### Helper: Read feature flag from DB

```typescript
async function getSemanticConfigFromDb(supabase: SupabaseClient): Promise<boolean> {
  if (process.env.SEMANTIC_SEARCH_ENABLED !== undefined) return false
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'semantic_search_enabled')
    .single()
  return data?.value === 'true'
}
```

---

## 7. Auto-Embed on Product Create/Update

| Approach            | Pros                          | Cons                          |
|---------------------|-------------------------------|-------------------------------|
| **Database Webhook**| Async, no app code change     | Requires Dashboard config     |
| **App code trigger**| Explicit control              | Must call Edge Function from create/update flows |
| **DB trigger + pg_net** | Native to Postgres         | More complex, needs HTTP from DB |

**Recommendation:** Database Webhook (Option 1) — Supabase-native, no app changes, async.

---

## 8. Hybrid Search Algorithm (RRF)

| Step | Action |
|------|--------|
| 1 | Keyword: top 50 from FTS (ts_rank_cd), with filters |
| 2 | Semantic: top 50 from `embedding <=> query_embedding`, with filters |
| 3 | RRF: `score(id) = Σ 1/(k + rank_i)` with k=60 |
| 4 | Sort by RRF score, apply sort_by (relevance, newest, price_asc, price_desc) |
| 5 | Paginate: LIMIT/OFFSET |

**Edge cases:**
- `search_query` empty → use `search_products` (keyword browse)
- `query_embedding` null → `search_products_semantic` delegates to `search_products`
- No keyword matches → semantic results only (RRF still applies)
- No embeddings yet → keyword results only (RRF still applies)

---

## 9. Environment Variables

| Variable                  | Required | Description                          |
|---------------------------|----------|--------------------------------------|
| `HUGGINGFACE_API_KEY`     | Yes (Edge Function) | Hugging Face Inference API token. Set in Supabase Dashboard → Edge Functions → Secrets. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (API route) | For server-side Edge Function calls. Set in `.env.local`. |
| `SEMANTIC_SEARCH_ENABLED` | No       | `true` / `false`; overrides DB config when set |

---

## 10. Migration Path

| Phase | Action |
|-------|--------|
| **MVP** | Hugging Face Inference API (free tier), Database Webhook |
| **Growth** | Optional: FastAPI + Sentence Transformers (self-hosted) for higher volume |
| **Scale** | Consider dedicated embedding service, batch backfill for embeddings |

---

## 11. Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDDHHMMSS_add_semantic_search.sql` | Create |
| `supabase/functions/generate-embedding/index.ts` | Create |
| `app/api/search/route.ts` | Modify (feature flag, hybrid call) |
| `types/database.ts` | Regenerate (embedding, search_products_semantic) |
| Supabase Dashboard | Configure Database Webhook |
