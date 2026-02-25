-- Set a known password for seller1@test.com so Playwright CLI can log in and save auth state.
-- Prefer (when using Docker/local Supabase): node scripts/set-test-passwords.mjs
--   so the password is set via Auth Admin API and login works with GoTrue.
-- Otherwise run: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/set-seller-password.sql
-- Standard test password: TestPassword123 (see tests/playwright-cli/README.md)

UPDATE auth.users
SET encrypted_password = crypt('TestPassword123', gen_salt('bf'))
WHERE email = 'seller1@test.com';

-- Confirm
SELECT email, 'password set to TestPassword123' AS note
FROM auth.users
WHERE email = 'seller1@test.com';
