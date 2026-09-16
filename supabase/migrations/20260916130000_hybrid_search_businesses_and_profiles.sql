-- =============================================================================
-- Hybrid search for businesses and profiles (mirrors products M4 pipeline)
--
-- Adds semantic search on top of the keyword FTS introduced in
-- 20260916120000_add_search_businesses_and_profiles.sql:
--   1. embedding vector(384) columns + partial HNSW indexes on
--      business_profiles and profiles
--   2. Text builders + pg_net triggers that call the generate-embedding
--      Edge Function (same pattern as products / demand_posts)
--   3. search_businesses / search_profiles gain an optional query_embedding
--      param and fuse keyword + semantic results with adaptive RRF
--      (k=60, semantic weight 2x when keyword has 0 hits) — same weights as
--      search_products_semantic / search_demands_hybrid.
--
-- Privacy contract unchanged: no phone ever leaves profiles; search_profiles
-- still INNER JOINs active sellers only; both RPCs remain SECURITY INVOKER.
--
-- Embedding text:
--   business: business_name (repeated, title-weight) + category + description
--             truncated to ~150 words (same dilution guard as products)
--   profile:  full_name (repeated) + owning business name/category/description
--             so queries like "muebles" surface the owner behind Muebles el
--             Roble, not just the storefront.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Embedding columns + HNSW indexes
-- ---------------------------------------------------------------------------

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS embedding vector(384);

COMMENT ON COLUMN public.business_profiles.embedding IS
  'Semantic embedding from business_name+category+description. Model: paraphrase-multilingual-MiniLM-L12-v2 (384d).';

CREATE INDEX IF NOT EXISTS idx_business_profiles_embedding_hnsw
  ON public.business_profiles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS embedding vector(384);

COMMENT ON COLUMN public.profiles.embedding IS
  'Semantic embedding from full_name + owning business context. Model: paraphrase-multilingual-MiniLM-L12-v2 (384d).';

