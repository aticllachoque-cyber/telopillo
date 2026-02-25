-- =============================================================================
-- Seed: Business profile for storefront testing (visitor flow 06)
-- Run: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/seed-business-storefront.sql
-- =============================================================================
-- Creates one business profile with slug tienda-electronica-la-paz.
-- Uses first existing user that has a profile (e.g. seller1@test.com / Vendedor Uno).
-- If that user has no products, adds one so the storefront isn't empty.
-- =============================================================================

BEGIN;

-- Use first auth user that has a profile (typically seller1 / Vendedor Uno)
UPDATE public.profiles
SET account_type = 'business',
    location_department = 'La Paz',
    location_city = 'La Paz'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);

INSERT INTO public.business_profiles (
  id, business_name, slug, business_description, business_category,
  business_department, business_city, social_facebook, social_instagram
)
SELECT sub.id, sub.business_name, sub.slug, sub.business_description, sub.business_category,
  sub.business_department, sub.business_city, sub.social_facebook, sub.social_instagram
FROM (
  SELECT
    u.id,
    'Tienda Electrónica La Paz'::text AS business_name,
    'tienda-electronica-la-paz'::text AS slug,
    'Venta de celulares, tablets y accesorios en La Paz. Productos nuevos y usados con garantía.'::text AS business_description,
    'Electrónica'::text AS business_category,
    'La Paz'::text AS business_department,
    'La Paz'::text AS business_city,
    'https://facebook.com/tienda-electronica-lapaz'::text AS social_facebook,
    'https://instagram.com/tienda-electronica-lapaz'::text AS social_instagram
  FROM auth.users u
  WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  ORDER BY u.created_at ASC
  LIMIT 1
) sub
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  slug = EXCLUDED.slug,
  business_description = EXCLUDED.business_description,
  business_category = EXCLUDED.business_category,
  business_department = EXCLUDED.business_department,
  business_city = EXCLUDED.business_city,
  social_facebook = EXCLUDED.social_facebook,
  social_instagram = EXCLUDED.social_instagram,
  updated_at = NOW();

-- Ensure this user has at least one product (seller1 already has products from seed)
INSERT INTO public.products (
  user_id, title, description, category, subcategory, price, currency,
  condition, location_department, location_city, images, status, expires_at
)
SELECT
  sub.id,
  'Celular Samsung Galaxy A54 5G',
  'Samsung Galaxy A54 5G 128GB, excelente estado. Pantalla Super AMOLED 120Hz.',
  'electronics', 'Celulares', 2200, 'BOB', 'used_good', 'La Paz', 'La Paz',
  '{}', 'active', NOW() + INTERVAL '30 days'
FROM (
  SELECT u.id FROM auth.users u
  WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
  ORDER BY u.created_at ASC LIMIT 1
) sub
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.user_id = sub.id);

COMMIT;

-- Test: http://localhost:3000/negocio/tienda-electronica-la-paz
