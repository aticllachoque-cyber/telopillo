-- =============================================================================
-- Product Promotions: reusable seller promotions + per-product promo pricing
-- =============================================================================
-- Allows any seller (personal or business) to create named promotions and
-- attach them to one or more products with a per-product promotional price.
-- =============================================================================

-- 1. Seller-owned promotions catalog (reusable across a seller's products)
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_discount_percent SMALLINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT promotions_name_length CHECK (char_length(trim(name)) BETWEEN 2 AND 40),
  CONSTRAINT promotions_default_discount_range CHECK (
    default_discount_percent IS NULL
    OR (default_discount_percent >= 1 AND default_discount_percent <= 95)
  ),
  CONSTRAINT promotions_date_range CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at
  )
);

COMMENT ON TABLE public.promotions IS 'Seller-defined reusable promotions (available to all account types).';
COMMENT ON COLUMN public.promotions.default_discount_percent IS 'Optional suggested discount percentage (1-95) used to prefill per-product promo prices.';

CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON public.promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(id) WHERE is_active = true;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select_policy"
  ON public.promotions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_active = true
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (ends_at IS NULL OR ends_at > NOW())
    )
  );

CREATE POLICY "promotions_insert_policy"
  ON public.promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "promotions_update_policy"
  ON public.promotions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "promotions_delete_policy"
  ON public.promotions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Product-to-promotion assignments with per-product promotional price
CREATE TABLE IF NOT EXISTS public.promotion_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  promo_price DECIMAL(10, 2) NOT NULL CHECK (promo_price > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each product can have at most one assigned promotion at a time
  CONSTRAINT promotion_products_unique_product UNIQUE (product_id)
);

COMMENT ON TABLE public.promotion_products IS 'Links a product to a seller promotion with a seller-defined per-product promotional price.';

CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion_id
  ON public.promotion_products(promotion_id);

ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotion_products_select_policy"
  ON public.promotion_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.promotions pr
      WHERE pr.id = promotion_id
        AND (
          pr.user_id = auth.uid()
          OR (
            pr.is_active = true
            AND (pr.starts_at IS NULL OR pr.starts_at <= NOW())
            AND (pr.ends_at IS NULL OR pr.ends_at > NOW())
          )
        )
    )
  );

CREATE POLICY "promotion_products_insert_policy"
  ON public.promotion_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.promotions pr
      WHERE pr.id = promotion_id AND pr.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "promotion_products_update_policy"
  ON public.promotion_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.promotions pr
      WHERE pr.id = promotion_id AND pr.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "promotion_products_delete_policy"
  ON public.promotion_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_id AND p.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_promotion_products_updated_at
  BEFORE UPDATE ON public.promotion_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Integrity triggers: enforce same owner and promo_price < products.price
CREATE OR REPLACE FUNCTION public.validate_promotion_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_product_user_id UUID;
  v_product_price DECIMAL(10, 2);
  v_promo_user_id UUID;
BEGIN
  SELECT user_id, price
  INTO v_product_user_id, v_product_price
  FROM public.products
  WHERE id = NEW.product_id;

  IF v_product_user_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  SELECT user_id
  INTO v_promo_user_id
  FROM public.promotions
  WHERE id = NEW.promotion_id;

  IF v_promo_user_id IS NULL THEN
    RAISE EXCEPTION 'Promotion not found';
  END IF;

  IF v_product_user_id != v_promo_user_id THEN
    RAISE EXCEPTION 'Promotion and product must belong to the same seller';
  END IF;

  IF NEW.promo_price >= v_product_price THEN
    RAISE EXCEPTION 'Promotional price must be lower than the regular product price';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_promotion_product
  BEFORE INSERT OR UPDATE ON public.promotion_products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_promotion_product();

-- Keep invariant valid if a product's base price is lowered at or below promo_price
CREATE OR REPLACE FUNCTION public.cleanup_invalid_product_promotions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.price < OLD.price THEN
    DELETE FROM public.promotion_products
    WHERE product_id = NEW.id
      AND promo_price >= NEW.price;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_invalid_product_promotions
  AFTER UPDATE OF price ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_invalid_product_promotions();

-- Grants
GRANT ALL ON public.promotions TO postgres, service_role;
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;

GRANT ALL ON public.promotion_products TO postgres, service_role;
GRANT SELECT ON public.promotion_products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotion_products TO authenticated;

-- 4. Update search_products and search_products_semantic to include active promotions
--    and filter/sort by effective_price = COALESCE(active_promo_price, price).

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
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
  v_trimmed TEXT;
