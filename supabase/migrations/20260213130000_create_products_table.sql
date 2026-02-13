-- =============================================================================
-- M2 Phase 1: Create products table
-- =============================================================================
-- Products store product listings. user_id references profiles(id) which
-- equals auth.users(id). RLS uses auth.uid() for ownership checks.
-- =============================================================================

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  -- Primary key (gen_random_uuid() built-in PostgreSQL 13+)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (profiles.id = auth.users.id)
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,

  -- Pricing (Bolivian Boliviano)
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'BOB' CHECK (currency = 'BOB'),

  -- Condition: new, used_like_new, used_good, used_fair
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used_like_new', 'used_good', 'used_fair')),

  -- Location (department + city from LocationSelector)
  location_department TEXT NOT NULL,
  location_city TEXT NOT NULL,

  -- Images: array of public URLs from Supabase Storage (1-5 required)
  images TEXT[] NOT NULL DEFAULT '{}',

  -- Status: active (visible), sold, inactive (hidden), deleted (soft delete)
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'sold', 'inactive', 'deleted')
  ),

  -- Metrics (denormalized for performance)
  views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  favorites_count INTEGER NOT NULL DEFAULT 0 CHECK (favorites_count >= 0),
  contacts_count INTEGER NOT NULL DEFAULT 0 CHECK (contacts_count >= 0),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),

  -- Constraints (array_length NULL for empty array; 1-5 images required)
  CONSTRAINT products_images_count CHECK (
    array_length(images, 1) >= 1 AND array_length(images, 1) <= 5
  ),
  CONSTRAINT products_title_length CHECK (char_length(title) BETWEEN 10 AND 100),
  CONSTRAINT products_description_length CHECK (char_length(description) BETWEEN 50 AND 5000)
);

COMMENT ON TABLE public.products IS 'Product listings for Telopillo.bo marketplace. M2 scope.';
COMMENT ON COLUMN public.products.images IS 'Array of public URLs from product-images bucket. 1-5 images.';
COMMENT ON COLUMN public.products.expires_at IS 'Auto-expire for cleanup. M2: no trigger; M9+ adds cron job.';

-- Indexes
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_location ON public.products(location_department, location_city);
CREATE INDEX idx_products_status_category ON public.products(status, category)
  WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "products_select_policy"
  ON public.products
  FOR SELECT
  USING (
    status = 'active'
    OR user_id = auth.uid()
  );

CREATE POLICY "products_insert_policy"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_update_policy"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "products_delete_policy"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger: update_updated_at (reuse function from M1)
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: Increment product views (avoids race conditions)
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = product_id
    AND (status = 'active' OR user_id = auth.uid());
END;
$$;

COMMENT ON FUNCTION public.increment_product_views IS 'Increments views_count for a product. Only for active products or owner.';

GRANT EXECUTE ON FUNCTION public.increment_product_views(UUID) TO anon, authenticated;

-- Grants
GRANT ALL ON public.products TO postgres, service_role;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
