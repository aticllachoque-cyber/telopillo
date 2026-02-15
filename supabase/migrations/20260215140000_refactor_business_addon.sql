-- M4.5 Refactor: Business as Add-on Architecture
-- Changes handle_new_user() so all users start as 'personal'.
-- Business profile creation is optional (driven by business_name in metadata).
-- account_type column is kept but no longer toggled by users.
-- Source of truth for "has business" = existence of business_profiles row.

-- ============================================================================
-- 1. Update handle_new_user() trigger
--    Always inserts account_type = 'personal'.
--    Still auto-creates business_profiles if business_name is provided in metadata.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_name TEXT;
  v_business_category TEXT;
  v_slug TEXT;
BEGIN
  -- Always create profile as personal
  INSERT INTO public.profiles (id, full_name, is_verified, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email_confirmed_at IS NOT NULL,
    'personal'
  );

  -- Optionally create business_profiles if business_name provided in metadata
  v_business_name := NEW.raw_user_meta_data->>'business_name';
  v_business_category := NEW.raw_user_meta_data->>'business_category';

  v_business_name := trim(v_business_name);

  IF v_business_name IS NOT NULL AND v_business_name != '' THEN
    v_slug := public.generate_slug(v_business_name);

    INSERT INTO public.business_profiles (id, business_name, slug, business_category)
    VALUES (NEW.id, v_business_name, v_slug, v_business_category);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. Normalize legacy data: set all account_type to 'personal'
--    In the add-on model, account_type is always 'personal'.
--    Any existing 'business' rows are normalized. The business_profiles row
--    (if it exists) is the source of truth for "has business".
-- ============================================================================

UPDATE public.profiles
SET account_type = 'personal'
WHERE account_type != 'personal';
