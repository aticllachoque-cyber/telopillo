-- =============================================================================
-- Fix demand search precision
--
-- Problems fixed:
--   1. search_vector was unweighted (title/description/category all same weight)
--   2. search_demands_hybrid returned ALL posts even when searching (no threshold)
--   3. total_count included non-matching posts when a query was active
-- =============================================================================

-- =============================================================================
-- 1. Weighted search_vector trigger (A: title, B: description, C: category)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_demand_posts_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.category, '') || ' ' || coalesce(NEW.subcategory, '')), 'C');
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_demand_posts_search_vector IS
  'Weighted FTS vector: A=title, B=description, C=category+subcategory. Matches product search pattern.';

-- =============================================================================
-- 2. Backfill existing demand posts search_vector with new weights
-- =============================================================================

UPDATE public.demand_posts
SET search_vector =
  setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(category, '') || ' ' || coalesce(subcategory, '')), 'C');

-- =============================================================================
-- 3. Fix search_demands_hybrid: filter non-matching results, fix total_count
-- =============================================================================

CREATE OR REPLACE FUNCTION public.search_demands_hybrid(
  search_query TEXT DEFAULT NULL,
  query_embedding vector(384) DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  department_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'newest',
  result_limit INT DEFAULT 12,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  demands JSONB,
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

  RETURN QUERY
  WITH
  base_filter AS (
    SELECT
      dp.id, dp.user_id, dp.title, dp.description,
      dp.category, dp.subcategory,
      dp.location_department, dp.location_city,
      dp.price_min, dp.price_max,
      dp.status, dp.offers_count,
      dp.expires_at, dp.created_at, dp.updated_at,
      pr.full_name AS poster_name,
      pr.avatar_url AS poster_avatar_url,
      pr.phone AS poster_phone,
      pr.verification_level AS poster_verification_level,
      bp.business_name AS poster_business_name,
      bp.slug AS poster_business_slug
    FROM public.demand_posts dp
    LEFT JOIN public.profiles pr ON pr.id = dp.user_id
    LEFT JOIN public.business_profiles bp ON bp.id = dp.user_id
    WHERE dp.status = 'active'
      AND dp.expires_at > NOW()
      AND (category_filter IS NULL OR dp.category = category_filter)
      AND (department_filter IS NULL OR dp.location_department = department_filter)
  ),

  keyword_results AS (
    SELECT bf.id,
      CASE WHEN v_has_search
        THEN ts_rank_cd(dp.search_vector, v_tsquery, 32)
        ELSE 0
      END AS relevance
    FROM base_filter bf
    JOIN public.demand_posts dp ON dp.id = bf.id
    WHERE (NOT v_has_search OR (dp.search_vector @@ v_tsquery))
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
    SELECT bf.id, (dp.embedding <=> query_embedding) AS distance
    FROM base_filter bf
    JOIN public.demand_posts dp ON dp.id = bf.id
    WHERE v_has_semantic AND dp.embedding IS NOT NULL
    ORDER BY dp.embedding <=> query_embedding
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

  -- When searching: only include posts that had at least one match (keyword or semantic).
  -- When browsing (no query): include all posts from base_filter.
  matched AS (
    SELECT
      bf.*,
      COALESCE(r.rrf_score, 0) AS rrf_score
    FROM base_filter bf
    INNER JOIN rrf_scores r ON r.id = bf.id
    WHERE v_has_search OR v_has_semantic
    UNION ALL
    SELECT
      bf.*,
      0::DOUBLE PRECISION AS rrf_score
    FROM base_filter bf
    WHERE NOT v_has_search AND NOT v_has_semantic
  ),

  counted AS (
    SELECT COUNT(*)::BIGINT AS total FROM matched
  ),
  ordered AS (
    SELECT *
    FROM matched
    ORDER BY
      CASE WHEN sort_by = 'relevance' THEN rrf_score END DESC NULLS LAST,
      CASE WHEN sort_by = 'newest' THEN created_at END DESC NULLS LAST,
      CASE WHEN sort_by = 'most_offers' THEN offers_count END DESC NULLS LAST,
      CASE WHEN sort_by = 'expiring_soon' THEN expires_at END ASC NULLS LAST,
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
          'location_department', o.location_department,
          'location_city', o.location_city,
          'price_min', o.price_min,
          'price_max', o.price_max,
          'status', o.status,
          'offers_count', o.offers_count,
          'expires_at', o.expires_at,
          'created_at', o.created_at,
          'updated_at', o.updated_at,
          'relevance_score', o.rrf_score,
          'poster_name', o.poster_name,
          'poster_avatar_url', o.poster_avatar_url,
          'poster_phone', o.poster_phone,
          'poster_verification_level', o.poster_verification_level,
          'poster_business_name', o.poster_business_name,
          'poster_business_slug', o.poster_business_slug
        )
        ORDER BY
          CASE WHEN sort_by = 'relevance' THEN o.rrf_score END DESC NULLS LAST,
          CASE WHEN sort_by = 'newest' THEN o.created_at END DESC NULLS LAST,
          CASE WHEN sort_by = 'most_offers' THEN o.offers_count END DESC NULLS LAST,
          CASE WHEN sort_by = 'expiring_soon' THEN o.expires_at END ASC NULLS LAST,
          o.created_at DESC
      ) AS demands_json,
      (SELECT total FROM counted) AS total_count
    FROM ordered o
  )
  SELECT
    COALESCE(p.demands_json, '[]'::JSONB) AS demands,
    COALESCE(p.total_count, 0) AS total_count
  FROM paginated p;
END;
$$;

COMMENT ON FUNCTION public.search_demands_hybrid IS
  'Hybrid keyword + semantic search for demand posts with RRF fusion. Only returns matching posts when a query is active.';
