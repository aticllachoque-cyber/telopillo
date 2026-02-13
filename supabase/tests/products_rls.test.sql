-- =============================================================================
-- M2 Phase 1: Test products table and RLS policies
-- =============================================================================
-- Run these tests in Supabase SQL Editor to verify RLS policies work correctly
-- =============================================================================

-- Test 1: Verify products table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- Test 2: Verify indexes exist
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND schemaname = 'public';

-- Test 3: Verify RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'products'
  AND schemaname = 'public';

-- Test 4: List all RLS policies
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products'
  AND schemaname = 'public';

-- Test 5: Verify storage bucket exists
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';

-- Test 6: List storage policies
SELECT
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE 'product_images%';

-- Test 7: Verify increment_product_views function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'increment_product_views';

-- =============================================================================
-- Manual RLS Testing (requires authenticated user)
-- =============================================================================
-- These tests should be run in Supabase SQL Editor with authenticated user
-- =============================================================================

-- Test 8: Insert a test product (as authenticated user)
-- INSERT INTO products (
--   user_id,
--   title,
--   description,
--   category,
--   price,
--   condition,
--   location_department,
--   location_city,
--   images
-- ) VALUES (
--   auth.uid(),
--   'Test Product for RLS',
--   'This is a test product to verify RLS policies are working correctly. It should only be visible to the owner or when status is active.',
--   'electronica',
--   100.00,
--   'new',
--   'Santa Cruz',
--   'Santa Cruz de la Sierra',
--   ARRAY['https://example.com/image1.webp']
-- );

-- Test 9: Select own products (should work)
-- SELECT id, title, status, user_id
-- FROM products
-- WHERE user_id = auth.uid();

-- Test 10: Try to update another user's product (should fail)
-- UPDATE products
-- SET title = 'Hacked Title'
-- WHERE user_id != auth.uid()
-- LIMIT 1;

-- Test 11: Try to delete another user's product (should fail)
-- DELETE FROM products
-- WHERE user_id != auth.uid()
-- LIMIT 1;

-- Test 12: Test increment_product_views function
-- SELECT increment_product_views('PRODUCT_ID_HERE');

-- Test 13: Verify views_count incremented
-- SELECT id, title, views_count
-- FROM products
-- WHERE id = 'PRODUCT_ID_HERE';

-- =============================================================================
-- Cleanup (optional)
-- =============================================================================
-- DELETE FROM products WHERE title = 'Test Product for RLS';
