-- =============================================================================
-- M3 Phase 1: Add full-text search to products table
-- =============================================================================
-- Adds search_vector column, trigger, GIN index, and search_products() RPC
-- for Spanish keyword search (Bolivian market).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add search_vector column
-- -----------------------------------------------------------------------------
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

COMMENT ON COLUMN public.products.search_vector IS 'Full-text search vector from title (A), description (B), category+subcategory (C). Spanish config.';

-- -----------------------------------------------------------------------------
-- 2. Trigger function to auto-update search_vector
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish',
      COALESCE(NEW.category, '') || ' ' || COALESCE(NEW.subcategory, '')
    ), 'C');
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.products_search_vector_update IS 'Updates search_vector on INSERT/UPDATE. Spanish stemming, weights: title A, description B, category C.';

-- -----------------------------------------------------------------------------
-- 3. Create trigger
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS products_search_vector_trigger ON public.products;

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, category, subcategory
  ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_search_vector_update();

-- -----------------------------------------------------------------------------
-- 4. Backfill existing products
-- -----------------------------------------------------------------------------
UPDATE public.products
SET search_vector =
  setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('spanish',
    COALESCE(category, '') || ' ' || COALESCE(subcategory, '')
  ), 'C')
WHERE search_vector IS NULL;

-- -----------------------------------------------------------------------------
-- 5. GIN index for fast full-text search
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON public.products
  USING GIN (search_vector);

-- -----------------------------------------------------------------------------
-- 6. search_products() RPC function
-- -----------------------------------------------------------------------------
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
  v_total BIGINT;
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
BEGIN
  -- Build tsquery only when search_query is non-empty
  v_has_search := (search_query IS NOT NULL AND trim(search_query) != '');
  IF v_has_search THEN
    v_tsquery := plainto_tsquery('spanish', trim(search_query));
  END IF;

  -- Return products + total_count as single row
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
      CASE
        WHEN v_has_search AND p.search_vector @@ v_tsquery
        THEN ts_rank_cd(p.search_vector, v_tsquery, 32)
        ELSE 0::REAL
      END AS relevance_score
    FROM public.products p
    WHERE
      -- RLS-equivalent: active or owner (handled by SECURITY INVOKER + RLS)
      (p.status = 'active' OR p.user_id = auth.uid())
      -- FTS: match when search_query provided
      AND (
        NOT v_has_search
        OR (p.search_vector @@ v_tsquery)
      )
      -- Optional filters
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (price_min IS NULL OR p.price >= price_min)
      AND (price_max IS NULL OR p.price <= price_max)
      AND (location_department_filter IS NULL OR p.location_department = location_department_filter)
      AND (condition_filter IS NULL OR p.condition = condition_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
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
          'relevance_score', o.relevance_score
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

COMMENT ON FUNCTION public.search_products IS 'M3: Full-text search with filters. Spanish FTS, ts_rank relevance. Sort: relevance, newest, price_asc, price_desc.';

-- Grant execute to anon and authenticated (RLS applies via SECURITY INVOKER)
GRANT EXECUTE ON FUNCTION public.search_products(
  TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT
) TO anon, authenticated;
