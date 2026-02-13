-- =============================================================================
-- M2 Phase 1: Create product-images storage bucket and RLS policies
-- =============================================================================

-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "product_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_read_policy" ON storage.objects;

-- RLS Policy: Users can upload only in their own folder (product-images/{userId}/*)
CREATE POLICY "product_images_upload_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can update their own files
CREATE POLICY "product_images_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can delete their own files
CREATE POLICY "product_images_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Anyone can view product images (public bucket)
CREATE POLICY "product_images_read_policy"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
