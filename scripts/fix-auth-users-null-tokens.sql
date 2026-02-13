-- Fix "Database error querying schema" / "converting NULL to string is unsupported"
-- Run in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
--
-- Root cause: auth.users columns confirmation_token, email_change, email_change_token_new,
-- recovery_token must NOT be NULL - Supabase Auth expects empty strings.
-- See: https://github.com/supabase/auth/issues/1940

-- Update any users with NULL token columns to use empty strings
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- Verify fix for dev user
SELECT id, email, 
  confirmation_token IS NOT NULL AND confirmation_token = '' AS confirmation_ok,
  email_change IS NOT NULL AND email_change = '' AS email_change_ok,
  recovery_token IS NOT NULL AND recovery_token = '' AS recovery_ok
FROM auth.users
WHERE email = 'dev@telopillo.test';
