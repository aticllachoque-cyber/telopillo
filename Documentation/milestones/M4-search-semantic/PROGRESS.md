# M4 Progress Report

**Milestone:** Search - Semantic (Embeddings)  
**Status:** COMPLETE  
**Last Updated:** February 14, 2026  
**Started:** February 14, 2026  
**Completed:** February 14, 2026

---

## Overall Progress

```
Phase 1: Database (pgvector)           ████████████████████ 100% ✅
Phase 2: Feature Flag System           ████████████████████ 100% ✅
Phase 3: Edge Function (HF)            ████████████████████ 100% ✅
Phase 4: Hybrid Search RPC (RRF)       ████████████████████ 100% ✅
Phase 5: API Route + Fallback          ████████████████████ 100% ✅
Phase 6: Auto-embed + Backfill         ████████████████████ 100% ✅
Phase 7: Performance Optimizations     ████████████████████ 100% ✅
Phase 8: Search Quality Tuning         ████████████████████ 100% ✅
Phase 9: E2E Testing                   ████████████████████ 100% ✅

Overall: ████████████████████ 100% ✅
```

---

## Phase 1: Database (pgvector + embedding) ✅

- [x] Enable `vector` extension on Supabase
- [x] Add `embedding vector(384)` column to products
- [x] Create HNSW index (`idx_products_embedding_hnsw`) with cosine distance
- [x] Migration pushed and applied

### Deliverables

- `supabase/migrations/20260214180000_add_semantic_search.sql`

---

## Phase 2: Feature Flag System ✅

- [x] Create `app_config` table with RLS (read: all, write: service_role)
- [x] Insert `semantic_search_enabled = false` default
- [x] Create `lib/feature-flags.ts` utility
- [x] Priority: env var `SEMANTIC_SEARCH_ENABLED` -> DB `app_config` -> default false

### Deliverables

- `app_config` table in database
- `lib/feature-flags.ts`

### How to Toggle

```bash
# Enable via env var (.env.local)
SEMANTIC_SEARCH_ENABLED=true

# Or via Supabase SQL
UPDATE app_config SET value = 'true' WHERE key = 'semantic_search_enabled';
```

---

## Phase 3: Edge Function (Hugging Face) ✅

- [x] Create `generate-embedding` Edge Function
- [x] Mode 1: DB webhook (product INSERT/UPDATE -> embed -> update products.embedding)
- [x] Mode 2: Direct text (search query -> return embedding vector)
- [x] Mode 3: Backfill (batch process products without embeddings)
- [x] Model: `paraphrase-multilingual-MiniLM-L12-v2` (384 dims, multilingual)
- [x] Retry logic: up to 2 retries with exponential backoff for 503/429/5xx
- [x] Title-boosted text: title repeated 2x for stronger signal
- [x] Description truncation: capped at 150 words to prevent dilution
- [x] Updated HF API URL: `router.huggingface.co` (old `api-inference.huggingface.co` deprecated)
- [x] Deploy to Supabase

### Deliverables

- `supabase/functions/generate-embedding/index.ts`
- Deployed to Supabase Edge Functions (v6)

---

## Phase 4: Hybrid Search RPC (RRF) ✅

- [x] `search_products_semantic()` RPC function
- [x] Keyword top 50 + Semantic top 50 -> RRF merge (k=60)
- [x] Adaptive RRF weights: 2x semantic weight when keyword returns 0 hits
- [x] Falls back to `search_products()` when no embedding provided
- [x] All filters, sort, pagination maintained
- [x] `SECURITY INVOKER` for RLS compliance

### Deliverables

- `supabase/migrations/20260214210000_improve_rrf_weights.sql`

---

## Phase 5: API Route + Fallback ✅

- [x] Updated `app/api/search/route.ts` with hybrid support
- [x] Checks feature flag before attempting semantic search
- [x] Gets query embedding from Edge Function
- [x] Calls `search_products_semantic` with embedding
- [x] Falls back to keyword-only if: flag OFF, no query, embedding fails, or RPC fails
- [x] Transparent to frontend (same response shape + new metadata)

---

## Phase 6: Auto-embed + Backfill ✅

- [x] PostgreSQL trigger `products_generate_embedding_trigger` on INSERT/UPDATE of text fields
- [x] Uses `pg_net` extension for async HTTP POST to Edge Function
- [x] Config stored in `app_config` table (supabase_url, service_role_key)
- [x] Backfill script: `scripts/backfill-embeddings.sh`
- [x] Backfill mode in Edge Function: batch process products missing embeddings
- [x] Tested: new products get embeddings automatically within ~15 seconds

### Deliverables

- `supabase/migrations/20260214200000_add_embedding_webhook.sql`
- `supabase/migrations/20260214200001_fix_embedding_webhook_config.sql`
- `scripts/backfill-embeddings.sh`

---

