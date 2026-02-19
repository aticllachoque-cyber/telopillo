-- =============================================================================
-- M4.7: Demand-Side Posting — "Busco/Necesito"
-- =============================================================================
-- Two new tables: demand_posts, demand_offers
-- Includes: indexes, RLS, triggers, search RPC
-- =============================================================================

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================================================
-- 1. demand_posts table
-- =============================================================================

CREATE TABLE public.demand_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  location_department TEXT NOT NULL,
  location_city TEXT NOT NULL,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'found', 'deleted')),
  offers_count INTEGER NOT NULL DEFAULT 0,
  embedding vector(384),
  search_vector tsvector,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT demand_posts_title_length
    CHECK (char_length(title) BETWEEN 5 AND 100),
  CONSTRAINT demand_posts_description_length
    CHECK (char_length(description) BETWEEN 20 AND 1000),
  CONSTRAINT demand_posts_price_range
    CHECK (price_max IS NULL OR price_min IS NULL OR price_max >= price_min)
);

-- Scalar indexes
CREATE INDEX idx_demand_posts_user     ON public.demand_posts(user_id);
CREATE INDEX idx_demand_posts_category ON public.demand_posts(category);
CREATE INDEX idx_demand_posts_status   ON public.demand_posts(status);
CREATE INDEX idx_demand_posts_location ON public.demand_posts(location_department);
CREATE INDEX idx_demand_posts_created  ON public.demand_posts(created_at DESC);
CREATE INDEX idx_demand_posts_expires  ON public.demand_posts(expires_at);

-- Composite index for the common active-list + filter query
CREATE INDEX idx_demand_posts_active_list
  ON public.demand_posts(status, category, location_department);

-- Full-text search index (Spanish)
CREATE INDEX idx_demand_posts_search_vector
  ON public.demand_posts USING GIN(search_vector);

-- Semantic search index (HNSW cosine)
CREATE INDEX idx_demand_posts_embedding
  ON public.demand_posts USING hnsw (embedding vector_cosine_ops);

-- =============================================================================
-- 2. demand_offers table
-- =============================================================================

CREATE TABLE public.demand_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_post_id UUID NOT NULL REFERENCES public.demand_posts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT
    CONSTRAINT demand_offers_message_length CHECK (message IS NULL OR char_length(message) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(demand_post_id, product_id)
);

CREATE INDEX idx_demand_offers_post    ON public.demand_offers(demand_post_id);
CREATE INDEX idx_demand_offers_product ON public.demand_offers(product_id);
CREATE INDEX idx_demand_offers_seller  ON public.demand_offers(seller_id);

-- =============================================================================
-- 3. RLS — demand_posts
-- =============================================================================

ALTER TABLE public.demand_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active demand posts"
  ON public.demand_posts FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

CREATE POLICY "Users can view their own demand posts"
  ON public.demand_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create demand posts"
  ON public.demand_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their demand posts"
  ON public.demand_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their demand posts"
  ON public.demand_posts FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. RLS — demand_offers
-- =============================================================================

ALTER TABLE public.demand_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view offers on active demand posts"
  ON public.demand_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.demand_posts dp
      WHERE dp.id = demand_offers.demand_post_id
        AND dp.status = 'active'
        AND dp.expires_at > NOW()
    )
  );

CREATE POLICY "Owners can view offers on their own demand posts"
  ON public.demand_offers FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM public.demand_posts WHERE id = demand_post_id)
  );

CREATE POLICY "Authenticated users can create offers for their products"
  ON public.demand_offers FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid())
  );

CREATE POLICY "Offer creators can delete their offers"
  ON public.demand_offers FOR DELETE
  USING (auth.uid() = seller_id);

-- =============================================================================
-- 5. Trigger: updated_at (reuse existing function)
-- =============================================================================

CREATE TRIGGER set_demand_posts_updated_at
  BEFORE UPDATE ON public.demand_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 6. Trigger: offers_count denormalization
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_demand_offers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.demand_posts
    SET offers_count = offers_count + 1
    WHERE id = NEW.demand_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.demand_posts
    SET offers_count = offers_count - 1
    WHERE id = OLD.demand_post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_demand_offers_count
  AFTER INSERT OR DELETE ON public.demand_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_demand_offers_count();

-- =============================================================================
-- 7. Trigger: search_vector (FTS, Spanish config)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_demand_posts_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector(
    'spanish',
    coalesce(NEW.title, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.category, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_demand_posts_search_vector
  BEFORE INSERT OR UPDATE OF title, description, category ON public.demand_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_demand_posts_search_vector();

-- =============================================================================
-- 8. Trigger: embedding (pg_net -> generate-embedding Edge Function)
--    Reads config from app_config (same pattern as products).
--    Sends { type: 'DEMAND', record: { id, text } } to the Edge Function.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.trigger_demand_post_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_embedding_text TEXT;
BEGIN
  SELECT value INTO v_supabase_url FROM public.app_config WHERE key = 'supabase_url';
  SELECT value INTO v_service_key FROM public.app_config WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_supabase_url = '' OR
     v_service_key IS NULL OR v_service_key = '' THEN
    RETURN NEW;
  END IF;

  v_embedding_text := 'Busco: ' || NEW.title
    || '. ' || NEW.description
    || '. Categoría: ' || NEW.category;

  PERFORM net.http_post(
    url := rtrim(v_supabase_url, '/') || '/functions/v1/generate-embedding',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'type', 'DEMAND',
      'record', jsonb_build_object('id', NEW.id, 'text', v_embedding_text)
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_demand_post_embedding
  AFTER INSERT OR UPDATE OF title, description, category ON public.demand_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_demand_post_embedding();

-- =============================================================================
-- 9. RPC: search_demands_hybrid (keyword + semantic + RRF fusion)
--    Modeled after search_products_semantic.
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

  fused AS (
    SELECT bf.*, COALESCE(r.rrf_score, 0) AS rrf_score
    FROM base_filter bf
    LEFT JOIN rrf_scores r ON r.id = bf.id
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
  'M4.7: Hybrid keyword + semantic search for demand posts with RRF fusion.';
