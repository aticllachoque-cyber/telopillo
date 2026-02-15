-- =============================================================================
-- M4.5 Phase 6a: Add seller info (profiles + business_profiles) to search RPCs
-- =============================================================================
-- Both search_products and search_products_semantic now LEFT JOIN profiles
-- and business_profiles to include seller information in product results.
-- New parameter: seller_type_filter ('business' | 'personal' | NULL)
-- Uses business_profiles row existence as source of truth (add-on model).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Drop old function signatures (different param list prevents OR REPLACE)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_products(
  TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT
);

DROP FUNCTION IF EXISTS public.search_products_semantic(
  TEXT, vector(384), TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT
);


-- ---------------------------------------------------------------------------
-- 1. Replace search_products (keyword FTS) with seller info
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_products(
  search_query TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  price_min DECIMAL DEFAULT NULL,
  price_max DECIMAL DEFAULT NULL,
  location_department_filter TEXT DEFAULT NULL,
  condition_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INT DEFAULT 24,
  result_offset INT DEFAULT 0,
  seller_type_filter TEXT DEFAULT NULL
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
  v_total BIGINT;
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
BEGIN
  v_has_search := (search_query IS NOT NULL AND trim(search_query) != '');
  IF v_has_search THEN
    v_tsquery := plainto_tsquery('spanish', trim(search_query));
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.id,
      p.user_id,
      p.title,
      p.description,
      p.category,
      p.subcategory,
      p.price,
      p.currency,
      p.condition,
      p.location_department,
      p.location_city,
      p.images,
      p.status,
      p.views_count,
      p.favorites_count,
      p.contacts_count,
      p.created_at,
      p.updated_at,
      p.expires_at,
      -- Seller info from profiles
      pr.full_name AS seller_name,
      pr.avatar_url AS seller_avatar_url,
      pr.verification_level AS seller_verification_level,
      -- Business info (NULL when no business profile)
      bp.business_name AS seller_business_name,
      bp.slug AS seller_business_slug,
      bp.business_logo_url AS seller_business_logo,
      CASE
        WHEN v_has_search AND p.search_vector @@ v_tsquery
        THEN ts_rank_cd(p.search_vector, v_tsquery, 32)
        ELSE 0::REAL
      END AS relevance_score
    FROM public.products p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    LEFT JOIN public.business_profiles bp ON bp.id = p.user_id
    WHERE
      (p.status = 'active' OR p.user_id = auth.uid())
      AND (
        NOT v_has_search
        OR (p.search_vector @@ v_tsquery)
      )
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (location_department_filter IS NULL OR p.location_department = location_department_filter)
      AND (condition_filter IS NULL OR p.condition = condition_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
      -- Seller type filter: 'business' = has business_profiles row, 'personal' = no row
      AND (
        seller_type_filter IS NULL
        OR (seller_type_filter = 'business' AND bp.id IS NOT NULL)
        OR (seller_type_filter = 'personal' AND bp.id IS NULL)
      )
  ),
  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM filtered
  ),
  ordered AS (
    SELECT *
    FROM filtered
    ORDER BY
      CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
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
          'relevance_score', o.relevance_score,
          -- Seller fields
          'seller_name', o.seller_name,
          'seller_avatar_url', o.seller_avatar_url,
          'seller_verification_level', o.seller_verification_level,
          'seller_business_name', o.seller_business_name,
          'seller_business_slug', o.seller_business_slug,
          'seller_business_logo', o.seller_business_logo
        )
        ORDER BY
          CASE WHEN sort_by = 'relevance' THEN o.relevance_score END DESC NULLS LAST,
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

COMMENT ON FUNCTION public.search_products(TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT)
  IS 'M4.5: Keyword search with seller info (profiles + business_profiles LEFT JOINs) and seller_type filter.';


-- ---------------------------------------------------------------------------
-- 2. Replace search_products_semantic (hybrid search) with seller info
-- ---------------------------------------------------------------------------

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
  result_offset INT DEFAULT 0,
  seller_type_filter TEXT DEFAULT NULL
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
  v_keyword_count INT;
BEGIN
  v_has_search := (search_query IS NOT NULL AND trim(search_query) != '');
  v_has_semantic := (query_embedding IS NOT NULL);

  IF v_has_search THEN
    v_tsquery := plainto_tsquery('spanish', trim(search_query));
  END IF;

  -- When no semantic: delegate to keyword-only (which now includes seller info)
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
      result_offset,
      seller_type_filter
    );
    RETURN;
  END IF;

  -- Hybrid: keyword top 50 + semantic top 50 -> RRF merge with adaptive weights
  RETURN QUERY
  WITH
  base_filter AS (
    SELECT p.id, p.user_id, p.title, p.description, p.category, p.subcategory,
           p.price, p.currency, p.condition, p.location_department, p.location_city,
           p.images, p.status, p.views_count, p.favorites_count, p.contacts_count,
           p.created_at, p.updated_at, p.expires_at,
           -- Seller info
           pr.full_name AS seller_name,
           pr.avatar_url AS seller_avatar_url,
           pr.verification_level AS seller_verification_level,
           bp.business_name AS seller_business_name,
           bp.slug AS seller_business_slug,
           bp.business_logo_url AS seller_business_logo,
           bp.id AS bp_id
    FROM public.products p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    LEFT JOIN public.business_profiles bp ON bp.id = p.user_id
    WHERE (p.status = 'active' OR p.user_id = auth.uid())
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (location_department_filter IS NULL OR p.location_department = location_department_filter)
      AND (condition_filter IS NULL OR p.condition = condition_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
      AND (
        seller_type_filter IS NULL
        OR (seller_type_filter = 'business' AND bp.id IS NOT NULL)
        OR (seller_type_filter = 'personal' AND bp.id IS NULL)
      )
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

  keyword_hit_count AS (
    SELECT COUNT(*)::INT AS cnt FROM keyword_ranked
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
      (
        COALESCE(1.0 / (v_rrf_k + kr.rn), 0)
        + CASE
            WHEN (SELECT cnt FROM keyword_hit_count) = 0
            THEN COALESCE(2.0 / (v_rrf_k + sr.rn), 0)
            ELSE COALESCE(1.0 / (v_rrf_k + sr.rn), 0)
          END
      ) AS rrf_score
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
          'relevance_score', o.rrf_score,
          -- Seller fields
          'seller_name', o.seller_name,
          'seller_avatar_url', o.seller_avatar_url,
          'seller_verification_level', o.seller_verification_level,
          'seller_business_name', o.seller_business_name,
          'seller_business_slug', o.seller_business_slug,
          'seller_business_logo', o.seller_business_logo
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

COMMENT ON FUNCTION public.search_products_semantic(TEXT, vector(384), TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT)
  IS 'M4.5: Hybrid search with adaptive RRF + seller info (profiles + business_profiles LEFT JOINs) and seller_type filter.';
