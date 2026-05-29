-- =============================================================================
-- TELO-003: Prevent bulk phone enumeration via anon/authenticated SELECT
-- =============================================================================

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  full_name,
  avatar_url,
  location_city,
  location_department,
  rating_average,
  rating_count,
  is_verified,
  verification_level,
  account_type,
  phone_verified,
  onboarding_completed,
  created_at,
  updated_at
FROM public.profiles;

COMMENT ON VIEW public.profiles_public IS
  'Public profile fields without phone. Use for cross-user reads via anon/authenticated.';

GRANT SELECT ON public.profiles_public TO anon, authenticated;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

REVOKE SELECT ON public.profiles FROM anon;

-- Contact for listings: single-row lookup (not enumerable via profiles table)
CREATE OR REPLACE FUNCTION public.get_seller_contact_phone(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(TRIM(bp.social_whatsapp), ''),
    NULLIF(TRIM(p.phone), '')
  )
  FROM public.profiles p
  LEFT JOIN public.business_profiles bp ON bp.id = p.id
  WHERE p.id = p_user_id;
$$;

REVOKE ALL ON FUNCTION public.get_seller_contact_phone(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_seller_contact_phone(uuid) TO anon, authenticated;