## Phase 7: Performance Optimizations ✅

- [x] In-memory query embedding cache (5 min TTL, max 200 entries)
- [x] Cache hit: ~340ms vs uncached ~940ms (2.8x faster)
- [x] API response includes `searchMode`, `embeddingCached`, `latencyMs`
- [x] Dev-mode console logging: embedding time, search mode, total latency

---

## Phase 8: Search Quality Tuning ✅

- [x] Title boost: title repeated 2x in embedding text for stronger signal
- [x] Adaptive RRF: 2x semantic weight when keyword has 0 hits (English queries)
- [x] Description truncation at 150 words to prevent title dilution
- [x] Result: **10/10 correct #1 ranking** on test suite (up from 8/10)

### Test Results

| Query | Expected #1 | Actual #1 | Pass |
|---|---|---|---|
| "computadora portatil" | Laptop HP | Laptop HP | Yes |
| "headphones wireless" | Audifonos Sony | Audifonos Sony | Yes |
| "reloj para hacer ejercicio" | Smartwatch | Smartwatch | Yes |
| "pantalla para dibujar" | Tablet Samsung | Tablet Samsung | Yes |
| "bateria para celular viaje" | Cargador Anker | Cargador Anker | Yes |
| "couch living room" | Sofa | Sofa | Yes |
| "luz para leer de noche" | Lampara | Lampara | Yes |
| "repisa para libros" | Estante Flotante | Estante Flotante | Yes |
| "tapete artesanal boliviano" | Alfombra | Alfombra | Yes |
| "espejo para dormitorio" | Espejo Decorativo | Espejo Decorativo | Yes |

---

## Phase 9: E2E Testing ✅

- [x] Playwright E2E test: `tests/m4-semantic-search-e2e.spec.ts`
- [x] 5 test cases, all passing
- [x] 14 screenshots captured per run
- [x] Tests: electronics queries, home queries, category isolation, API metadata, mobile view

### Run Tests

```bash
# Headless
npx playwright test tests/m4-semantic-search-e2e.spec.ts --project=chromium

# Headed (visual)
npx playwright test tests/m4-semantic-search-e2e.spec.ts --project=chromium --headed
```

---

## Architecture

```
User searches "computadora portatil"
        |
API checks feature flag (env -> app_config -> default false)
        |
+---- FF OFF -----------------------------------+
|  search_products() (keyword FTS only)         |
+-----------------------------------------------+
        | (FF ON)
        v
Query Embedding Cache (5min TTL)
  |-- HIT:  use cached embedding (~1ms)
  |-- MISS: Edge Function -> HF API (~400ms)
        |
search_products_semantic()
  |-- Keyword FTS top 50 (ts_rank)
  |-- Semantic top 50 (cosine similarity)
  |-- Adaptive RRF merge (k=60, 2x semantic when 0 keyword hits)
        |
JSON response {products, totalCount, searchMode, embeddingCached, latencyMs}
```

---

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260214180000_add_semantic_search.sql` | pgvector, embedding, app_config, hybrid RPC |
| `supabase/migrations/20260214200000_add_embedding_webhook.sql` | pg_net trigger for auto-embed |
| `supabase/migrations/20260214200001_fix_embedding_webhook_config.sql` | Config fix for trigger |
| `supabase/migrations/20260214210000_improve_rrf_weights.sql` | Adaptive RRF weights |
| `supabase/functions/generate-embedding/index.ts` | Edge Function: embeddings, retry, backfill |
| `lib/feature-flags.ts` | Feature flag utility (env + DB) |
| `scripts/backfill-embeddings.sh` | Batch embedding backfill script |
| `tests/m4-semantic-search-e2e.spec.ts` | E2E Playwright tests (5 cases, 14 screenshots) |
| `Documentation/milestones/M4-search-semantic/ARCHITECTURE_DESIGN.md` | Architecture design |

### Modified Files

| File | Changes |
|------|---------|
| `app/api/search/route.ts` | Hybrid search, embedding cache, search metadata |
| `types/database.ts` | Regenerated with embedding, app_config, semantic RPC |
| `tsconfig.json` | Excluded `supabase/functions` (Deno runtime) |
| `.env.example` | Added SEMANTIC_SEARCH_ENABLED flag |

---

## Activation Checklist

To enable semantic search:

1. [x] Set Hugging Face API key: `npx supabase secrets set HUGGINGFACE_API_KEY=hf_xxx`
2. [x] Auto-embed trigger configured via pg_net + app_config
3. [x] Backfill existing products: `./scripts/backfill-embeddings.sh`
4. [x] Enable flag: `SEMANTIC_SEARCH_ENABLED=true` in `.env.local`
5. [x] Tested with 13 products, 10/10 ranking accuracy

---

**Milestone Status:** COMPLETE  
**Next Milestone:** M5 - Real-time Chat
