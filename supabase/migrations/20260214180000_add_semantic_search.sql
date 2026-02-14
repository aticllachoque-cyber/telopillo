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

INSERT INTO public.app_config (key, value)
VALUES ('semantic_search_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_select_policy"
  ON public.app_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

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

  -- When no semantic: delegate to keyword-only
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

  -- Hybrid: keyword top 50 + semantic top 50 -> RRF merge
  RETURN QUERY
  WITH
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

  all_ids AS (
    SELECT id FROM keyword_ranked
    UNION
    SELECT id FROM semantic_ranked
  ),

  rrf_scores AS (
    SELECT
      a.id,
      (COALESCE(1.0 / (v_rrf_k + kr.rn), 0) + COALESCE(1.0 / (v_rrf_k + sr.rn), 0)) AS rrf_score
    FROM all_ids a
    LEFT JOIN keyword_ranked kr ON kr.id = a.id
    LEFT JOIN semantic_ranked sr ON sr.id = a.id
  ),

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