BEGIN
  v_has_search := (search_query IS NOT NULL AND trim(search_query) != '');
  v_trimmed := trim(search_query);

  IF v_has_search THEN
    IF v_trimmed ~ ' \| | & ' THEN
      v_tsquery := to_tsquery('spanish', v_trimmed);
    ELSE
      v_tsquery := plainto_tsquery('spanish', v_trimmed);
    END IF;
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      p.id, p.user_id, p.title, p.description, p.category, p.subcategory,
      p.price, p.currency, p.condition, p.location_department, p.location_city,
      p.images, p.status, p.views_count, p.favorites_count, p.contacts_count,
      p.created_at, p.updated_at, p.expires_at,
      pr.full_name AS seller_name,
      pr.avatar_url AS seller_avatar_url,
      pr.verification_level AS seller_verification_level,
      bp.business_name AS seller_business_name,
      bp.slug AS seller_business_slug,
      bp.business_logo_url AS seller_business_logo,
      bp.social_whatsapp AS seller_business_whatsapp,
      NULL::text AS seller_profile_phone,
      bp.social_whatsapp AS seller_whatsapp_phone,
      CASE
        WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN promo.id
        ELSE NULL
      END AS promo_id,
      CASE
        WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN promo.name
        ELSE NULL
      END AS promo_name,
      CASE
        WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price
        ELSE NULL
      END AS promo_price,
      CASE
        WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price
        ELSE p.price
      END AS effective_price,
      CASE
        WHEN v_has_search AND p.search_vector @@ v_tsquery
        THEN ts_rank_cd(p.search_vector, v_tsquery, 32)
        ELSE 0::REAL
      END AS relevance_score
    FROM public.products p
    LEFT JOIN public.profiles_public pr ON pr.id = p.user_id
    LEFT JOIN public.business_profiles bp ON bp.id = p.user_id
    LEFT JOIN public.promotion_products pp ON pp.product_id = p.id
    LEFT JOIN public.promotions promo
      ON promo.id = pp.promotion_id
      AND promo.is_active = true
      AND (promo.starts_at IS NULL OR promo.starts_at <= NOW())
      AND (promo.ends_at IS NULL OR promo.ends_at > NOW())
    WHERE
      (p.status = 'active' OR p.user_id = auth.uid())
      AND (NOT v_has_search OR (p.search_vector @@ v_tsquery))
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (
        price_min IS NULL
        OR (CASE WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price ELSE p.price END) >= price_min
      )
      AND (
        price_max IS NULL
        OR (CASE WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price ELSE p.price END) <= price_max
      )
      AND (location_department_filter IS NULL OR p.location_department = location_department_filter)
      AND (condition_filter IS NULL OR p.condition = condition_filter)
      AND (status_filter IS NULL OR p.status = status_filter)
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
      CASE WHEN sort_by = 'price_asc' THEN effective_price END ASC NULLS LAST,
      CASE WHEN sort_by = 'price_desc' THEN effective_price END DESC NULLS LAST,
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
          'seller_name', o.seller_name,
          'seller_avatar_url', o.seller_avatar_url,
          'seller_verification_level', o.seller_verification_level,
          'seller_business_name', o.seller_business_name,
          'seller_business_slug', o.seller_business_slug,
          'seller_business_logo', o.seller_business_logo,
          'seller_business_whatsapp', o.seller_business_whatsapp,
          'seller_profile_phone', o.seller_profile_phone,
          'seller_whatsapp_phone', o.seller_whatsapp_phone,
          'promo_id', o.promo_id,
          'promo_name', o.promo_name,
          'promo_price', o.promo_price
        )
        ORDER BY
          CASE WHEN sort_by = 'relevance' THEN o.relevance_score END DESC NULLS LAST,
          CASE WHEN sort_by = 'newest' THEN o.created_at END DESC NULLS LAST,
          CASE WHEN sort_by = 'price_asc' THEN o.effective_price END ASC NULLS LAST,
          CASE WHEN sort_by = 'price_desc' THEN o.effective_price END DESC NULLS LAST,
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

