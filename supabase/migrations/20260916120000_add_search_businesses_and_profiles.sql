-- Unified search backend: full-text search RPCs for businesses and public seller
-- profiles (unified-search redesign, F-2).
--
-- Privacy contract:
-- * search_businesses reads only business_profiles (public by RLS) + profiles_public
--   (owner name / verification level, never phone).
-- * search_profiles reads only profiles_public fields (NO phone, TELO-003) and is
--   restricted to profiles with at least one ACTIVE product via an INNER JOIN CTE,
--   so inactive / private accounts stay unlisted.
-- * Both functions are SECURITY INVOKER so the anon role's grants/RLS apply; the
--   profiles_public view itself is security_invoker=false (owner-scoped), which is
--   what makes its safe column projection reachable without exposing profiles.
--
-- profiles_public does not expose a search vector column, so profile matching and
-- ranking compute to_tsvector('spanish', full_name) inline (cheap for name-length
-- text); business_profiles gets a stored generated column + GIN index.
--
-- Both RPCs are single STABLE statements (window count(*) OVER () for the total
-- instead of a temp table, which is not allowed in non-volatile functions).

-- ---------------------------------------------------------------------------
-- 1. Business profiles: stored FTS vector + GIN index
-- ---------------------------------------------------------------------------

ALTER TABLE public.business_profiles
  ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector(
      'spanish',
      coalesce(business_name, '') || ' ' ||
      coalesce(business_category, '') || ' ' ||
      coalesce(business_description, '')
    )
  ) STORED;

COMMENT ON COLUMN public.business_profiles.search_vector IS 'Full-text vector from business_name + business_category + business_description. Spanish config. Generated column.';

CREATE INDEX IF NOT EXISTS idx_business_profiles_search_vector
  ON public.business_profiles
  USING GIN (search_vector);

-- ---------------------------------------------------------------------------
-- 2. search_businesses
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_businesses(TEXT, TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.search_businesses(
  search_query TEXT DEFAULT '',
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
  v_trimmed TEXT;
BEGIN
  v_trimmed := COALESCE(NULLIF(trim(COALESCE(search_query, '')), ''), '');
  v_has_search := v_trimmed <> '';

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
          'businessName', ordered.business_name,
          'slug', ordered.slug,
          'businessDescription', ordered.business_description,
          'businessCategory', ordered.business_category,
          'businessLogoUrl', ordered.business_logo_url,
          'businessDepartment', ordered.business_department,
          'businessCity', ordered.business_city,
          'isNitVerified', ordered.is_nit_verified,
          'ownerName', ordered.owner_name,
          'verificationLevel', ordered.verification_level,
          'activeListingsCount', ordered.active_listings_count,
          'relevanceScore', ordered.relevance_score,
          'createdAt', ordered.created_at
        ) ORDER BY
          CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
          created_at DESC
      ),
      '[]'::jsonb
    ),
    COALESCE((SELECT matched_total FROM ordered LIMIT 1), 0)
  FROM ordered;
END;
$$;

COMMENT ON FUNCTION public.search_businesses(TEXT, TEXT, TEXT, TEXT, INT, INT) IS
'Full-text search over business profiles (public fields only). SECURITY INVOKER.';

-- ---------------------------------------------------------------------------
-- 3. search_profiles (public seller profiles, active listings only, NO phone)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_profiles(TEXT, TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION public.search_profiles(
  search_query TEXT DEFAULT '',
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
  v_trimmed TEXT;
BEGIN
  v_trimmed := COALESCE(NULLIF(trim(COALESCE(search_query, '')), ''), '');
  v_has_search := v_trimmed <> '';

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
          'fullName', ordered.full_name,
          'avatarUrl', ordered.avatar_url,
          'locationDepartment', ordered.location_department,
          'locationCity', ordered.location_city,
          'verificationLevel', ordered.verification_level,
          'ratingAverage', ordered.rating_average,
          'ratingCount', ordered.rating_count,
          'accountType', ordered.account_type,
          'businessSlug', ordered.business_slug,
          'activeListingsCount', ordered.active_listings_count,
          'relevanceScore', ordered.relevance_score,
          'createdAt', ordered.created_at
        ) ORDER BY
          CASE WHEN sort_by = 'relevance' THEN relevance_score END DESC NULLS LAST,
          created_at DESC
      ),
      '[]'::jsonb
    ),
    COALESCE((SELECT matched_total FROM ordered LIMIT 1), 0)
  FROM ordered;
END;
$$;

COMMENT ON FUNCTION public.search_profiles(TEXT, TEXT, TEXT, INT, INT) IS
'Full-text search over public seller profiles with active listings. Only profiles_public fields (never phone, TELO-003). SECURITY INVOKER.';

-- ---------------------------------------------------------------------------
-- 4. Grants (explicit arg-type lists so re-runs are idempotent)
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.search_businesses(TEXT, TEXT, TEXT, TEXT, INT, INT)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT, TEXT, TEXT, INT, INT)
  TO anon, authenticated;