CREATE INDEX IF NOT EXISTS idx_profiles_embedding_hnsw
  ON public.profiles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64)
  WHERE embedding IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Embedding text builders (shared by triggers and Edge Function backfill)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.build_business_embedding_text(p_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT concat_ws(
    '. ',
    NULLIF(bp.business_name, ''),
    'Negocio: ' || NULLIF(bp.business_name, ''),
    NULLIF(bp.business_category, '') || '',
    CASE
      WHEN bp.business_description IS NULL OR bp.business_description = '' THEN NULL
      ELSE 'Descripción: ' || array_to_string(
        (string_to_array(bp.business_description, ' '))[1:150], ' '
      )
    END
  )
  FROM business_profiles bp
  WHERE bp.id = p_id;
$$;

COMMENT ON FUNCTION public.build_business_embedding_text(UUID) IS
  'Structured text for business embeddings. Name repeated twice to boost its signal; description truncated to ~150 words (products pattern).';

CREATE OR REPLACE FUNCTION public.build_profile_embedding_text(p_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT concat_ws(
    '. ',
    NULLIF(pr.full_name, ''),
    'Vendedor: ' || NULLIF(pr.full_name, ''),
    NULLIF(bp.business_name, ''),
    NULLIF(bp.business_category, ''),
    CASE
      WHEN bp.business_description IS NULL OR bp.business_description = '' THEN NULL
      ELSE 'Descripción: ' || array_to_string(
        (string_to_array(bp.business_description, ' '))[1:150], ' '
      )
    END
  )
  FROM profiles pr
  LEFT JOIN business_profiles bp ON bp.id = pr.id
  WHERE pr.id = p_id;
$$;

COMMENT ON FUNCTION public.build_profile_embedding_text(UUID) IS
  'Structured text for profile embeddings: name + owning business context. Never includes phone (TELO-003).';

-- ---------------------------------------------------------------------------
-- 3. pg_net triggers -> generate-embedding Edge Function
--    (same app_config lookup as trigger_generate_embedding)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trigger_generate_business_or_profile_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_url TEXT;
  v_headers JSONB;
  v_business_text TEXT;
  v_profile_text TEXT;
BEGIN
  SELECT value INTO v_supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_config WHERE key = 'service_role_key';

  -- Skip if config not available (same guard as the products trigger)
  IF v_supabase_url IS NULL OR v_supabase_url = '' OR
     v_service_key IS NULL OR v_service_key = '' THEN
    RETURN NEW;
  END IF;

  v_url := rtrim(v_supabase_url, '/') || '/functions/v1/generate-embedding';
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_service_key
  );

  IF TG_TABLE_NAME = 'business_profiles' THEN
    v_business_text := public.build_business_embedding_text(NEW.id);
    IF v_business_text IS NOT NULL AND v_business_text <> '' THEN
      PERFORM net.http_post(
        url := v_url,
        headers := v_headers,
        body := jsonb_build_object(
          'type', 'BUSINESS',
          'record', jsonb_build_object('id', NEW.id, 'text', v_business_text)
        )
      );
    END IF;

    -- Owner profile embedding includes business context: refresh it too.
    IF EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = NEW.id) THEN
      v_profile_text := public.build_profile_embedding_text(NEW.id);
      IF v_profile_text IS NOT NULL AND v_profile_text <> '' THEN
        PERFORM net.http_post(
          url := v_url,
          headers := v_headers,
          body := jsonb_build_object(
            'type', 'PROFILE',
            'record', jsonb_build_object('id', NEW.id, 'text', v_profile_text)
          )
        );
      END IF;
    END IF;
  ELSE
    -- profiles: name + owning business context
    v_profile_text := public.build_profile_embedding_text(NEW.id);
    IF v_profile_text IS NOT NULL AND v_profile_text <> '' THEN
      PERFORM net.http_post(
        url := v_url,
        headers := v_headers,
        body := jsonb_build_object(
          'type', 'PROFILE',
          'record', jsonb_build_object('id', NEW.id, 'text', v_profile_text)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_generate_business_or_profile_embedding IS
  'Async call to generate-embedding Edge Function via pg_net on business/profile INSERT/UPDATE.';

DROP TRIGGER IF EXISTS business_profiles_generate_embedding_trigger ON public.business_profiles;
CREATE TRIGGER business_profiles_generate_embedding_trigger
  AFTER INSERT OR UPDATE OF business_name, business_category, business_description
  ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_business_or_profile_embedding();

COMMENT ON TRIGGER business_profiles_generate_embedding_trigger ON public.business_profiles IS
  'Auto-generate semantic embedding when business text fields change.';

DROP TRIGGER IF EXISTS profiles_generate_embedding_trigger ON public.profiles;
CREATE TRIGGER profiles_generate_embedding_trigger
  AFTER INSERT OR UPDATE OF full_name
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_generate_business_or_profile_embedding();

COMMENT ON TRIGGER profiles_generate_embedding_trigger ON public.profiles IS
  'Auto-generate semantic embedding when the profile name changes.';

-- ---------------------------------------------------------------------------
-- 1b. Expose profiles.embedding through profiles_public
--     search_profiles is SECURITY INVOKER and anon has no SELECT on profiles
--     (TELO-003 hardening), so the hybrid path must read the embedding through
--     the owner-scoped public view — same sanctioned projection, still no
--     phone, no extra RLS surface on the base table.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  full_name,
  avatar_url,
  location_city,
  location_department,
  rating_average,
  rating_count,
  is_verified,
  verification_level,
  account_type,
  phone_verified,
  onboarding_completed,
  created_at,
  updated_at,
  embedding
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS
  'Public profile fields without phone (TELO-003), plus the semantic embedding used by hybrid search. Use for cross-user reads via anon/authenticated.';

-- ---------------------------------------------------------------------------
-- 4. search_businesses: + query_embedding, adaptive RRF
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_businesses(TEXT, TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.search_businesses(
  search_query TEXT DEFAULT '',
  query_embedding vector(384) DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  location_department_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INT DEFAULT 24,
  result_offset INT DEFAULT 0
)
RETURNS TABLE(businesses JSONB, total_count BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
  v_has_semantic BOOLEAN;
  v_trimmed TEXT;
  v_rrf_k CONSTANT INT := 60;
BEGIN
  v_trimmed := COALESCE(NULLIF(trim(COALESCE(search_query, '')), ''), '');
  v_has_search := v_trimmed <> '';
  v_has_semantic := (query_embedding IS NOT NULL);

  -- No semantic: delegate to the keyword-only path (previous behaviour)
  IF NOT v_has_semantic THEN
    IF v_has_search AND v_trimmed ~ '\| | & ' THEN
      v_tsquery := to_tsquery('spanish', v_trimmed);
    ELSE
      v_tsquery := plainto_tsquery('spanish', v_trimmed);
    END IF;

    RETURN QUERY
    WITH filtered AS (
      SELECT
        bp.id,
        bp.business_name,
        bp.slug,
        bp.business_description,
        bp.business_category,
        bp.business_logo_url,
        bp.business_department,
        bp.business_city,
        bp.is_nit_verified,
        pr.full_name AS owner_name,
        pr.verification_level,
        (
          SELECT count(*)
          FROM products p
          WHERE p.user_id = bp.id
            AND p.status = 'active'
        ) AS active_listings_count,
        CASE
          WHEN v_has_search AND bp.search_vector @@ v_tsquery
          THEN ts_rank_cd(bp.search_vector, v_tsquery, 32)
          ELSE 0
        END AS relevance_score,
        bp.created_at
      FROM business_profiles bp
      JOIN profiles_public pr ON pr.id = bp.id
      WHERE (
              NOT v_has_search
              OR bp.search_vector @@ v_tsquery
            )
        AND (
              category_filter IS NULL
              OR category_filter = ''
              OR bp.business_category = category_filter
            )
        AND (
              location_department_filter IS NULL
              OR location_department_filter = ''
              OR bp.business_department = location_department_filter
            )
    ),
    ordered AS (
      SELECT
        filtered.*,
        count(*) OVER () AS matched_total
      FROM filtered
      ORDER BY
        CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
        created_at DESC
      LIMIT LEAST(GREATEST(COALESCE(result_limit, 24), 1), 100)
      OFFSET GREATEST(COALESCE(result_offset, 0), 0)
    )
    SELECT
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ordered.id,
            'business_name', ordered.business_name,
            'slug', ordered.slug,
            'business_description', ordered.business_description,
            'business_category', ordered.business_category,
            'business_logo_url', ordered.business_logo_url,
            'business_department', ordered.business_department,
            'business_city', ordered.business_city,
            'is_nit_verified', ordered.is_nit_verified,
            'owner_name', ordered.owner_name,
            'verification_level', ordered.verification_level,
            'active_listings_count', ordered.active_listings_count,
            'relevance_score', ordered.relevance_score,
            'created_at', ordered.created_at
          ) ORDER BY
            CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
            created_at DESC
        ),
        '[]'::jsonb
      ),
      COALESCE((SELECT matched_total FROM ordered LIMIT 1), 0)
    FROM ordered;
    RETURN;
  END IF;

  -- Hybrid: keyword top 50 + semantic top 50 -> adaptive RRF merge
  IF v_has_search AND v_trimmed ~ '\| | & ' THEN
    v_tsquery := to_tsquery('spanish', v_trimmed);
  ELSE
    v_tsquery := plainto_tsquery('spanish', v_trimmed);
  END IF;

  RETURN QUERY
  WITH
  base_filter AS (
    SELECT
      bp.id,
      bp.business_name,
      bp.slug,
      bp.business_description,
      bp.business_category,
      bp.business_logo_url,
      bp.business_department,
      bp.business_city,
      bp.is_nit_verified,
      pr.full_name AS owner_name,
      pr.verification_level,
      (
        SELECT count(*)
        FROM products p
        WHERE p.user_id = bp.id
          AND p.status = 'active'
      ) AS active_listings_count,
      bp.created_at
    FROM business_profiles bp
    JOIN profiles_public pr ON pr.id = bp.id
    WHERE (category_filter IS NULL OR category_filter = '' OR bp.business_category = category_filter)
      AND (location_department_filter IS NULL OR location_department_filter = ''
           OR bp.business_department = location_department_filter)
  ),

  keyword_results AS (
    SELECT bf.id, ts_rank_cd(bp.search_vector, v_tsquery, 32) AS relevance
    FROM base_filter bf
    JOIN business_profiles bp ON bp.id = bf.id
    WHERE (NOT v_has_search OR bp.search_vector @@ v_tsquery)
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
    SELECT bf.id, (bp.embedding <=> query_embedding) AS distance
    FROM base_filter bf
    JOIN business_profiles bp ON bp.id = bf.id
    WHERE bp.embedding IS NOT NULL
    ORDER BY bp.embedding <=> query_embedding
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

  matched AS (
    SELECT bf.*, r.rrf_score
    FROM base_filter bf
    INNER JOIN rrf_scores r ON r.id = bf.id
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
      created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(result_limit, 24), 1), 100)
    OFFSET GREATEST(COALESCE(result_offset, 0), 0)
  )
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ordered.id,
          'business_name', ordered.business_name,
          'slug', ordered.slug,
          'business_description', ordered.business_description,
          'business_category', ordered.business_category,
          'business_logo_url', ordered.business_logo_url,
          'business_department', ordered.business_department,
          'business_city', ordered.business_city,
          'is_nit_verified', ordered.is_nit_verified,
          'owner_name', ordered.owner_name,
          'verification_level', ordered.verification_level,
          'active_listings_count', ordered.active_listings_count,
          'relevance_score', ordered.rrf_score,
          'created_at', ordered.created_at
        ) ORDER BY
          CASE WHEN sort_by = 'relevance' THEN ordered.rrf_score END DESC NULLS LAST,
          CASE WHEN sort_by = 'newest' THEN ordered.created_at END DESC NULLS LAST,
          ordered.created_at DESC
      ),
      '[]'::jsonb
    ),
    COALESCE((SELECT total FROM counted), 0)
  FROM ordered;
