-- M1 Phase 1: Create avatars storage bucket and RLS policies

-- Create avatars bucket (skip if already exists from M0)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "avatar_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatar_read_policy" ON storage.objects;

-- RLS Policy: Users can upload their own avatar (path: {user_id}/avatar.{ext})
CREATE POLICY "avatar_upload_policy"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can update their own avatar
CREATE POLICY "avatar_update_policy"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Users can delete their own avatar
CREATE POLICY "avatar_delete_policy"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policy: Anyone can view avatars (public bucket)
CREATE POLICY "avatar_read_policy"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
