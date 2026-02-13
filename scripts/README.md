# Scripts

Utility scripts for development and testing.

## create-dev-user.sql

Creates a development test user in Supabase.

**Usage:**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `create-dev-user.sql`
5. Click **Run** or press `Ctrl+Enter`

**Credentials:**
- Email: `dev@telopillo.test`
- Password: `DevTest123`

**What it does:**
- Creates a user in `auth.users` table
- Email is pre-confirmed (no verification needed)
- Profile should be auto-created via the `handle_new_user` trigger
- User can login immediately

**Verification:**
```sql
-- Check if user exists
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'dev@telopillo.test';

-- Check if profile exists
SELECT id, full_name, location_city, location_department
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'dev@telopillo.test');
```

**Delete dev user:**
```sql
-- Delete from profiles first (due to foreign key)
DELETE FROM public.profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'dev@telopillo.test');

-- Then delete from auth.users
DELETE FROM auth.users 
WHERE email = 'dev@telopillo.test';
```

---

## fix-auth-users-null-tokens.sql

Fixes "Database error querying schema" error during login.

**Problem:**
- Error: `Database error querying schema`
- Status: 500 from Supabase Auth
- Root cause: NULL values in token columns (`confirmation_token`, `email_change`, `email_change_token_new`, `recovery_token`)
- Supabase Auth expects empty strings (`''`), not NULL

**When to use:**
- Login fails with "Database error querying schema"
- Users were created manually via SQL
- After importing users from another system

**Usage:**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `fix-auth-users-null-tokens.sql`
5. Click **Run** or press `Ctrl+Enter`

**What it does:**
- Updates all `auth.users` rows where token columns are NULL
- Sets them to empty strings (`''`)
- Verifies the fix for the dev user

**Reference:**
- GitHub Issue: https://github.com/supabase/auth/issues/1940
