-- M4.5 Phase 1: Account Types & Minimal KYC
-- Adds account_type, verification_level to profiles
-- Creates business_profiles table
-- Creates generate_slug() function
-- Updates handle_new_user() trigger
-- Creates auto_verify_phone trigger
-- Creates business-logos storage bucket

-- ============================================================================
-- 1. ALTER profiles table: add account_type, verification_level, phone_verified
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'business'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_level INTEGER NOT NULL DEFAULT 0
    CHECK (verification_level BETWEEN 0 AND 3);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for filtering by account type
CREATE INDEX IF NOT EXISTS idx_profiles_account_type
  ON public.profiles(account_type);

-- ============================================================================
-- 2. Create business_profiles table (1:0..1 with profiles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_description TEXT,
  business_category TEXT,
  nit TEXT,
  business_logo_url TEXT,
  website_url TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  social_tiktok TEXT,
  social_whatsapp TEXT,
  business_hours JSONB,
  business_address TEXT,
  business_department TEXT,
  business_city TEXT,
  is_nit_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unique index on slug (explicit, for performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_profiles_slug
  ON public.business_profiles(slug);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view business profiles
CREATE POLICY "business_profiles_select_policy"
  ON public.business_profiles
  FOR SELECT
  USING (true);

-- RLS: Users can insert their own business profile
CREATE POLICY "business_profiles_insert_policy"
  ON public.business_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS: Users can update their own business profile
CREATE POLICY "business_profiles_update_policy"
  ON public.business_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS: Users can delete their own business profile
CREATE POLICY "business_profiles_delete_policy"
  ON public.business_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- Auto-update updated_at on business_profiles (reuse existing function)
DROP TRIGGER IF EXISTS update_business_profiles_updated_at ON public.business_profiles;
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.business_profiles TO postgres, service_role;
GRANT SELECT ON public.business_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.business_profiles TO authenticated;

-- ============================================================================
-- 3. generate_slug() function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_slug(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug TEXT;
  v_base_slug TEXT;
  v_suffix TEXT;
  v_exists BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  -- Normalize: lowercase, trim
  v_slug := lower(trim(input));

  -- Transliterate common accented characters
  v_slug := translate(v_slug,
    'áéíóúñÁÉÍÓÚÑäëïöüÄËÏÖÜàèìòùÀÈÌÒÙ',
    'aeiounAEIOUNaeiouAEIOUaeiouAEIOU'
  );

  -- Replace non-alphanumeric with hyphens
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');

  -- Remove leading/trailing hyphens
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

  -- Ensure slug is not empty
  IF v_slug = '' OR v_slug IS NULL THEN
    v_slug := 'negocio';
  END IF;

  v_base_slug := v_slug;

  -- Check uniqueness, retry with random suffix up to 5 times
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.business_profiles WHERE slug = v_slug
    ) INTO v_exists;

    IF NOT v_exists THEN
      RETURN v_slug;
    END IF;

    v_attempts := v_attempts + 1;
    IF v_attempts > 5 THEN
      -- Fallback: use full md5 suffix
      v_slug := v_base_slug || '-' || substr(md5(random()::text), 1, 8);
      RETURN v_slug;
    END IF;

    v_suffix := substr(md5(random()::text), 1, 4);
    v_slug := v_base_slug || '-' || v_suffix;
  END LOOP;
END;
$$;

-- ============================================================================
-- 4. Auto-verify phone trigger
-- When a user adds/removes their phone number, auto-update verification_level
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_verification_on_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Phone provided and verification_level is still 0 -> upgrade to 1
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND OLD.verification_level < 1 THEN
    NEW.verification_level := 1;
    NEW.phone_verified := TRUE;
  END IF;

  -- Phone removed and verification_level was 1 (auto from phone) -> downgrade to 0
  IF (NEW.phone IS NULL OR NEW.phone = '') AND OLD.verification_level = 1 THEN
    NEW.verification_level := 0;
    NEW.phone_verified := FALSE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_verify_phone ON public.profiles;
CREATE TRIGGER auto_verify_phone
  BEFORE UPDATE OF phone ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_on_phone();

-- ============================================================================
-- 5. Update handle_new_user() trigger to support account_type
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type TEXT;
  v_business_name TEXT;
  v_business_category TEXT;
  v_slug TEXT;
BEGIN
  -- Read account_type from user metadata (default: personal)
  v_account_type := COALESCE(
    NEW.raw_user_meta_data->>'account_type', 'personal'
  );

  -- Validate account_type
  IF v_account_type NOT IN ('personal', 'business') THEN
    v_account_type := 'personal';
  END IF;

  -- Create profile row
  INSERT INTO public.profiles (id, full_name, is_verified, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email_confirmed_at IS NOT NULL,
    v_account_type
  );

  -- If business account, auto-create business_profiles row
  IF v_account_type = 'business' THEN
    v_business_name := NEW.raw_user_meta_data->>'business_name';
    v_business_category := NEW.raw_user_meta_data->>'business_category';

    IF v_business_name IS NOT NULL AND v_business_name != '' THEN
      v_slug := public.generate_slug(v_business_name);

      INSERT INTO public.business_profiles (id, business_name, slug, business_category)
      VALUES (NEW.id, v_business_name, v_slug, v_business_category);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. Business logos storage bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can read business logos
CREATE POLICY "business_logos_read_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-logos');

-- RLS: Authenticated users can upload their own business logo
CREATE POLICY "business_logos_upload_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: Users can update their own business logo
CREATE POLICY "business_logos_update_policy"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: Users can delete their own business logo
CREATE POLICY "business_logos_delete_policy"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
