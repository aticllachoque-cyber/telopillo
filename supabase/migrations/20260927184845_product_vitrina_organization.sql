-- Vitrina catalog organization (Option A)
-- Sellers with a business profile can feature up to 4 active products and
-- order products within their storefront. Buyer storefront reads these.
-- The global `category` taxonomy powers buyer-side section chips (no new table).

-- Order within the seller's catalog; NULL = legacy order (created_at desc).
ALTER TABLE public.products
  ADD COLUMN display_order integer;

-- Featured flag for storefront highlights (cap of 4 enforced in app logic).
ALTER TABLE public.products
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Featured lookup: seller + featured, bounded result set.
CREATE INDEX idx_products_user_featured
  ON public.products (user_id)
  WHERE is_featured = true AND status = 'active';

-- Stable ordering for a seller's catalog.
CREATE INDEX idx_products_user_display_order
  ON public.products (user_id, display_order)
  WHERE status = 'active';

COMMENT ON COLUMN public.products.is_featured IS 'Highlighted in the seller storefront (max 4 active, enforced by app logic)';
COMMENT ON COLUMN public.products.display_order IS 'Manual position within the seller storefront catalog; NULL falls back to created_at desc';