END;
$$;

COMMENT ON FUNCTION public.search_businesses(TEXT, vector, TEXT, TEXT, TEXT, INT, INT) IS
  'Hybrid keyword + semantic search over business profiles with adaptive RRF (k=60, 2x semantic weight when keyword has 0 hits). No phone in output. SECURITY INVOKER.';

-- ---------------------------------------------------------------------------
-- 5. search_profiles: + query_embedding, adaptive RRF
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_profiles(TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.search_profiles(
  search_query TEXT DEFAULT '',
  query_embedding vector(384) DEFAULT NULL,
  location_department_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INT DEFAULT 24,
  result_offset INT DEFAULT 0
)
RETURNS TABLE(profiles JSONB, total_count BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
  v_has_semantic BOOLEAN;
  v_trimmed TEXT;
  v_rrf_k CONSTANT INT := 60;
BEGIN
  v_trimmed := COALESCE(NULLIF(trim(COALESCE(search_query, '')), ''), '');
  v_has_search := v_trimmed <> '';
  v_has_semantic := (query_embedding IS NOT NULL);

  -- No semantic: delegate to the keyword-only path (previous behaviour)
  IF NOT v_has_semantic THEN
    IF v_has_search AND v_trimmed ~ '\| | & ' THEN
      v_tsquery := to_tsquery('spanish', v_trimmed);
    ELSE
      v_tsquery := plainto_tsquery('spanish', v_trimmed);
    END IF;

    RETURN QUERY
    WITH filtered AS (
      SELECT
        pr.id,
        pr.full_name,
        pr.avatar_url,
        pr.location_department,
        pr.location_city,
        pr.verification_level,
        pr.rating_average,
        pr.rating_count,
        pr.account_type,
        bp.slug AS business_slug,
        (
          SELECT count(*)
          FROM products p
          WHERE p.user_id = pr.id
            AND p.status = 'active'
        ) AS active_listings_count,
        CASE
          WHEN v_has_search
            AND to_tsvector('spanish', pr.full_name) @@ v_tsquery
          THEN ts_rank_cd(to_tsvector('spanish', pr.full_name), v_tsquery, 32)
          ELSE 0
        END AS relevance_score,
        pr.created_at
      FROM profiles_public pr
      JOIN (
        SELECT DISTINCT p.user_id
        FROM products p
        WHERE p.status = 'active'
      ) active_sellers ON active_sellers.user_id = pr.id
      LEFT JOIN business_profiles bp ON bp.id = pr.id
      WHERE (
              NOT v_has_search
              OR to_tsvector('spanish', pr.full_name) @@ v_tsquery
            )
        AND (
              location_department_filter IS NULL
              OR location_department_filter = ''
              OR pr.location_department = location_department_filter
            )
    ),
    ordered AS (
      SELECT
        filtered.*,
        count(*) OVER () AS matched_total
      FROM filtered
      ORDER BY
        CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
        created_at DESC
      LIMIT LEAST(GREATEST(COALESCE(result_limit, 24), 1), 100)
      OFFSET GREATEST(COALESCE(result_offset, 0), 0)
    )
    SELECT
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', ordered.id,
            'full_name', ordered.full_name,
            'avatar_url', ordered.avatar_url,
            'location_department', ordered.location_department,
            'location_city', ordered.location_city,
            'verification_level', ordered.verification_level,
            'rating_average', ordered.rating_average,
            'rating_count', ordered.rating_count,
            'account_type', ordered.account_type,
            'business_slug', ordered.business_slug,
            'active_listings_count', ordered.active_listings_count,
            'relevance_score', ordered.relevance_score,
            'created_at', ordered.created_at
          ) ORDER BY
            CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
            created_at DESC
        ),
        '[]'::jsonb
      ),
      COALESCE((SELECT matched_total FROM ordered LIMIT 1), 0)
    FROM ordered;
    RETURN;
  END IF;

  -- Hybrid: keyword top 50 + semantic top 50 -> adaptive RRF merge
  IF v_has_search AND v_trimmed ~ '\| | & ' THEN
    v_tsquery := to_tsquery('spanish', v_trimmed);
  ELSE
    v_tsquery := plainto_tsquery('spanish', v_trimmed);
  END IF;

  RETURN QUERY
  WITH
  base_filter AS (
    SELECT
      pr.id,
      pr.full_name,
      pr.avatar_url,
      pr.location_department,
      pr.location_city,
      pr.verification_level,
      pr.rating_average,
      pr.rating_count,
      pr.account_type,
      bp.slug AS business_slug,
      (
        SELECT count(*)
        FROM products p
        WHERE p.user_id = pr.id
          AND p.status = 'active'
      ) AS active_listings_count,
      pr.created_at
    FROM profiles_public pr
    JOIN (
      SELECT DISTINCT p.user_id
      FROM products p
      WHERE p.status = 'active'
    ) active_sellers ON active_sellers.user_id = pr.id
    LEFT JOIN business_profiles bp ON bp.id = pr.id
    WHERE (location_department_filter IS NULL OR location_department_filter = ''
           OR pr.location_department = location_department_filter)
  ),

  keyword_results AS (
    SELECT bf.id,
      ts_rank_cd(to_tsvector('spanish', pr.full_name), v_tsquery, 32) AS relevance
    FROM base_filter bf
    JOIN profiles_public pr ON pr.id = bf.id
    WHERE (NOT v_has_search OR to_tsvector('spanish', pr.full_name) @@ v_tsquery)
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
    SELECT bf.id, (pr.embedding <=> query_embedding) AS distance
    FROM base_filter bf
    JOIN profiles_public pr ON pr.id = bf.id
    WHERE pr.embedding IS NOT NULL
    ORDER BY pr.embedding <=> query_embedding
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

  matched AS (
    SELECT bf.*, r.rrf_score
    FROM base_filter bf
    INNER JOIN rrf_scores r ON r.id = bf.id
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
      created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(result_limit, 24), 1), 100)
    OFFSET GREATEST(COALESCE(result_offset, 0), 0)
  )
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ordered.id,
          'full_name', ordered.full_name,
          'avatar_url', ordered.avatar_url,
          'location_department', ordered.location_department,
          'location_city', ordered.location_city,
          'verification_level', ordered.verification_level,
          'rating_average', ordered.rating_average,
          'rating_count', ordered.rating_count,
          'account_type', ordered.account_type,
          'business_slug', ordered.business_slug,
          'active_listings_count', ordered.active_listings_count,
          'relevance_score', ordered.rrf_score,
          'created_at', ordered.created_at
        ) ORDER BY
          CASE WHEN sort_by = 'relevance' THEN ordered.rrf_score END DESC NULLS LAST,
          CASE WHEN sort_by = 'newest' THEN ordered.created_at END DESC NULLS LAST,
          ordered.created_at DESC
      ),
      '[]'::jsonb
    ),
    COALESCE((SELECT total FROM counted), 0)
  FROM ordered;
END;
$$;

COMMENT ON FUNCTION public.search_profiles(TEXT, vector, TEXT, TEXT, INT, INT) IS
  'Hybrid keyword + semantic search over public seller profiles with active listings. Adaptive RRF (k=60). Only profiles_public fields, never phone (TELO-003). SECURITY INVOKER.';

-- ---------------------------------------------------------------------------
-- 6. Grants (explicit arg-type lists so re-runs are idempotent)
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.search_businesses(TEXT, vector, TEXT, TEXT, TEXT, INT, INT)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT, vector, TEXT, TEXT, INT, INT)
  TO anon, authenticated;