GRANT EXECUTE ON FUNCTION public.search_products(
  TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT
) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.search_products_semantic(
  search_query TEXT DEFAULT NULL,
  query_embedding VECTOR DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  price_min NUMERIC DEFAULT NULL,
  price_max NUMERIC DEFAULT NULL,
  location_department_filter TEXT DEFAULT NULL,
  condition_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INT DEFAULT 24,
  result_offset INT DEFAULT 0,
  seller_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE(products JSONB, total_count BIGINT)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_tsquery TSQUERY;
  v_has_search BOOLEAN;
  v_has_semantic BOOLEAN;
  v_rrf_k CONSTANT INT := 60;
  v_semantic_threshold CONSTANT DOUBLE PRECISION := 0.70;
  v_trimmed TEXT;
BEGIN
  v_has_search := (search_query IS NOT NULL AND trim(search_query) != '');
  v_has_semantic := (query_embedding IS NOT NULL);
  v_trimmed := trim(search_query);

  IF v_has_search THEN
    IF v_trimmed ~ ' \| | & ' THEN
      v_tsquery := to_tsquery('spanish', v_trimmed);
    ELSE
      v_tsquery := plainto_tsquery('spanish', v_trimmed);
    END IF;
  END IF;

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

  RETURN QUERY
  WITH
  base_filter AS (
    SELECT p.id, p.user_id, p.title, p.description, p.category, p.subcategory,
           p.price, p.currency, p.condition, p.location_department, p.location_city,
           p.images, p.status, p.views_count, p.favorites_count, p.contacts_count,
           p.created_at, p.updated_at, p.expires_at,
           pr.full_name AS seller_name,
           pr.avatar_url AS seller_avatar_url,
           pr.verification_level AS seller_verification_level,
           bp.business_name AS seller_business_name,
           bp.slug AS seller_business_slug,
           bp.business_logo_url AS seller_business_logo,
           bp.social_whatsapp AS seller_business_whatsapp,
           NULL::text AS seller_profile_phone,
           bp.social_whatsapp AS seller_whatsapp_phone,
           CASE
             WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN promo.id
             ELSE NULL
           END AS promo_id,
           CASE
             WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN promo.name
             ELSE NULL
           END AS promo_name,
           CASE
             WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price
             ELSE NULL
           END AS promo_price,
           CASE
             WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price
             ELSE p.price
           END AS effective_price,
           bp.id AS bp_id
    FROM public.products p
    LEFT JOIN public.profiles_public pr ON pr.id = p.user_id
    LEFT JOIN public.business_profiles bp ON bp.id = p.user_id
    LEFT JOIN public.promotion_products pp ON pp.product_id = p.id
    LEFT JOIN public.promotions promo
      ON promo.id = pp.promotion_id
      AND promo.is_active = true
      AND (promo.starts_at IS NULL OR promo.starts_at <= NOW())
      AND (promo.ends_at IS NULL OR promo.ends_at > NOW())
    WHERE (p.status = 'active' OR p.user_id = auth.uid())
      AND (category_filter IS NULL OR p.category = category_filter)
      AND (
        price_min IS NULL
        OR (CASE WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price ELSE p.price END) >= price_min
      )
      AND (
        price_max IS NULL
        OR (CASE WHEN promo.id IS NOT NULL AND pp.promo_price < p.price THEN pp.promo_price ELSE p.price END) <= price_max
      )
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
      AND (p.embedding <=> query_embedding) <= v_semantic_threshold
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
            THEN COALESCE(1.5 / (v_rrf_k + sr.rn), 0)
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
      CASE WHEN sort_by = 'price_asc' THEN effective_price END ASC NULLS LAST,
      CASE WHEN sort_by = 'price_desc' THEN effective_price END DESC NULLS LAST,
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
          'seller_name', o.seller_name,
          'seller_avatar_url', o.seller_avatar_url,
          'seller_verification_level', o.seller_verification_level,
          'seller_business_name', o.seller_business_name,
          'seller_business_slug', o.seller_business_slug,
          'seller_business_logo', o.seller_business_logo,
          'seller_business_whatsapp', o.seller_business_whatsapp,
          'seller_profile_phone', o.seller_profile_phone,
          'seller_whatsapp_phone', o.seller_whatsapp_phone,
          'promo_id', o.promo_id,
          'promo_name', o.promo_name,
          'promo_price', o.promo_price
        )
        ORDER BY
          CASE WHEN sort_by = 'relevance' THEN o.rrf_score END DESC NULLS LAST,
          CASE WHEN sort_by = 'newest' THEN o.created_at END DESC NULLS LAST,
          CASE WHEN sort_by = 'price_asc' THEN o.effective_price END ASC NULLS LAST,
          CASE WHEN sort_by = 'price_desc' THEN o.effective_price END DESC NULLS LAST,
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
$function$;

GRANT EXECUTE ON FUNCTION public.search_products_semantic(
  TEXT, VECTOR, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, INT, INT, TEXT
) TO anon, authenticated;
