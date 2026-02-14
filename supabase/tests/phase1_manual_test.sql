-- =============================================================================
-- M2 Phase 1: Manual E2E Testing
-- =============================================================================
-- Run these queries in Supabase SQL Editor to verify Phase 1 is working
-- Make sure you're logged in as the dev user (dev@telopillo.test)
-- =============================================================================

-- Step 1: Verify you're authenticated
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email;

-- Expected: Should return your user ID and email
-- If NULL, you need to login first

-- =============================================================================
-- Step 2: Insert a test product
-- =============================================================================

INSERT INTO public.products (
  user_id,
  title,
  description,
  category,
  subcategory,
  price,
  currency,
  condition,
  location_department,
  location_city,
  images,
  status
) VALUES (
  auth.uid(),  -- Your user ID
  'Test Product - Laptop Dell',
  'This is a test product to verify Phase 1 database schema and RLS policies are working correctly. Laptop Dell Inspiron 15, 16GB RAM, 512GB SSD, Intel i7 11th Gen. Excellent condition, barely used.',
  'electronica',
  'computadoras',
  3500.00,
  'BOB',
  'used_like_new',
  'Santa Cruz',
  'Santa Cruz de la Sierra',
  ARRAY['https://placehold.co/600x400/png?text=Laptop+Front', 'https://placehold.co/600x400/png?text=Laptop+Side'],
  'active'
)
RETURNING id, title, price, status, created_at;

-- Expected: Should return the inserted product with generated ID
-- Save the ID for next steps

-- =============================================================================
-- Step 3: Verify you can SELECT your own product
-- =============================================================================

SELECT 
  id,
  title,
  price,
  status,
  user_id,
  created_at
FROM public.products
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- Expected: Should return the product you just created

-- =============================================================================
-- Step 4: Verify you can UPDATE your own product
-- =============================================================================

-- Replace 'YOUR_PRODUCT_ID' with the actual ID from Step 2
UPDATE public.products
SET 
  price = 3200.00,
  title = 'Test Product - Laptop Dell (UPDATED)'
WHERE id = 'YOUR_PRODUCT_ID'  -- Replace with actual ID
  AND user_id = auth.uid()
RETURNING id, title, price, updated_at;

-- Expected: Should return the updated product
-- Note: updated_at should be newer than created_at

-- =============================================================================
-- Step 5: Test increment_product_views function
-- =============================================================================

-- Replace 'YOUR_PRODUCT_ID' with the actual ID
SELECT public.increment_product_views('YOUR_PRODUCT_ID');

-- Expected: Should return void (no error)

-- Verify views_count incremented
SELECT id, title, views_count
FROM public.products
WHERE id = 'YOUR_PRODUCT_ID';

-- Expected: views_count should be 1

-- =============================================================================
-- Step 6: Test RLS - Try to view inactive product (should work for owner)
-- =============================================================================

-- Mark product as inactive
UPDATE public.products
SET status = 'inactive'
WHERE id = 'YOUR_PRODUCT_ID'
  AND user_id = auth.uid();

-- Try to view it (should still work because you're the owner)
SELECT id, title, status
FROM public.products
WHERE id = 'YOUR_PRODUCT_ID';

-- Expected: Should return the product even though status = 'inactive'

-- =============================================================================
-- Step 7: Test RLS - Public can only see active products
-- =============================================================================

-- Set back to active
UPDATE public.products
SET status = 'active'
WHERE id = 'YOUR_PRODUCT_ID'
  AND user_id = auth.uid();

-- This query simulates what anonymous users see
-- (In real app, they wouldn't have auth.uid())
SELECT id, title, status
FROM public.products
WHERE status = 'active';

-- Expected: Should return your product (and any other active products)

-- =============================================================================
-- Step 8: Test DELETE (soft delete by changing status)
-- =============================================================================

-- Soft delete (recommended approach)
UPDATE public.products
SET status = 'deleted'
WHERE id = 'YOUR_PRODUCT_ID'
  AND user_id = auth.uid()
RETURNING id, title, status;

-- Expected: Should return the product with status = 'deleted'

-- Verify you can still see it (as owner)
SELECT id, title, status
FROM public.products
WHERE id = 'YOUR_PRODUCT_ID';

-- Expected: Should return the product

-- =============================================================================
-- Step 9: Test hard DELETE (optional - only if you want to remove completely)
-- =============================================================================

-- CAUTION: This permanently deletes the product
-- DELETE FROM public.products
-- WHERE id = 'YOUR_PRODUCT_ID'
--   AND user_id = auth.uid()
-- RETURNING id, title;

-- Expected: Should return the deleted product
-- The product is now permanently removed

-- =============================================================================
-- Step 10: Cleanup - Remove test product
-- =============================================================================

-- If you didn't hard delete in Step 9, do it now
DELETE FROM public.products
WHERE title LIKE 'Test Product - Laptop Dell%'
  AND user_id = auth.uid();

-- Expected: Should delete the test product(s)

-- =============================================================================
-- VERIFICATION SUMMARY
-- =============================================================================

-- Run this to verify everything is clean
SELECT 
  'Total products' as check_name,
  COUNT(*) as count
FROM public.products
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'Active products' as check_name,
  COUNT(*) as count
FROM public.products
WHERE user_id = auth.uid() AND status = 'active'
UNION ALL
SELECT 
  'Test products remaining' as check_name,
  COUNT(*) as count
FROM public.products
WHERE user_id = auth.uid() 
  AND title LIKE 'Test Product%';

-- Expected: 
-- - Total products: 0 (if you deleted all test products)
-- - Active products: 0
-- - Test products remaining: 0

-- =============================================================================
-- ✅ Phase 1 E2E Test Complete!
-- =============================================================================
-- If all steps worked:
-- ✅ RLS policies are working correctly
-- ✅ You can INSERT products
-- ✅ You can SELECT your own products
-- ✅ You can UPDATE your own products
-- ✅ You can DELETE your own products
-- ✅ increment_product_views function works
-- ✅ Status filtering works correctly
--
-- Ready to proceed to Phase 2: Image Upload Component
-- =============================================================================
