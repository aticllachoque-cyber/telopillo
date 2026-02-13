-- Create development test user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- 1. Create the auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'dev@telopillo.test',
  crypt('DevTest123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Usuario de Desarrollo"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- 2. Verify the user was created
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'dev@telopillo.test';

-- 3. Check if profile was auto-created (should happen via trigger)
SELECT id, full_name, location_city, location_department, created_at
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'dev@telopillo.test');

-- Note: If profile doesn't exist, the trigger might not have fired.
-- You can manually create it:
-- INSERT INTO public.profiles (id, full_name)
-- SELECT id, 'Usuario de Desarrollo'
-- FROM auth.users
-- WHERE email = 'dev@telopillo.test'
-- ON CONFLICT (id) DO NOTHING;
